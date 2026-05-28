const express = require('express');
const Guide = require('../models/Guide');
const Booking = require('../models/Booking');
const Tourist = require('../models/Tourist');
const router = express.Router();
const ethers = require('ethers');

// Minimal ABI for PlatformCore verify function and event
const PLATFORM_CORE_ABI = [
  "function verifyGuide(address guideAddress, string name, string serviceType, string areaOfExpertise, string location, uint256 expiryDate) public",
  "event GuideVerified(address indexed guideAddress, uint256 nftTokenId)"
];

// Admin verification of guide (Step 2 from functional flow)
router.patch('/guides/:guideId/verify', async (req, res) => {
  try {
    const { guideId } = req.params;
    const { blockchainTransactionHash, nftTokenId } = req.body;

    const guide = await Guide.findById(guideId);
    if (!guide) {
      return res.status(404).json({ message: 'Guide not found' });
    }

    if (guide.status !== 'pending') {
      return res.status(400).json({ message: 'Guide is not in pending status' });
    }

    // Update guide status to verified with blockchain details
    guide.status = 'verified';
    guide.blockchainTransactionHash = blockchainTransactionHash;
    guide.nftTokenId = nftTokenId;
    guide.updatedAt = new Date();

    await guide.save();

    res.json({
      message: 'Guide verified successfully',
      guide: {
        id: guide._id,
        name: guide.name,
        walletAddress: guide.walletAddress,
        status: guide.status,
        blockchainTransactionHash: guide.blockchainTransactionHash,
        nftTokenId: guide.nftTokenId
      }
    });
  } catch (error) {
    console.error('Verify guide error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Owner-signed: Mint on-chain Soulbound NFT certificate for a verified guide
router.post('/guides/:guideId/mint-certificate', async (req, res) => {
  try {
    const { guideId } = req.params;
    const { name, serviceType, areaOfExpertise, location, expiryDays } = req.body || {};

    const guide = await Guide.findById(guideId);
    if (!guide) return res.status(404).json({ message: 'Guide not found' });
    if (guide.status !== 'verified') return res.status(400).json({ message: 'Guide must be verified before minting certificate' });

    const rpcUrl = process.env.SEPOLIA_RPC_URL;
    const ownerPk = process.env.OWNER_PRIVATE_KEY || process.env.PRIVATE_KEY; // Fallback to PRIVATE_KEY
    const platformCoreAddress = process.env.PLATFORM_CORE_ADDRESS || process.env.REACT_APP_PLATFORM_CORE_CONTRACT_ADDRESS;

    const missing = [];
    if (!rpcUrl) missing.push('SEPOLIA_RPC_URL');
    if (!ownerPk) missing.push('OWNER_PRIVATE_KEY/PRIVATE_KEY');
    if (!platformCoreAddress) missing.push('PLATFORM_CORE_ADDRESS');
    if (missing.length) {
      return res.status(500).json({ message: `Server missing: ${missing.join(', ')}` });
    }

    const ProviderCtor = (ethers.providers && ethers.providers.JsonRpcProvider) || ethers.JsonRpcProvider;
    const provider = new ProviderCtor(rpcUrl);
    const ownerSigner = new ethers.Wallet(ownerPk, provider);
    const platformCore = new ethers.Contract(platformCoreAddress, PLATFORM_CORE_ABI, ownerSigner);

    // Diagnostics
    try {
      const net = await provider.getNetwork();
      console.log('[mint-certificate] network:', net?.name || net);
    } catch (_) {}
    try {
      console.log('[mint-certificate] signer:', await ownerSigner.getAddress());
    } catch (_) {}
    console.log('[mint-certificate] platformCoreAddress:', platformCoreAddress);

    const effectiveName = name || guide.name || 'Verified Guide';
    const effectiveService = serviceType || 'General Tourism';
    const effectiveArea = areaOfExpertise || 'General';
    const effectiveLocation = location || 'Unknown';
    const days = Number(expiryDays) > 0 ? Number(expiryDays) : 365;
    const expiryDate = Math.floor(Date.now() / 1000) + days * 24 * 60 * 60;

    // Preflight static call to surface revert reasons early
    try {
      if (platformCore.callStatic && typeof platformCore.callStatic.verifyGuide === 'function') {
        await platformCore.callStatic.verifyGuide(
          guide.walletAddress,
          effectiveName,
          effectiveService,
          effectiveArea,
          effectiveLocation,
          expiryDate
        );
      }
    } catch (preflightErr) {
      console.error('Preflight verifyGuide error:', preflightErr);
      const msg = preflightErr?.error?.reason || preflightErr?.reason || preflightErr?.data?.message || preflightErr?.message || 'Preflight failed';
      return res.status(400).json({ message: msg });
    }

    const tx = await platformCore.verifyGuide(
      guide.walletAddress,
      effectiveName,
      effectiveService,
      effectiveArea,
      effectiveLocation,
      expiryDate
    );
    const receipt = await tx.wait();

    const InterfaceCtor = (ethers.utils && ethers.utils.Interface) || ethers.Interface;
    const iface = new InterfaceCtor(PLATFORM_CORE_ABI);
    let nftTokenId = null;
    for (const log of receipt.logs) {
      try {
        const parsed = iface.parseLog(log);
        if (parsed.name === 'GuideVerified') {
          nftTokenId = parsed.args.nftTokenId?.toString();
          break;
        }
      } catch (_) {}
    }

    guide.blockchainTransactionHash = receipt.transactionHash;
    guide.nftTokenId = nftTokenId ? Number(nftTokenId) : guide.nftTokenId;
    guide.updatedAt = new Date();
    await guide.save();

    return res.json({
      message: 'Certificate minted successfully',
      txHash: receipt.transactionHash,
      nftTokenId,
      guide: {
        id: guide._id,
        status: guide.status,
        blockchainTransactionHash: guide.blockchainTransactionHash,
        nftTokenId: guide.nftTokenId
      }
    });
  } catch (error) {
    console.error('Mint certificate error:', error);
    const msg = error?.reason || error?.data?.message || error?.message || 'Internal server error';
    return res.status(500).json({ message: msg });
  }
});

// Admin rejection of guide
router.patch('/guides/:guideId/reject', async (req, res) => {
  try {
    const { guideId } = req.params;

    const guide = await Guide.findById(guideId);
    if (!guide) {
      return res.status(404).json({ message: 'Guide not found' });
    }

    if (guide.status !== 'pending') {
      return res.status(400).json({ message: 'Guide is not in pending status' });
    }

    // Update guide status to rejected
    guide.status = 'rejected';
    guide.updatedAt = new Date();

    await guide.save();

    res.json({
      message: 'Guide rejected successfully',
      guide: {
        id: guide._id,
        name: guide.name,
        walletAddress: guide.walletAddress,
        status: guide.status
      }
    });
  } catch (error) {
    console.error('Reject guide error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all pending guides for admin review
router.get('/guides/pending', async (req, res) => {
  try {
    const guides = await Guide.find({ status: 'pending' }).sort({ createdAt: -1 });

    res.json({
      guides: guides.map(guide => ({
        id: guide._id,
        name: guide.name,
        age: guide.age,
        gender: guide.gender,
        aadhaarId: guide.aadhaarId,
        walletAddress: guide.walletAddress,
        serviceRate: guide.serviceRate,
        status: guide.status,
        createdAt: guide.createdAt
      }))
    });
  } catch (error) {
    console.error('Fetch pending guides error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get admin dashboard analytics (Step 7 from functional flow)
router.get('/dashboard', async (req, res) => {
  try {
    // Get verified guides count
    const verifiedGuidesCount = await Guide.countDocuments({ status: 'verified' });
    
    // Get total bookings count
    const totalBookingsCount = await Booking.countDocuments();
    
    // Get completed bookings count
    const completedBookingsCount = await Booking.countDocuments({ status: 'completed' });
    
    // Get total revenue (sum of completed bookings)
    const revenueResult = await Booking.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, totalRevenue: { $sum: '$amount' } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    // Get recent bookings
    const recentBookings = await Booking.find()
      .populate('guideId', 'name walletAddress')
      .populate('touristId', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get guides with ratings
    const guidesWithRatings = await Booking.aggregate([
      { $match: { status: 'completed', 'feedback.rating': { $exists: true } } },
      {
        $group: {
          _id: '$guideId',
          averageRating: { $avg: '$feedback.rating' },
          totalBookings: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'guides',
          localField: '_id',
          foreignField: '_id',
          as: 'guide'
        }
      },
      { $unwind: '$guide' },
      {
        $project: {
          guideName: '$guide.name',
          guideWalletAddress: '$guide.walletAddress',
          averageRating: { $round: ['$averageRating', 2] },
          totalBookings: '$totalBookings'
        }
      },
      { $sort: { averageRating: -1 } }
    ]);

    res.json({
      analytics: {
        verifiedGuidesCount,
        totalBookingsCount,
        completedBookingsCount,
        totalRevenue,
        recentBookings: recentBookings.map(booking => ({
          id: booking._id,
          guideName: booking.guideId.name,
          touristName: booking.touristId.name,
          amount: booking.amount,
          status: booking.status,
          createdAt: booking.createdAt
        })),
        topRatedGuides: guidesWithRatings
      }
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all guides for admin management
router.get('/guides', async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = {};
    if (status) {
      query.status = status;
    }

    const guides = await Guide.find(query).sort({ createdAt: -1 });

    res.json({
      guides: guides.map(guide => ({
        id: guide._id,
        name: guide.name,
        age: guide.age,
        gender: guide.gender,
        aadhaarId: guide.aadhaarId,
        walletAddress: guide.walletAddress,
        serviceRate: guide.serviceRate,
        status: guide.status,
        blockchainTransactionHash: guide.blockchainTransactionHash,
        nftTokenId: guide.nftTokenId,
        createdAt: guide.createdAt,
        updatedAt: guide.updatedAt
      }))
    });
  } catch (error) {
    console.error('Fetch all guides error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all tourists for admin management
router.get('/tourists', async (req, res) => {
  try {
    const tourists = await Tourist.find().select('-password').sort({ createdAt: -1 });

    res.json({
      tourists: tourists.map(tourist => ({
        id: tourist._id,
        name: tourist.name,
        email: tourist.email,
        walletAddress: tourist.walletAddress,
        createdAt: tourist.createdAt
      }))
    });
  } catch (error) {
    console.error('Fetch tourists error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;

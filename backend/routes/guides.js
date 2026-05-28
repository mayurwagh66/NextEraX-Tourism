const express = require('express');
const Guide = require('../models/Guide');
const jwt = require('jsonwebtoken'); // Import jsonwebtoken
const router = express.Router();

// Simple JWT auth for guide actions
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }
  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Guide Registration (Step 1 from functional flow)
router.post('/register', async (req, res) => {
  try {
    const { name, age, gender, aadhaarId, walletAddress, serviceRate } = req.body;

    // Check if guide already exists
    const existingGuide = await Guide.findOne({ 
      $or: [{ aadhaarId }, { walletAddress }] 
    });

    if (existingGuide) {
      return res.status(400).json({ 
        message: 'Guide with this Aadhaar ID or wallet address already exists' 
      });
    }

    // Create new guide with pending status
    const guide = new Guide({
      name,
      age,
      gender,
      aadhaarId,
      walletAddress,
      serviceRate,
      status: 'pending'
    });

    await guide.save();

    res.status(201).json({
      message: 'Guide registration submitted successfully. Awaiting admin verification.',
      guide: {
        id: guide._id,
        name: guide.name,
        walletAddress: guide.walletAddress,
        status: guide.status
      }
    });
  } catch (error) {
    console.error('Guide registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all guides (for admin and tourists to view)
router.get('/', async (req, res) => {
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
        walletAddress: guide.walletAddress,
        serviceRate: guide.serviceRate,
        status: guide.status,
        availabilityStatus: guide.availabilityStatus,
        blockchainTransactionHash: guide.blockchainTransactionHash,
        nftTokenId: guide.nftTokenId,
        createdAt: guide.createdAt
      }))
    });
  } catch (error) {
    console.error('Fetch guides error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get verified guides only (for tourists to book)
router.get('/verified', async (req, res) => {
  try {
    const guides = await Guide.find({ status: 'verified' }).sort({ createdAt: -1 });
    
    res.json({
      guides: guides.map(guide => ({
        id: guide._id,
        name: guide.name,
        age: guide.age,
        gender: guide.gender,
        walletAddress: guide.walletAddress,
        serviceRate: guide.serviceRate,
        availabilityStatus: guide.availabilityStatus,
        nftTokenId: guide.nftTokenId,
        blockchainTransactionHash: guide.blockchainTransactionHash
      }))
    });
  } catch (error) {
    console.error('Fetch verified guides error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get guide by wallet address
router.get('/wallet/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    const guide = await Guide.findOne({ walletAddress });
    if (!guide) {
      return res.status(404).json({ message: 'Guide not found' });
    }

    res.json({
      guide: {
        id: guide._id,
        name: guide.name,
        age: guide.age,
        gender: guide.gender,
        aadhaarId: guide.aadhaarId,
        walletAddress: guide.walletAddress,
        serviceRate: guide.serviceRate,
        status: guide.status,
        availabilityStatus: guide.availabilityStatus,
        blockchainTransactionHash: guide.blockchainTransactionHash,
        nftTokenId: guide.nftTokenId,
        createdAt: guide.createdAt
      }
    });
  } catch (error) {
    console.error('Fetch guide by wallet error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Guide Login with Wallet Address
router.post('/login-with-wallet', async (req, res) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ message: 'Wallet address is required' });
    }

    const guide = await Guide.findOne({ walletAddress });

    if (!guide) {
      return res.status(404).json({ message: 'Guide not found with this wallet address' });
    }

    if (guide.status !== 'verified') {
      return res.status(403).json({ message: 'Guide is not yet verified by admin' });
    }

    // Generate JWT token for the guide
    const token = jwt.sign(
      { guideId: guide._id, walletAddress: guide.walletAddress, role: 'guide' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Guide login successful',
      token,
      guide: {
        id: guide._id,
        name: guide.name,
        walletAddress: guide.walletAddress,
        status: guide.status,
        availabilityStatus: guide.availabilityStatus,
      },
    });
  } catch (error) {
    console.error('Guide login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update guide availability (guide can toggle between available/booked)
router.patch('/:guideId/availability', authenticateToken, async (req, res) => {
  try {
    const { guideId } = req.params;
    const { availabilityStatus } = req.body;

    if (!['available', 'booked'].includes(availabilityStatus)) {
      return res.status(400).json({ message: 'Invalid availability status' });
    }

    // Only the authenticated guide can update their availability
    if (!req.user || req.user.role !== 'guide' || req.user.guideId !== guideId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const guide = await Guide.findById(guideId);
    if (!guide) {
      return res.status(404).json({ message: 'Guide not found' });
    }

    guide.availabilityStatus = availabilityStatus;
    guide.updatedAt = new Date();
    await guide.save();

    res.json({
      message: 'Availability updated successfully',
      guide: {
        id: guide._id,
        availabilityStatus: guide.availabilityStatus,
      }
    });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;

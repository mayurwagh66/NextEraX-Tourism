const express = require('express');
const Booking = require('../models/Booking');
const Guide = require('../models/Guide');
const Tourist = require('../models/Tourist');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Verify JWT token middleware
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

// Create booking (Step 4 from functional flow)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { guideId, bookingDate, durationInMinutes, touristWalletAddress } = req.body; // Removed amount, added durationInMinutes

    // Verify guide exists and is verified
    const guide = await Guide.findById(guideId);
    if (!guide) {
      return res.status(404).json({ message: 'Guide not found' });
    }

    if (guide.status !== 'verified') {
      return res.status(400).json({ message: 'Guide is not verified' });
    }

    if (guide.availabilityStatus === 'booked') {
      return res.status(400).json({ message: 'Guide is currently booked and unavailable.' });
    }

    // Get tourist details
    const tourist = await Tourist.findById(req.user.touristId);
    if (!tourist) {
      return res.status(404).json({ message: 'Tourist not found' });
    }

    // Calculate amount based on guide's service rate and durationInMinutes
    const amount = guide.serviceRate * durationInMinutes;
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Invalid booking amount calculation.' });
    }

    // Create booking with pending status
    const booking = new Booking({
      touristId: req.user.touristId,
      guideId,
      touristWalletAddress, 
      guideWalletAddress: guide.walletAddress,
      bookingDate: new Date(bookingDate),
      durationInMinutes, // Save duration in minutes
      amount,
      status: 'pending'
    });

    await booking.save();

    // Update guide's availability status to 'booked'
    guide.availabilityStatus = 'booked';
    await guide.save();

    res.status(201).json({
      message: 'Booking created successfully. Proceed with payment.',
      booking: {
        id: booking._id,
        guideName: guide.name,
        bookingDate: booking.bookingDate,
        durationInMinutes: booking.durationInMinutes, // Include in response
        amount: booking.amount,
        status: booking.status
      }
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update booking payment status (Step 5 from functional flow)
router.patch('/:bookingId/payment', authenticateToken, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { paymentTransactionHash } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify the booking belongs to the authenticated tourist
    if (booking.touristId.toString() !== req.user.touristId) {
      return res.status(403).json({ message: 'Unauthorized access to booking' });
    }

    // Update booking with payment details
    booking.status = 'paid';
    booking.paymentTransactionHash = paymentTransactionHash;
    booking.updatedAt = new Date();

    await booking.save();

    res.json({
      message: 'Payment confirmed successfully',
      booking: {
        id: booking._id,
        status: booking.status,
        paymentTransactionHash: booking.paymentTransactionHash
      }
    });
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Complete service (Step 6 from functional flow)
router.patch('/:bookingId/complete', authenticateToken, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { completionTransactionHash, feedback } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify the booking belongs to the authenticated tourist
    if (booking.touristId.toString() !== req.user.touristId) {
      return res.status(403).json({ message: 'Unauthorized access to booking' });
    }

    // Update booking with completion details
    booking.status = 'completed';
    booking.completionTransactionHash = completionTransactionHash;
    if (feedback) {
      booking.feedback = feedback;
    }
    booking.updatedAt = new Date();

    await booking.save();

    // Set guide's availability back to 'available'
    const guide = await Guide.findById(booking.guideId);
    if (guide) {
      guide.availabilityStatus = 'available';
      await guide.save();
    }

    res.json({
      message: 'Service completed successfully',
      booking: {
        id: booking._id,
        status: booking.status,
        completionTransactionHash: booking.completionTransactionHash,
        feedback: booking.feedback
      }
    });
  } catch (error) {
    console.error('Complete service error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get tourist's bookings
router.get('/my-bookings', authenticateToken, async (req, res) => {
  try {
    const bookings = await Booking.find({ touristId: req.user.touristId })
      .populate('guideId', 'name walletAddress serviceRate availabilityStatus') // Include availabilityStatus
      .sort({ createdAt: -1 });

    res.json({
      bookings: bookings.map(booking => ({
        id: booking._id,
        guideName: booking.guideId.name,
        guideWalletAddress: booking.guideWalletAddress,
        bookingDate: booking.bookingDate,
        durationInMinutes: booking.durationInMinutes, // Include in response
        amount: booking.amount,
        status: booking.status,
        paymentTransactionHash: booking.paymentTransactionHash,
        completionTransactionHash: booking.completionTransactionHash,
        feedback: booking.feedback,
        createdAt: booking.createdAt,
        guideAvailabilityStatus: booking.guideId.availabilityStatus // Add guide availability
      }))
    });
  } catch (error) {
    console.error('Fetch bookings error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get booking by ID
router.get('/:bookingId', authenticateToken, async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId)
      .populate('guideId', 'name walletAddress serviceRate')
      .populate('touristId', 'name email walletAddress');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify the booking belongs to the authenticated tourist
    if (booking.touristId._id.toString() !== req.user.touristId) {
      return res.status(403).json({ message: 'Unauthorized access to booking' });
    }

    res.json({
      booking: {
        id: booking._id,
        guideName: booking.guideId.name,
        guideWalletAddress: booking.guideWalletAddress,
        touristName: booking.touristId.name,
        touristWalletAddress: booking.touristWalletAddress,
        bookingDate: booking.bookingDate,
        durationInMinutes: booking.durationInMinutes, // Include in response
        amount: booking.amount,
        status: booking.status,
        paymentTransactionHash: booking.paymentTransactionHash,
        completionTransactionHash: booking.completionTransactionHash,
        feedback: booking.feedback,
        createdAt: booking.createdAt,
        guideAvailabilityStatus: booking.guideId.availabilityStatus // Add guide availability
      }
    });
  } catch (error) {
    console.error('Fetch booking error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all bookings for a tourist
router.get('/tourist', authenticateToken, async (req, res) => {
  try {
    const bookings = await Booking.find({ tourist: req.user.touristId })
      .populate('guide', 'name email phone')
      .populate('tourist', 'name email')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.error('Fetch tourist bookings error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;

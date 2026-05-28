const express = require('express');
const jwt = require('jsonwebtoken');
const Tourist = require('../models/Tourist');
const router = express.Router();

// Tourist Registration
router.post('/register', async (req, res) => {
  try {
    const { email, password, walletAddress, name } = req.body;

    const query = { email };
    if (walletAddress) {
      query.$or = [{ email }, { walletAddress }];
    }

    // Check if tourist already exists
    const existingTourist = await Tourist.findOne(query);

    if (existingTourist) {
      return res.status(400).json({
        message: 'Tourist with this email or wallet address already exists'
      });
    }

    // Create new tourist
    const tourist = new Tourist({
      email,
      password,
      walletAddress,
      name
    });

    await tourist.save();

    // Generate JWT token
    const token = jwt.sign(
      { touristId: tourist._id, walletAddress },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Tourist registered successfully',
      token,
      tourist: {
        id: tourist._id,
        email: tourist.email,
        walletAddress: tourist.walletAddress,
        name: tourist.name
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Tourist Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find tourist by email
    const tourist = await Tourist.findOne({ email });
    if (!tourist) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await tourist.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { touristId: tourist._id, walletAddress: tourist.walletAddress },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      tourist: {
        id: tourist._id,
        email: tourist.email,
        walletAddress: tourist.walletAddress,
        name: tourist.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

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

// Get tourist profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const tourist = await Tourist.findById(req.user.touristId);
    if (!tourist) {
      return res.status(404).json({ message: 'Tourist not found' });
    }

    res.json({
      tourist: {
        id: tourist._id,
        email: tourist.email,
        walletAddress: tourist.walletAddress,
        name: tourist.name
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;

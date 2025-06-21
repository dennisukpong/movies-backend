const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  console.log('Register attempt:', { username, email });

  try {
    // Validate input
    if (!username || !email || !password) {
      console.error('Register error: Missing fields', { username, email });
      return res.status(400).json({ message: 'Please provide username, email, and password' });
    }

    // Check for existing user
    let user = await User.findOne({ email });
    if (user) {
      console.error('Register error: User already exists', { email });
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    user = new User({
      username,
      email,
      password,
      watchlist: [], // Explicitly set, though schema default is []
      genres: [], // Explicitly set, though schema default is []
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    console.log('User registered:', { userId: user._id, username, email });

    // Generate JWT token
    const payload = { id: user._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({
      token,
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (error) {
    console.error('Register error:', {
      message: error.message,
      stack: error.stack,
      email,
    });
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Login user (assumed existing, included for completeness)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('Login attempt:', { email });

  try {
    // Validate input
    if (!email || !password) {
      console.error('Login error: Missing fields', { email });
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Check for user
    const user = await User.findOne({ email });
    if (!user) {
      console.error('Login error: User not found', { email });
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.error('Login error: Invalid password', { email });
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const payload = { id: user._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    console.log('User logged in:', { userId: user._id, email });

    res.json({
      token,
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (error) {
    console.error('Login error:', {
      message: error.message,
      stack: error.stack,
      email,
    });
    res.status(500).json({ message: 'Server error' });
  }
});

// Add to watchlist
router.post('/watchlist', auth, async (req, res) => {
  const { movieId } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.watchlist.includes(movieId)) {
      user.watchlist.push(movieId);
      await user.save();
    }
    res.json(user.watchlist);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get watchlist
router.get('/watchlist', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.watchlist);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
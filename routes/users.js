// backend/routes/users.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const User = require('../models/User');
const axios = require('axios');

const TMDB_API_KEY = process.env.TMDB_API_KEY;

//const TMDB_API_KEY = '3c5ef1350054425e5f0245ae97567257';

console.log('TMDB_API_KEY in users.js:', TMDB_API_KEY);

// GET /api/users/profile
router.get('/profile', auth, async (req, res) => {
  console.log('GET /profile called', { userId: req.user?.id });
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      console.error('Profile error: User not found', { userId: req.user.id });
      return res.status(404).json({ message: 'User not found' });
    }
    console.log('Profile fetched:', {
      userId: user._id,
      username: user.username,
      genres: user.genres,
    });
    res.json({
      username: user.username,
      email: user.email,
      genres: user.genres || [],
    });
  } catch (error) {
    console.error('Profile error:', {
      message: error.message,
      stack: error.stack,
      userId: req.user?.id,
    });
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/users/profile
router.put('/profile', auth, async (req, res) => {
  const { genres } = req.body;
  console.log('PUT /profile called', { userId: req.user?.id, genres });
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      console.error('Update profile error: User not found', { userId: req.user.id });
      return res.status(404).json({ message: 'User not found' });
    }
    if (genres && !Array.isArray(genres)) {
      console.error('Update profile error: Invalid genres format', { genres });
      return res.status(400).json({ message: 'Genres must be an array' });
    }
    user.genres = genres || user.genres || [];
    await user.save();
    console.log('Profile updated:', {
      userId: user._id,
      username: user.username,
      genres: user.genres,
    });
    res.json({
      username: user.username,
      email: user.email,
      genres: user.genres,
    });
  } catch (error) {
    console.error('Update profile error:', {
      message: error.message,
      stack: error.stack,
      userId: req.user?.id,
      genres,
    });
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/watchlist
router.get('/watchlist', auth, async (req, res) => {
  console.log('GET /watchlist called', { userId: req.user?.id });
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      console.error('Watchlist error: User not found', { userId: req.user.id });
      return res.status(404).json({ message: 'User not found' });
    }
    const movies = await Promise.all(
      user.watchlist.map(async (movieId) => {
        const url = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API_KEY}`;
        console.log('Watchlist Request URL:', url);
        try {
          const response = await axios.get(url, {
            headers: { Accept: 'application/json' },
          });
          return response.data;
        } catch (error) {
          console.error('Watchlist TMDB error:', {
            movieId,
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
          });
          return null;
        }
      })
    );
    const validMovies = movies.filter((movie) => movie !== null);
    console.log('Watchlist fetched:', {
      userId: user._id,
      movieCount: validMovies.length,
    });
    res.json(validMovies);
  } catch (error) {
    console.error('Watchlist error:', {
      message: error.message,
      stack: error.stack,
      userId: req.user?.id,
    });
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/watchlist', auth, async (req, res) => {
  const { movieId } = req.body;
  console.log('POST /watchlist called', { userId: req.user?.id, movieId });
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      console.error('Watchlist error: User not found', { userId: req.user.id });
      return res.status(404).json({ message: 'User not found' });
    }
    if (!user.watchlist.includes(movieId)) {
      user.watchlist.push(movieId);
      await user.save();
      console.log('Watchlist updated:', { userId: user._id, movieId });
    }
    res.json({ message: 'Added to watchlist' });
  } catch (error) {
    console.error('Watchlist error:', { message: error.message, userId: req.user?.id });
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/watchlist/:movieId', auth, async (req, res) => {
  const { movieId } = req.params;
  console.log('DELETE /watchlist/:movieId called', { userId: req.user?.id, movieId });
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      console.error('Watchlist error: User not found', { userId: req.user.id });
      return res.status(404).json({ message: 'User not found' });
    }
    user.watchlist = user.watchlist.filter((id) => id !== parseInt(movieId));
    await user.save();
    console.log('Watchlist updated:', { userId: user._id, movieId });
    res.json({ message: 'Removed from watchlist' });
  } catch (error) {
    console.error('Watchlist error:', { message: error.message, userId: req.user?.id });
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
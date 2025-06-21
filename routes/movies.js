// backend/routes/movies.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const User = require('../models/User');
const auth = require('../middleware/auth');

//const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_API_KEY = '3c5ef1350054425e5f0245ae97567257'; // Hardcoded key

console.log('TMDB_API_KEY in movies.js:', TMDB_API_KEY);

router.get('/trending', async (req, res) => {
  const url = `https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_API_KEY}`;
  console.log('Trending Request URL:', url);

  try {
    const response = await axios.get(url, {
      headers: { Accept: 'application/json' },
    });
    console.log('Trending Response:', {
      status: response.status,
      resultsCount: response.data.results?.length,
    });
    res.json(response.data.results);
  } catch (error) {
    console.error('Trending error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: url,
    });
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'Failed to fetch trending movies',
    });
  }
});

router.get('/top-rated', async (req, res) => {
  const url = `https://api.themoviedb.org/3/movie/top_rated?api_key=${TMDB_API_KEY}`;
  console.log('Top-rated Request URL:', url);

  try {
    const response = await axios.get(url, {
      headers: { Accept: 'application/json' },
    });
    console.log('Top-rated Response:', {
      status: response.status,
      resultsCount: response.data.results?.length,
    });
    res.json(response.data.results);
  } catch (error) {
    console.error('Top-rated error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: url,
    });
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'Failed to fetch top-rated movies',
    });
  }
});

router.get('/recommended', auth, async (req, res) => {
  const url = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_genres=28&sort_by=popularity.desc`; // Default genre if user has none
  console.log('Recommended Request URL:', url);

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.genres && user.genres.length > 0) {
      const genreId = user.genres[0];
      url = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreId}&sort_by=popularity.desc`;
      console.log('Updated Recommended Request URL:', url);
    }
    const response = await axios.get(url, {
      headers: { Accept: 'application/json' },
    });
    console.log('Recommended Response:', {
      status: response.status,
      resultsCount: response.data.results?.length,
    });
    res.json(response.data.results);
  } catch (error) {
    console.error('Recommended error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: url, // Now defined
    });
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'Failed to fetch recommended movies',
    });
  }
});

router.get('/search', async (req, res) => {
  const { query } = req.query;
  if (!query) {
    return res.status(400).json({ message: 'Query parameter is required' });
  }

  const url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`;
  console.log('Search Request URL:', url);

  try {
    const response = await axios.get(url, {
      headers: { Accept: 'application/json' },
    });
    console.log('Search Response:', {
      status: response.status,
      resultsCount: response.data.results?.length,
    });
    res.json(response.data.results);
  } catch (error) {
    console.error('Search error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: url,
    });
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'Failed to fetch search results',
    });
  }
});

router.get('/details/:id', async (req, res) => {
  const { id } = req.params;
  console.log('GET /details/:id called', { movieId: id });
  try {
    const movieRes = await axios.get(
      `https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_API_KEY}&append_to_response=videos`,
      { headers: { Accept: 'application/json' } }
    );
    console.log('Movie Details Response:', { status: movieRes.status, title: movieRes.data.title });
    res.json(movieRes.data);
  } catch (error) {
    console.error('Movie details error:', {
      message: error.message,
      status: error.response?.status,
      movieId: id,
    });
    res.status(error.response?.status || 500).json({ message: 'Failed to fetch movie details' });
  }
});

module.exports = router;
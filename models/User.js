// backend/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  username: { type: String, required: true },
  watchlist: { type: [Number], default: [] }, // TMDB movie IDs
  genres: { type: [Number], default: [] }, // TMDB genre IDs (moved from preferences)
});

module.exports = mongoose.model('User', userSchema);
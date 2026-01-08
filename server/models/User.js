const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: String,
  email: { type: String, required: true, unique: true },
  googleId: String,
  profilePicture: String,
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null
  }
});

module.exports = mongoose.model('User', UserSchema);
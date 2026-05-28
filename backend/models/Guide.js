const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const guideSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true, min: 18, max: 100 },
  gender: { type: String, required: true, enum: ['male', 'female', 'other'] },
  aadhaarId: { type: String, required: true, unique: true },
  email: { type: String, required: false, unique: true, sparse: true },
  passwordHash: { type: String, required: false },
  walletAddress: { type: String, required: true, unique: true },
  serviceRate: { type: Number, required: true, min: 0.001, max: 0.005 },
  status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
  availabilityStatus: { type: String, enum: ['available', 'booked'], default: 'available' },
  blockchainTransactionHash: { type: String, default: null },
  nftTokenId: { type: Number, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Instance method to set password
guideSchema.methods.setPassword = async function(password) {
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(password, salt);
};

// Instance method to validate password
guideSchema.methods.validatePassword = function(password) {
  return bcrypt.compare(password, this.passwordHash || '');
};

module.exports = mongoose.model('Guide', guideSchema);

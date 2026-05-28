const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  touristId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tourist',
    required: true
  },
  guideId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Guide',
    required: true
  },
  touristWalletAddress: {
    type: String,
    required: false // Made optional, as tourist connects wallet only for payment
  },
  guideWalletAddress: {
    type: String,
    required: true
  },
  bookingDate: {
    type: Date,
    required: true
  },
  durationInMinutes: { // Reintroduced duration field, now in minutes
    type: Number,
    required: true,
    min: 1 // Minimum 1 minute booking
  },
  amount: {
    type: Number, // Stores ETH amount
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'completed', 'cancelled'],
    default: 'pending'
  },
  paymentTransactionHash: {
    type: String,
    default: null
  },
  completionTransactionHash: {
    type: String,
    default: null
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: {
      type: String
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Booking', bookingSchema);

const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  text: { type: String, required: true },
  sentiment: {
    label: { type: String, required: true },
    confidence: { type: Number, required: true }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Feedback", FeedbackSchema);

const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Feedback = require('../models/Feedback');

const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Get all feedback (admin)
router.get('/all', async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

// Add new feedback + analyze sentiment
router.post('/', async (req, res) => {
  try {
    const { text, sentimentOverride } = req.body;

    let sentiment;
    // Always use the emoji if provided, regardless of text
    if (sentimentOverride === 'Positive') {
      sentiment = { label: 'Positive', confidence: 1.0 };
    } else if (sentimentOverride === 'Negative') {
      sentiment = { label: 'Negative', confidence: 1.0 };
    } else if (sentimentOverride === 'Neutral') {
      sentiment = { label: 'Neutral', confidence: 1.0 };
    } else {
      // Use AI only if no emoji override
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
        },
      });

      const prompt = `You are a sentiment analysis engine.\nAnalyze the user comment and return ONLY valid JSON.\nDo not include explanations or markdown fences.\n\nOutput format:\n{\n  "label": "Positive" | "Negative" | "Neutral",\n  "confidence": 0.xx\n}\n\nUser Comment: "${text}"`;

      const result = await model.generateContent(prompt);

      try {
        sentiment = JSON.parse(result.response.text());
      } catch (e) {
        console.error('❌ JSON parse failed. Raw response:', result.response.text());
        sentiment = { label: 'Neutral', confidence: 0.5 };
      }
    }

    // Save to MongoDB
    const newFeedback = new Feedback({
      text,
      sentiment,
    });
    await newFeedback.save();

    res.json(newFeedback);
  } catch (error) {
    console.error('❌ Sentiment analysis failed:', error);
    res.status(500).json({ error: 'Sentiment analysis failed' });
  }
});

module.exports = router;

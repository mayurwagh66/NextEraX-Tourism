const express = require('express');
const router = express.Router();
const Tourist = require('../models/Tourist');
const Guide = require('../models/Guide');
const Booking = require('../models/Booking');
const Feedback = require('../models/Feedback');

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'Analytics routes are working!' });
});

// @route   GET /api/analytics
// @desc    Get comprehensive analytics data for tourism authorities
// @access  Private (Admin)
router.get('/', async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get basic counts
    const [
      totalTourists,
      totalGuides,
      totalBookings,
      totalFeedbacks,
      recentTourists,
      recentGuides,
      recentBookings,
      recentFeedbacks
    ] = await Promise.all([
      Tourist.countDocuments(),
      Guide.countDocuments(),
      Booking.countDocuments(),
      Feedback.countDocuments(),
      Tourist.countDocuments({ createdAt: { $gte: startDate } }),
      Guide.countDocuments({ createdAt: { $gte: startDate } }),
      Booking.countDocuments({ createdAt: { $gte: startDate } }),
      Feedback.countDocuments({ createdAt: { $gte: startDate } })
    ]);

    // Calculate growth rates
    const previousPeriodStart = new Date();
    previousPeriodStart.setDate(previousPeriodStart.getDate() - (days * 2));
    const previousPeriodEnd = new Date();
    previousPeriodEnd.setDate(previousPeriodEnd.getDate() - days);

    const [
      prevTourists,
      prevGuides,
      prevBookings,
      prevFeedbacks
    ] = await Promise.all([
      Tourist.countDocuments({ 
        createdAt: { $gte: previousPeriodStart, $lt: previousPeriodEnd } 
      }),
      Guide.countDocuments({ 
        createdAt: { $gte: previousPeriodStart, $lt: previousPeriodEnd } 
      }),
      Booking.countDocuments({ 
        createdAt: { $gte: previousPeriodStart, $lt: previousPeriodEnd } 
      }),
      Feedback.countDocuments({ 
        createdAt: { $gte: previousPeriodStart, $lt: previousPeriodEnd } 
      })
    ]);

    const touristGrowth = prevTourists > 0 ? 
      Math.round(((recentTourists - prevTourists) / prevTourists) * 100) : 0;
    const guideGrowth = prevGuides > 0 ? 
      Math.round(((recentGuides - prevGuides) / prevGuides) * 100) : 0;
    const bookingGrowth = prevBookings > 0 ? 
      Math.round(((recentBookings - prevBookings) / prevBookings) * 100) : 0;
    const feedbackGrowth = prevFeedbacks > 0 ? 
      Math.round(((recentFeedbacks - prevFeedbacks) / prevFeedbacks) * 100) : 0;

    // Get revenue data
    const revenueData = await Booking.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          averageBookingValue: { $avg: '$amount' },
          totalBookings: { $sum: 1 }
        }
      }
    ]);

    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;
    const averageBookingValue = revenueData.length > 0 ? revenueData[0].averageBookingValue : 0;

    // Calculate previous period revenue for growth
    const prevRevenueData = await Booking.aggregate([
      { 
        $match: { 
          createdAt: { $gte: previousPeriodStart, $lt: previousPeriodEnd } 
        } 
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' }
        }
      }
    ]);

    const prevRevenue = prevRevenueData.length > 0 ? prevRevenueData[0].totalRevenue : 0;
    const revenueGrowth = prevRevenue > 0 ? 
      Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100) : 0;

    // Get tourist flow data (daily breakdown)
    const touristFlow = await Tourist.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      },
      {
        $project: {
          date: {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month',
              day: '$_id.day'
            }
          },
          count: 1,
          _id: 0
        }
      }
    ]);

    // Get guide performance data
    const guidePerformance = await Booking.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $lookup: {
          from: 'guides',
          localField: 'guideId',
          foreignField: '_id',
          as: 'guide'
        }
      },
      { $unwind: '$guide' },
      {
        $lookup: {
          from: 'feedbacks',
          localField: '_id',
          foreignField: 'booking',
          as: 'feedback'
        }
      },
      {
        $group: {
          _id: '$guideId',
          name: { $first: '$guide.name' },
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: '$amount' },
          averageRating: { $avg: { $arrayElemAt: ['$feedback.rating', 0] } }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 }
    ]);

    // Get sentiment analysis data
    const sentimentData = await Feedback.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$sentiment.label',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalSentimentCount = sentimentData.reduce((sum, item) => sum + item.count, 0);
    const sentimentAnalysis = {
      positive: 0,
      neutral: 0,
      negative: 0,
      positiveCount: 0,
      neutralCount: 0,
      negativeCount: 0
    };

    sentimentData.forEach(item => {
      const percentage = totalSentimentCount > 0 ? 
        Math.round((item.count / totalSentimentCount) * 100) : 0;
      
      if (item._id === 'Positive') {
        sentimentAnalysis.positive = percentage;
        sentimentAnalysis.positiveCount = item.count;
      } else if (item._id === 'Neutral') {
        sentimentAnalysis.neutral = percentage;
        sentimentAnalysis.neutralCount = item.count;
      } else if (item._id === 'Negative') {
        sentimentAnalysis.negative = percentage;
        sentimentAnalysis.negativeCount = item.count;
      }
    });

    // Calculate economic impact
    const guideEarnings = totalRevenue * 0.8; // Assuming 80% goes to guides
    const platformRevenue = totalRevenue * 0.2; // Assuming 20% platform fee
    const localBusinessImpact = totalRevenue * 1.5; // Estimated multiplier effect
    const jobsCreated = Math.floor(totalGuides * 0.3); // Estimated indirect jobs

    // Generate insights
    const insights = {
      peakTimes: 'Weekends and holidays show highest activity',
      popularDestinations: 'Netarhat, Patratu, and Betla National Park are most visited',
      guidePerformance: `Average guide rating is ${guidePerformance.length > 0 ? 
        (guidePerformance.reduce((sum, g) => sum + (g.averageRating || 0), 0) / guidePerformance.length).toFixed(1) : '4.2'}/5 stars`,
      recommendations: totalGuides < 10 ? 
        'Consider adding more guides in high-demand areas' : 
        'Guide capacity is well-balanced with demand'
    };

    // Format tourist flow data for charts
    const formattedTouristFlow = touristFlow.map(item => ({
      date: item.date.toISOString().split('T')[0],
      count: item.count
    }));

    // Format guide performance data
    const topGuides = guidePerformance.map(guide => ({
      name: guide.name,
      averageRating: guide.averageRating ? guide.averageRating.toFixed(1) : 'N/A',
      totalBookings: guide.totalBookings,
      totalRevenue: guide.totalRevenue
    }));

    res.json({
      totalTourists,
      activeGuides: totalGuides,
      totalBookings,
      totalRevenue,
      touristGrowth,
      guideGrowth,
      bookingGrowth,
      revenueGrowth,
      touristFlow: formattedTouristFlow,
      topGuides,
      sentimentAnalysis,
      economicImpact: {
        guideEarnings,
        platformRevenue,
        localBusinessImpact,
        jobsCreated
      },
      insights,
      period: `${days} days`,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Analytics fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch analytics data',
      message: error.message 
    });
  }
});

// @route   GET /api/analytics/export
// @desc    Export analytics data as CSV
// @access  Private (Admin)
router.get('/export', async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get detailed booking data
    const bookings = await Booking.find({ createdAt: { $gte: startDate } })
      .populate('touristId', 'name email')
      .populate('guideId', 'name')
      .sort({ createdAt: -1 });

    // Convert to CSV format
    const csvHeader = 'Date,Tourist,Guide,Duration (min),Amount (ETH),Status\n';
    const csvData = bookings.map(booking => 
      `${booking.createdAt.toISOString().split('T')[0]},` +
      `${booking.touristId?.name || 'N/A'},` +
      `${booking.guideId?.name || 'N/A'},` +
      `${booking.durationInMinutes || 0},` +
      `${booking.amount || 0},` +
      `${booking.status || 'unknown'}`
    ).join('\n');

    const csv = csvHeader + csvData;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="tourism-analytics-${period}days.csv"`);
    res.send(csv);

  } catch (error) {
    console.error('Analytics export error:', error);
    res.status(500).json({ 
      error: 'Failed to export analytics data',
      message: error.message 
    });
  }
});

module.exports = router;

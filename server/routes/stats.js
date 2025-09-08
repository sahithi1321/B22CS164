const express = require('express');
const Url = require('../models/Url');
const logger = require('../utils/logger');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get overall statistics for user
router.get('/overview', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get basic counts
    const totalUrls = await Url.countDocuments({ userId });
    const activeUrls = await Url.countDocuments({ userId, isActive: true });
    const expiredUrls = await Url.countDocuments({ 
      userId, 
      expiresAt: { $lt: new Date() } 
    });
    
    // Get total clicks
    const totalClicksResult = await Url.aggregate([
      { $match: { userId } },
      { $group: { _id: null, totalClicks: { $sum: '$clicks' } } }
    ]);
    const totalClicks = totalClicksResult[0]?.totalClicks || 0;
    
    // Get clicks in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentClicksResult = await Url.aggregate([
      { $match: { userId } },
      { $unwind: '$clickHistory' },
      { $match: { 'clickHistory.timestamp': { $gte: thirtyDaysAgo } } },
      { $count: 'recentClicks' }
    ]);
    const recentClicks = recentClicksResult[0]?.recentClicks || 0;
    
    // Get top performing URLs
    const topUrls = await Url.find({ userId })
      .sort({ clicks: -1 })
      .limit(5)
      .select('originalUrl shortCode clicks title createdAt');
    
    // Get clicks by day for last 30 days
    const clicksByDay = await Url.aggregate([
      { $match: { userId } },
      { $unwind: '$clickHistory' },
      { $match: { 'clickHistory.timestamp': { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$clickHistory.timestamp' },
            month: { $month: '$clickHistory.timestamp' },
            day: { $dayOfMonth: '$clickHistory.timestamp' }
          },
          clicks: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);
    
    // Get clicks by country
    const clicksByCountry = await Url.aggregate([
      { $match: { userId } },
      { $unwind: '$clickHistory' },
      {
        $group: {
          _id: '$clickHistory.country',
          clicks: { $sum: 1 }
        }
      },
      { $sort: { clicks: -1 } },
      { $limit: 10 }
    ]);
    
    // Get clicks by referer
    const clicksByReferer = await Url.aggregate([
      { $match: { userId } },
      { $unwind: '$clickHistory' },
      {
        $group: {
          _id: '$clickHistory.referer',
          clicks: { $sum: 1 }
        }
      },
      { $sort: { clicks: -1 } },
      { $limit: 10 }
    ]);

    logger.info('Statistics retrieved', { userId });

    res.json({
      success: true,
      data: {
        overview: {
          totalUrls,
          activeUrls,
          expiredUrls,
          totalClicks,
          recentClicks
        },
        topUrls,
        clicksByDay: clicksByDay.map(item => ({
          date: new Date(item._id.year, item._id.month - 1, item._id.day).toISOString().split('T')[0],
          clicks: item.clicks
        })),
        clicksByCountry,
        clicksByReferer
      }
    });
  } catch (error) {
    logger.error('Statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving statistics'
    });
  }
});

// Get detailed statistics for a specific URL
router.get('/url/:urlId', auth, async (req, res) => {
  try {
    const { urlId } = req.params;
    const userId = req.user._id;
    
    const url = await Url.findOne({ _id: urlId, userId });
    
    if (!url) {
      return res.status(404).json({
        success: false,
        message: 'URL not found'
      });
    }
    
    // Get clicks by day for this URL
    const clicksByDay = await Url.aggregate([
      { $match: { _id: url._id } },
      { $unwind: '$clickHistory' },
      {
        $group: {
          _id: {
            year: { $year: '$clickHistory.timestamp' },
            month: { $month: '$clickHistory.timestamp' },
            day: { $dayOfMonth: '$clickHistory.timestamp' }
          },
          clicks: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);
    
    // Get clicks by country for this URL
    const clicksByCountry = await Url.aggregate([
      { $match: { _id: url._id } },
      { $unwind: '$clickHistory' },
      {
        $group: {
          _id: '$clickHistory.country',
          clicks: { $sum: 1 }
        }
      },
      { $sort: { clicks: -1 } }
    ]);
    
    // Get clicks by referer for this URL
    const clicksByReferer = await Url.aggregate([
      { $match: { _id: url._id } },
      { $unwind: '$clickHistory' },
      {
        $group: {
          _id: '$clickHistory.referer',
          clicks: { $sum: 1 }
        }
      },
      { $sort: { clicks: -1 } }
    ]);
    
    // Get recent clicks (last 50)
    const recentClicks = url.clickHistory
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 50)
      .map(click => ({
        ip: click.ip,
        userAgent: click.userAgent,
        referer: click.referer,
        country: click.country,
        city: click.city,
        timestamp: click.timestamp
      }));

    logger.info('URL statistics retrieved', { urlId, userId });

    res.json({
      success: true,
      data: {
        url: {
          id: url._id,
          originalUrl: url.originalUrl,
          shortCode: url.shortCode,
          shortUrl: url.shortUrl,
          title: url.title,
          description: url.description,
          clicks: url.clicks,
          isActive: url.isActive,
          expiresAt: url.expiresAt,
          maxClicks: url.maxClicks,
          createdAt: url.createdAt
        },
        clicksByDay: clicksByDay.map(item => ({
          date: new Date(item._id.year, item._id.month - 1, item._id.day).toISOString().split('T')[0],
          clicks: item.clicks
        })),
        clicksByCountry,
        clicksByReferer,
        recentClicks
      }
    });
  } catch (error) {
    logger.error('URL statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving URL statistics'
    });
  }
});

// Get real-time analytics (last 24 hours)
router.get('/realtime', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    
    // Get clicks in last 24 hours
    const recentClicksResult = await Url.aggregate([
      { $match: { userId } },
      { $unwind: '$clickHistory' },
      { $match: { 'clickHistory.timestamp': { $gte: twentyFourHoursAgo } } },
      { $count: 'recentClicks' }
    ]);
    const recentClicks = recentClicksResult[0]?.recentClicks || 0;
    
    // Get clicks by hour for last 24 hours
    const clicksByHour = await Url.aggregate([
      { $match: { userId } },
      { $unwind: '$clickHistory' },
      { $match: { 'clickHistory.timestamp': { $gte: twentyFourHoursAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$clickHistory.timestamp' },
            month: { $month: '$clickHistory.timestamp' },
            day: { $dayOfMonth: '$clickHistory.timestamp' },
            hour: { $hour: '$clickHistory.timestamp' }
          },
          clicks: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 } }
    ]);
    
    // Get top URLs in last 24 hours
    const topUrlsLast24h = await Url.aggregate([
      { $match: { userId } },
      { $unwind: '$clickHistory' },
      { $match: { 'clickHistory.timestamp': { $gte: twentyFourHoursAgo } } },
      {
        $group: {
          _id: '$_id',
          shortCode: { $first: '$shortCode' },
          originalUrl: { $first: '$originalUrl' },
          title: { $first: '$title' },
          clicks: { $sum: 1 }
        }
      },
      { $sort: { clicks: -1 } },
      { $limit: 10 }
    ]);

    logger.info('Real-time analytics retrieved', { userId });

    res.json({
      success: true,
      data: {
        recentClicks,
        clicksByHour: clicksByHour.map(item => ({
          hour: new Date(item._id.year, item._id.month - 1, item._id.day, item._id.hour).toISOString(),
          clicks: item.clicks
        })),
        topUrlsLast24h
      }
    });
  } catch (error) {
    logger.error('Real-time analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving real-time analytics'
    });
  }
});

module.exports = router;

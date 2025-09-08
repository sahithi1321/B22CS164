const express = require('express');
const Url = require('../models/Url');
const logger = require('../utils/logger');

const router = express.Router();

// Redirect short URL to original URL
router.get('/:shortCode', async (req, res) => {
  try {
    const { shortCode } = req.params;
    
    // Find the URL by short code
    const url = await Url.findOne({ shortCode });
    
    if (!url) {
      logger.warn('Short code not found', { shortCode, ip: req.ip });
      return res.status(404).json({
        success: false,
        message: 'Short URL not found'
      });
    }

    // Check if URL is accessible
    if (!url.isAccessible()) {
      let message = 'This short URL is no longer active';
      
      if (url.isExpired()) {
        message = 'This short URL has expired';
      } else if (url.hasReachedMaxClicks()) {
        message = 'This short URL has reached its maximum click limit';
      } else if (!url.isActive) {
        message = 'This short URL has been deactivated';
      }

      logger.warn('Inaccessible URL accessed', { 
        shortCode, 
        reason: message,
        ip: req.ip 
      });

      return res.status(410).json({
        success: false,
        message
      });
    }

    // Add click data
    const clickData = {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent') || 'Unknown',
      referer: req.get('Referer') || 'Direct',
      country: req.get('CF-IPCountry') || 'Unknown', // Cloudflare country header
      city: req.get('CF-IPCity') || 'Unknown' // Cloudflare city header
    };

    // Update click count and history
    await url.addClick(clickData);

    logger.info('URL redirected successfully', {
      shortCode,
      originalUrl: url.originalUrl,
      clicks: url.clicks + 1,
      ip: req.ip
    });

    // Redirect to original URL
    res.redirect(302, url.originalUrl);
  } catch (error) {
    logger.error('Redirect error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during redirection'
    });
  }
});

// Get URL info without redirecting (for preview)
router.get('/:shortCode/info', async (req, res) => {
  try {
    const { shortCode } = req.params;
    
    const url = await Url.findOne({ shortCode }).select('-clickHistory');
    
    if (!url) {
      return res.status(404).json({
        success: false,
        message: 'Short URL not found'
      });
    }

    // Return URL info without redirecting
    res.json({
      success: true,
      data: {
        originalUrl: url.originalUrl,
        shortCode: url.shortCode,
        shortUrl: url.shortUrl,
        title: url.title,
        description: url.description,
        clicks: url.clicks,
        isActive: url.isActive,
        isAccessible: url.isAccessible(),
        expiresAt: url.expiresAt,
        maxClicks: url.maxClicks,
        createdAt: url.createdAt
      }
    });
  } catch (error) {
    logger.error('URL info error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving URL info'
    });
  }
});

module.exports = router;

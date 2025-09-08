const express = require('express');
const { body, validationResult } = require('express-validator');
const Url = require('../models/Url');
const logger = require('../utils/logger');
const { auth, optionalAuth } = require('../middleware/auth');
const { generateShortCode, isValidUrl } = require('../utils/urlUtils');

const router = express.Router();

// Create short URL
router.post('/shorten', [
  optionalAuth,
  body('originalUrl')
    .isURL({ protocols: ['http', 'https'] })
    .withMessage('Please provide a valid URL')
    .isLength({ max: 2048 })
    .withMessage('URL cannot exceed 2048 characters'),
  body('customCode')
    .optional()
    .isLength({ min: 3, max: 20 })
    .withMessage('Custom code must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Custom code can only contain letters, numbers, hyphens, and underscores'),
  body('title')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('expiresAt')
    .optional()
    .isISO8601()
    .withMessage('Expiration date must be a valid ISO 8601 date'),
  body('maxClicks')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max clicks must be a positive integer'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      originalUrl,
      customCode,
      title,
      description,
      expiresAt,
      maxClicks,
      tags
    } = req.body;

    // Validate URL format
    if (!isValidUrl(originalUrl)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid URL format'
      });
    }

    let shortCode = customCode;

    // If no custom code provided, generate one
    if (!shortCode) {
      let attempts = 0;
      const maxAttempts = 10;
      
      do {
        shortCode = generateShortCode();
        attempts++;
        
        if (attempts >= maxAttempts) {
          return res.status(500).json({
            success: false,
            message: 'Unable to generate unique short code. Please try again.'
          });
        }
      } while (await Url.findOne({ shortCode }));
    } else {
      // Check if custom code is already taken
      const existingUrl = await Url.findOne({ shortCode });
      if (existingUrl) {
        return res.status(400).json({
          success: false,
          message: 'Custom code is already taken'
        });
      }
    }

    // Create URL document
    const urlData = {
      originalUrl,
      shortCode,
      customCode: !!customCode,
      userId: req.user?._id,
      title,
      description,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      maxClicks,
      tags: tags || []
    };

    const url = new Url(urlData);
    await url.save();

    logger.info('URL shortened successfully', {
      shortCode,
      originalUrl,
      userId: req.user?._id,
      customCode: !!customCode
    });

    res.status(201).json({
      success: true,
      message: 'URL shortened successfully',
      data: {
        url: {
          id: url._id,
          originalUrl: url.originalUrl,
          shortCode: url.shortCode,
          shortUrl: url.shortUrl,
          customCode: url.customCode,
          title: url.title,
          description: url.description,
          expiresAt: url.expiresAt,
          maxClicks: url.maxClicks,
          tags: url.tags,
          clicks: url.clicks,
          isActive: url.isActive,
          createdAt: url.createdAt
        }
      }
    });
  } catch (error) {
    logger.error('URL shortening error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during URL shortening'
    });
  }
});

// Get user's URLs
router.get('/my-urls', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const query = { userId: req.user._id };
    
    // Add search functionality
    if (search) {
      query.$or = [
        { originalUrl: { $regex: search, $options: 'i' } },
        { shortCode: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const urls = await Url.find(query)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-clickHistory');

    const total = await Url.countDocuments(query);

    logger.info('User URLs retrieved', { userId: req.user._id, count: urls.length });

    res.json({
      success: true,
      data: {
        urls,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalUrls: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    logger.error('Get user URLs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving URLs'
    });
  }
});

// Get single URL details
router.get('/:id', auth, async (req, res) => {
  try {
    const url = await Url.findOne({ _id: req.params.id, userId: req.user._id });
    
    if (!url) {
      return res.status(404).json({
        success: false,
        message: 'URL not found'
      });
    }

    res.json({
      success: true,
      data: { url }
    });
  } catch (error) {
    logger.error('Get URL details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving URL details'
    });
  }
});

// Update URL
router.put('/:id', auth, [
  body('title')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('expiresAt')
    .optional()
    .isISO8601()
    .withMessage('Expiration date must be a valid ISO 8601 date'),
  body('maxClicks')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max clicks must be a positive integer'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const url = await Url.findOne({ _id: req.params.id, userId: req.user._id });
    
    if (!url) {
      return res.status(404).json({
        success: false,
        message: 'URL not found'
      });
    }

    const updateData = {};
    const { title, description, expiresAt, maxClicks, tags, isActive } = req.body;

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;
    if (maxClicks !== undefined) updateData.maxClicks = maxClicks;
    if (tags !== undefined) updateData.tags = tags;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedUrl = await Url.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    logger.info('URL updated successfully', { urlId: req.params.id, userId: req.user._id });

    res.json({
      success: true,
      message: 'URL updated successfully',
      data: { url: updatedUrl }
    });
  } catch (error) {
    logger.error('URL update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during URL update'
    });
  }
});

// Delete URL
router.delete('/:id', auth, async (req, res) => {
  try {
    const url = await Url.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    
    if (!url) {
      return res.status(404).json({
        success: false,
        message: 'URL not found'
      });
    }

    logger.info('URL deleted successfully', { urlId: req.params.id, userId: req.user._id });

    res.json({
      success: true,
      message: 'URL deleted successfully'
    });
  } catch (error) {
    logger.error('URL deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during URL deletion'
    });
  }
});

// Bulk delete URLs
router.delete('/bulk/delete', auth, [
  body('urlIds')
    .isArray({ min: 1 })
    .withMessage('URL IDs must be provided as an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { urlIds } = req.body;

    const result = await Url.deleteMany({
      _id: { $in: urlIds },
      userId: req.user._id
    });

    logger.info('Bulk delete URLs', { 
      deletedCount: result.deletedCount, 
      userId: req.user._id 
    });

    res.json({
      success: true,
      message: `${result.deletedCount} URLs deleted successfully`
    });
  } catch (error) {
    logger.error('Bulk delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during bulk deletion'
    });
  }
});

module.exports = router;

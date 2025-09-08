const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema({
  originalUrl: {
    type: String,
    required: [true, 'Original URL is required'],
    trim: true,
    maxlength: [2048, 'URL cannot exceed 2048 characters']
  },
  shortCode: {
    type: String,
    required: [true, 'Short code is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Short code must be at least 3 characters long'],
    maxlength: [20, 'Short code cannot exceed 20 characters'],
    match: [/^[a-zA-Z0-9_-]+$/, 'Short code can only contain letters, numbers, hyphens, and underscores']
  },
  customCode: {
    type: Boolean,
    default: false
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Allow anonymous URLs
  },
  clicks: {
    type: Number,
    default: 0
  },
  maxClicks: {
    type: Number,
    default: null // null means unlimited
  },
  expiresAt: {
    type: Date,
    default: null // null means never expires
  },
  isActive: {
    type: Boolean,
    default: true
  },
  title: {
    type: String,
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  clickHistory: [{
    ip: String,
    userAgent: String,
    referer: String,
    country: String,
    city: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better performance
urlSchema.index({ shortCode: 1 });
urlSchema.index({ userId: 1 });
urlSchema.index({ createdAt: -1 });
urlSchema.index({ expiresAt: 1 });
urlSchema.index({ isActive: 1 });

// Update updatedAt field
urlSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for full short URL
urlSchema.virtual('shortUrl').get(function() {
  const domain = process.env.DEFAULT_DOMAIN || 'short.ly';
  return `https://${domain}/${this.shortCode}`;
});

// Method to check if URL is expired
urlSchema.methods.isExpired = function() {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
};

// Method to check if URL has reached max clicks
urlSchema.methods.hasReachedMaxClicks = function() {
  if (!this.maxClicks) return false;
  return this.clicks >= this.maxClicks;
};

// Method to check if URL is accessible
urlSchema.methods.isAccessible = function() {
  return this.isActive && !this.isExpired() && !this.hasReachedMaxClicks();
};

// Method to add click
urlSchema.methods.addClick = function(clickData) {
  this.clicks += 1;
  this.clickHistory.push({
    ip: clickData.ip,
    userAgent: clickData.userAgent,
    referer: clickData.referer,
    country: clickData.country || 'Unknown',
    city: clickData.city || 'Unknown',
    timestamp: new Date()
  });
  
  // Keep only last 100 click records to prevent document from growing too large
  if (this.clickHistory.length > 100) {
    this.clickHistory = this.clickHistory.slice(-100);
  }
  
  return this.save();
};

module.exports = mongoose.model('Url', urlSchema);

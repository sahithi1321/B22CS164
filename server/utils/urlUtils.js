const crypto = require('crypto');

// Generate a random short code
const generateShortCode = (length = 6) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
};

// Generate short code using crypto for better randomness
const generateSecureShortCode = (length = 6) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.randomBytes(length);
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  
  return result;
};

// Validate URL format
const isValidUrl = (string) => {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
};

// Extract domain from URL
const extractDomain = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (_) {
    return null;
  }
};

// Generate QR code data URL (placeholder - would need qrcode library)
const generateQRCode = (url) => {
  // This is a placeholder. In a real implementation, you would use a library like 'qrcode'
  // to generate an actual QR code image
  return `data:image/svg+xml;base64,${Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <rect width="200" height="200" fill="white"/>
      <text x="100" y="100" text-anchor="middle" font-family="Arial" font-size="12" fill="black">
        QR Code for: ${url}
      </text>
    </svg>
  `).toString('base64')}`;
};

// Sanitize URL for display
const sanitizeUrl = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.toString();
  } catch (_) {
    return url;
  }
};

// Check if URL is likely to be malicious (basic check)
const isSuspiciousUrl = (url) => {
  const suspiciousPatterns = [
    /bit\.ly/i,
    /tinyurl\.com/i,
    /short\.link/i,
    /t\.co/i,
    /goo\.gl/i,
    /ow\.ly/i,
    /is\.gd/i,
    /v\.gd/i,
    /short\.ly/i
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(url));
};

// Get URL preview data (placeholder)
const getUrlPreview = async (url) => {
  // This is a placeholder. In a real implementation, you would use a library
  // like 'metascraper' or 'open-graph-scraper' to fetch URL metadata
  try {
    const domain = extractDomain(url);
    return {
      title: `Page from ${domain}`,
      description: `A link to ${domain}`,
      image: null,
      domain
    };
  } catch (error) {
    return {
      title: 'Unknown Page',
      description: 'Unable to fetch page information',
      image: null,
      domain: 'unknown'
    };
  }
};

module.exports = {
  generateShortCode,
  generateSecureShortCode,
  isValidUrl,
  extractDomain,
  generateQRCode,
  sanitizeUrl,
  isSuspiciousUrl,
  getUrlPreview
};

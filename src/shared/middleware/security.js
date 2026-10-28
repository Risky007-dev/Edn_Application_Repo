/**
 * Security & Rate Limiting Middleware
 * Integrates helmet and express-rate-limit.
 */

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Content Security Policy permitting local styles, fonts, and inline scripts
const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false
});

// General API rate limiter
const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes'
  }
});

// Form submission rate limiter (default: 5 per 15 minutes per IP, configurable via FORM_RATE_LIMIT_MAX)
const formSubmissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.FORM_RATE_LIMIT_MAX || '5', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Submission limit reached for this IP. Please wait before submitting another form.'
  }
});

module.exports = {
  helmetMiddleware,
  generalApiLimiter,
  formSubmissionLimiter
};

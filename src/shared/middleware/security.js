/**
 * Security & Rate Limiting Middleware
 * Integrates helmet and express-rate-limit.
 */

const crypto = require('crypto');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const helmetCache = new Map();

/**
 * Build allowed Content-Security-Policy connect-src origins from an env map.
 * Permits 'self' plus configured S3 presigned-POST upload endpoints when UPLOADS_BUCKET_NAME is set.
 */
function buildConnectSrc(env = process.env) {
  const sources = ["'self'"];
  const bucket = String((env && env.UPLOADS_BUCKET_NAME) || '').trim();
  const region = String((env && env.AWS_REGION) || 'us-east-2').trim();
  if (bucket && /^[a-z0-9.-]+$/i.test(bucket) && /^[a-z0-9-]+$/i.test(region)) {
    sources.push(`https://${bucket}.s3.${region}.amazonaws.com`);
    sources.push(`https://${bucket}.s3.amazonaws.com`);
  }
  return sources;
}

function getHelmetInstance() {
  const bucket = (process.env.UPLOADS_BUCKET_NAME || '').trim();
  const region = (process.env.AWS_REGION || 'us-east-2').trim();
  const cacheKey = `${bucket}|${region}`;
  if (helmetCache.has(cacheKey)) {
    return helmetCache.get(cacheKey);
  }
  const middleware = helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        fontSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: buildConnectSrc(process.env)
      }
    },
    crossOriginEmbedderPolicy: false
  });
  helmetCache.set(cacheKey, middleware);
  return middleware;
}

// Content Security Policy permitting local styles, fonts, inline scripts, and S3 CV uploads
function helmetMiddleware(req, res, next) {
  return getHelmetInstance()(req, res, next);
}

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

/**
 * Constant-time string comparison safe against non-string inputs and mismatched lengths.
 */
function timingSafeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }
  const hashA = crypto.createHash('sha256').update(a, 'utf8').digest();
  const hashB = crypto.createHash('sha256').update(b, 'utf8').digest();
  return crypto.timingSafeEqual(hashA, hashB) && a.length === b.length;
}

module.exports = {
  helmetMiddleware,
  buildConnectSrc,
  getAllowedConnectSources: buildConnectSrc,
  generalApiLimiter,
  formSubmissionLimiter,
  timingSafeCompare
};

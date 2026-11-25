/**
 * Portal Authentication, Session, Rate-Limiting & CSRF Protection
 */

const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { timingSafeCompare } = require('../shared/middleware/security');

const SESSION_COOKIE_NAME = 'tt_portal_session';
const SESSION_TTL_SECONDS = 12 * 60 * 60; // 12 hours

function hashPassword(password) {
  if (typeof password !== 'string' || password.length < 1) {
    throw new Error('Password must be a non-empty string');
  }
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 }).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

function verifyPassword(password, storedHash) {
  if (typeof password !== 'string' || typeof storedHash !== 'string') return false;
  const parts = storedHash.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const [, salt, expectedHex] = parts;
  const derivedHex = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 }).toString('hex');
  return timingSafeCompare(derivedHex, expectedHex);
}

function generateToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64url');
}

function hashToken(rawToken) {
  return crypto.createHash('sha256').update(String(rawToken)).digest('hex');
}

function generateTempPassword() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  const bytes = crypto.randomBytes(20);
  let out = '';
  for (let i = 0; i < 20; i++) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
}

function parseCookies(req) {
  const header = req.headers && req.headers.cookie;
  const cookies = {};
  if (!header) return cookies;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) {
      try {
        cookies[key] = decodeURIComponent(val);
      } catch {
        cookies[key] = val;
      }
    }
  }
  return cookies;
}

function isHttpsRequest(req) {
  if (req.secure) return true;
  const proto = req.headers && req.headers['x-forwarded-proto'];
  if (typeof proto === 'string' && proto.split(',')[0].trim().toLowerCase() === 'https') {
    return true;
  }
  return process.env.NODE_ENV === 'production' && process.env.ALLOW_INSECURE_LOCAL_COOKIE !== 'true';
}

function setSessionCookie(res, rawToken, req) {
  const parts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(rawToken)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${SESSION_TTL_SECONDS}`
  ];
  if (isHttpsRequest(req)) {
    parts.push('Secure');
  }
  res.setHeader('Set-Cookie', parts.join('; '));
}

function clearSessionCookie(res, req) {
  const parts = [
    `${SESSION_COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0'
  ];
  if (isHttpsRequest(req)) {
    parts.push('Secure');
  }
  res.setHeader('Set-Cookie', parts.join('; '));
}

function createLoginRateLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: parseInt(process.env.PORTAL_LOGIN_RATE_LIMIT_MAX || '5', 10),
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    handler: (req, res) => {
      res.status(429).send('Too many login attempts. Please wait 15 minutes before trying again.');
    }
  });
}

function requireAuth(store, getBasePrefix) {
  return async (req, res, next) => {
    try {
      const cookies = parseCookies(req);
      const rawToken = cookies[SESSION_COOKIE_NAME];
      const base = getBasePrefix(req);

      if (!rawToken) {
        return res.redirect(`${base}/login`);
      }

      const tokenHash = hashToken(rawToken);
      const session = await store.getSession(tokenHash);
      if (!session) {
        clearSessionCookie(res, req);
        return res.redirect(`${base}/login`);
      }

      const user = await store.getUser(session.username);
      if (!user) {
        await store.deleteSession(tokenHash);
        clearSessionCookie(res, req);
        return res.redirect(`${base}/login`);
      }

      req.portalUser = user;
      req.portalSession = session;
      req.portalSessionTokenHash = tokenHash;

      // Force password change on first login
      const relPath = req.path || '/';
      if (user.mustChangePassword && relPath !== '/change-password' && relPath !== '/logout') {
        return res.redirect(`${base}/change-password`);
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

function verifyCsrf(req, res, next) {
  const session = req.portalSession;
  const submitted = (req.body && req.body._csrf) || req.headers['x-csrf-token'];
  if (!session || !session.csrfToken || typeof submitted !== 'string' || !timingSafeCompare(submitted, session.csrfToken)) {
    return res.status(403).send('Invalid or missing CSRF token. Please refresh and try again.');
  }
  next();
}

async function ensureKashamarSeeded(store) {
  const existing = await store.getUser('kashamar');
  if (existing) {
    return { created: false, user: existing };
  }
  const tempPassword = generateTempPassword();
  const user = {
    username: 'kashamar',
    displayName: 'Kashamar (Teacher Cassie)',
    role: 'admin',
    passwordHash: hashPassword(tempPassword),
    mustChangePassword: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await store.putUser(user);
  return { created: true, user, tempPassword };
}

module.exports = {
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
  hashPassword,
  verifyPassword,
  generateToken,
  hashToken,
  generateTempPassword,
  parseCookies,
  setSessionCookie,
  clearSessionCookie,
  createLoginRateLimiter,
  requireAuth,
  verifyCsrf,
  ensureKashamarSeeded
};

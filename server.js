const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Trust Proxy Configuration (default off)
if (process.env.TRUST_PROXY === 'true' || process.env.TRUST_PROXY === '1') {
  app.set('trust proxy', 1);
}

// Shared Infrastructure & Modular Middleware
const config = require('./src/shared/config');
const requestLogger = require('./src/shared/middleware/logger');
const { helmetMiddleware, generalApiLimiter, formSubmissionLimiter, timingSafeCompare } = require('./src/shared/middleware/security');
const brand = require('./src/shared/brand');
const storage = require('./src/shared/storage');
const formPipeline = require('./src/shared/forms/formPipeline');
const {
  renderHomePage,
  renderTraditionalTutoringPage,
  renderConciergePage,
  renderPopcornMathsPage,
  renderSpecialistSupportPage,
  renderPresenterPage,
  renderBookPage,
  renderContactPage,
  renderFaqPage,
  renderAboutPage,
  renderPopcornGamePage,
  renderServiceFinderPage,
  renderSchoolPartnershipPage,
  renderResourcesPage,
  renderReadinessCheckPage
} = require('./src/shared/templates/pages');
const { renderPrivacyPage, renderTermsPage } = require('./src/shared/templates/legalPages');
const {
  renderPopcornHubPage,
  renderPopcornParentsPage,
  renderPopcornSchoolsPage,
  renderPopcornPresentersPage,
  renderPopcornLocationsPage,
  renderPopcornPlayPage,
  renderPopcornFaqPage
} = require('./src/popcorn/popcornRebuild');
const { sanitizeInterestHint } = require('./src/shared/finder/serviceFinder');

// Middleware
app.use(requestLogger);
app.use(helmetMiddleware);
app.use(bodyParser.json());

// Deny requests for sensitive file extensions, legacy paths, or path traversal
app.use((req, res, next) => {
  const urlPath = (req.path || '').toLowerCase();
  if (
    urlPath.endsWith('.py') ||
    (urlPath.endsWith('.xml') && urlPath !== '/sitemap.xml') ||
    urlPath.endsWith('.json') ||
    urlPath.endsWith('.md') ||
    urlPath.includes('/web-inf') ||
    urlPath.includes('flasktest') ||
    urlPath.includes('pom.xml') ||
    urlPath.includes('..')
  ) {
    return res.status(404).send('Not Found');
  }
  next();
});

// Operational Health & Tracing Benchmark Probes (zero-IO, unthrottled)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

app.get('/api/health/ping', (req, res) => {
  res.status(200).type('text/plain').send('pong');
});

// Config-Gated Synthetic Fault Injection (disabled in production by default)
app.post('/api/debug/fault', (req, res) => {
  const faultEnabled = config.faultInjectionEnabled || process.env.FAULT_INJECTION_ENABLED === 'true';
  const expectedKey = process.env.FAULT_INJECTION_KEY || '';
  const providedKey = req.headers['x-debug-fault-key'] || '';

  if (!faultEnabled || !expectedKey || !timingSafeCompare(String(providedKey), expectedKey)) {
    return res.status(404).send('Not Found');
  }

  const { mode = '503', delayMs = 0 } = req.body || {};
  const boundedDelay = Math.min(Math.max(Number(delayMs) || 0, 0), 2000);

  setTimeout(() => {
    if (mode === 'delay') {
      return res.status(200).json({ fault: 'delay', delayMs: boundedDelay });
    }
    return res.status(503).json({ error: 'Simulated service fault', traceId: req.traceId || null });
  }, boundedDelay);
});

// SEO Discovery Routes (robots.txt & canonical sitemap.xml)
const CANONICAL_PUBLIC_ROUTES = [
  '/',
  '/about',
  '/services/traditional-tutoring',
  '/services/concierge',
  '/services/popcorn-math',
  '/services/specialist-support',
  '/popcorn-math/parents',
  '/popcorn-math/schools',
  '/popcorn-math/presenters',
  '/popcorn-math/locations',
  '/popcorn-math/play',
  '/popcorn-math/faq',
  '/find-your-programme',
  '/resources',
  '/book',
  '/contact',
  '/faq',
  '/readiness-check'
];

app.get('/robots.txt', (req, res) => {
  const siteOrigin = (process.env.SITE_URL || process.env.PUBLIC_SITE_URL || 'https://popcornmaths.com').replace(/\/+$/, '');
  if ((req.headers.host || '').split(':')[0].toLowerCase() === 'checkin.tutortime.ai') {
    return res.type('text/plain').send('User-agent: *\nDisallow: /\n');
  }
  res.type('text/plain').send(
    `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /office\nDisallow: /p/\nSitemap: ${siteOrigin}/sitemap.xml\n`
  );
});

app.get('/sitemap.xml', (req, res) => {
  const siteOrigin = (process.env.SITE_URL || process.env.PUBLIC_SITE_URL || 'https://popcornmaths.com').replace(/\/+$/, '');
  const urlsXml = CANONICAL_PUBLIC_ROUTES.map(
    (routePath) => `  <url><loc>${siteOrigin}${routePath}</loc></url>`
  ).join('\n');
  res.type('application/xml').send(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlsXml}\n</urlset>\n`
  );
});

app.use('/api', generalApiLimiter);
app.use('/api', formPipeline);

// AI Chatbot Route (Task 3)
const { handleChat, chatRateLimiter } = require('./src/shared/chatbot/chatController');
app.post('/api/chat', chatRateLimiter, handleChat);

// Explicit Static Asset Serving (pages, css, js, assets, fonts only)
app.use('/css', express.static(path.join(__dirname, 'MyWebApp/src/main/webapp/css')));
app.use('/js', express.static(path.join(__dirname, 'MyWebApp/src/main/webapp/js')));
app.use('/assets', express.static(path.join(__dirname, 'MyWebApp/src/main/webapp/assets')));
app.use('/fonts', express.static(path.join(__dirname, 'MyWebApp/src/main/webapp/fonts')));
app.use('/finalnewmathapo-01.png', express.static(path.join(__dirname, 'MyWebApp/src/main/webapp/finalnewmathapo-01.png')));

// Private Attendance & Invoicing Portal (unlisted /office, checkin.tutortime.ai, and /p/:token)
const { createPortalRouters, isCheckinHost } = require('./src/portal/router');
const { officeRouter, parentRouter } = createPortalRouters();
app.use('/p', parentRouter);
app.use('/office', officeRouter);
app.use((req, res, next) => {
  if (isCheckinHost(req)) {
    return officeRouter(req, res, next);
  }
  next();
});

// Database file path (supports test isolation via SUBSCRIBERS_DB_FILE)
const dbFile = process.env.SUBSCRIBERS_DB_FILE || path.join(__dirname, 'subscribers.json');

// Initialize database file if it doesn't exist
if (!fs.existsSync(dbFile)) {
  fs.writeFileSync(dbFile, JSON.stringify({ subscribers: [] }, null, 2));
}

// Helper function to read subscribers
function getSubscribers() {
  try {
    const data = fs.readFileSync(dbFile, 'utf8');
    return JSON.parse(data).subscribers || [];
  } catch (err) {
    console.error('Error reading subscribers:', err);
    return [];
  }
}

// Helper function to save subscribers atomically
function saveSubscribers(subscribers) {
  try {
    const tmpFile = `${dbFile}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify({ subscribers }, null, 2));
    fs.renameSync(tmpFile, dbFile);
    return true;
  } catch (err) {
    console.error('Error saving subscribers:', err);
    return false;
  }
}

// Helper function to validate email
function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length > 150) return false;
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(trimmed);
}

// Helper function to send confirmation email (zero-PII logging)
async function sendConfirmationEmail(recipientEmail) {
  if (!recipientEmail) {
    console.log('✉️  Confirmation email queued');
    return true;
  }
  try {
    const result = await storage.sendNotificationEmail(
      recipientEmail,
      'Welcome to Tutor Time & Popcorn Math!',
      '<p>Thank you for subscribing to updates from <strong>Tutor Time with Teacher Cassie</strong> and <strong>Popcorn Math</strong>.</p>' +
      '<p>We will keep you posted on upcoming sessions, workshops, and resources.</p>'
    );
    return !(result && result.skipped);
  } catch (err) {
    console.error('[Email] Confirmation email failed:', err.message);
    return false;
  }
}

// Routes

// GET / & /index.html - Serve dynamic server-rendered homepage
app.get('/', (req, res) => {
  res.send(renderHomePage());
});

app.get('/index.html', (req, res) => {
  res.send(renderHomePage());
});

// GET /services/:slug - Explicit route to serve the service pages
app.get('/services/:slug', (req, res) => {
  const { slug } = req.params;
  
  if (!slug || !brand.isSlugAllowed(slug) || slug.includes('..')) {
    return res.status(404).send('Service not found');
  }

  switch (slug) {
    case 'traditional-tutoring':
      return res.send(renderTraditionalTutoringPage());
    case 'concierge':
      return res.send(renderConciergePage());
    case 'popcorn-maths':
      return res.redirect(301, '/services/popcorn-math');
    case 'popcorn-math':
      return res.send(renderPopcornHubPage());
    case 'specialist-support':
      return res.send(renderSpecialistSupportPage());
    default:
      return res.status(404).send('Service not found');
  }
});

// Rebuilt Popcorn Math Canonical Routes (Task 5 Rebuild)
app.get('/services/popcorn-math', (req, res) => {
  res.send(renderPopcornHubPage());
});

app.get('/popcorn-math/parents', (req, res) => {
  res.send(renderPopcornParentsPage());
});

app.get('/popcorn-math/schools', (req, res) => {
  res.send(renderPopcornSchoolsPage());
});

app.get('/popcorn-math/presenters', (req, res) => {
  res.send(renderPopcornPresentersPage());
});

app.get('/popcorn-math/locations', (req, res) => {
  res.send(renderPopcornLocationsPage());
});

app.get('/popcorn-math/play', (req, res) => {
  res.send(renderPopcornPlayPage());
});

app.get('/popcorn-math/faq', (req, res) => {
  res.send(renderPopcornFaqPage());
});

// Alias: /join -> 301 to /popcorn-math/presenters
app.get('/join', (req, res) => {
  res.redirect(301, '/popcorn-math/presenters');
});

// 301 Permanent Redirects from legacy Popcorn Maths URLs
app.get('/services/popcorn-maths', (req, res) => {
  res.redirect(301, '/services/popcorn-math');
});

app.get('/popcorn-maths/presenter', (req, res) => {
  res.redirect(301, '/popcorn-math/presenters');
});

app.get('/popcorn-maths/game', (req, res) => {
  res.redirect(301, '/popcorn-math/play');
});

app.get('/popcorn-maths/school-partnership', (req, res) => {
  res.redirect(301, '/popcorn-math/schools');
});

// Core Site Pages
app.get('/book', (req, res) => {
  res.send(renderBookPage());
});

app.get('/contact', (req, res) => {
  res.send(renderContactPage());
});

app.get('/faq', (req, res) => {
  res.send(renderFaqPage());
});

app.get('/about', (req, res) => {
  res.send(renderAboutPage());
});

app.get('/find-your-programme', (req, res) => {
  const hint = sanitizeInterestHint(req.query.interest);
  res.send(renderServiceFinderPage(hint));
});

// GET /resources - TT-16 Resources Page Stub
app.get('/resources', (req, res) => {
  res.send(renderResourcesPage());
});

// GET /readiness-check - Gamified CPEA Readiness Check (Task 4)
app.get('/readiness-check', (req, res) => {
  res.send(renderReadinessCheckPage());
});

// GET /privacy - Draft Privacy Policy & Data Retention Schedule
app.get('/privacy', (req, res) => {
  res.send(renderPrivacyPage());
});

// GET /terms - Draft Terms of Service & Policy Inventory
app.get('/terms', (req, res) => {
  res.send(renderTermsPage());
});

// Favicon routes
app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(__dirname, 'MyWebApp/src/main/webapp/assets/icons/favicon-32x32.png'));
});

app.get('/favicon.png', (req, res) => {
  res.sendFile(path.join(__dirname, 'MyWebApp/src/main/webapp/assets/icons/favicon-32x32.png'));
});

// POST /subscribe - Subscribe a new email (rate-limited & type-safe)
app.post('/subscribe', formSubmissionLimiter, async (req, res) => {
  try {
    const { email } = (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) ? req.body : {};
    
    // Validate input
    if (typeof email !== 'string' || !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email address'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const subscribers = getSubscribers();

    // Check if already subscribed
    if (subscribers.some(s => s.email === cleanEmail)) {
      return res.status(409).json({
        success: false,
        message: 'Email already subscribed'
      });
    }

    // Add new subscriber
    const newSubscriber = {
      email: cleanEmail,
      subscribedAt: new Date().toISOString(),
      confirmed: false
    };

    subscribers.push(newSubscriber);

    // Save to file
    if (!saveSubscribers(subscribers)) {
      return res.status(500).json({
        success: false,
        message: 'Error saving email. Try again later.'
      });
    }

    // Send confirmation email
    const emailSent = await sendConfirmationEmail(cleanEmail);

    return res.status(201).json({
      success: true,
      message: 'Successfully subscribed! Check your email for confirmation.',
      email_sent: emailSent
    });

  } catch (err) {
    console.error('Error in /subscribe:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Error processing subscription'
    });
  }
});

// GET /subscribers - Get all subscribers (admin endpoint, requires X-Admin-Key)
app.get('/subscribers', generalApiLimiter, (req, res) => {
  const expectedKey = process.env.ADMIN_API_KEY;
  if (!expectedKey) {
    return res.status(404).send('Not Found');
  }

  const providedKey = req.headers['x-admin-key'];
  if (!timingSafeCompare(providedKey, expectedKey)) {
    return res.status(404).send('Not Found');
  }

  try {
    const subscribers = getSubscribers();
    return res.json({
      total: subscribers.length,
      subscribers: subscribers
    });
  } catch (err) {
    console.error('Error fetching subscribers:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Error fetching subscribers'
    });
  }
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════╗
║    🍿 Popcorn Maths Server 🍿    ║
╚════════════════════════════════════╝

✅ Server running on http://localhost:${PORT}
📧 Email storage: ${dbFile}
📊 View subscribers: http://localhost:${PORT}/subscribers

Press Ctrl+C to stop the server
`);
});

// Graceful container-native socket draining & crash JSON loggers
let isShuttingDown = false;
function gracefulShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'info',
    event: 'graceful_shutdown',
    signal
  }));

  const forceTimer = setTimeout(() => {
    process.exit(1);
  }, 5000);
  if (typeof forceTimer.unref === 'function') {
    forceTimer.unref();
  }

  server.close(() => {
    process.exit(0);
  });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'error',
    event: 'unhandledRejection',
    message: reason instanceof Error ? reason.message : String(reason)
  }));
});

process.on('uncaughtException', (err) => {
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'fatal',
    event: 'uncaughtException',
    message: err instanceof Error ? err.message : String(err)
  }));
  gracefulShutdown('uncaughtException');
});

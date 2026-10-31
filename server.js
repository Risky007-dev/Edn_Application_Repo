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
const { helmetMiddleware, generalApiLimiter } = require('./src/shared/middleware/security');
const brand = require('./src/shared/brand');
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
  renderResourcesPage
} = require('./src/shared/templates/pages');
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

  if (!faultEnabled || !expectedKey || providedKey !== expectedKey) {
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
  '/services/popcorn-maths',
  '/services/specialist-support',
  '/popcorn-maths/presenter',
  '/popcorn-maths/game',
  '/find-your-programme',
  '/popcorn-maths/school-partnership',
  '/resources',
  '/book',
  '/contact',
  '/faq'
];

app.get('/robots.txt', (req, res) => {
  const siteOrigin = (process.env.PUBLIC_SITE_URL || 'https://popcornmaths.com').replace(/\/+$/, '');
  res.type('text/plain').send(
    `User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${siteOrigin}/sitemap.xml\n`
  );
});

app.get('/sitemap.xml', (req, res) => {
  const siteOrigin = (process.env.PUBLIC_SITE_URL || 'https://popcornmaths.com').replace(/\/+$/, '');
  const urlsXml = CANONICAL_PUBLIC_ROUTES.map(
    (routePath) => `  <url><loc>${siteOrigin}${routePath}</loc></url>`
  ).join('\n');
  res.type('application/xml').send(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlsXml}\n</urlset>\n`
  );
});

app.use('/api', generalApiLimiter);
app.use('/api', formPipeline);

// Explicit Static Asset Serving (pages, css, js, assets only)
app.use('/css', express.static(path.join(__dirname, 'MyWebApp/src/main/webapp/css')));
app.use('/js', express.static(path.join(__dirname, 'MyWebApp/src/main/webapp/js')));
app.use('/assets', express.static(path.join(__dirname, 'MyWebApp/src/main/webapp/assets')));
app.use('/finalnewmathapo-01.png', express.static(path.join(__dirname, 'MyWebApp/src/main/webapp/finalnewmathapo-01.png')));

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

// Helper function to save subscribers
function saveSubscribers(subscribers) {
  try {
    fs.writeFileSync(dbFile, JSON.stringify({ subscribers }, null, 2));
    return true;
  } catch (err) {
    console.error('Error saving subscribers:', err);
    return false;
  }
}

// Helper function to validate email
function isValidEmail(email) {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
}

// Helper function to send confirmation email
function sendConfirmationEmail(email) {
  console.log(`✉️  Confirmation email sent to: ${email}`);
  return Promise.resolve(true);
}

// Routes

// GET / & /index.html - Serve dynamic server-rendered homepage
app.get('/', (req, res) => {
  res.send(renderHomePage());
});

app.get('/index.html', (req, res) => {
  res.send(renderHomePage());
});

// GET /services/:slug - Explicit route to serve the four service pages
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
      return res.send(renderPopcornMathsPage());
    case 'specialist-support':
      return res.send(renderSpecialistSupportPage());
    default:
      return res.status(404).send('Service not found');
  }
});

// GET /popcorn-maths/presenter - We're hiring recruitment page
app.get('/popcorn-maths/presenter', (req, res) => {
  res.send(renderPresenterPage());
});

// GET /book - Book Now consultation request page
app.get('/book', (req, res) => {
  res.send(renderBookPage());
});

// GET /contact - Contact form and WhatsApp integration
app.get('/contact', (req, res) => {
  res.send(renderContactPage());
});

// GET /faq - FAQ accordion page
app.get('/faq', (req, res) => {
  res.send(renderFaqPage());
});

// GET /about - About page stub
app.get('/about', (req, res) => {
  res.send(renderAboutPage());
});

// GET /popcorn-maths/game - TT-13 Popcorn Math Mini-Game
app.get('/popcorn-maths/game', (req, res) => {
  res.send(renderPopcornGamePage());
});

// GET /find-your-programme - TT-14 Smart Service Finder
app.get('/find-your-programme', (req, res) => {
  const hint = sanitizeInterestHint(req.query.interest);
  res.send(renderServiceFinderPage(hint));
});

// GET /popcorn-maths/school-partnership - TT-15 School Partnership Enquiry
app.get('/popcorn-maths/school-partnership', (req, res) => {
  res.send(renderSchoolPartnershipPage());
});

// GET /resources - TT-16 Resources Page Stub
app.get('/resources', (req, res) => {
  res.send(renderResourcesPage());
});

// Favicon routes
app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(__dirname, 'MyWebApp/src/main/webapp/assets/icons/favicon-32x32.png'));
});

app.get('/favicon.png', (req, res) => {
  res.sendFile(path.join(__dirname, 'MyWebApp/src/main/webapp/assets/icons/favicon-32x32.png'));
});

// POST /subscribe - Subscribe a new email (PRESERVED - UNCHANGED)
app.post('/subscribe', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Validate input
    if (!email || !isValidEmail(email.trim())) {
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
    console.error('Error in /subscribe:', err);
    return res.status(500).json({
      success: false,
      message: 'Error processing subscription'
    });
  }
});

// GET /subscribers - Get all subscribers (admin endpoint)
app.get('/subscribers', (req, res) => {
  try {
    const subscribers = getSubscribers();
    return res.json({
      total: subscribers.length,
      subscribers: subscribers
    });
  } catch (err) {
    console.error('Error fetching subscribers:', err);
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

/**
 * Check TODOs and Content Markers in RENDERED HTTP Pages
 * Spawns the application on an isolated temporary port, fetches every rendered
 * page route over HTTP, and lists every visible "TODO(" and "data-todo" marker.
 */

const http = require('http');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const TEMP_PORT = 5004;
const TEMP_DATA_DIR = path.join(__dirname, '../tests/temp_check_todos_data');
const TEMP_SUBS_FILE = path.join(TEMP_DATA_DIR, 'subscribers.json');

// Ensure clean temp data directory
if (!fs.existsSync(TEMP_DATA_DIR)) {
  fs.mkdirSync(TEMP_DATA_DIR, { recursive: true });
}

const PAGE_ROUTES = [
  '/',
  '/about',
  '/services/traditional-tutoring',
  '/services/concierge',
  '/services/popcorn-maths',
  '/services/specialist-support',
  '/popcorn-maths/presenter',
  '/book',
  '/contact',
  '/faq'
];

function fetchRoute(route) {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${TEMP_PORT}${route}`, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, body });
      });
    }).on('error', reject);
  });
}

function waitForServer(maxRetries = 25) {
  return new Promise((resolve, reject) => {
    let retries = 0;
    const check = () => {
      http.get(`http://127.0.0.1:${TEMP_PORT}/`, () => {
        resolve();
      }).on('error', () => {
        retries++;
        if (retries >= maxRetries) {
          reject(new Error(`Server failed to start on port ${TEMP_PORT}`));
        } else {
          setTimeout(check, 200);
        }
      });
    };
    check();
  });
}

async function runCheck() {
  const serverProcess = spawn('node', ['server.js'], {
    cwd: path.join(__dirname, '..'),
    env: {
      ...process.env,
      PORT: String(TEMP_PORT),
      DATA_DIR: TEMP_DATA_DIR,
      SUBSCRIBERS_DB_FILE: TEMP_SUBS_FILE,
      NODE_ENV: 'test'
    },
    stdio: ['ignore', 'ignore', 'ignore']
  });

  try {
    await waitForServer();

    console.log('================================================================');
    console.log('   TODO( AND data-todo MARKERS IN RENDERED HTTP PAGES           ');
    console.log('================================================================\n');

    let totalMarkers = 0;

    for (const route of PAGE_ROUTES) {
      const { statusCode, body } = await fetchRoute(route);
      if (statusCode !== 200) {
        console.error(`Warning: ${route} returned status ${statusCode}`);
        continue;
      }

      const lines = body.split(/\r?\n/);
      const matches = [];

      lines.forEach((line, idx) => {
        if (line.includes('TODO(') || line.includes('data-todo')) {
          matches.push({
            lineNumber: idx + 1,
            text: line.trim()
          });
        }
      });

      if (matches.length > 0) {
        console.log(`Route: ${route} (${matches.length} markers found)`);
        matches.forEach(m => {
          console.log(`  Line ${String(m.lineNumber).padStart(3, ' ')}: ${m.text}`);
          totalMarkers++;
        });
        console.log('');
      } else {
        console.log(`Route: ${route} (0 markers found)\n`);
      }
    }

    console.log('================================================================');
    console.log(`TOTAL RENDERED TODO( AND data-todo MARKERS: ${totalMarkers}`);
    console.log('================================================================\n');

  } finally {
    serverProcess.kill('SIGTERM');
    if (fs.existsSync(TEMP_DATA_DIR)) {
      try { fs.rmSync(TEMP_DATA_DIR, { recursive: true, force: true }); } catch (_) {}
    }
  }
}

runCheck().catch(err => {
  console.error('Error running rendered TODO check:', err);
  process.exit(1);
});

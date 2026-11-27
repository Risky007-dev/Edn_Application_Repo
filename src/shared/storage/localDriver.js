/**
 * Local File-Based Storage Driver
 * Persists submissions and newsletter subscribers to gitignored JSON files.
 * Zero external cloud dependencies; lazy disk initialization so importing in
 * AWS Lambda (read-only /app filesystem) never fails with EROFS.
 */

const fs = require('fs');
const path = require('path');
const { computeSubmissionExpireAt } = require('./retention');

function getDataDir() {
  return process.env.DATA_DIR || path.join(__dirname, '../../../data');
}

function getSubmissionsFile() {
  return path.join(getDataDir(), 'tutortime-submissions.json');
}

function getSubscribersFile() {
  return process.env.SUBSCRIBERS_DB_FILE || path.join(__dirname, '../../../subscribers.json');
}

function ensureDataFile() {
  const dir = getDataDir();
  const file = getSubmissionsFile();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify({ submissions: [] }, null, 2));
  }
}

function ensureSubscribersFile() {
  const file = getSubscribersFile();
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify({ subscribers: [] }, null, 2));
  }
}

function readSubmissions() {
  ensureDataFile();
  const file = getSubmissionsFile();
  try {
    const raw = fs.readFileSync(file, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed.submissions || [];
  } catch (err) {
    console.error('[LocalStorage] Error reading submissions:', err.message);
    return [];
  }
}

function writeSubmissions(submissions) {
  ensureDataFile();
  const file = getSubmissionsFile();
  try {
    fs.writeFileSync(file, JSON.stringify({ submissions }, null, 2));
    return true;
  } catch (err) {
    console.error('[LocalStorage] Error writing submissions:', err.message);
    return false;
  }
}

function readSubscribers() {
  ensureSubscribersFile();
  const file = getSubscribersFile();
  try {
    const raw = fs.readFileSync(file, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.subscribers) ? parsed.subscribers : [];
  } catch (err) {
    console.error('[LocalStorage] Error reading subscribers:', err.message);
    return [];
  }
}

function writeSubscribers(subscribers) {
  ensureSubscribersFile();
  const file = getSubscribersFile();
  try {
    const tmpFile = `${file}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify({ subscribers }, null, 2));
    fs.renameSync(tmpFile, file);
    return true;
  } catch (err) {
    console.error('[LocalStorage] Error saving subscribers:', err.message);
    return false;
  }
}

function generateId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
}

class LocalDriver {
  constructor() {
    // Lazy disk initialization: never write on require() so read-only Lambda /app stays EROFS-free
  }

  async saveSubmission(formType, payload) {
    const submissions = readSubmissions();
    const id = generateId();
    const now = new Date().toISOString();

    const record = {
      formType,
      'createdAt#id': `${now}#${id}`,
      id,
      createdAt: now,
      status: 'PENDING_REVIEW',
      expireAt: computeSubmissionExpireAt(formType, now),
      ...payload
    };

    submissions.push(record);
    const ok = writeSubmissions(submissions);
    if (!ok) {
      throw new Error('Failed to persist submission locally');
    }
    return record;
  }

  async getSubmissionCount(formType = null) {
    const submissions = readSubmissions();
    if (!formType) return submissions.length;
    return submissions.filter(s => s.formType === formType).length;
  }

  async addSubscriber(email) {
    const cleanEmail = String(email || '').trim().toLowerCase();
    const subscribers = readSubscribers();
    if (subscribers.some(s => s.email === cleanEmail)) {
      return { created: false, duplicate: true };
    }
    const subscriber = {
      email: cleanEmail,
      subscribedAt: new Date().toISOString(),
      confirmed: false
    };
    subscribers.push(subscriber);
    if (!writeSubscribers(subscribers)) {
      throw new Error('Failed to persist subscriber locally');
    }
    return { created: true, duplicate: false, subscriber };
  }

  async listSubscribers() {
    return readSubscribers();
  }

  async createUploadPresignedPost(filename, mimeType = 'application/pdf') {
    const id = generateId();
    const sanitized = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `cv-uploads/local/${id}_${sanitized}`;

    // In local development mode, return a simulated presigned post payload
    return {
      url: '/api/uploads/mock-post',
      fields: {
        key,
        'Content-Type': mimeType,
        'x-local-dev': 'true'
      },
      key,
      maxSizeBytes: 5242880
    };
  }

  async sendNotificationEmail(to, subject, bodyHtml) {
    console.log(`[LocalStorage Mock SES] Notification email queued for: ${to} | Subject: "${subject}"`);
    return { success: true, messageId: `mock-email-${generateId()}` };
  }
}

const defaultLocalInstance = new LocalDriver();
defaultLocalInstance.LocalDriver = LocalDriver;
defaultLocalInstance.computeExpireAt = (formType, dateOrIso) =>
  computeSubmissionExpireAt(formType, dateOrIso instanceof Date ? dateOrIso.toISOString() : dateOrIso);
module.exports = defaultLocalInstance;

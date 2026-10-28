/**
 * Local File-Based Storage Driver
 * Persists submissions to gitignored JSON files.
 * Zero external cloud dependencies; ideal for local offline development.
 */

const fs = require('fs');
const path = require('path');

function getDataDir() {
  return process.env.DATA_DIR || path.join(__dirname, '../../../data');
}

function getSubmissionsFile() {
  return path.join(getDataDir(), 'tutortime-submissions.json');
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

function generateId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
}

class LocalDriver {
  constructor() {
    ensureDataFile();
    console.log('[Storage] Initialized Local File Storage at:', getSubmissionsFile());
  }

  async saveSubmission(formType, payload) {
    const submissions = readSubmissions();
    const id = generateId();
    const now = new Date().toISOString();
    
    const record = {
      formType,
      type: formType,
      'createdAt#id': `${now}#${id}`,
      id,
      createdAt: now,
      payload: { ...payload },
      ...payload,
      status: 'PENDING_REVIEW'
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

module.exports = new LocalDriver();

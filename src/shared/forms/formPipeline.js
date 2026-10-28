/**
 * Shared Form Submission Pipeline
 * Handles validation, honeypot mitigation, rate limiting, and persistence.
 * HARD RULES:
 * - Never log personal details (email, phone, name).
 * - Honeypot failures return 200 silently (bot sinkhole) and store nothing.
 * - Minimum data enforcement; adult fields only.
 * - Applicant confirmation emails disabled behind SEND_CONFIRMATIONS=false.
 */

const express = require('express');
const router = express.Router();
const storage = require('../storage');
const { formSubmissionLimiter } = require('../middleware/security');
const {
  validateHoneypot,
  validateConsent,
  validateConsultationForm,
  validateConciergeForm,
  validatePresenterForm,
  validateLearningNeedsForm,
  validateContactForm
} = require('./validators');

// In-memory telemetry counter (no personal data stored or exposed)
const submissionMetrics = {
  'book-consultation': 0,
  'concierge-application': 0,
  'presenter-application': 0,
  'learning-needs': 0,
  'contact': 0,
  'other': 0
};

// Dispatch validators by form type
function getValidator(formType) {
  switch (formType) {
    case 'book-consultation':
      return validateConsultationForm;
    case 'concierge-application':
      return validateConciergeForm;
    case 'presenter-application':
      return validatePresenterForm;
    case 'learning-needs':
      return validateLearningNeedsForm;
    case 'contact':
      return validateContactForm;
    default:
      return null;
  }
}

// POST /api/forms/:formType - Unified form submission handler
router.post('/forms/:formType', formSubmissionLimiter, async (req, res) => {
  const { formType } = req.params;
  const validator = getValidator(formType);

  if (!validator) {
    return res.status(404).json({
      success: false,
      message: `Unknown form type: ${formType}`
    });
  }

  // 1. Honeypot check (Silent drop for bots - return 200, store nothing)
  if (!validateHoneypot(req.body)) {
    // Log only formType, never request body or personal details
    console.warn(`[Security] Honeypot triggered for form: ${formType}`);
    return res.status(200).json({
      success: true,
      message: 'Thank you for your submission.'
    });
  }

  // 2. Consent check (TODO(legal) privacy text)
  if (!validateConsent(req.body)) {
    return res.status(400).json({
      success: false,
      errors: ['You must consent to our privacy policy to proceed.']
    });
  }

  // 3. Schema validation (types, max lengths, allowed values, reject unknown fields)
  const errors = validator(req.body);
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      errors
    });
  }

  try {
    // 4. Sanitize and prepare payload (strip honeypot)
    const { _gotcha, ...sanitizedPayload } = req.body;
    
    // 5. Persist via Storage Adapter (local tutortime-submissions.json or DynamoDB)
    const record = await storage.saveSubmission(formType.toUpperCase().replace(/-/g, '_'), sanitizedPayload);
    
    // 6. Update aggregate counter
    if (submissionMetrics[formType] !== undefined) {
      submissionMetrics[formType] += 1;
    } else {
      submissionMetrics.other += 1;
    }

    // 7. Admin notification only (no applicant confirmation emails in SES sandbox)
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
    if (adminEmail) {
      await storage.sendNotificationEmail(
        adminEmail,
        `New ${formType} submission received`,
        `<p>A new ${formType} submission was received with ID: ${record.id}.</p>`
      );
    }

    // Applicant confirmation email strictly behind SEND_CONFIRMATIONS=false (default: off)
    if (process.env.SEND_CONFIRMATIONS === 'true' && req.body.email) {
      await storage.sendNotificationEmail(
        req.body.email,
        'Thank you for contacting Tutor Time with Teacher Cassie',
        '<p>We have received your enquiry and will be in touch shortly.</p>'
      );
    }

    return res.status(201).json({
      success: true,
      message: 'Submission successfully received. Thank you!',
      id: record.id
    });
  } catch (err) {
    console.error(`[FormPipeline Error] Failed processing ${formType}:`, err.message);
    return res.status(500).json({
      success: false,
      message: 'A temporary error occurred while saving your submission. Please try again later.'
    });
  }
});

// POST /api/uploads/presign - Generates presigned POST payload for PDF CV uploads
router.post('/uploads/presign', async (req, res) => {
  const { filename } = req.body;
  
  if (!filename || typeof filename !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Filename is required'
    });
  }

  // Enforce PDF extension
  if (!filename.toLowerCase().endsWith('.pdf')) {
    return res.status(400).json({
      success: false,
      message: 'Only PDF documents (.pdf) are permitted for CV uploads'
    });
  }

  try {
    const presignedData = await storage.createUploadPresignedPost(filename, 'application/pdf');
    return res.status(200).json({
      success: true,
      ...presignedData
    });
  } catch (err) {
    console.error('[Upload Presign Error]:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate upload credentials'
    });
  }
});

// POST /api/uploads/mock-post - Local development upload destination (local driver only)
router.post('/uploads/mock-post', (req, res) => {
  if (storage.getCurrentDriverName() !== 'local') {
    return res.status(404).send('Not Found');
  }
  return res.status(204).end();
});

// GET /api/metrics - Anonymized submission counts by form type (requires X-Admin-Key)
router.get('/metrics', (req, res) => {
  const expectedKey = process.env.ADMIN_API_KEY;
  if (!expectedKey) {
    return res.status(404).send('Not Found');
  }

  const providedKey = req.headers['x-admin-key'];
  if (!providedKey || providedKey !== expectedKey) {
    return res.status(404).send('Not Found');
  }

  return res.json({
    driver: storage.getCurrentDriverName(),
    submissions: submissionMetrics
  });
});

// GET /api/brand-info - Public brand configuration and canonical definitions
router.get('/brand-info', (req, res) => {
  const brand = require('../brand');
  const siteContent = require('../content');
  
  const whatsappNumber = process.env.WHATSAPP_PHONE_NUMBER || '';
  const whatsappLink = whatsappNumber ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}` : '';

  return res.json({
    platformName: brand.platformName,
    parentBrand: brand.parentBrand,
    tagline: brand.tagline,
    platformLogo: brand.platformLogo,
    platformLogoLight: brand.platformLogoLight,
    services: brand.services,
    whatsapp: {
      number: whatsappNumber,
      link: whatsappLink
    }
  });
});

module.exports = router;

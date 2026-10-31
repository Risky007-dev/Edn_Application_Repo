/**
 * Server-Side Form Validators & Sanitizers
 * HARD RULES:
 * - Strict schema validation: reject unknown fields.
 * - Minimum data principle: adult fields only, no child PII.
 * - No diagnostic, medical or clinical details for learning needs.
 * - Honeypot (_gotcha) must be strictly empty.
 * - Mandatory consent checkbox.
 * - Age verification for presenters (18+ confirmation).
 */

function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email.trim());
}

function isValidPhone(phone) {
  if (typeof phone !== 'string') return false;
  const pattern = /^[+]?[\d\s().-]{7,25}$/;
  return pattern.test(phone.trim());
}

function validateHoneypot(body) {
  return !body._gotcha || body._gotcha.trim() === '';
}

function validateConsent(body) {
  return body.consent === true || body.consent === 'true' || body.consent === 'on' || body.consent === 1;
}

function checkUnknownFields(body, allowedFields) {
  const keys = Object.keys(body);
  for (const key of keys) {
    if (!allowedFields.includes(key)) {
      return `Unknown field: ${key}`;
    }
  }
  return null;
}

function isAllowedYearGroup(yg) {
  if (typeof yg !== 'string') return false;
  const s = yg.toLowerCase();
  return s.includes('primary') || s.includes('secondary');
}

// 1. Book Consultation Form
const BOOK_CONSULTATION_FIELDS = [
  'parentName',
  'email',
  'phone',
  'studentYearGroup',
  'serviceInterest',
  'additionalNotes',
  'message',
  'consent',
  '_gotcha'
];

const ALLOWED_SERVICE_INTERESTS = [
  'One-on-One Tutoring',
  'Small Group Tutoring',
  'Concierge Academic Coaching',
  'Popcorn Math',
  'Specialist Learning Support',
  'School Partnership',
  'traditional-tutoring',
  'concierge',
  'popcorn-maths',
  'specialist-support'
];

function validateConsultationForm(body) {
  const errors = [];
  
  const unknown = checkUnknownFields(body, BOOK_CONSULTATION_FIELDS);
  if (unknown) return [unknown];

  if (!body.parentName || typeof body.parentName !== 'string' || body.parentName.trim().length < 2) {
    errors.push('Parent / Guardian name is required (minimum 2 characters).');
  } else if (body.parentName.length > 100) {
    errors.push('Parent / Guardian name exceeds maximum length of 100 characters.');
  }

  if (!body.email || !isValidEmail(body.email)) {
    errors.push('A valid email address is required.');
  } else if (body.email.length > 150) {
    errors.push('Email exceeds maximum length of 150 characters.');
  }

  if (!body.phone || !isValidPhone(body.phone)) {
    errors.push('A valid contact phone number is required.');
  } else if (body.phone.length > 25) {
    errors.push('Phone number exceeds maximum length of 25 characters.');
  }

  if (!body.studentYearGroup || !isAllowedYearGroup(body.studentYearGroup)) {
    errors.push('Student year group must be specified (Early Primary, Upper Primary, or Secondary).');
  }

  if (!body.serviceInterest || !ALLOWED_SERVICE_INTERESTS.includes(body.serviceInterest)) {
    errors.push('Service interest is invalid.');
  }

  if (body.additionalNotes !== undefined) {
    if (typeof body.additionalNotes !== 'string') {
      errors.push('Additional notes must be a string.');
    } else if (body.additionalNotes.length > 1000) {
      errors.push('Additional notes exceed maximum length of 1000 characters.');
    }
  }

  if (body.message !== undefined) {
    if (typeof body.message !== 'string') {
      errors.push('Message must be a string.');
    } else if (body.message.length > 1000) {
      errors.push('Message exceeds maximum length of 1000 characters.');
    }
  }

  return errors;
}

// 2. Concierge Application Form
const CONCIERGE_FIELDS = [
  'parentName',
  'email',
  'phone',
  'studentYearGroup',
  'academicGoals',
  'preferredSchedule',
  'consent',
  '_gotcha'
];

function validateConciergeForm(body) {
  const errors = [];

  const unknown = checkUnknownFields(body, CONCIERGE_FIELDS);
  if (unknown) return [unknown];

  if (!body.parentName || typeof body.parentName !== 'string' || body.parentName.trim().length < 2) {
    errors.push('Parent / Guardian name is required.');
  } else if (body.parentName.length > 100) {
    errors.push('Parent name exceeds maximum length of 100 characters.');
  }

  if (!body.email || !isValidEmail(body.email)) {
    errors.push('A valid email address is required.');
  } else if (body.email.length > 150) {
    errors.push('Email exceeds maximum length of 150 characters.');
  }

  if (!body.phone || !isValidPhone(body.phone)) {
    errors.push('A valid contact phone number is required.');
  } else if (body.phone.length > 25) {
    errors.push('Phone number exceeds maximum length of 25 characters.');
  }

  if (!body.studentYearGroup || !isAllowedYearGroup(body.studentYearGroup)) {
    errors.push('Student year group must be specified.');
  }

  if (!body.academicGoals || typeof body.academicGoals !== 'string' || body.academicGoals.trim().length < 10) {
    errors.push('Please outline academic goals (minimum 10 characters).');
  } else if (body.academicGoals.length > 1000) {
    errors.push('Academic goals exceed maximum length of 1000 characters.');
  }

  if (body.preferredSchedule !== undefined) {
    if (typeof body.preferredSchedule !== 'string') {
      errors.push('Preferred schedule must be a string.');
    } else if (body.preferredSchedule.length > 500) {
      errors.push('Preferred schedule exceeds maximum length of 500 characters.');
    }
  }

  return errors;
}

// 3. Presenter Application Form
const PRESENTER_FIELDS = [
  'fullName',
  'email',
  'phone',
  'location',
  'ageConfirmation',
  'educationalBackground',
  'experienceWithChildren',
  'mathConfidence',
  'availability',
  'preferredRole',
  'whyPopcornMath',
  'cvUploadKey',
  'cvFileKey',
  'consent',
  '_gotcha'
];

function validatePresenterForm(body) {
  const errors = [];

  const unknown = checkUnknownFields(body, PRESENTER_FIELDS);
  if (unknown) return [unknown];

  if (!body.fullName || typeof body.fullName !== 'string' || body.fullName.trim().length < 2) {
    errors.push('Full name is required (minimum 2 characters).');
  } else if (body.fullName.length > 100) {
    errors.push('Full name exceeds maximum length of 100 characters.');
  }

  if (!body.email || !isValidEmail(body.email)) {
    errors.push('A valid email address is required.');
  } else if (body.email.length > 150) {
    errors.push('Email exceeds maximum length of 150 characters.');
  }

  if (!body.phone || !isValidPhone(body.phone)) {
    errors.push('A valid contact phone number is required.');
  } else if (body.phone.length > 25) {
    errors.push('Phone number exceeds maximum length of 25 characters.');
  }

  if (!body.location || typeof body.location !== 'string' || body.location.trim().length < 2) {
    errors.push('Location (island / country) is required.');
  } else if (body.location.length > 100) {
    errors.push('Location exceeds maximum length of 100 characters.');
  }

  // Mandatory 18+ check (no DOB)
  const is18OrOlder = body.ageConfirmation === true || body.ageConfirmation === 'true' || body.ageConfirmation === 'on';
  if (!is18OrOlder) {
    errors.push('You must confirm that you are 18 years of age or older.');
  }

  if (!body.educationalBackground || typeof body.educationalBackground !== 'string' || body.educationalBackground.trim().length < 5) {
    errors.push('Please provide your educational background (minimum 5 characters).');
  } else if (body.educationalBackground.length > 500) {
    errors.push('Educational background exceeds maximum length of 500 characters.');
  }

  if (!body.experienceWithChildren || typeof body.experienceWithChildren !== 'string' || body.experienceWithChildren.trim().length < 5) {
    errors.push('Please describe your experience working with children (minimum 5 characters).');
  } else if (body.experienceWithChildren.length > 500) {
    errors.push('Experience with children exceeds maximum length of 500 characters.');
  }

  if (!body.availability || typeof body.availability !== 'string' || body.availability.trim().length < 2) {
    errors.push('Availability details are required.');
  } else if (body.availability.length > 250) {
    errors.push('Availability exceeds maximum length of 250 characters.');
  }

  if (!body.whyPopcornMath || typeof body.whyPopcornMath !== 'string' || body.whyPopcornMath.trim().length < 10) {
    errors.push('Please tell us why you would like to join Popcorn Math (minimum 10 characters).');
  } else if (body.whyPopcornMath.length > 1000) {
    errors.push('Why Popcorn Math statement exceeds maximum length of 1000 characters.');
  }

  const cvKey = body.cvUploadKey || body.cvFileKey;
  if (cvKey !== undefined) {
    if (typeof cvKey !== 'string') {
      errors.push('CV upload key must be a string.');
    } else if (cvKey.length > 255) {
      errors.push('CV upload key exceeds maximum length of 255 characters.');
    }
  }

  return errors;
}

// 4. Learning Needs Form (Specialist Support)
// STRICT: Must not ask for diagnoses, medical or clinical details
const LEARNING_NEEDS_FIELDS = [
  'parentName',
  'email',
  'phone',
  'studentYearGroup',
  'learningStrengths',
  'areasForSupport',
  'areasRequiringSupport',
  'academicGoals',
  'preferredLearningEnvironment',
  'consent',
  '_gotcha'
];

function validateLearningNeedsForm(body) {
  const errors = [];

  const unknown = checkUnknownFields(body, LEARNING_NEEDS_FIELDS);
  if (unknown) return [unknown];

  if (!body.parentName || typeof body.parentName !== 'string' || body.parentName.trim().length < 2) {
    errors.push('Parent / Guardian name is required.');
  } else if (body.parentName.length > 100) {
    errors.push('Parent name exceeds maximum length of 100 characters.');
  }

  if (!body.email || !isValidEmail(body.email)) {
    errors.push('A valid email address is required.');
  } else if (body.email.length > 150) {
    errors.push('Email exceeds maximum length of 150 characters.');
  }

  if (!body.phone || !isValidPhone(body.phone)) {
    errors.push('A valid contact phone number is required.');
  } else if (body.phone.length > 25) {
    errors.push('Phone number exceeds maximum length of 25 characters.');
  }

  if (!body.studentYearGroup || !isAllowedYearGroup(body.studentYearGroup)) {
    errors.push('Student year group is invalid.');
  }

  if (!body.learningStrengths || typeof body.learningStrengths !== 'string' || body.learningStrengths.trim().length < 5) {
    errors.push('Please describe the student’s learning strengths (minimum 5 characters).');
  } else if (body.learningStrengths.length > 500) {
    errors.push('Learning strengths description exceeds maximum length of 500 characters.');
  }

  const support = body.areasForSupport || body.areasRequiringSupport;
  if (!support) {
    errors.push('Please describe areas requiring support.');
  } else if (typeof support === 'string' && support.length > 500) {
    errors.push('Areas for support description exceeds maximum length of 500 characters.');
  }

  if (body.academicGoals !== undefined) {
    if (typeof body.academicGoals !== 'string') {
      errors.push('Academic goals must be a string.');
    } else if (body.academicGoals.length > 1000) {
      errors.push('Academic goals exceed maximum length of 1000 characters.');
    }
  }

  if (body.preferredLearningEnvironment !== undefined) {
    if (typeof body.preferredLearningEnvironment !== 'string') {
      errors.push('Preferred learning environment must be a string.');
    } else if (body.preferredLearningEnvironment.length > 500) {
      errors.push('Preferred learning environment exceeds maximum length of 500 characters.');
    }
  }

  return errors;
}

// 5. Contact Form
const CONTACT_FIELDS = [
  'fullName',
  'email',
  'phone',
  'subject',
  'message',
  'consent',
  '_gotcha'
];

function validateContactForm(body) {
  const errors = [];

  const unknown = checkUnknownFields(body, CONTACT_FIELDS);
  if (unknown) return [unknown];

  if (!body.fullName || typeof body.fullName !== 'string' || body.fullName.trim().length < 2) {
    errors.push('Full name is required (minimum 2 characters).');
  } else if (body.fullName.length > 100) {
    errors.push('Full name exceeds maximum length of 100 characters.');
  }

  if (!body.email || !isValidEmail(body.email)) {
    errors.push('A valid email address is required.');
  } else if (body.email.length > 150) {
    errors.push('Email exceeds maximum length of 150 characters.');
  }

  if (body.phone !== undefined && body.phone !== '') {
    if (!isValidPhone(body.phone)) {
      errors.push('Phone number format is invalid.');
    } else if (body.phone.length > 25) {
      errors.push('Phone number exceeds maximum length of 25 characters.');
    }
  }

  if (!body.subject || typeof body.subject !== 'string' || body.subject.trim().length < 2) {
    errors.push('Subject is required.');
  } else if (body.subject.length > 150) {
    errors.push('Subject exceeds maximum length of 150 characters.');
  }

  if (!body.message || typeof body.message !== 'string' || body.message.trim().length < 5) {
    errors.push('Message is required (minimum 5 characters).');
  } else if (body.message.length > 2000) {
    errors.push('Message exceeds maximum length of 2000 characters.');
  }

  return errors;
}

// 6. School Partnership Enquiry Form
const SCHOOL_ENQUIRY_FIELDS = [
  'schoolName',
  'contactPerson',
  'roleTitle',
  'email',
  'phone',
  'locationDistrict',
  'studentAgeGroup',
  'estimatedStudentCount',
  'programmeType',
  'targetDate',
  'message',
  'consent',
  '_gotcha'
];

const ALLOWED_STUDENT_AGE_GROUPS = ['8-10', '11-13', 'Mixed'];
const ALLOWED_PROGRAMME_TYPES = ['Workshop', 'After-school club', 'Event'];

function validateSchoolEnquiryForm(body) {
  const errors = [];

  const unknown = checkUnknownFields(body, SCHOOL_ENQUIRY_FIELDS);
  if (unknown) return [unknown];

  if (!validateConsent(body)) {
    errors.push('Consent to the privacy policy is required.');
  }

  if (!body.schoolName || typeof body.schoolName !== 'string' || body.schoolName.trim().length < 2) {
    errors.push('School name is required (minimum 2 characters).');
  } else if (body.schoolName.length > 100) {
    errors.push('School name exceeds maximum length of 100 characters.');
  }

  if (!body.contactPerson || typeof body.contactPerson !== 'string' || body.contactPerson.trim().length < 2) {
    errors.push('Contact person name is required (minimum 2 characters).');
  } else if (body.contactPerson.length > 100) {
    errors.push('Contact person name exceeds maximum length of 100 characters.');
  }

  if (!body.roleTitle || typeof body.roleTitle !== 'string' || body.roleTitle.trim().length < 2) {
    errors.push('Role title is required (e.g. Principal, Head of Math).');
  } else if (body.roleTitle.length > 100) {
    errors.push('Role title exceeds maximum length of 100 characters.');
  }

  if (!body.email || !isValidEmail(body.email)) {
    errors.push('A valid email address is required.');
  } else if (body.email.length > 150) {
    errors.push('Email exceeds maximum length of 150 characters.');
  }

  if (!body.phone || !isValidPhone(body.phone)) {
    errors.push('A valid phone number is required.');
  } else if (body.phone.length > 25) {
    errors.push('Phone number exceeds maximum length of 25 characters.');
  }

  if (!body.locationDistrict || typeof body.locationDistrict !== 'string' || body.locationDistrict.trim().length < 2) {
    errors.push('Location or district is required.');
  } else if (body.locationDistrict.length > 100) {
    errors.push('Location exceeds maximum length of 100 characters.');
  }

  if (!body.studentAgeGroup || !ALLOWED_STUDENT_AGE_GROUPS.includes(body.studentAgeGroup)) {
    errors.push('Student age group must be one of: 8-10, 11-13, Mixed.');
  }

  const count = Number(body.estimatedStudentCount);
  if (
    body.estimatedStudentCount === undefined ||
    body.estimatedStudentCount === '' ||
    isNaN(count) ||
    !Number.isInteger(count) ||
    count < 10 ||
    count > 500
  ) {
    errors.push('Estimated student count must be an integer between 10 and 500.');
  }

  if (!body.programmeType || !ALLOWED_PROGRAMME_TYPES.includes(body.programmeType)) {
    errors.push('Programme type must be one of: Workshop, After-school club, Event.');
  }

  if (body.targetDate !== undefined && body.targetDate !== null && typeof body.targetDate === 'string') {
    if (body.targetDate.length > 50) {
      errors.push('Target date exceeds maximum length of 50 characters.');
    }
  }

  if (body.message !== undefined && body.message !== null && typeof body.message === 'string') {
    if (body.message.length > 500) {
      errors.push('Message exceeds maximum length of 500 characters.');
    }
  }

  return errors;
}

module.exports = {
  isValidEmail,
  isValidPhone,
  validateHoneypot,
  validateConsent,
  checkUnknownFields,
  validateConsultationForm,
  validateConciergeForm,
  validatePresenterForm,
  validateLearningNeedsForm,
  validateContactForm,
  validateSchoolEnquiryForm
};

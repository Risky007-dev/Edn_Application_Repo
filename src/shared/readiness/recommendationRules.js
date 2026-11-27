/**
 * Configurable Readiness Check Recommendation Rules (Single Source of Truth)
 * Used by:
 *   1. Non-AI recommendation card on /readiness-check (works without an API key)
 *   2. Server-side Claude chatbot grounding in src/shared/chatbot/chatController.js
 *
 * All visitor-facing rationales are marked status: 'APPROVED' (approved by owner 2026-11-27).
 * HARD RULE: Never invent prices, dates, or session availability.
 */

const ALLOWED_SUBJECTS = ['Mathematics', 'Language Arts'];
const ALLOWED_BANDS = ['Just Starting', 'Getting There', 'Looking Good', 'Exam Star'];

const SERVICE_CATALOG = {
  'one-on-one-tutoring': {
    id: 'one-on-one-tutoring',
    name: 'One-on-One Tutoring',
    href: '/services/traditional-tutoring',
    bookParam: 'One-on-One Tutoring',
    shortDesc: {
      text: 'Tailored one-to-one instruction paced to your child\'s needs and curriculum goals.',
      status: 'APPROVED'
    }
  },
  'sunday-workshops': {
    id: 'sunday-workshops',
    name: 'Sunday Workshops',
    href: '/book?service=Small%20Group%20Tutoring',
    bookParam: 'Small Group Tutoring',
    shortDesc: {
      text: 'Guided small-group practice sessions focused on confidence, fluency, and exam habits (schedules confirmed upon enquiry).',
      status: 'APPROVED'
    }
  },
  'seasonal-pop-ups': {
    id: 'seasonal-pop-ups',
    name: 'Seasonal Pop-Ups',
    href: '/#holiday-specials',
    bookParam: 'One-on-One Tutoring',
    shortDesc: {
      text: 'Short, focused seasonal refreshers and holiday clinics to keep strong skills sharp (upcoming availability confirmed upon enquiry).',
      status: 'APPROVED'
    }
  }
};

/**
 * Approved 10-question band recommendation table (configurable in one place).
 * - 0–4 (Just Starting): One-on-One Tutoring primary, Sunday Workshops secondary.
 * - 5–6 (Getting There): Sunday Workshops primary, One-on-One Tutoring secondary.
 * - 7–8 (Looking Good):  Sunday Workshops primary, Seasonal Pop-Ups secondary.
 * - 9–10 (Exam Star):    Seasonal Pop-Ups primary, Sunday Workshops secondary.
 */
const RECOMMENDATION_RULE_TABLE = [
  {
    id: 'just-starting',
    minScore: 0,
    maxScore: 4,
    band: 'Just Starting',
    badge: '🌱',
    primaryServiceId: 'one-on-one-tutoring',
    secondaryServiceId: 'sunday-workshops',
    rationale: {
      Mathematics: {
        text: 'Dedicated One-on-One Tutoring helps build core math foundations step-by-step at your child\'s own pace, with Sunday Workshops as a supportive group option as confidence grows.',
        status: 'APPROVED'
      },
      'Language Arts': {
        text: 'Dedicated One-on-One Tutoring strengthens reading comprehension, grammar, and writing step-by-step in a calm setting, with Sunday Workshops as a helpful companion option.',
        status: 'APPROVED'
      }
    }
  },
  {
    id: 'getting-there',
    minScore: 5,
    maxScore: 6,
    band: 'Getting There',
    badge: '💪',
    primaryServiceId: 'sunday-workshops',
    secondaryServiceId: 'one-on-one-tutoring',
    rationale: {
      Mathematics: {
        text: 'Core math skills are taking shape! Sunday Workshops provide structured, encouraging group practice to build fluency, with One-on-One Tutoring available for targeted topic gaps.',
        status: 'APPROVED'
      },
      'Language Arts': {
        text: 'Core reading and grammar skills are growing! Sunday Workshops offer steady, guided group practice, with One-on-One Tutoring available if your child would benefit from individual support.',
        status: 'APPROVED'
      }
    }
  },
  {
    id: 'looking-good',
    minScore: 7,
    maxScore: 8,
    band: 'Looking Good',
    badge: '🚀',
    primaryServiceId: 'sunday-workshops',
    secondaryServiceId: 'seasonal-pop-ups',
    rationale: {
      Mathematics: {
        text: 'Strong math foundations are already in place! Sunday Workshops help sharpen speed and problem-solving confidence, while Seasonal Pop-Ups offer focused refreshers during breaks.',
        status: 'APPROVED'
      },
      'Language Arts': {
        text: 'Strong literacy habits are showing! Sunday Workshops help refine comprehension and editing skills, while Seasonal Pop-Ups offer focused refreshers during breaks.',
        status: 'APPROVED'
      }
    }
  },
  {
    id: 'exam-star',
    minScore: 9,
    maxScore: 10,
    band: 'Exam Star',
    badge: '🌟',
    primaryServiceId: 'seasonal-pop-ups',
    secondaryServiceId: 'sunday-workshops',
    rationale: {
      Mathematics: {
        text: 'Outstanding work on these sample questions! Short Seasonal Pop-Ups help stretch higher-order math thinking and keep skills sharp, with Sunday Workshops as an optional steady tune-up.',
        status: 'APPROVED'
      },
      'Language Arts': {
        text: 'Outstanding work on these sample questions! Short Seasonal Pop-Ups keep reading, vocabulary, and exam confidence high, with Sunday Workshops as an optional steady tune-up.',
        status: 'APPROVED'
      }
    }
  }
];

const RECOMMENDATION_UI_COPY = {
  heading: {
    text: 'Suggested Next Steps for Your Family',
    status: 'APPROVED'
  },
  availabilityNote: {
    text: 'Availability, schedules, and fees are confirmed with Teacher Cassie during a consultation — no dates or prices are quoted automatically.',
    status: 'APPROVED'
  },
  talkButtonLabel: {
    text: 'Talk about my results',
    status: 'APPROVED'
  }
};

function findRuleByScore(score) {
  if (!Number.isInteger(score) || score < 0 || score > 10) return null;
  return RECOMMENDATION_RULE_TABLE.find(r => score >= r.minScore && score <= r.maxScore) || null;
}

/**
 * Strict server-side validator for chatbot readinessResult payload.
 * Accepts ONLY { subject, score, band } — rejects any extra keys (including childName/PII).
 */
function validateChatReadinessResult(input) {
  if (input === undefined || input === null) {
    return { valid: true, value: null, errors: [] };
  }
  if (typeof input !== 'object' || Array.isArray(input)) {
    return { valid: false, value: null, errors: ['Readiness result must be an object.'] };
  }

  const allowedKeys = ['subject', 'score', 'band'];
  const keys = Object.keys(input);
  for (const key of keys) {
    if (!allowedKeys.includes(key)) {
      return { valid: false, value: null, errors: [`Unknown field in readinessResult: ${key}`] };
    }
  }

  const errors = [];
  if (!ALLOWED_SUBJECTS.includes(input.subject)) {
    errors.push('readinessResult.subject must be Mathematics or Language Arts.');
  }
  if (!Number.isInteger(input.score) || input.score < 0 || input.score > 10) {
    errors.push('readinessResult.score must be an integer between 0 and 10.');
  }
  if (!ALLOWED_BANDS.includes(input.band)) {
    errors.push('readinessResult.band is invalid.');
  }

  if (errors.length === 0) {
    const rule = findRuleByScore(input.score);
    if (!rule || rule.band !== input.band) {
      errors.push('readinessResult.band does not match readinessResult.score.');
    }
  }

  if (errors.length > 0) {
    return { valid: false, value: null, errors };
  }

  return {
    valid: true,
    value: {
      subject: input.subject,
      score: input.score,
      band: input.band
    },
    errors: []
  };
}

function getRecommendationForResult({ subject, score, band } = {}) {
  const check = validateChatReadinessResult({ subject, score, band });
  if (!check.valid || !check.value) {
    return null;
  }

  const rule = findRuleByScore(check.value.score);
  const primary = SERVICE_CATALOG[rule.primaryServiceId];
  const secondary = SERVICE_CATALOG[rule.secondaryServiceId];
  const rationaleObj = rule.rationale[check.value.subject];

  return {
    subject: check.value.subject,
    score: check.value.score,
    total: 10,
    band: rule.band,
    badge: rule.badge,
    primary: {
      id: primary.id,
      name: primary.name,
      href: primary.href,
      bookParam: primary.bookParam,
      shortDesc: primary.shortDesc.text
    },
    secondary: {
      id: secondary.id,
      name: secondary.name,
      href: secondary.href,
      bookParam: secondary.bookParam,
      shortDesc: secondary.shortDesc.text
    },
    rationale: rationaleObj ? rationaleObj.text : '',
    availabilityNote: RECOMMENDATION_UI_COPY.availabilityNote.text
  };
}

/**
 * Returns a client-safe plain JSON snapshot of the rule table for non-AI result rendering.
 */
function getClientRuleConfig() {
  return {
    services: Object.fromEntries(
      Object.entries(SERVICE_CATALOG).map(([id, svc]) => [
        id,
        {
          id: svc.id,
          name: svc.name,
          href: svc.href,
          bookParam: svc.bookParam,
          shortDesc: svc.shortDesc.text
        }
      ])
    ),
    rules: RECOMMENDATION_RULE_TABLE.map(r => ({
      minScore: r.minScore,
      maxScore: r.maxScore,
      band: r.band,
      badge: r.badge,
      primaryServiceId: r.primaryServiceId,
      secondaryServiceId: r.secondaryServiceId,
      rationale: {
        Mathematics: r.rationale.Mathematics.text,
        'Language Arts': r.rationale['Language Arts'].text
      }
    })),
    uiCopy: {
      heading: RECOMMENDATION_UI_COPY.heading.text,
      availabilityNote: RECOMMENDATION_UI_COPY.availabilityNote.text,
      talkButtonLabel: RECOMMENDATION_UI_COPY.talkButtonLabel.text
    }
  };
}

module.exports = {
  ALLOWED_SUBJECTS,
  ALLOWED_BANDS,
  SERVICE_CATALOG,
  RECOMMENDATION_RULE_TABLE,
  RECOMMENDATION_UI_COPY,
  findRuleByScore,
  validateChatReadinessResult,
  getRecommendationForResult,
  getClientRuleConfig
};

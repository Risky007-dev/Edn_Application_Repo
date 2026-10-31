/**
 * Smart Service Finder Logic (Pure Mapping Functions)
 * Maps parent answers to one of the four core services.
 * Pure in-memory calculation, zero storage, zero analytics.
 */

const { services } = require('../brand');

const ALLOWED_INTEREST_HINTS = [
  'traditional-tutoring',
  'group-tutoring',
  'concierge',
  'popcorn-maths',
  'specialist-support',
  'school-partnership'
];

const FINDER_QUESTIONS = [
  {
    id: 'yearGroup',
    prompt: "1. What is your child's current year group?",
    options: [
      { value: 'early-primary', label: 'Early Primary' },
      { value: 'upper-primary', label: 'Upper Primary' },
      { value: 'secondary', label: 'Secondary' }
    ]
  },
  {
    id: 'supportWanted',
    prompt: "2. What support are you looking for?",
    options: [
      { value: 'maths', label: 'Improving mathematics skills' },
      { value: 'reading-writing', label: 'Reading and writing support' },
      { value: 'homework-assistance', label: 'Homework and assignment assistance' },
      { value: 'exam-prep', label: 'Exam preparation' },
      { value: 'organisation', label: 'Organisation and study skills' },
      { value: 'learning-support', label: 'Learning support for ADHD or dyslexia' },
      { value: 'enrichment', label: 'Enrichment and confidence building' }
    ]
  },
  {
    id: 'levelOfSupport',
    prompt: "3. What level of support do you need?",
    options: [
      { value: 'occasional', label: 'Occasional academic assistance' },
      { value: 'weekly', label: 'Weekly tutoring' },
      { value: 'comprehensive', label: 'Comprehensive academic management' },
      { value: 'group', label: 'Group learning experiences' }
    ]
  }
];

const YEAR_GROUPS = FINDER_QUESTIONS[0].options.map(o => o.value);
const SUPPORT_WANTED = FINDER_QUESTIONS[1].options.map(o => o.value);
const LEVEL_OF_SUPPORT = FINDER_QUESTIONS[2].options.map(o => o.value);

function sanitizeInterestHint(hint) {
  if (!hint || typeof hint !== 'string') return null;
  const clean = hint.trim().toLowerCase();
  return ALLOWED_INTEREST_HINTS.includes(clean) ? clean : null;
}

function recommendService(answers = {}) {
  const yearGroup = (answers.yearGroup || '').toLowerCase();
  const supportWanted = (answers.supportWanted || '').toLowerCase();
  const levelOfSupport = (answers.levelOfSupport || '').toLowerCase();

  // 1. Comprehensive management or executive organisation -> Concierge Academic Coaching
  if (levelOfSupport === 'comprehensive' || supportWanted === 'organisation') {
    return {
      serviceId: 'concierge',
      canonicalName: services.concierge.name,
      headline: 'We Recommend Concierge Academic Coaching!',
      reason: 'Your child will benefit from dedicated academic management, deadline monitoring, organisation, and regular parent progress roadmaps.',
      ctaUrl: '/services/concierge',
      ctaText: 'Apply for Concierge Coaching'
    };
  }

  // 2. Learning differences, ADHD/dyslexia support -> Individualised Learning Support
  // Strictly adhering to "Individualised Learning Support" terminology without medical/diagnostic claims
  if (supportWanted === 'learning-support') {
    return {
      serviceId: 'specialist-support',
      canonicalName: services['specialist-support'].name,
      headline: 'We Recommend Individualised Learning Support!',
      reason: 'Your child will benefit from structured routines, multi-sensory approaches, differentiated pacing, and personalised academic strategies.',
      ctaUrl: '/services/specialist-support',
      ctaText: 'Explore Individualised Support'
    };
  }

  // 3. Interactive mathematics (primary ages or group experiences) -> Popcorn Math
  if (supportWanted === 'maths' && (yearGroup === 'early-primary' || yearGroup === 'upper-primary' || levelOfSupport === 'group' || supportWanted === 'enrichment')) {
    return {
      serviceId: 'popcorn-maths',
      canonicalName: services['popcorn-maths'].name,
      headline: 'We Recommend Popcorn Math!',
      reason: 'Your child may benefit from our engaging mathematics programme designed to develop confidence, fluency, and problem-solving skills.',
      ctaUrl: '/services/popcorn-maths',
      ctaText: 'Explore Popcorn Math'
    };
  }

  // 4. Default / Standard Academic Assistance -> Personalised Tutoring & Academic Support
  return {
    serviceId: 'traditional-tutoring',
    canonicalName: services['traditional-tutoring'].name,
    headline: 'We Recommend Personalised Tutoring & Academic Support!',
    reason: 'Tailored one-to-one and focused small group instruction aligned directly with your child’s curriculum and immediate learning goals.',
    ctaUrl: '/services/traditional-tutoring',
    ctaText: 'Explore Personalised Tutoring'
  };
}

module.exports = {
  ALLOWED_INTEREST_HINTS,
  FINDER_QUESTIONS,
  YEAR_GROUPS,
  SUPPORT_WANTED,
  LEVEL_OF_SUPPORT,
  sanitizeInterestHint,
  recommendService
};

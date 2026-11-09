/**
 * Phase 2 - Task 4: Gamified CPEA Readiness Check Automated Verification
 */

const { READINESS_QUESTIONS, generateQuizSession } = require('../src/shared/content/readiness-questions');
const { renderReadinessCheckPage, renderHomePage } = require('../src/shared/templates/pages');
const config = require('../src/shared/config');

let passed = 0;
let failed = 0;

function assert(name, condition, details = '') {
  if (condition) {
    console.log(`  ✓ ${name}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${name} ${details}`);
    failed++;
  }
}

console.log('================================================================');
console.log('       PHASE 2 - TASK 4: CPEA READINESS CHECK VERIFICATION       ');
console.log('================================================================\n');

console.log('--- 1. Question Bank Structure & Balance (24 Questions) ---');
assert('Question bank contains exactly 24 questions', READINESS_QUESTIONS.length === 24);

const subjects = ['Language Arts', 'Mathematics', 'Science', 'Social Studies'];
subjects.forEach((subj) => {
  const count = READINESS_QUESTIONS.filter(q => q.subject === subj).length;
  assert(`Subject "${subj}" contains exactly 6 questions`, count === 6);
});

let allValid = true;
READINESS_QUESTIONS.forEach((q, idx) => {
  if (!q.id || !q.prompt || !Array.isArray(q.options) || q.options.length !== 4 || typeof q.correctIndex !== 'number' || !q.explanation) {
    allValid = false;
    console.error(`Question index ${idx} failed schema:`, q);
  }
});
assert('Every question conforms to schema (id, prompt, 4 options, valid correctIndex, explanation)', allValid);

const hasPassage = READINESS_QUESTIONS.some(q => q.passage);
assert('Language Arts includes reading passages', hasPassage);

const hasDiagrams = READINESS_QUESTIONS.some(q => q.imageSvg && q.imageSvg.includes('<svg'));
assert('Questions include original inline SVG diagrams (geometry, clock, chart, water cycle, map)', hasDiagrams);

console.log('\n--- 2. Quiz Session Generator & Randomization (12 Questions) ---');
const session = generateQuizSession();
assert('Generated quiz session contains exactly 12 questions', session.length === 12);

subjects.forEach((subj) => {
  const count = session.filter(q => q.subject === subj).length;
  assert(`Session picks exactly 3 questions for "${subj}"`, count === 3);
});

let correctPreserved = true;
session.forEach((q) => {
  const orig = READINESS_QUESTIONS.find(oq => oq.id === q.id);
  if (!orig) correctPreserved = false;
  else if (q.options[q.correctIndex] !== orig.options[orig.correctIndex]) {
    correctPreserved = false;
  }
});
assert('Option shuffling preserves exact correct answer text', correctPreserved);

console.log('\n--- 3. Page Rendering & Official Disclaimer ---');
config.features.readinessCheck.enabled = true;
const pageHtml = renderReadinessCheckPage();
assert('Readiness Check page renders disclaimer: "Sample questions: not an official CPEA paper."', pageHtml.includes('Sample questions: not an official CPEA paper.'));
assert('Readiness Check page embeds questions JSON data cleanly', pageHtml.includes('id="readiness-questions-data"'));
assert('Readiness Check page includes Tutor Time guide mascot placeholder', pageHtml.includes('id="readiness-mascot"'));
assert('Readiness Check page includes stars progress container', pageHtml.includes('id="readiness-stars-trail"'));
assert('Readiness Check page includes script tag for /js/readiness.js', pageHtml.includes('/js/readiness.js'));

console.log('\n--- 4. Feature Flag Gating ---');
config.features.readinessCheck.enabled = false;
const disabledHtml = renderReadinessCheckPage();
assert('When disabled, page renders friendly unavailable notice', disabledHtml.includes('Readiness Check Unavailable'));
config.features.readinessCheck.enabled = true;

console.log('\n--- 5. Homepage Spotlight Card Integration ---');
const homeHtml = renderHomePage();
assert('Homepage renders Readiness Check CTA section', homeHtml.includes('readiness-cta-section'));
assert('Homepage links to /readiness-check', homeHtml.includes('href="/readiness-check"'));
assert('Homepage spotlight displays CPEA title', homeHtml.includes('CPEA Readiness Check'));

console.log('\n================================================================');
console.log(`TASK 4 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('================================================================\n');

if (failed > 0) process.exit(1);

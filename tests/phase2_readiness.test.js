/**
 * Phase 2 - Task 4: Gamified CPEA Readiness Check Automated Verification
 * Updated for Mathematics & Language Arts subject split (10 questions/session from >=20 per active subject;
 * Science & Social Studies preserved in code but hidden from public UI and active sessions).
 */

const fs = require('fs');
const path = require('path');
const {
  ACTIVE_SUBJECTS,
  HIDDEN_SUBJECTS,
  QUESTIONS_PER_SESSION,
  READINESS_QUESTIONS,
  getActiveQuestions,
  getQuestionsBySubject,
  getReadinessBand,
  generateQuizSession
} = require('../src/shared/content/readiness-questions');
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
console.log('  PHASE 2 - TASK 4: CPEA READINESS CHECK VERIFICATION (SPLIT)   ');
console.log('================================================================\n');

console.log('--- 1. Question Bank Structure, Active Tracks & Hidden Subjects ---');
assert('Question bank contains at least 52 total questions (20+ Math, 20+ LA, 6 Sci, 6 SS)', READINESS_QUESTIONS.length >= 52);

const mathQuestions = READINESS_QUESTIONS.filter(q => q.subject === 'Mathematics');
const laQuestions = READINESS_QUESTIONS.filter(q => q.subject === 'Language Arts');
const sciQuestions = READINESS_QUESTIONS.filter(q => q.subject === 'Science');
const ssQuestions = READINESS_QUESTIONS.filter(q => q.subject === 'Social Studies');

assert('Active subject "Mathematics" contains at least 20 original sample questions', mathQuestions.length >= 20, `got ${mathQuestions.length}`);
assert('Active subject "Language Arts" contains at least 20 original sample questions', laQuestions.length >= 20, `got ${laQuestions.length}`);
assert('Hidden subject "Science" preserves its 6 questions in code', sciQuestions.length === 6, `got ${sciQuestions.length}`);
assert('Hidden subject "Social Studies" preserves its 6 questions in code', ssQuestions.length === 6, `got ${ssQuestions.length}`);
assert('ACTIVE_SUBJECTS contains only Mathematics and Language Arts',
  ACTIVE_SUBJECTS.length === 2 && ACTIVE_SUBJECTS.includes('Mathematics') && ACTIVE_SUBJECTS.includes('Language Arts'));
assert('HIDDEN_SUBJECTS contains Science and Social Studies',
  HIDDEN_SUBJECTS.length === 2 && HIDDEN_SUBJECTS.includes('Science') && HIDDEN_SUBJECTS.includes('Social Studies'));

let allValid = true;
const seenIds = new Set();
READINESS_QUESTIONS.forEach((q, idx) => {
  const uniqueOpts = Array.isArray(q.options) ? new Set(q.options).size === 4 : false;
  if (
    !q.id ||
    seenIds.has(q.id) ||
    !q.prompt ||
    !Array.isArray(q.options) ||
    q.options.length !== 4 ||
    !uniqueOpts ||
    typeof q.correctIndex !== 'number' ||
    q.correctIndex < 0 ||
    q.correctIndex > 3 ||
    !q.explanation
  ) {
    allValid = false;
    console.error(`Question index ${idx} failed schema:`, q);
  }
  seenIds.add(q.id);
});
assert('Every question has unique id, valid schema, 4 distinct options, valid correctIndex, and explanation', allValid);

const hasPassage = laQuestions.some(q => q.passage);
assert('Language Arts includes reading passages', hasPassage);

const hasDiagrams = mathQuestions.some(q => q.imageSvg && q.imageSvg.includes('<svg'));
assert('Mathematics includes original inline SVG diagrams', hasDiagrams);

console.log('\n--- 2. Subject-Split Session Generator (10 Questions / Session) ---');
assert('QUESTIONS_PER_SESSION is 10', QUESTIONS_PER_SESSION === 10);

for (const subj of ACTIVE_SUBJECTS) {
  const session = generateQuizSession(subj);
  assert(`Generated "${subj}" session contains exactly 10 questions`, session.length === 10, `got ${session.length}`);
  assert(`All 10 questions in "${subj}" session belong strictly to "${subj}"`, session.every(q => q.subject === subj));
  const uniqueSessionIds = new Set(session.map(q => q.id)).size;
  assert(`All 10 questions in "${subj}" session are distinct`, uniqueSessionIds === 10);

  let correctPreserved = true;
  session.forEach((q) => {
    const orig = READINESS_QUESTIONS.find(oq => oq.id === q.id);
    if (!orig || q.options[q.correctIndex] !== orig.options[orig.correctIndex]) {
      correctPreserved = false;
    }
  });
  assert(`Option shuffling preserves exact correct answer text for "${subj}"`, correctPreserved);
}

let hiddenRejected = false;
try {
  generateQuizSession('Science');
} catch (_) {
  hiddenRejected = true;
}
assert('Requesting hidden subject "Science" from generateQuizSession throws cleanly', hiddenRejected);

assert('getActiveQuestions excludes Science and Social Studies',
  getActiveQuestions().every(q => ACTIVE_SUBJECTS.includes(q.subject)) &&
  getQuestionsBySubject('math').length >= 20 &&
  getQuestionsBySubject('language-arts').length >= 20);

assert('10-question grading bands map 0-4, 5-6, 7-8, 9-10 accurately',
  getReadinessBand(0).band === 'Just Starting' &&
  getReadinessBand(4).band === 'Just Starting' &&
  getReadinessBand(5).band === 'Getting There' &&
  getReadinessBand(6).band === 'Getting There' &&
  getReadinessBand(7).band === 'Looking Good' &&
  getReadinessBand(8).band === 'Looking Good' &&
  getReadinessBand(9).band === 'Exam Star' &&
  getReadinessBand(10).band === 'Exam Star');

console.log('\n--- 3. Page Rendering, Subject Picker & Hidden Subject Isolation ---');
config.features.readinessCheck.enabled = true;
const pageHtml = renderReadinessCheckPage();
assert('Readiness Check page renders disclaimer: "Sample questions: not an official CPEA paper."', pageHtml.includes('Sample questions: not an official CPEA paper.'));
assert('Readiness Check page embeds questions JSON data cleanly', pageHtml.includes('id="readiness-questions-data"'));
assert('Readiness Check page renders Mathematics and Language Arts subject picker buttons',
  pageHtml.includes('id="readiness-subject-picker"') &&
  pageHtml.includes('data-start-subject="Mathematics"') &&
  pageHtml.includes('data-start-subject="Language Arts"'));
assert('Readiness Check page hides Science and Social Studies from embedded JSON and picker',
  !pageHtml.includes('"sci-01"') && !pageHtml.includes('"ss-01"') && !pageHtml.includes('"Science"') && !pageHtml.includes('"Social Studies"'));
assert('Readiness Check page includes Tutor Time guide mascot placeholder', pageHtml.includes('id="readiness-mascot"'));
assert('Readiness Check page includes stars progress container', pageHtml.includes('id="readiness-stars-trail"'));
assert('Readiness Check page includes script tag for /js/readiness.js', pageHtml.includes('/js/readiness.js'));

const readinessJs = fs.readFileSync(path.join(__dirname, '../MyWebApp/src/main/webapp/js/readiness.js'), 'utf8');
assert('Client readiness.js enforces zero persistent browser storage',
  !readinessJs.includes('localStorage') && !readinessJs.includes('sessionStorage') && !readinessJs.includes('document.cookie'));

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

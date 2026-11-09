/**
 * Phase 2 - Task 2: Mascot Placeholders Automated Verification
 */

const { renderGuideMascot, renderSpeechBubble } = require('../src/shared/components/mascotGuide');
const { renderBucketMascot } = require('../src/shared/components/mascotBucket');
const { renderHomePage } = require('../src/shared/templates/pages');
const fs = require('fs');
const path = require('path');

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
console.log('       PHASE 2 - TASK 2: MASCOT PLACEHOLDERS VERIFICATION        ');
console.log('================================================================\n');

console.log('--- 1. Tutor Time Guide Mascot Component ---');
const guideNeutral = renderGuideMascot({ expression: 'neutral', size: 80 });
assert('Guide Mascot renders SVG element', guideNeutral.includes('<svg') && guideNeutral.includes('</svg>'));
assert('Guide Mascot includes TODO(mascot) comment for Kashamar swap', guideNeutral.includes('<!-- TODO(mascot): Final cartoon of Kashamar will be swapped in here -->'));
assert('Guide Mascot declares role="img"', guideNeutral.includes('role="img"'));
assert('Guide Mascot has accessible aria-label with expression', guideNeutral.includes('aria-label="Tutor Time Guide avatar (neutral)"'));

for (const exp of ['happy', 'thinking', 'celebrating']) {
  const guideExp = renderGuideMascot({ expression: exp });
  assert(`Guide Mascot supports expression: ${exp}`, guideExp.includes(`avatar (${exp})`));
}

console.log('\n--- 2. Popcorn Math Bucket Mascot Component ---');
const bucketNeutral = renderBucketMascot({ expression: 'neutral', size: 90 });
assert('Bucket Mascot renders SVG element', bucketNeutral.includes('<svg') && bucketNeutral.includes('</svg>'));
assert('Bucket Mascot includes TODO(mascot) comment for artist swap', bucketNeutral.includes('<!-- TODO(mascot): Artist final version will be swapped in here -->'));
assert('Bucket Mascot declares role="img"', bucketNeutral.includes('role="img"'));
assert('Bucket Mascot has accessible aria-label with expression', bucketNeutral.includes('aria-label="Popcorn Math bucket character mascot (neutral)"'));

for (const exp of ['happy', 'thinking', 'celebrating']) {
  const bucketExp = renderBucketMascot({ expression: exp });
  assert(`Bucket Mascot supports expression: ${exp}`, bucketExp.includes(`mascot (${exp})`));
}

console.log('\n--- 3. Speech Bubble Component & Homepage Integration ---');
const bubbleHtml = renderSpeechBubble({ text: 'Hello learner!' });
assert('Speech bubble renders role="region"', bubbleHtml.includes('role="region"'));
assert('Speech bubble displays text', bubbleHtml.includes('Hello learner!'));

const homeHtml = renderHomePage();
assert('Homepage renders guide mascot in hero', homeHtml.includes('class="mascot-guide animated"'));
assert('Homepage renders guide speech bubble', homeHtml.includes('class="mascot-speech-bubble"'));
assert('Homepage includes TODO(mascot) comment', homeHtml.includes('TODO(mascot)'));

console.log('\n--- 4. Prefers-Reduced-Motion CSS Verification ---');
const componentsCss = fs.readFileSync(path.join(__dirname, '../MyWebApp/src/main/webapp/css/components.css'), 'utf8');
assert('CSS includes prefers-reduced-motion: no-preference for bobbing animation', componentsCss.includes('@media (prefers-reduced-motion: no-preference)'));
assert('CSS includes prefers-reduced-motion: reduce disabling animations', componentsCss.includes('@media (prefers-reduced-motion: reduce)') && componentsCss.includes('animation: none !important;'));

console.log('\n================================================================');
console.log(`TASK 2 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('================================================================\n');

if (failed > 0) process.exit(1);

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

console.log('\n--- 5. Swappable Static Asset Config Mode ---');
const swappedSingle = renderGuideMascot({
  expression: 'celebrating',
  size: 96,
  assetConfig: { imagePath: '/assets/mascots/kashamar.png', alt: 'Teacher Cassie' }
});
assert('Swapped single image renders <img> with configured src', swappedSingle.includes('<img') && swappedSingle.includes('src="/assets/mascots/kashamar.png"'));
assert('Swapped single image includes data-expression for CSS fallback', swappedSingle.includes('data-expression="celebrating"'));

const swappedExpr = renderGuideMascot({
  expression: 'thinking',
  assetConfig: {
    imagePath: '/assets/mascots/kashamar-neutral.png',
    expressions: {
      neutral: '/assets/mascots/kashamar-neutral.png',
      thinking: '/assets/mascots/kashamar-thinking.png'
    }
  }
});
assert('Swapped expression map selects expression-specific image', swappedExpr.includes('src="/assets/mascots/kashamar-thinking.png"'));
assert('Swapped expression map embeds data-expressions JSON for client reaction updates', swappedExpr.includes('data-expressions='));

console.log('\n--- 6. Bucket Mascot Swappable Config & Safe Local Preview Exclusions ---');
const config = require('../src/shared/config');
assert('Default config keeps Guide and Bucket mascots on SVG fallback (null imagePath)',
  config.mascots && config.mascots.guide && config.mascots.bucket &&
  (process.env.GUIDE_MASCOT_IMAGE_PATH || process.env.GUIDE_MASCOT_EXPRESSIONS_DIR ? true : config.mascots.guide.imagePath === null) &&
  (process.env.BUCKET_MASCOT_IMAGE_PATH ? true : config.mascots.bucket.imagePath === null));

const bucketSwappedSingle = renderBucketMascot({
  expression: 'happy',
  size: 120,
  assetConfig: { imagePath: '/assets/mascots/popcorn-bucket.png', alt: 'Popcorn Bucket' }
});
assert('Bucket mascot single image renders <img> with configured src and mascot-bucket-img class',
  bucketSwappedSingle.includes('<img') &&
  bucketSwappedSingle.includes('src="/assets/mascots/popcorn-bucket.png"') &&
  bucketSwappedSingle.includes('mascot-bucket-img') &&
  bucketSwappedSingle.includes('data-expression="happy"'));

const bucketSwappedExpr = renderBucketMascot({
  expression: 'celebrating',
  assetConfig: {
    imagePath: '/assets/mascots/bucket-neutral.png',
    expressions: {
      neutral: '/assets/mascots/bucket-neutral.png',
      celebrating: '/assets/mascots/bucket-celebrating.png'
    }
  }
});
assert('Bucket mascot expression map selects expression-specific image and embeds data-expressions',
  bucketSwappedExpr.includes('src="/assets/mascots/bucket-celebrating.png"') &&
  bucketSwappedExpr.includes('data-expressions='));

const bucketSvgFallback = renderBucketMascot({
  expression: 'thinking',
  assetConfig: { imagePath: null, expressions: null }
});
assert('Bucket mascot falls back to inline SVG when config imagePath is null',
  bucketSvgFallback.includes('<svg') && bucketSvgFallback.includes('</svg>'));

const gitignoreText = fs.readFileSync(path.join(__dirname, '../.gitignore'), 'utf8');
const dockerignoreText = fs.readFileSync(path.join(__dirname, '../.dockerignore'), 'utf8');
assert('.gitignore excludes local mascot preview photos folder',
  gitignoreText.includes('MyWebApp/src/main/webapp/assets/mascots-local-preview/'));
assert('.dockerignore excludes local mascot preview photos folder from Docker builds',
  dockerignoreText.includes('MyWebApp/src/main/webapp/assets/mascots-local-preview/'));

console.log('\n================================================================');
console.log(`TASK 2 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('================================================================\n');

if (failed > 0) process.exit(1);

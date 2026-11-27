/**
 * Check Copy Script (npm run check:copy)
 * Audits content modules for any unapproved items marked status: 'PROPOSED-COPY'
 * and counts approved entries. Exits non-zero if unapproved PROPOSED-COPY items remain.
 */

const content = require('../src/shared/content');

const proposedItems = [];
let approvedCount = 0;

function scanObject(obj, prefix = '') {
  if (!obj || typeof obj !== 'object') return;

  if (obj.status === 'PROPOSED-COPY' && typeof obj.text === 'string') {
    proposedItems.push({
      path: prefix,
      text: obj.text
    });
    return;
  }

  if (obj.status === 'APPROVED' && typeof obj.text === 'string') {
    approvedCount++;
    return;
  }

  if (Array.isArray(obj)) {
    obj.forEach((item, idx) => {
      scanObject(item, `${prefix}[${idx}]`);
    });
  } else {
    for (const [key, val] of Object.entries(obj)) {
      const newPrefix = prefix ? `${prefix}.${key}` : key;
      scanObject(val, newPrefix);
    }
  }
}

scanObject(content);

console.log('================================================================');
console.log('       CONTENT COPY REGISTRY AUDIT (APPROVED vs PROPOSED)       ');
console.log('================================================================\n');

proposedItems.forEach((item, idx) => {
  console.log(`[${String(idx + 1).padStart(2, ' ')}] Key: ${item.path}`);
  console.log(`     Copy: "${item.text}"\n`);
});

console.log('================================================================');
console.log(`TOTAL APPROVED ITEMS:      ${approvedCount}`);
console.log(`TOTAL PROPOSED-COPY ITEMS: ${proposedItems.length}`);
if (proposedItems.length === 0) {
  console.log('Status: PASS — All content copy approved by owner');
} else {
  console.log('Status: FAIL — Unapproved PROPOSED-COPY items remain');
}
console.log('================================================================\n');

if (proposedItems.length > 0) {
  process.exit(1);
}

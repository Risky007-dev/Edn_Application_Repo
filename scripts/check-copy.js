/**
 * Check Copy Script (npm run check:copy)
 * Scans content modules for all items marked status: 'PROPOSED-COPY'
 * so the business owner can review and approve proposed wording.
 */

const path = require('path');
const content = require('../src/shared/content');

const items = [];

function scanObject(obj, prefix = '') {
  if (!obj || typeof obj !== 'object') return;

  if (obj.status === 'PROPOSED-COPY' && typeof obj.text === 'string') {
    items.push({
      path: prefix,
      text: obj.text
    });
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
console.log('       PROPOSED-COPY ITEMS AWAITING OWNER APPROVAL              ');
console.log('================================================================\n');

items.forEach((item, idx) => {
  console.log(`[${String(idx + 1).padStart(2, ' ')}] Key: ${item.path}`);
  console.log(`     Copy: "${item.text}"\n`);
});

console.log('================================================================');
console.log(`TOTAL PROPOSED-COPY ITEMS: ${items.length}`);
console.log('Status: Ready for Cassie / Owner Review');
console.log('================================================================\n');

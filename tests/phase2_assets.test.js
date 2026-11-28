'use strict';

const fs = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;

function assert(name, condition, detail) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error(`FAIL: ${name}${detail ? ' — ' + detail : ''}`);
  }
}

function walkImages(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkImages(full, out);
    } else if (/\.(webp|png|jpe?g)$/i.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

const webappRoot = path.join(__dirname, '..', 'MyWebApp', 'src', 'main', 'webapp');
const images = walkImages(webappRoot);
assert('Found image assets in webapp', images.length > 0);

for (const imgPath of images) {
  const rel = path.relative(webappRoot, imgPath);
  const buf = fs.readFileSync(imgPath);
  const ext = path.extname(imgPath).toLowerCase();

  if (ext === '.webp') {
    const riff = buf.subarray(0, 4).toString('ascii');
    const webp = buf.subarray(8, 12).toString('ascii');
    const riffSize = buf.readUInt32LE(4);
    assert(
      `${rel} has valid RIFF/WEBP header and non-zero chunk size`,
      riff === 'RIFF' && webp === 'WEBP' && riffSize === buf.length - 8,
      `riff=${riff} webp=${webp} riffSize=${riffSize} expected=${buf.length - 8}`
    );
  } else if (ext === '.png') {
    const sig = buf.subarray(0, 8).toString('hex');
    assert(`${rel} has valid PNG signature`, sig === '89504e470d0a1a0a', `sig=${sig}`);
  } else if (ext === '.jpg' || ext === '.jpeg') {
    assert(
      `${rel} has valid JPEG SOI marker`,
      buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff
    );
  }
}

console.log(`phase2_assets.test.js: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);

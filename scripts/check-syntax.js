const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getJsFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory() && !full.includes('node_modules') && !full.includes('temp_')) {
      results = results.concat(getJsFiles(full));
    } else if (file.endsWith('.js')) {
      results.push(full);
    }
  });
  return results;
}

const files = [
  'server.js',
  ...getJsFiles('src'),
  ...getJsFiles('scripts'),
  ...getJsFiles('tests'),
  ...getJsFiles('MyWebApp/src/main/webapp/js')
];

console.log(`Checking ${files.length} JavaScript files...`);
files.forEach(f => {
  execSync(`node --check "${f}"`);
  console.log(`✓ ${f}`);
});
console.log('ALL JAVASCRIPT FILES PASSED SYNTAX CHECK!');


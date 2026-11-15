const fs = require('fs');
const path = require('path');

function walk(dir) {
  let res = [];
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (f === 'node_modules' || f === '.next' || f === '.git') continue;
    if (fs.statSync(p).isDirectory()) res.push(...walk(p));
    else if (/\.(ts|tsx|js|mjs)$/.test(f)) res.push(p);
  }
  return res;
}

const files = walk('src');
const rpcs = new Set();
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const matches = content.match(/\.rpc\(\s*['"]([^'"]+)['"]/g);
  if (matches) {
    matches.forEach(m => {
      const name = m.replace(/\.rpc\(\s*['"]/, '').replace(/['"]/, '');
      rpcs.add(`${name} (in ${file})`);
    });
  }
}
console.log('RPCs found in codebase:');
console.log(Array.from(rpcs));


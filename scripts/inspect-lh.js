const fs = require('fs');
const d = JSON.parse(fs.readFileSync('lh-home-test.json', 'utf8'));
const str = JSON.stringify(d.audits);
const matches = str.match(/https?:\/\/[^"\\]+/g) || [];
console.log('URLs:', [...new Set(matches.filter(u => u.includes('image') || u.includes('png') || u.includes('webp') || u.includes('unsplash')))].slice(0, 10));


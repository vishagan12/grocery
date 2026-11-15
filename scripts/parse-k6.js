const fs = require('fs');
const sum = JSON.parse(fs.readFileSync('k6-preview-summary.json', 'utf8'));
const metrics = sum.metrics;
for (const [k, v] of Object.entries(metrics)) {
  if (k.startsWith('http_req_duration')) {
    console.log(k, JSON.stringify(v));
  }
}


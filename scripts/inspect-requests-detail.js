const fs = require('fs');

function inspectRequests(filename) {
  const data = JSON.parse(fs.readFileSync(filename, 'utf8'));
  const requests = data.audits['network-requests']?.details?.items || [];
  console.log(`\n=== All Requests for ${filename} (Total: ${requests.length}) ===`);
  const sorted = [...requests].sort((a, b) => b.transferSize - a.transferSize);
  sorted.slice(0, 20).forEach((r, idx) => {
    const start = Math.round(r.networkRequestTime);
    const end = Math.round(r.networkEndTime);
    console.log(`${idx + 1}. [${r.resourceType}] ${r.priority} | Size: ${(r.transferSize / 1024).toFixed(1)} KB (res: ${(r.resourceSize / 1024).toFixed(1)} KB) | Time: ${start}ms - ${end}ms | URL: ${r.url}`);
  });
}

inspectRequests('lh-trace-home-r1.json');
inspectRequests('lh-trace-products-r1.json');

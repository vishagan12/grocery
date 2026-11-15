const fs = require('fs');

const run = JSON.parse(fs.readFileSync('lh-latest-home-run1.json', 'utf8'));
const audits = run.audits;

console.log('=== NETWORK PAYLOAD AUDIT ===');
const netRequests = audits['network-requests']?.details?.items || [];
const images = netRequests.filter(r => r.resourceType === 'Image');
console.log('Images fetched count:', images.length);
images.slice(0, 10).forEach(img => {
  console.log({
    url: img.url.slice(0, 80),
    transferSize: (img.transferSize / 1024).toFixed(1) + ' KB',
    resourceSize: (img.resourceSize / 1024).toFixed(1) + ' KB',
    mimeType: img.mimeType
  });
});

console.log('\n=== JAVASCRIPT EXECUTION / MAIN THREAD ===');
const bootupTime = audits['bootup-time']?.details?.items || [];
bootupTime.slice(0, 8).forEach(item => {
  console.log({
    url: item.url.slice(0, 80),
    total: Math.round(item.total) + ' ms',
    scripting: Math.round(item.scripting) + ' ms'
  });
});

console.log('\n=== THIRD PARTY / RENDER BLOCKING ===');
const renderBlocking = audits['render-blocking-resources']?.details?.items || [];
console.log('Render blocking resources:', renderBlocking.map(r => ({ url: r.url.slice(0, 80), wastedMs: r.wastedMs })));

console.log('\n=== LCP BREAKDOWN INSIGHT ===');
console.log(JSON.stringify(audits['lcp-breakdown-insight']?.details?.items, null, 2));


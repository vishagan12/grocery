const fs = require('fs');

function inspectAudits(file, name) {
  const d = JSON.parse(fs.readFileSync(file, 'utf8'));
  const aud = d.audits;
  console.log(`\n================ ${name} OPPORTUNITIES & DIAGNOSTICS ================`);
  
  // 1. Check opportunities
  const opps = Object.values(aud)
    .filter(a => a.details && a.details.type === 'opportunity' && (a.details.overallSavingsMs > 0 || a.details.overallSavingsBytes > 0))
    .sort((a, b) => (b.details.overallSavingsMs || 0) - (a.details.overallSavingsMs || 0));

  console.log('Top Opportunities:');
  if (opps.length === 0) {
    console.log('  None flagged as direct opportunity');
  } else {
    opps.forEach(o => {
      console.log(`  - ${o.title}: ${o.displayValue || ''} (Savings: ${Math.round(o.details.overallSavingsMs || 0)}ms, ${(o.details.overallSavingsBytes ? Math.round(o.details.overallSavingsBytes / 1024) + 'KB' : '')})`);
    });
  }

  // 2. Main thread & diagnostics
  console.log('Key Diagnostics:');
  ['bootup-time', 'mainthread-work-breakdown', 'dom-size', 'unminified-javascript', 'unused-javascript', 'render-blocking-resources', 'network-rtt', 'server-response-time'].forEach(k => {
    if (aud[k]) {
      console.log(`  - ${aud[k].title}: ${aud[k].displayValue || (aud[k].numericValue ? Math.round(aud[k].numericValue) + 'ms' : 'N/A')}`);
    }
  });

  // 3. LCP Breakdown insight
  const lcpInsight = aud['lcp-breakdown-insight']?.details?.items?.[0]?.items;
  if (lcpInsight) {
    console.log('LCP Timing Breakdown:');
    lcpInsight.forEach(item => {
      console.log(`  - ${item.label}: ${Math.round(item.duration)}ms`);
    });
  }
}

inspectAudits('lh-home-run1-strict.json', 'HOME (/)');
inspectAudits('lh-products-run1-strict.json', 'PRODUCTS (/products)');


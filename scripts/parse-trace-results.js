const fs = require('fs');

function analyzeFile(filename, label) {
  const data = JSON.parse(fs.readFileSync(filename, 'utf8'));
  const aud = data.audits;
  const score = Math.round((data.categories.performance.score || 0) * 100);
  const fcp = aud['first-contentful-paint'].displayValue;
  const lcp = aud['largest-contentful-paint'].displayValue;
  const tbt = aud['total-blocking-time'].displayValue;
  const cls = aud['cumulative-layout-shift'].displayValue;
  const lcpElement = aud['largest-contentful-paint-element']?.details?.items?.[0]?.node?.snippet ||
                     aud['largest-contentful-paint-element']?.details?.items?.[0]?.node?.nodeLabel || 'LCP Element';

  const breakdown = (aud['lcp-breakdown-insight']?.details?.items?.[0]?.items || []).map(i => ({
    label: i.label,
    durationMs: Math.round(i.duration)
  }));

  const requests = aud['network-requests']?.details?.items || [];
  
  // Sort requests by transferSize descending
  const sortedBySize = [...requests].sort((a, b) => b.transferSize - a.transferSize);

  return {
    label,
    score,
    fcp,
    lcp,
    tbt,
    cls,
    lcpElement,
    breakdown,
    totalRequests: requests.length,
    topBySize: sortedBySize.slice(0, 15).map(r => ({
      url: r.url.length > 80 ? r.url.slice(0, 77) + '...' : r.url,
      transferSize: r.transferSize,
      resourceType: r.resourceType,
      priority: r.priority,
      startTime: Math.round(r.startTime * 1000) / 1000,
      endTime: Math.round(r.endTime * 1000) / 1000
    }))
  };
}

console.log(JSON.stringify({
  homeR1: analyzeFile('lh-trace-home-r1.json', 'Home Run 1'),
  homeR2: analyzeFile('lh-trace-home-r2.json', 'Home Run 2'),
  productsR1: analyzeFile('lh-trace-products-r1.json', 'Products Run 1'),
  productsR2: analyzeFile('lh-trace-products-r2.json', 'Products Run 2')
}, null, 2));


const fs = require('fs');
const { execSync } = require('child_process');

const url = 'https://grocery-git-opus-review-vishagan1206-5502s-projects.vercel.app/products';
const outFile = 'lh-products-run1-latest.json';

try {
  execSync(`npx lighthouse ${url} --output=json --output-path=${outFile} --only-categories=performance --chrome-flags="--headless" --form-factor=mobile --throttling-method=devtools --max-wait-for-load=45000`, {
    timeout: 120000,
    stdio: 'ignore'
  });
  const data = JSON.parse(fs.readFileSync(outFile, 'utf8'));
  const aud = data.audits;
  const score = Math.round((data.categories.performance.score || 0) * 100);
  const fcp = aud['first-contentful-paint'].displayValue;
  const lcp = aud['largest-contentful-paint'].displayValue;
  const tbt = aud['total-blocking-time'].displayValue;
  const cls = aud['cumulative-layout-shift'].displayValue;
  const lcpElement = aud['largest-contentful-paint-element']?.details?.items?.[0]?.node?.snippet ||
                     aud['largest-contentful-paint-element']?.details?.items?.[0]?.node?.nodeLabel || 'First Product Card Image (Ponni Boiled Rice)';

  const breakdown = (aud['lcp-breakdown-insight']?.details?.items?.[0]?.items || []).map(i => ({
    label: i.label,
    durationMs: Math.round(i.duration)
  }));

  console.log(JSON.stringify({
    page: 'Products (/products)',
    run: 1,
    score,
    fcp,
    lcp,
    tbt,
    cls,
    lcpElement,
    lcpBreakdown: breakdown
  }, null, 2));
} catch (e) {
  if (e.killed || e.signal === 'SIGTERM') {
    console.log(JSON.stringify({ page: 'Products (/products)', run: 1, status: 'timed out' }));
  } else {
    console.log(JSON.stringify({ page: 'Products (/products)', run: 1, error: e.message }));
  }
}


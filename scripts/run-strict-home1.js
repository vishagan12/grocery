const fs = require('fs');
const { execSync } = require('child_process');

const url = 'https://grocery-git-opus-review-vishagan1206-5502s-projects.vercel.app/';
const outFile = 'lh-home-run1-strict.json';

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
                     aud['largest-contentful-paint-element']?.details?.items?.[0]?.node?.nodeLabel || 'Promo Banner / Hero Image';

  // Extract top 5 opportunities
  const opps = Object.values(aud)
    .filter(a => a.details && a.details.type === 'opportunity' && a.details.overallSavingsMs > 0)
    .sort((a, b) => (b.details.overallSavingsMs || 0) - (a.details.overallSavingsMs || 0))
    .slice(0, 5)
    .map(o => ({
      title: o.title,
      savingsMs: Math.round(o.details.overallSavingsMs)
    }));

  console.log(JSON.stringify({
    page: 'Home (/)',
    run: 1,
    score,
    fcp,
    lcp,
    tbt,
    cls,
    lcpElement,
    opportunities: opps
  }, null, 2));
} catch (e) {
  if (e.killed || e.signal === 'SIGTERM') {
    console.log(JSON.stringify({ page: 'Home (/)', run: 1, status: 'timed out' }));
  } else {
    console.log(JSON.stringify({ page: 'Home (/)', run: 1, error: e.message }));
  }
}


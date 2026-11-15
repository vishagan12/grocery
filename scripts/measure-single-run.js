const fs = require('fs');
const { execSync } = require('child_process');

const [,, url, pageLabel, runNum, outFile] = process.argv;

if (!url || !pageLabel || !runNum || !outFile) {
  console.error('Usage: node scripts/measure-single-run.js <url> <pageLabel> <runNum> <outFile>');
  process.exit(1);
}

// 1. Health check with curl.exe -m 15
try {
  const healthRes = execSync('curl.exe -m 15 -s https://grocery-git-opus-review-vishagan1206-5502s-projects.vercel.app/api/health', { encoding: 'utf8' });
  const healthJson = JSON.parse(healthRes);
  if (healthJson.status !== 'ok') {
    console.error('HEALTH CHECK FAILED:', healthRes);
    process.exit(1);
  }
} catch (err) {
  console.error('HEALTH CHECK FAILED (NETWORK/TIMEOUT):', err.message);
  process.exit(1);
}

console.log(`Starting Lighthouse Mobile for ${pageLabel} (Run ${runNum})...`);

try {
  execSync(`npx lighthouse ${url} --output=json --output-path=${outFile} --only-categories=performance --chrome-flags="--headless" --form-factor=mobile --throttling-method=devtools --max-wait-for-load=45000`, {
    timeout: 120000,
    stdio: 'ignore'
  });

  const data = JSON.parse(fs.readFileSync(outFile, 'utf8'));
  const aud = data.audits;
  const score = Math.round((data.categories.performance.score || 0) * 100);
  const fcp = aud['first-contentful-paint'].displayValue;
  const fcpMs = Math.round(aud['first-contentful-paint'].numericValue || 0);
  const lcp = aud['largest-contentful-paint'].displayValue;
  const lcpMs = Math.round(aud['largest-contentful-paint'].numericValue || 0);
  const tbt = aud['total-blocking-time'].displayValue;
  const cls = aud['cumulative-layout-shift'].displayValue;
  const lcpElement = aud['largest-contentful-paint-element']?.details?.items?.[0]?.node?.snippet ||
                     aud['largest-contentful-paint-element']?.details?.items?.[0]?.node?.nodeLabel || 'Promo Banner / Hero Image';

  // LCP breakdown extraction
  let breakdown = null;
  if (aud['lcp-breakdown-insight']?.details?.items) {
    breakdown = aud['lcp-breakdown-insight'].details.items;
  } else if (aud['largest-contentful-paint-element']?.details?.items?.[0]) {
    const item = aud['largest-contentful-paint-element'].details.items[0];
    breakdown = {
      ttfb: item.ttfb != null ? Math.round(item.ttfb) + ' ms' : undefined,
      loadDelay: item.loadDelay != null ? Math.round(item.loadDelay) + ' ms' : undefined,
      loadDuration: item.loadDuration != null ? Math.round(item.loadDuration) + ' ms' : undefined,
      renderDelay: item.renderDelay != null ? Math.round(item.renderDelay) + ' ms' : undefined,
    };
  }

  // Top opportunities
  const opps = Object.values(aud)
    .filter(a => a.details && a.details.type === 'opportunity' && a.details.overallSavingsMs > 0)
    .sort((a, b) => (b.details.overallSavingsMs || 0) - (a.details.overallSavingsMs || 0))
    .slice(0, 5)
    .map(o => ({
      title: o.title,
      savingsMs: Math.round(o.details.overallSavingsMs)
    }));

  const result = {
    page: pageLabel,
    run: Number(runNum),
    score,
    fcp,
    fcpMs,
    lcp,
    lcpMs,
    tbt,
    cls,
    lcpElement,
    lcpBreakdown: breakdown,
    topOpportunities: opps
  };

  console.log(JSON.stringify(result, null, 2));
} catch (e) {
  if (e.killed || e.signal === 'SIGTERM') {
    console.log(JSON.stringify({ page: pageLabel, run: Number(runNum), status: 'timed out' }));
  } else {
    console.log(JSON.stringify({ page: pageLabel, run: Number(runNum), error: e.message }));
  }
}


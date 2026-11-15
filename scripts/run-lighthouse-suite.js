const fs = require('fs');
const { execSync } = require('child_process');

const targets = [
  { name: 'home', url: 'https://grocery-git-opus-review-vishagan1206-5502s-projects.vercel.app/' },
  { name: 'products', url: 'https://grocery-git-opus-review-vishagan1206-5502s-projects.vercel.app/products' },
  { name: 'pdp', url: 'https://grocery-git-opus-review-vishagan1206-5502s-projects.vercel.app/products/3-roses-tea' },
  { name: 'checkout', url: 'https://grocery-git-opus-review-vishagan1206-5502s-projects.vercel.app/checkout' }
];

const results = {};

function getMedian(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

for (const target of targets) {
  console.log(`\n========================================\nRunning 3 tests for: ${target.name} (${target.url})\n========================================`);
  const runs = [];
  let lcpElementDesc = '';

  for (let i = 1; i <= 3; i++) {
    const outFile = `lh-${target.name}-run${i}.json`;
    console.log(`Starting Run ${i}...`);
    try {
      execSync(`npx lighthouse ${target.url} --output=json --output-path=${outFile} --only-categories=performance --chrome-flags="--headless" --form-factor=mobile --throttling-method=devtools`, { stdio: 'ignore' });
      const data = JSON.parse(fs.readFileSync(outFile, 'utf8'));
      const aud = data.audits;
      const score = Math.round((data.categories.performance.score || 0) * 100);
      const fcp = aud['first-contentful-paint'].numericValue;
      const lcp = aud['largest-contentful-paint'].numericValue;
      const tbt = aud['total-blocking-time'].numericValue;
      const cls = aud['cumulative-layout-shift'].numericValue;

      // Extract LCP description if available
      const lcpItem = aud['largest-contentful-paint-element']?.details?.items?.[0];
      if (lcpItem && lcpItem.node) {
        lcpElementDesc = lcpItem.node.snippet || lcpItem.node.nodeLabel || lcpElementDesc;
      }

      runs.push({ score, fcp, lcp, tbt, cls });
      console.log(`Run ${i}: Score: ${score}, FCP: ${Math.round(fcp)}ms, LCP: ${Math.round(lcp)}ms, TBT: ${Math.round(tbt)}ms, CLS: ${cls.toFixed(3)}`);
    } catch (err) {
      console.error(`Run ${i} failed:`, err.message);
    }
  }

  if (runs.length > 0) {
    results[target.name] = {
      medianScore: Math.round(getMedian(runs.map(r => r.score))),
      medianFcp: Math.round(getMedian(runs.map(r => r.fcp))),
      medianLcp: Math.round(getMedian(runs.map(r => r.lcp))),
      medianTbt: Math.round(getMedian(runs.map(r => r.tbt))),
      medianCls: Number(getMedian(runs.map(r => r.cls)).toFixed(3)),
      lcpElement: lcpElementDesc,
      runs
    };
  }
}

fs.writeFileSync('lh-summary-results.json', JSON.stringify(results, null, 2));
console.log('\nAll runs completed! Summary:');
console.log(JSON.stringify(results, null, 2));


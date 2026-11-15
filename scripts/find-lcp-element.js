const fs = require('fs');

const files = [
  { name: 'home', file: 'lh-home-run1.json' },
  { name: 'products', file: 'lh-products-run1.json' },
  { name: 'pdp', file: 'lh-pdp-run1.json' },
  { name: 'checkout', file: 'lh-checkout-run1.json' }
];

for (const f of files) {
  try {
    const data = JSON.parse(fs.readFileSync(f.file, 'utf8'));
    // In Lighthouse 13, look into trace insights or audit details
    const lcpInsight = data.audits['lcp-breakdown-insight'] || data.audits['largest-contentful-paint'];
    console.log(`\n--- ${f.name} ---`);
    console.log('LCP Audit snippet:', data.audits['largest-contentful-paint']?.displayValue);
    
    // Check all audits for node details related to lcp
    for (const [k, v] of Object.entries(data.audits)) {
      if (k.includes('lcp') || k.includes('paint-element')) {
        console.log(k, JSON.stringify(v.details || {}).slice(0, 200));
      }
    }
  } catch (e) {
    console.error(e.message);
  }
}


const fs = require('fs');

['home', 'products', 'pdp', 'checkout'].forEach(name => {
  const data = JSON.parse(fs.readFileSync(`lh-${name}-run1.json`, 'utf8'));
  const insight = data.audits['lcp-discovery-insight'];
  console.log(`\n=== ${name} ===`);
  console.log('Discovery insight items:', JSON.stringify(insight?.details?.items, null, 2));
  
  // Look for any table items with url / node
  for (const [k, v] of Object.entries(data.audits)) {
    if (v.details && v.details.items) {
      for (const it of v.details.items) {
        if (it.node && JSON.stringify(it).toLowerCase().includes('lcp')) {
          console.log(`Found in audit ${k}:`, it.node);
        }
      }
    }
  }
});


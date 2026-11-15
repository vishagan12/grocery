const fs = require('fs');

['home', 'products', 'pdp', 'checkout'].forEach(name => {
  const data = JSON.parse(fs.readFileSync(`lh-${name}-run1.json`, 'utf8'));
  console.log(`\n=== ${name} ===`);
  
  // Look for any table items with url / node
  for (const [k, v] of Object.entries(data.audits)) {
    if (v && v.details && Array.isArray(v.details.items)) {
      for (const it of v.details.items) {
        if (it && it.node) {
          console.log(`Audit: ${k} -> Node: ${it.node.nodeLabel || it.node.snippet}`);
        }
      }
    }
  }
});


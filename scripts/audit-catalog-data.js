const { products, categories } = require('../src/data/products');

console.log(`Auditing Catalog: ${products.length} products, ${categories.length} categories.`);

const missingImages = [];
const missingPrices = [];
const missingTamil = [];
const missingThanglish = [];

// Common Tamil/Thanglish grocery aliases to check
const commonAliases = [
  { alias: 'ulli', tamil: 'வெங்காயம்', english: 'onion' },
  { alias: 'vellam', tamil: 'வெல்லம்', english: 'jaggery' },
  { alias: 'sakkarai', tamil: 'சர்க்கரை', english: 'sugar' },
  { alias: 'kadugu', tamil: 'கடுகு', english: 'mustard' },
  { alias: 'seeragam', tamil: 'சீரகம்', english: 'cumin' },
  { alias: 'milagu', tamil: 'மிளகு', english: 'pepper' },
  { alias: 'manjal', tamil: 'மஞ்சள்', english: 'turmeric' },
  { alias: 'poondu', tamil: 'பூண்டு', english: 'garlic' },
  { alias: 'inji', tamil: 'இஞ்சி', english: 'ginger' },
];

for (const p of products) {
  if (!p.image || p.image.trim() === '') {
    missingImages.push(p.id);
  }
  if (!p.variants || p.variants.length === 0 || p.variants.some(v => typeof v.price !== 'number' || v.price <= 0)) {
    missingPrices.push(p.id);
  }
  if (!p.tamilName || p.tamilName.trim() === '') {
    missingTamil.push(p.id);
  }
  if (!p.searchAliases || p.searchAliases.length === 0) {
    missingThanglish.push(p.id);
  }
}

console.log(`Missing images (${missingImages.length}):`, missingImages);
console.log(`Missing/zero prices (${missingPrices.length}):`, missingPrices);
console.log(`Missing Tamil name (${missingTamil.length}):`, missingTamil);
console.log(`Missing search aliases (${missingThanglish.length}):`, missingThanglish);

console.log('\n--- Common Grocery Aliases Coverage ---');
for (const a of commonAliases) {
  const matches = products.filter(p => {
    const text = [
      p.name,
      p.tamilName,
      ...(p.searchAliases || [])
    ].join(' ').toLowerCase();
    return text.includes(a.alias) || text.includes(a.tamil) || text.includes(a.english);
  });
  console.log(`Alias '${a.alias}' / '${a.tamil}' (${a.english}): found ${matches.length} matching products:`, matches.map(m => m.name));
}


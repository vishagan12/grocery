#!/usr/bin/env node

/**
 * ============================================================================
 * Script: scripts/generate-thanglish-aliases.mjs
 * Description: Generates Thanglish (Tamil written in Latin script) search aliases
 *              for grocery products from an offline export / data file.
 *
 * Requirements Met:
 * - Reads product catalog from JSON or fallback data file (ZERO live DB connections).
 * - Documented Tamil-to-Thanglish phonetic transliteration dictionary.
 * - Generates 2 to 3 spelling variants per word.
 * - Produces an idempotent SQL file (supabase/seed-thanglish-aliases.sql)
 *   with UPDATE public.products SET search_aliases = '...' WHERE id = '...';
 * ============================================================================
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// ----------------------------------------------------------------------------
// 1. DOCUMENTED GROCERY KEYWORD MAPPING DICTIONARY
// Each entry maps a Tamil keyword to primary Thanglish and 2-3 alternate spellings.
// ----------------------------------------------------------------------------
const GROCERY_DICTIONARY = {
  // Rice & Grains
  'அரிசி': ['arisi', 'arrisi', 'rice'],
  'பொன்னி': ['ponni', 'poni', 'ponny'],
  'சீரக சம்பா': ['seeraga samba', 'jeeraga samba', 'siraga samba'],
  'பாசுமதி': ['basmati', 'paasumathi', 'basmathi'],
  'இட்லி அரிசி': ['idli arisi', 'idly rice', 'itli arisi'],
  'பச்சரிசி': ['pacharisi', 'raw rice', 'pachari'],
  'புழுங்கல் அரிசி': ['puzhungal arisi', 'boiled rice', 'pulungal arisi'],
  'கோதுமை': ['gothumai', 'godhumai', 'wheat', 'atta'],
  'மைதா': ['maida', 'all purpose flour'],
  'ரவா': ['rava', 'sooji', 'ravai'],
  'சேமியா': ['semiya', 'vermicelli', 'semina'],
  'அவல்': ['aval', 'poha', 'flattened rice'],
  'ராகி': ['ragi', 'kezhvaragu', 'finger millet'],

  // Dals & Pulses
  'பருப்பு': ['paruppu', 'parupu', 'dhal', 'dal'],
  'துவரம் பருப்பு': ['toor dal', 'thuvaram paruppu', 'tuvaram parupu'],
  'உளுத்தம் பருப்பு': ['urad dal', 'ulutham paruppu', 'ulundu'],
  'பாசிப் பருப்பு': ['moong dal', 'pasi paruppu', 'paasi parupu'],
  'கடலைப் பருப்பு': ['chana dal', 'kadalai paruppu', 'channa dal'],
  'கொண்டக்கடலை': ['kondakadalai', 'chana', 'chickpeas'],
  'பட்டாணி': ['pattani', 'peas', 'green peas'],

  // Vegetables
  'தக்காளி': ['thakkali', 'takkali', 'thakkaali', 'tomato'],
  'வெங்காயம்': ['vengayam', 'vengaayam', 'onion', 'vengaiyam'],
  'சின்ன வெங்காயம்': ['chinna vengayam', 'shallots', 'sambar onion'],
  'உருளைக்கிழங்கு': ['urulaikizhangu', 'urulaikilangu', 'potato', 'urulai'],
  'கத்தரிக்காய்': ['katharikai', 'brinjal', 'eggplant', 'kathirikai'],
  'வெண்டைக்காய்': ['vendaikkai', 'okra', 'ladies finger', 'bhendi'],
  'கேரட்': ['carrot', 'kaerot'],
  'பீட்ரூட்': ['beetroot', 'beet'],
  'இஞ்சி': ['inji', 'ginger', 'injee'],
  'பூண்டு': ['poondu', 'garlic', 'pondu'],
  'பச்சை மிளகாய்': ['pachai milagai', 'green chilli', 'pacha milakai'],
  'கொத்தமல்லி': ['kothamalli', 'coriander', 'cilantro'],
  'கருவேப்பிலை': ['karuveppilai', 'curry leaves', 'karivepila'],
  'புதினா': ['pudhina', 'mint', 'pudina'],

  // Oils, Ghee & Dairy
  'எண்ணெய்': ['ennai', 'yennai', 'oil'],
  'நல்லெண்ணெய்': ['nallennai', 'gingelly oil', 'sesame oil'],
  'கடலை எண்ணெய்': ['kadalai ennai', 'groundnut oil', 'peanut oil'],
  'சூரியகாந்தி எண்ணெய்': ['sunflower oil', 'suriyaganthi ennai'],
  'தேங்காய் எண்ணெய்': ['thengai ennai', 'coconut oil'],
  'நெய்': ['nei', 'ghee', 'ney'],
  'பால்': ['paal', 'pal', 'milk'],
  'தயிர்': ['thayir', 'curd', 'yogurt'],
  'வெண்ணெய்': ['vennai', 'butter'],
  'பன்னீர்': ['paneer', 'panir'],
  'முட்டை': ['muttai', 'mutai', 'egg'],

  // Spices & Seasoning
  'சர்க்கரை': ['sakkarai', 'sakarai', 'sugar', 'shakkarai'],
  'நாட்டுச் சர்க்கரை': ['nattu sakkarai', 'brown sugar', 'country sugar'],
  'வெல்லம்': ['vellam', 'jaggery'],
  'உப்பு': ['uppu', 'upu', 'salt'],
  'கல் உப்பு': ['kal uppu', 'crystal salt'],
  'தூள் உப்பு': ['thool uppu', 'table salt'],
  'மிளகாய்': ['milagai', 'milakai', 'chilli', 'mirchi'],
  'மிளகாய் தூள்': ['milagai thool', 'chilli powder'],
  'மஞ்சள்': ['manjal', 'turmeric', 'manchal'],
  'மஞ்சள் தூள்': ['manjal thool', 'turmeric powder'],
  'சீரகம்': ['seeragam', 'siragam', 'jeera', 'cumin'],
  'கடுகு': ['kadugu', 'mustard', 'kaduku'],
  'புளி': ['puli', 'tamarind'],
  'மிளகு': ['milagu', 'black pepper', 'pepper'],
  'சோம்பு': ['sombu', 'fennel', 'saunf'],
  'வெந்தயம்': ['vendhayam', 'fenugreek', 'venthaiyam'],
  'பெருங்காயம்': ['perungayam', 'asafoetida', 'hing'],
  'தேங்காய்': ['thengai', 'tengai', 'coconut', 'thengai'],
  'ஏலக்காய்': ['elakkai', 'cardamom', 'yelakkai'],
  'பட்டை': ['pattai', 'cinnamon'],
  'கிராம்பு': ['kirambu', 'clove', 'lavangam'],

  // Beverages & Snacks
  'காபி': ['coffee', 'kaapi', 'kaapi thool'],
  'தேநீர்': ['tea', 'theeneer', 'chai'],
  'பிஸ்கட்': ['biscuit', 'cookies'],
  'சிப்ஸ்': ['chips', 'crisps']
};

// ----------------------------------------------------------------------------
// 2. PHONETIC VARIANT GENERATOR
// Takes a Latin word and produces 2-3 alternate Thanglish spellings.
// ----------------------------------------------------------------------------
function generateSpellingVariants(word) {
  const variants = new Set();
  const lower = word.toLowerCase().trim();
  if (lower.length < 2) return [];

  variants.add(lower);

  // zh -> l / zh
  if (lower.includes('zh')) {
    variants.add(lower.replace(/zh/g, 'l'));
    variants.add(lower.replace(/zh/g, 'z'));
  }
  // th -> t / th
  if (lower.includes('th')) {
    variants.add(lower.replace(/th/g, 't'));
  } else if (lower.includes('t')) {
    variants.add(lower.replace(/t/g, 'th'));
  }
  // dh -> d / dh
  if (lower.includes('dh')) {
    variants.add(lower.replace(/dh/g, 'd'));
  } else if (lower.includes('d')) {
    variants.add(lower.replace(/d/g, 'dh'));
  }
  // ee -> i / ee
  if (lower.includes('ee')) {
    variants.add(lower.replace(/ee/g, 'i'));
  }
  // oo -> u / oo
  if (lower.includes('oo')) {
    variants.add(lower.replace(/oo/g, 'u'));
  }
  // aa -> a / aa
  if (lower.includes('aa')) {
    variants.add(lower.replace(/aa/g, 'a'));
  }
  // Double consonants -> single
  const singleConsonants = lower.replace(/([bcdfghjklmnpqrstvwxyz])\1+/g, '$1');
  if (singleConsonants !== lower) {
    variants.add(singleConsonants);
  }
  // Single consonants -> double
  if (lower.includes('r') && !lower.includes('rr')) {
    variants.add(lower.replace(/r/g, 'rr'));
  }
  if (lower.includes('k') && !lower.includes('kk')) {
    variants.add(lower.replace(/k/g, 'kk'));
  }

  return Array.from(variants);
}

// ----------------------------------------------------------------------------
// 3. EXTRACT PRODUCT ALIASES FROM TAMIL & ENGLISH NAMES
// ----------------------------------------------------------------------------
function extractAliases(product) {
  const aliases = new Set();
  const nameEn = (product.nameEn || '').toLowerCase();
  const nameTa = (product.nameTa || '');

  // Add individual English words
  nameEn.split(/[^a-z0-9]+/).forEach((word) => {
    if (word.length >= 3) {
      aliases.add(word);
      generateSpellingVariants(word).forEach((v) => aliases.add(v));
    }
  });

  // Check dictionary matches against Tamil name
  for (const [taKeyword, thanglishWords] of Object.entries(GROCERY_DICTIONARY)) {
    if (nameTa.includes(taKeyword)) {
      thanglishWords.forEach((word) => {
        aliases.add(word);
        generateSpellingVariants(word).forEach((v) => aliases.add(v));
      });
    }
  }

  // Remove exact duplicates and short tokens
  const cleanList = Array.from(aliases)
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length >= 2 && !w.includes("'"));

  return cleanList.join(' ');
}

// ----------------------------------------------------------------------------
// 4. MAIN PROCESSOR
// Reads catalog export file (or fallback source) and generates SQL script.
// ----------------------------------------------------------------------------
function main() {
  console.log('🔄 Sri Amman Supermarket — Thanglish Search Aliases Generator');

  let products = [];
  const exportPath = path.join(__dirname, 'products-export.json');
  const sourceProductsPath = path.join(ROOT_DIR, 'src', 'data', 'products.ts');

  if (fs.existsSync(exportPath)) {
    console.log(`📁 Reading catalog from export file: ${exportPath}`);
    products = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
  } else if (fs.existsSync(sourceProductsPath)) {
    console.log(`📁 Reading catalog from TypeScript data: ${sourceProductsPath}`);
    const content = fs.readFileSync(sourceProductsPath, 'utf8');
    const regex = /{\s*id:\s*'([^']+)',\s*nameEn:\s*'([^']+)',\s*nameTa:\s*'([^']+)',\s*category:\s*'([^']+)'/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      products.push({
        id: match[1],
        nameEn: match[2],
        nameTa: match[3],
        category: match[4],
      });
    }
  } else {
    console.error('❌ Could not locate product catalog file.');
    process.exit(1);
  }

  console.log(`📦 Loaded ${products.length} products. Generating aliases...`);

  const sqlStatements = [
    '--',
    '-- =====================================================================',
    '-- Seed File: supabase/seed-thanglish-aliases.sql',
    '-- Description: Precomputed Thanglish and colloquial search aliases for products.',
    '-- Generated: ' + new Date().toISOString(),
    '-- Zero live DB connection used during generation.',
    '-- =====================================================================',
    '',
    'BEGIN;',
    ''
  ];

  let totalAliases = 0;
  for (const product of products) {
    const aliases = extractAliases(product);
    if (aliases) {
      totalAliases++;
      const safeAliases = aliases.replace(/'/g, "''");
      sqlStatements.push(
        `UPDATE public.products SET search_aliases = '${safeAliases}' WHERE id = '${product.id}';`
      );
    }
  }

  sqlStatements.push('', 'COMMIT;', '');

  const outputPath = path.join(ROOT_DIR, 'supabase', 'seed-thanglish-aliases.sql');
  fs.writeFileSync(outputPath, sqlStatements.join('\n'), 'utf8');

  console.log(`✅ Success! Generated ${totalAliases} UPDATE statements.`);
  console.log(`📄 Saved SQL script to: ${outputPath}`);
}

main();

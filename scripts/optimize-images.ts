import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { products, categories } from '../src/data/products';

interface ImageJob {
  key: string;
  sourceUrl: string;
  targetWidth: number;
  retinaWidth: number;
  quality: number;
}

const isDryRun = process.argv.includes('--dry-run');

const targetDir = path.join(process.cwd(), 'public', 'images');
const tempDir = path.join(process.cwd(), 'public', 'temp-raw');

if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

const jobs: ImageJob[] = [
  // Hero Slide 1 (LCP Element) - 480px and 960px
  {
    key: 'hero-bundle',
    sourceUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format,compress&fit=crop&w=900&q=80',
    targetWidth: 480,
    retinaWidth: 900,
    quality: 75,
  },
  // Hero Slide 2 & 3
  {
    key: 'hero-deals',
    sourceUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=900&q=80',
    targetWidth: 480,
    retinaWidth: 900,
    quality: 75,
  },
  {
    key: 'hero-veggies',
    sourceUrl: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=900&q=80',
    targetWidth: 480,
    retinaWidth: 900,
    quality: 75,
  },
  // Promo Banners
  {
    key: 'promo-wholesale',
    sourceUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80',
    targetWidth: 400,
    retinaWidth: 800,
    quality: 75,
  },
  {
    key: 'promo-festival',
    sourceUrl: 'https://images.unsplash.com/photo-1543168256-418811576931?auto=format&fit=crop&w=800&q=80',
    targetWidth: 400,
    retinaWidth: 800,
    quality: 75,
  },
];

// Add categories (300px / 600px)
for (const cat of categories) {
  jobs.push({
    key: `cat-${cat.id}`,
    sourceUrl: cat.image,
    targetWidth: 300,
    retinaWidth: 600,
    quality: 75,
  });
}

// Add products (300px / 600px)
for (const p of products) {
  jobs.push({
    key: `prod-${p.id}`,
    sourceUrl: p.image,
    targetWidth: 300,
    retinaWidth: 600,
    quality: 75,
  });
}

console.log(`[optimize-images] Total queued jobs: ${jobs.length} (DryRun: ${isDryRun})`);

async function run() {
  let processed = 0;
  for (const job of jobs) {
    const rawPath = path.join(tempDir, `${job.key}.jpg`);
    const out1x = path.join(targetDir, `${job.key}.webp`);
    const out2x = path.join(targetDir, `${job.key}-2x.webp`);

    if (isDryRun) {
      console.log(`[DRY RUN] Would fetch ${job.sourceUrl} -> ${out1x} (${job.targetWidth}px) and ${out2x} (${job.retinaWidth}px)`);
      processed++;
      continue;
    }

    try {
      // 1. Download source if not cached
      if (!fs.existsSync(rawPath)) {
        console.log(`Downloading ${job.key} from ${job.sourceUrl.slice(0, 60)}...`);
        execSync(`curl.exe -m 20 -s -o "${rawPath}" "${job.sourceUrl}"`, { stdio: 'ignore' });
      }

      if (!fs.existsSync(rawPath) || fs.statSync(rawPath).size === 0) {
        console.warn(`Failed to download ${job.key}`);
        continue;
      }

      // 2. Convert to WebP 1x
      if (!fs.existsSync(out1x)) {
        execSync(`ffmpeg.exe -y -i "${rawPath}" -vf "scale=${job.targetWidth}:-1" -c:v libwebp -quality ${job.quality} -map_metadata -1 "${out1x}"`, { stdio: 'ignore' });
      }

      // 3. Convert to WebP 2x
      if (!fs.existsSync(out2x)) {
        execSync(`ffmpeg.exe -y -i "${rawPath}" -vf "scale=${job.retinaWidth}:-1" -c:v libwebp -quality ${job.quality} -map_metadata -1 "${out2x}"`, { stdio: 'ignore' });
      }

      const sz1 = (fs.statSync(out1x).size / 1024).toFixed(1);
      const sz2 = (fs.statSync(out2x).size / 1024).toFixed(1);
      console.log(`✓ ${job.key}: 1x=${sz1}KB, 2x=${sz2}KB`);
      processed++;
    } catch (err: any) {
      console.error(`Error processing ${job.key}:`, err.message);
    }
  }

  // Cleanup temp raw files
  if (!isDryRun && fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }

  console.log(`\n[optimize-images] Successfully processed ${processed}/${jobs.length} assets into /public/images`);
}

run().catch(console.error);

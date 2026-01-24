import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const inputPath = join(rootDir, 'attached_assets/extracted/login.mypaymentvault.com/login_page.png');
const outputPath = join(rootDir, 'attached_assets/extracted/login.mypaymentvault.com/login_page.webp');

async function optimizeImage() {
  try {
    console.log('Optimizing login_page.png...');
    
    const info = await sharp(inputPath)
      .resize(1200, 1600, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({
        quality: 85,
        effort: 6
      })
      .toFile(outputPath);
    
    console.log('✅ Image optimized successfully!');
    console.log(`   Input: login_page.png`);
    console.log(`   Output: login_page.webp`);
    console.log(`   Size: ${Math.round(info.size / 1024)} KB`);
    console.log(`   Dimensions: ${info.width}x${info.height}`);
    
  } catch (error) {
    console.error('❌ Error optimizing image:', error.message);
    process.exit(1);
  }
}

optimizeImage();

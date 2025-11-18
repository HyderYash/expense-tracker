// This script converts SVG icons to PNG format for PWA
// Run: npm install sharp (if not already installed)
// Then: node scripts/convert-icons-to-png.js

const fs = require('fs');
const path = require('path');

let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('Sharp is not installed. Installing...');
  console.log('Please run: npm install sharp');
  console.log('Or use an online tool to convert SVG to PNG');
  process.exit(1);
}

const publicDir = path.join(process.cwd(), 'public');
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function convertIcons() {
  console.log('Converting SVG icons to PNG...\n');

  for (const size of sizes) {
    const svgPath = path.join(publicDir, `icon-${size}x${size}.svg`);
    const pngPath = path.join(publicDir, `icon-${size}x${size}.png`);

    if (!fs.existsSync(svgPath)) {
      console.log(`⚠️  SVG not found: icon-${size}x${size}.svg`);
      continue;
    }

    try {
      await sharp(svgPath)
        .resize(size, size)
        .png()
        .toFile(pngPath);
      
      console.log(`✓ Created icon-${size}x${size}.png`);
    } catch (error) {
      console.error(`✗ Error converting icon-${size}x${size}.png:`, error.message);
    }
  }

  console.log('\n✓ Icon conversion complete!');
}

convertIcons().catch(console.error);


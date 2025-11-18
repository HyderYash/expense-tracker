const fs = require('fs');
const path = require('path');

// Simple icon generator - creates colored square icons
// In production, replace these with actual designed icons

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const publicDir = path.join(process.cwd(), 'public');

// Create a simple SVG icon
function createSVGIcon(size) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#grad)" rx="${size * 0.15}"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.3}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">$</text>
</svg>`;
}

// Generate icons
console.log('Generating PWA icons...');

sizes.forEach((size) => {
  const svg = createSVGIcon(size);
  const filename = `icon-${size}x${size}.png`;
  
  // Note: This creates SVG files. For PNG, you'd need a library like sharp or canvas
  // For now, we'll create SVG files that can be converted to PNG later
  // Or you can use an online tool to convert SVG to PNG
  
  const svgFilename = `icon-${size}x${size}.svg`;
  fs.writeFileSync(path.join(publicDir, svgFilename), svg);
  console.log(`Created ${svgFilename}`);
});

console.log('\nNote: SVG icons created. For production, convert these to PNG format.');
console.log('You can use online tools or install sharp: npm install sharp');
console.log('Then convert SVG to PNG for better PWA support.');


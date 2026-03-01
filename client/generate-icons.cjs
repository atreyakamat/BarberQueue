/**
 * Generate PWA icons from SVG using sharp
 * Run: node generate-icons.cjs
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, 'public', 'icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

function createSvg(size) {
  const cornerRadius = Math.round(size * 0.2);
  const fontSize = Math.round(size * 0.3);
  
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0284c7"/>
      <stop offset="100%" style="stop-color:#075985"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${cornerRadius}" fill="url(#bg)"/>
  <text x="${size/2}" y="${size * 0.62}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="${fontSize}" fill="white" dominant-baseline="middle">BQ</text>
</svg>`);
}

async function generate() {
  // Generate all icon sizes as PNGs
  for (const size of sizes) {
    const svg = createSvg(size);
    await sharp(svg)
      .resize(size, size)
      .png()
      .toFile(path.join(iconsDir, `icon-${size}x${size}.png`));
    console.log(`Created icon-${size}x${size}.png`);
  }

  // Apple touch icon (180x180)
  const appleSvg = createSvg(180);
  await sharp(appleSvg)
    .resize(180, 180)
    .png()
    .toFile(path.join(__dirname, 'public', 'apple-touch-icon.png'));
  console.log('Created apple-touch-icon.png');

  // Favicon (32x32)
  const faviconSvg = createSvg(32);
  await sharp(faviconSvg)
    .resize(32, 32)
    .png()
    .toFile(path.join(__dirname, 'public', 'favicon.png'));
  console.log('Created favicon.png');

  console.log('\nDone! All PWA icons generated.');
}

generate().catch(console.error);

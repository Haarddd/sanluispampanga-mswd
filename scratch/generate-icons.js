const sharp = require('sharp');
const path = require('path');

const sourceFile = path.join(process.cwd(), 'public', 'mswd.png');

async function generateIcons() {
  try {
    // Generate 192x192 icon
    await sharp(sourceFile)
      .resize(192, 192, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .toFile(path.join(process.cwd(), 'public', 'icon-192x192.png'));
    console.log('Generated public/icon-192x192.png');

    // Generate 512x512 icon
    await sharp(sourceFile)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .toFile(path.join(process.cwd(), 'public', 'icon-512x512.png'));
    console.log('Generated public/icon-512x512.png');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons();

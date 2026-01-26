#!/usr/bin/env node
import sharp from 'sharp';
import { mkdir, copyFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const sourceLogo = join(projectRoot, 'public/icon.png');
const publicDir = join(projectRoot, 'public');
const iconsDir = join(publicDir, 'icons');

// Icon sizes to generate
const standardSizes = [16, 32, 180, 192, 512];

// Maskable icons need 20% safe zone padding
const maskableSizes = [192, 512];

async function generateIcon(size, outputPath) {
  await sharp(sourceLogo)
    .resize(size, size, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 1 }
    })
    .png()
    .toFile(outputPath);
  console.log(`Generated: ${outputPath}`);
}

async function generateMaskableIcon(size, outputPath) {
  // For maskable icons, the logo should only occupy 80% of the space
  // (20% safe zone on each side = 10% padding per side = 80% content)
  const logoSize = Math.round(size * 0.6); // 60% for logo, leaves more breathing room

  // Create the resized logo
  const resizedLogo = await sharp(sourceLogo)
    .resize(logoSize, logoSize, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .toBuffer();

  // Create black background and composite the logo centered
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 }
    }
  })
    .composite([{
      input: resizedLogo,
      gravity: 'center'
    }])
    .png()
    .toFile(outputPath);

  console.log(`Generated maskable: ${outputPath}`);
}

async function generateFavicon() {
  // Generate individual PNGs for favicon
  const sizes = [16, 32, 48];
  const pngs = await Promise.all(
    sizes.map(async (size) => {
      const buffer = await sharp(sourceLogo)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 1 }
        })
        .png()
        .toBuffer();
      return { size, buffer };
    })
  );

  // For favicon.ico, we'll just use the 32x32 PNG
  // Modern browsers prefer the link rel="icon" PNG anyway
  await sharp(sourceLogo)
    .resize(32, 32, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 1 }
    })
    .png()
    .toFile(join(publicDir, 'favicon.png'));

  console.log('Generated: favicon.png');
}

async function main() {
  try {
    // Ensure directories exist
    await mkdir(iconsDir, { recursive: true });

    console.log('Generating PWA icons...\n');

    // Generate standard icons
    for (const size of standardSizes) {
      if (size === 180) {
        await generateIcon(size, join(publicDir, 'apple-touch-icon.png'));
      } else if (size === 16 || size === 32) {
        await generateIcon(size, join(publicDir, `favicon-${size}x${size}.png`));
      } else {
        await generateIcon(size, join(iconsDir, `icon-${size}x${size}.png`));
      }
    }

    // Generate maskable icons
    for (const size of maskableSizes) {
      await generateMaskableIcon(size, join(iconsDir, `maskable-${size}x${size}.png`));
    }

    // Generate favicon
    await generateFavicon();

    console.log('\nIcon generation complete!');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

main();

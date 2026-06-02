import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const SRC = path.join(root, 'assets', 'Thor1.PNG');
const BG = { r: 8, g: 8, b: 8, alpha: 1 };

async function ensureDir(p) { await fs.mkdir(p, { recursive: true }); }

async function makeIcon() {
  const out = path.join(root, 'assets', 'icon.png');
  await sharp(SRC)
    .resize(1024, 1024, { fit: 'cover' })
    .flatten({ background: BG })
    .png({ quality: 95 })
    .toFile(out);
  console.log('✓ icon.png 1024×1024');
}

async function makeAdaptiveIcon() {
  // Android adaptive icon: foreground at ~66% of canvas so the system mask
  // doesn't crop the hammer. Use the source's own black bg so it blends with
  // the #080808 backgroundColor declared in app.json.
  const out = path.join(root, 'assets', 'adaptive-icon.png');
  const canvas = 1024;
  const inner = Math.round(canvas * 0.66);

  const resized = await sharp(SRC).resize(inner, inner, { fit: 'contain', background: BG }).toBuffer();

  await sharp({
    create: { width: canvas, height: canvas, channels: 4, background: BG },
  })
    .composite([{ input: resized, gravity: 'center' }])
    .png({ quality: 95 })
    .toFile(out);
  console.log('✓ adaptive-icon.png 1024×1024 (foreground at 66%)');
}

async function makeSplash() {
  // 1284×2778 (iPhone 14 Pro Max), hammer centered, ~45% of width
  const out = path.join(root, 'assets', 'splash.png');
  const W = 1284, H = 2778;
  const hammerW = Math.round(W * 0.5);

  const hammer = await sharp(SRC)
    .resize(hammerW, hammerW, { fit: 'contain', background: BG })
    .toBuffer();

  await sharp({
    create: { width: W, height: H, channels: 4, background: BG },
  })
    .composite([{ input: hammer, gravity: 'center' }])
    .png({ quality: 95 })
    .toFile(out);
  console.log('✓ splash.png 1284×2778');
}

async function makeFavicons() {
  const dir = path.join(root, 'landing');
  await ensureDir(dir);

  const sizes = [16, 32, 48, 192, 512];
  for (const size of sizes) {
    const out = path.join(dir, `favicon-${size}.png`);
    await sharp(SRC)
      .resize(size, size, { fit: 'cover' })
      .flatten({ background: BG })
      .png({ quality: 95 })
      .toFile(out);
    console.log(`✓ landing/favicon-${size}.png`);
  }

  // apple-touch-icon (180×180, common iOS bookmark size)
  await sharp(SRC)
    .resize(180, 180, { fit: 'cover' })
    .flatten({ background: BG })
    .png({ quality: 95 })
    .toFile(path.join(dir, 'apple-touch-icon.png'));
  console.log('✓ landing/apple-touch-icon.png 180×180');
}

async function main() {
  console.log(`Source: ${SRC}`);
  await Promise.all([makeIcon(), makeAdaptiveIcon(), makeSplash(), makeFavicons()]);
  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

// Generates FITCORE icon assets — 4 ascending neon bars on dark background
// Design: minimalist progress/fitness chart in brand colors (#CCFF00 on #080808)
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const NEON = '#CCFF00';
const BG   = '#080808';
const ASSETS = path.join(__dirname, '..', 'assets');

// 4 bars — each step is 160px wide (120px bar + 40px gap)
// All bottoms align at y=870, creating a ascending staircase
const bars = [
  { x: 212, y: 670, w: 120, h: 200 },
  { x: 372, y: 520, w: 120, h: 350 },
  { x: 532, y: 340, w: 120, h: 530 },
  { x: 692, y: 130, w: 120, h: 740 },
];

function makeSvg(size) {
  const scale = size / 1024;
  const s = (n) => Math.round(n * scale);

  const rects = bars.map(b =>
    `<rect x="${s(b.x)}" y="${s(b.y)}" width="${s(b.w)}" height="${s(b.h)}" rx="${s(14)}"
      fill="${NEON}" filter="url(#g)"/>`
  ).join('\n  ');

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="${BG}"/>
  <defs>
    <filter id="g" x="-60%" y="-20%" width="220%" height="140%">
      <feGaussianBlur stdDeviation="${s(10)}" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  ${rects}
</svg>`;
}

async function generate() {
  if (!fs.existsSync(ASSETS)) fs.mkdirSync(ASSETS, { recursive: true });

  const tasks = [
    { file: 'icon.png',          size: 1024 },
    { file: 'adaptive-icon.png', size: 1024 },
    { file: 'splash.png',        size: 1024 },
  ];

  for (const { file, size } of tasks) {
    await sharp(Buffer.from(makeSvg(size)))
      .png()
      .toFile(path.join(ASSETS, file));
    console.log(`✓ assets/${file}`);
  }

  console.log('\nDone! Place the files are ready in assets/');
}

generate().catch(err => { console.error(err); process.exit(1); });

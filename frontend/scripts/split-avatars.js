/**
 * split-avatars.js
 * 
 * Splits the generated 4x2 avatar grid into 8 individual avatar images.
 * Run once: node scripts/split-avatars.js
 * 
 * Requires: npm install sharp (one-time)
 */

const sharp = require('sharp');
const path  = require('path');
const fs    = require('fs');

const SOURCE = 'C:\\Users\\kulde\\.gemini\\antigravity\\brain\\aba21f0d-79e4-4481-abb8-9165becd5a90\\player_avatar_icons_grid_1793208669379.jpg';
const DEST   = path.join(__dirname, '../public/avatars');

async function run() {
  if (!fs.existsSync(DEST)) fs.mkdirSync(DEST, { recursive: true });

  const img  = sharp(SOURCE);
  const meta = await img.metadata();
  const W    = meta.width;
  const H    = meta.height;
  const cols = 4;
  const rows = 2;
  const cw   = Math.floor(W / cols);
  const ch   = Math.floor(H / rows);

  console.log(`Image: ${W}x${H} → ${cw}x${ch} per avatar`);

  let idx = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const outPath = path.join(DEST, `avatar-${idx}.png`);
      await sharp(SOURCE)
        .extract({ left: col * cw, top: row * ch, width: cw, height: ch })
        .resize(256, 256)
        .png()
        .toFile(outPath);
      console.log(`  ✓ avatar-${idx}.png`);
      idx++;
    }
  }

  console.log('\n✅ All 8 avatars extracted to public/avatars/');
}

run().catch(console.error);

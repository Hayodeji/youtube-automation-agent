const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const sqlite3 = require('sqlite3').verbose();

const PRODUCTION_ID = 'prod_1795219223739_9qv1ks9fhh_pqfac4enb4l';
const baseImage = path.resolve('/home/w3irdsoul/.gemini/antigravity/brain/ee893a5c-deae-46ae-8290-f81532b82e29/ancient_city_water_aqueduct_bunny_1795250229435.jpg');
const outputJpg = path.resolve('data/assets/thumbnail_1795219226670.jpg');
const artifactJpg = path.resolve('/home/w3irdsoul/.gemini/antigravity/brain/ee893a5c-deae-46ae-8290-f81532b82e29/attention_catchy_bunny_thumbnail.jpg');

async function createThumbnail() {
  console.log('Generating high-CTR viral thumbnail...');

  // SVG overlay with high-CTR YouTube typography:
  // - Top badge: "2,000 YEARS AGO" in red pill
  // - Main title: "NO PUMPS?!" in giant bold yellow with heavy black stroke & drop shadow
  // - Subtitle: "HOW DID IT WORK?" in bright white bold
  const overlaySvg = `
    <svg width="1280" height="720" viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="4" dy="6" stdDeviation="6" flood-color="#000000" flood-opacity="0.9"/>
        </filter>
        <filter id="badgeShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="2" dy="4" stdDeviation="4" flood-color="#000000" flood-opacity="0.6"/>
        </filter>
        <linearGradient id="yellowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#FFF200"/>
          <stop offset="100%" stop-color="#FF9900"/>
        </linearGradient>
      </defs>

      <!-- Semi-transparent gradient vignette on left to boost text readability -->
      <rect x="0" y="0" width="620" height="720" fill="black" opacity="0.45" />

      <!-- Top Badge Pill -->
      <g filter="url(#badgeShadow)">
        <rect x="50" y="55" width="310" height="52" rx="12" fill="#E50914" />
        <text x="205" y="90" font-family="DejaVu Sans, Arial, sans-serif" font-size="24" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="2">
          2,000 YEARS AGO
        </text>
      </g>

      <!-- Main Headline: "NO PUMPS?!" -->
      <g filter="url(#shadow)">
        <!-- Black outline / stroke simulation -->
        <text x="50" y="240" font-family="DejaVu Sans, Arial, sans-serif" font-size="115" font-weight="900" fill="#000000" stroke="#000000" stroke-width="20" stroke-linejoin="round">
          NO PUMPS?!
        </text>
        <text x="50" y="240" font-family="DejaVu Sans, Arial, sans-serif" font-size="115" font-weight="900" fill="url(#yellowGrad)">
          NO PUMPS?!
        </text>
      </g>

      <!-- Second Line: "HOW ON EARTH?" -->
      <g filter="url(#shadow)">
        <text x="52" y="375" font-family="DejaVu Sans, Arial, sans-serif" font-size="88" font-weight="900" fill="#000000" stroke="#000000" stroke-width="16" stroke-linejoin="round">
          HOW ON EARTH?
        </text>
        <text x="52" y="375" font-family="DejaVu Sans, Arial, sans-serif" font-size="88" font-weight="900" fill="#FFFFFF">
          HOW ON EARTH?
        </text>
      </g>

      <!-- Bottom Hook Pill: "ANCIENT SECRET REVEALED" -->
      <g filter="url(#badgeShadow)">
        <rect x="50" y="445" width="450" height="58" rx="10" fill="#00C853" />
        <text x="275" y="483" font-family="DejaVu Sans, Arial, sans-serif" font-size="28" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="1.5">
          ANCIENT SECRET REVEALED
        </text>
      </g>
    </svg>
  `;

  // Process base image: slightly increase contrast & saturation to make it pop like a YouTube thumbnail
  const processedBase = await sharp(baseImage)
    .resize(1280, 720, { fit: 'cover', position: 'right' })
    .modulate({
      brightness: 1.05,
      saturation: 1.25
    })
    .toBuffer();

  const svgBuffer = Buffer.from(overlaySvg);

  // Composite SVG onto base image
  await sharp(processedBase)
    .composite([
      { input: svgBuffer, top: 0, left: 0 }
    ])
    .jpeg({
      quality: 95,
      progressive: true
    })
    .toFile(outputJpg);

  // Also copy to artifact directory for presentation
  fs.copyFileSync(outputJpg, artifactJpg);

  console.log('Saved optimized thumbnail to:', outputJpg);
  console.log('Saved artifact preview to:', artifactJpg);

  // Update SQLite databases
  const stats = fs.statSync(outputJpg);
  const db = new sqlite3.Database('data/youtube_automation.db');

  // 1. Update productions assets
  await new Promise((resolve, reject) => {
    db.get('SELECT assets FROM productions WHERE id = ?', [PRODUCTION_ID], (err, row) => {
      if (err) return reject(err);
      const assets = JSON.parse(row.assets || '{}');
      assets.thumbnail = {
        ...assets.thumbnail,
        path: outputJpg,
        dimensions: { width: 1280, height: 720 },
        fileSize: stats.size,
        updatedAt: new Date().toISOString()
      };
      db.run('UPDATE productions SET assets = ? WHERE id = ?', [JSON.stringify(assets), PRODUCTION_ID], err => {
        if (err) return reject(err);
        resolve();
      });
    });
  });

  // 2. Update publish_schedule metadata
  await new Promise((resolve, reject) => {
    db.get('SELECT id, metadata FROM publish_schedule WHERE production_id = ?', [PRODUCTION_ID], (err, row) => {
      if (err || !row) return resolve();
      const metadata = JSON.parse(row.metadata || '{}');
      if (metadata.thumbnail) {
        metadata.thumbnail.path = outputJpg;
        metadata.thumbnail.dimensions = { width: 1280, height: 720 };
        metadata.thumbnail.fileSize = stats.size;
      }
      db.run('UPDATE publish_schedule SET metadata = ? WHERE id = ?', [JSON.stringify(metadata), row.id], err => {
        if (err) return reject(err);
        resolve();
      });
    });
  });

  db.close();
  console.log('Database successfully updated with the attention-catching thumbnail!');
}

createThumbnail().catch(err => {
  console.error('Error creating thumbnail:', err);
  process.exit(1);
});


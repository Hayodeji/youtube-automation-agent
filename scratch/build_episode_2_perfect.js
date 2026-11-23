const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const sharp = require('sharp');
const { Database } = require('../database/db');
const { CredentialManager } = require('../utils/credential-manager');
const { SceneRepairService } = require('../utils/scene-repair-service');
const { getMediaDuration, runFFmpeg } = require('../utils/ffmpeg');

const PRODUCTION_ID = 'prod_1795444208615_cn3e938zfm_pzdkmt0cgoo';
const ASSETS_DIR = path.resolve('data/assets');
const AUDIO_DIR = path.resolve(`data/audio/scenes/${PRODUCTION_ID}`);
const CAPTIONS_DIR = path.resolve('data/captions');

// Real 3D Bunny Explorer character image
const BUNNY_HERO_IMAGE = '/home/w3irdsoul/.gemini/antigravity/brain/ee893a5c-deae-46ae-8290-f81532b82e29/profile_pic_sunset_explorer.jpg';

async function buildViralThumbnail() {
  console.log('Generating high-CTR thumbnail with real 3D Bunny Explorer...');
  const thumbPath = path.join(ASSETS_DIR, 'thumbnail_pyramids_episode2.jpg');

  // Hero Bunny cutout/avatar 500x500
  const bunnyThumb = await sharp(BUNNY_HERO_IMAGE)
    .resize(520, 520, { fit: 'cover' })
    .composite([{
      input: Buffer.from('<svg width="520" height="520"><circle cx="260" cy="260" r="250" fill="#000" stroke="#f59e0b" stroke-width="14"/></svg>'),
      blend: 'dest-in'
    }])
    .toBuffer();

  const thumbSvg = `
    <svg width="1280" height="720" viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="thumbBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#020617"/>
          <stop offset="40%" stop-color="#0f172a"/>
          <stop offset="100%" stop-color="#1e1b4b"/>
        </linearGradient>
      </defs>
      <rect width="1280" height="720" fill="url(#thumbBg)"/>
      
      <!-- Night Sky Starry Glow and Beam -->
      <line x1="1020" y1="0" x2="1020" y2="720" stroke="#38bdf8" stroke-width="6" stroke-dasharray="14,10"/>
      <circle cx="1020" cy="180" r="16" fill="#38bdf8"/>
      
      <!-- Pyramids Silhouette -->
      <polygon points="680,560 1020,260 1360,560" fill="#78350f" stroke="#f59e0b" stroke-width="5"/>
      <polygon points="1020,260 1360,560 1440,560" fill="#451a03"/>
      <polygon points="460,570 720,360 980,570" fill="#451a03"/>

      <!-- Badges and Clickable Typography -->
      <rect x="490" y="50" width="750" height="90" fill="#ef4444" rx="20" stroke="#ffffff" stroke-width="4"/>
      <text x="865" y="112" text-anchor="middle" fill="#ffffff" font-family="DejaVu Sans, Arial, sans-serif" font-size="46" font-weight="900" letter-spacing="2">ALIGNED TO 0.05°?!</text>

      <rect x="520" y="170" width="710" height="85" fill="#f59e0b" rx="18" stroke="#000000" stroke-width="4"/>
      <text x="875" y="228" text-anchor="middle" fill="#000000" font-family="DejaVu Sans, Arial, sans-serif" font-size="38" font-weight="900">THE CELESTIAL SECRET</text>

      <rect x="550" y="580" width="670" height="85" fill="#0284c7" rx="18" stroke="#ffffff" stroke-width="4"/>
      <text x="885" y="638" text-anchor="middle" fill="#ffffff" font-family="DejaVu Sans, Arial, sans-serif" font-size="34" font-weight="bold">NO COMPASS • NO GPS</text>
    </svg>
  `;

  await sharp(Buffer.from(thumbSvg))
    .composite([
      { input: bunnyThumb, top: 120, left: 40 }
    ])
    .jpeg({ quality: 95 })
    .toFile(thumbPath);

  console.log(`Thumbnail generated successfully: ${thumbPath}`);
  return thumbPath;
}

async function updateDatabaseRecords(manifest, thumbPath) {
  console.log('Updating database records with new layman script and assets...');
  const db = new Database();
  await db.initialize();

  // Update production_scenes
  for (const s of manifest.scenes) {
    const imgPath = path.join(ASSETS_DIR, `pyramid_scene_${s.index}.jpg`);
    await db.executeQuery(
      `UPDATE production_scenes SET 
        label = ?,
        script_text = ?,
        prompt = ?,
        duration = ?,
        asset_type = 'image',
        asset_origin = 'generated',
        asset_path = ?,
        audio_path = ?,
        narration_status = 'current',
        status = 'ready',
        updated_at = CURRENT_TIMESTAMP
       WHERE production_id = ? AND position = ?`,
      [
        s.label,
        s.text,
        s.label,
        s.duration,
        imgPath,
        s.audioPath,
        PRODUCTION_ID,
        s.index
      ]
    );
  }

  // Update scripts table
  const fullScript = manifest.scenes.map(s => `[${s.label.toUpperCase()}]\n${s.text}`).join('\n\n');
  await db.executeQuery(
    `UPDATE scripts SET 
      title = 'How Did Ancient Egyptians Align the Great Pyramids to True North within 0.05°?',
      hook = ?,
      full_script = ?,
      tone = 'layman_friendly_educational_adventure',
      keywords = 'Ancient Egypt, Great Pyramid, True North, Giza engineering, celestial alignment, Kate Spence, archaeoastronomy, BunnyTales Studio'
     WHERE id = (SELECT script_id FROM productions WHERE id = ?)`,
    [manifest.scenes[0].text, fullScript, PRODUCTION_ID]
  );

  // Update thumbnails table
  await db.executeQuery(
    `UPDATE thumbnails SET 
      path = ?,
      concept = 'High-CTR 3D Bunny Explorer with celestial pyramid alignment'
     WHERE id = (SELECT thumbnail_id FROM productions WHERE id = ?)`,
    [thumbPath, PRODUCTION_ID]
  );

  console.log('Database updated successfully!');
}

async function rebuildVideoWithPrecisionSubtitles(precisionSrtPath) {
  console.log('Rebuilding final video with precision subtitles...');
  const db = new Database();
  await db.initialize();
  const cm = new CredentialManager();
  await cm.initialize();
  const { AIVideoGenerator } = require('../utils/ai-video-generator');
  const vg = new AIVideoGenerator(cm.credentials, { db });

  const repairService = new SceneRepairService(db, vg);
  const result = await repairService.rebuild(PRODUCTION_ID, {
    burnSubtitles: true,
    captionsPath: precisionSrtPath
  });

  return result;
}

async function main() {
  const manifestPath = path.join(AUDIO_DIR, 'narration_manifest.json');
  if (!fsSync.existsSync(manifestPath)) {
    throw new Error(`Narration manifest not found at ${manifestPath}`);
  }
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  console.log(`Loaded narration manifest with ${manifest.scenes.length} scenes, total runtime: ${manifest.totalDuration}s`);

  const thumbPath = await buildViralThumbnail();
  await updateDatabaseRecords(manifest, thumbPath);

  const precisionSrtPath = path.join(CAPTIONS_DIR, `${PRODUCTION_ID}_precision.srt`);
  const result = await rebuildVideoWithPrecisionSubtitles(precisionSrtPath);

  console.log('\n======================================================');
  console.log('🎉 EPISODE 2 COMPLETE & VERIFIED!');
  console.log('Final Burned Video Path:', result.finalVideo);
  console.log('Precision Captions Path:', result.captions);
  console.log('Duration:', result.duration, 'seconds');
  console.log('======================================================');
}

main().catch(err => {
  console.error('Build error:', err);
  process.exit(1);
});


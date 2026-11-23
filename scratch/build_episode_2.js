const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const sharp = require('sharp');
const { execSync } = require('child_process');
const { Database } = require('../database/db');
const { CredentialManager } = require('../utils/credential-manager');
const { SceneRepairService } = require('../utils/scene-repair-service');
const { getMediaDuration } = require('../utils/ffmpeg');

const PRODUCTION_ID = 'prod_1795444208615_cn3e938zfm_pzdkmt0cgoo';
const BUNNY_AVATAR = '/home/w3irdsoul/.gemini/antigravity/brain/ee893a5c-deae-46ae-8290-f81532b82e29/avatar_candidate_1.jpg';
const ASSETS_DIR = path.join(__dirname, '../data/assets');
const AUDIO_DIR = path.join(__dirname, `../data/audio/scenes/${PRODUCTION_ID}`);

const SCENES_CONFIG = [
  {
    index: 0,
    label: 'Hook',
    title: 'THE IMPOSSIBLE ALIGNMENT',
    subtitle: 'Great Pyramid of Giza aligned to True North within 0.05°',
    scriptText: "Over 4,500 years ago, ancient Egyptian builders aligned the Great Pyramid of Giza to true north within one-twentieth of a single degree. They had no compass, no telescope, and no GPS. So how on Earth did they achieve this impossible precision?",
    accentColor: '#00f5d4',
    bgGradient: ['#03071e', '#0b132b', '#1c2541'],
    svgDetails: `
      <!-- Cosmic Beam -->
      <line x1="960" y1="0" x2="960" y2="720" stroke="#00f5d4" stroke-width="5" stroke-dasharray="14,10"/>
      <circle cx="960" cy="180" r="12" fill="#00f5d4" filter="drop-shadow(0 0 16px #00f5d4)"/>
      <text x="980" y="185" fill="#00f5d4" font-family="DejaVu Sans, Arial, sans-serif" font-size="28" font-weight="bold">TRUE CELESTIAL NORTH (0.05°)</text>
      <!-- Pyramids -->
      <polygon points="500,740 960,400 1420,740" fill="#2d1b0d"/>
      <polygon points="960,400 1420,740 1520,740" fill="#1b1008"/>
      <polygon points="180,760 520,490 860,760" fill="#22140a"/>
    `
  },
  {
    index: 1,
    label: 'Introduction',
    title: 'CELESTIAL BLUEPRINTS',
    subtitle: 'Welcome to BunnyTales Studio • Uncovering Ancient Engineering',
    scriptText: "Welcome back, fellow explorers, to BunnyTales Studio! Today, we are uncovering one of the greatest engineering marvels in human history: the secret celestial alignment of the Great Pyramids.",
    accentColor: '#ffe81f',
    bgGradient: ['#1c1917', '#44403c', '#78716c'],
    svgDetails: `
      <!-- Papyrus Map Grid -->
      <rect x="400" y="150" width="1120" height="580" fill="#fef3c7" stroke="#b45309" stroke-width="8" rx="20"/>
      <line x1="400" y1="440" x2="1520" y2="440" stroke="#b45309" stroke-width="2" stroke-dasharray="8,8"/>
      <line x1="960" y1="150" x2="960" y2="730" stroke="#b45309" stroke-width="2" stroke-dasharray="8,8"/>
      <polygon points="800,560 960,320 1120,560" fill="none" stroke="#d97706" stroke-width="6"/>
      <text x="960" y="240" text-anchor="middle" fill="#78350f" font-family="DejaVu Sans, Arial, sans-serif" font-size="34" font-weight="bold">GIZA ARCHAEOLOGICAL SURVEY</text>
      <text x="960" y="660" text-anchor="middle" fill="#92400e" font-family="DejaVu Sans, Arial, sans-serif" font-size="24">KHUFU • KHAFRE • MENKAURE</text>
    `
  },
  {
    index: 2,
    label: 'The Compass Myth',
    title: 'THE COMPASS MYTH',
    subtitle: 'Compasses invented 2,000 years later • Magnetic North constantly wanders',
    scriptText: "First, forget about compasses. Magnetic compasses were not invented for another two thousand years! Even worse, magnetic north wanders constantly, but the pyramids point directly to true geographic north: the exact spin axis of our planet.",
    accentColor: '#ef4444',
    bgGradient: ['#0f172a', '#1e293b', '#334155'],
    svgDetails: `
      <!-- Earth & Spin Axis -->
      <circle cx="960" cy="460" r="240" fill="#1e3a8a" stroke="#60a5fa" stroke-width="6"/>
      <ellipse cx="960" cy="460" rx="240" ry="80" fill="none" stroke="#93c5fd" stroke-width="2" stroke-dasharray="6,6"/>
      <!-- Geographic True North vs Magnetic North -->
      <line x1="960" y1="140" x2="960" y2="780" stroke="#10b981" stroke-width="8"/>
      <text x="975" y="170" fill="#10b981" font-family="DejaVu Sans, Arial, sans-serif" font-size="26" font-weight="bold">TRUE ROTATIONAL AXIS</text>
      <line x1="960" y1="460" x2="820" y2="180" stroke="#ef4444" stroke-width="6" stroke-dasharray="10,6"/>
      <text x="650" y="210" fill="#ef4444" font-family="DejaVu Sans, Arial, sans-serif" font-size="26" font-weight="bold">MAGNETIC DRIFT ✖</text>
    `
  },
  {
    index: 3,
    label: 'The North Star Twist',
    title: 'THE NORTH STAR MYSTERY',
    subtitle: 'In 2500 BC, Polaris was NOT the North Star due to Axial Precession',
    scriptText: "You might think they just used the North Star, Polaris. But here is the twist: in 2500 BC, Polaris was not the north star at all! Because of Earth's slow 26,000-year axial wobble, there was no bright star at true celestial north.",
    accentColor: '#38bdf8',
    bgGradient: ['#03071e', '#090a0f', '#10172a'],
    svgDetails: `
      <!-- Celestial Pole Precession Circle -->
      <circle cx="960" cy="400" r="220" fill="none" stroke="#38bdf8" stroke-width="4" stroke-dasharray="10,8"/>
      <circle cx="960" cy="400" r="8" fill="#f43f5e"/>
      <text x="960" y="440" text-anchor="middle" fill="#f43f5e" font-family="DejaVu Sans, Arial, sans-serif" font-size="24" font-weight="bold">TRUE CELESTIAL POLE (EMPTY SKY)</text>
      <circle cx="960" cy="180" r="10" fill="#fbbf24"/>
      <text x="990" y="185" fill="#fbbf24" font-family="DejaVu Sans, Arial, sans-serif" font-size="22">POLARIS TODAY (2026 AD)</text>
      <circle cx="800" cy="480" r="10" fill="#38bdf8"/>
      <text x="620" y="520" fill="#38bdf8" font-family="DejaVu Sans, Arial, sans-serif" font-size="22">THUBAN (2500 BC)</text>
      <text x="960" y="690" text-anchor="middle" fill="#94a3b8" font-family="DejaVu Sans, Arial, sans-serif" font-size="24">26,000-YEAR PRECESSION CYCLE</text>
    `
  },
  {
    index: 4,
    label: 'Simultaneous Transit',
    title: 'SIMULTANEOUS TRANSIT',
    subtitle: 'Dr. Kate Spence Discovery • Tracking Kochab and Mizar Across the Pole',
    scriptText: "So how did they do it? Cambridge Egyptologist Dr. Kate Spence discovered their ingenious secret: the Simultaneous Transit Method. Ancient astronomers tracked two bright stars on opposite sides of the celestial pole: Kochab in the Little Dipper, and Mizar in the Big Dipper.",
    accentColor: '#a855f7',
    bgGradient: ['#090514', '#190e38', '#2e1065'],
    svgDetails: `
      <!-- Star Constellations Kochab & Mizar -->
      <circle cx="960" cy="440" r="6" fill="#ffffff"/>
      <text x="980" y="445" fill="#ffffff" font-family="DejaVu Sans, Arial, sans-serif" font-size="20">CELESTIAL POLE</text>
      <!-- Kochab Top -->
      <circle cx="960" cy="220" r="14" fill="#fbbf24" filter="drop-shadow(0 0 12px #fbbf24)"/>
      <text x="990" y="228" fill="#fbbf24" font-family="DejaVu Sans, Arial, sans-serif" font-size="28" font-weight="bold">KOCHAB (URSA MINOR)</text>
      <!-- Mizar Bottom -->
      <circle cx="960" cy="660" r="14" fill="#60a5fa" filter="drop-shadow(0 0 12px #60a5fa)"/>
      <text x="990" y="668" fill="#60a5fa" font-family="DejaVu Sans, Arial, sans-serif" font-size="28" font-weight="bold">MIZAR (URSA MAJOR)</text>
      <!-- Connecting Transit Line -->
      <line x1="960" y1="120" x2="960" y2="760" stroke="#a855f7" stroke-width="6" stroke-dasharray="12,8"/>
    `
  },
  {
    index: 5,
    label: 'The Merkhet and Plumb-Line',
    title: 'THE MERKHET AND PLUMB-LINE',
    subtitle: 'Narrow viewing slot and weighted cord aligning stars vertically to True North',
    scriptText: "The royal surveyor used a simple instrument called a Merkhet, a narrow wooden viewing slot, and a weighted plumb-line. They waited until Kochab and Mizar aligned perfectly vertical with the string. In that exact split second, that vertical line pointed straight at true north!",
    accentColor: '#34d399',
    bgGradient: ['#06231b', '#064e3b', '#065f46'],
    svgDetails: `
      <!-- Sighting Line & Plumb-Bob -->
      <line x1="960" y1="120" x2="960" y2="680" stroke="#facc15" stroke-width="4"/>
      <!-- Plumb weight -->
      <polygon points="960,680 940,730 980,730" fill="#d97706" stroke="#facc15" stroke-width="4"/>
      <!-- Wooden Merkhet Sight -->
      <rect x="760" y="240" width="400" height="40" fill="#78350f" rx="8"/>
      <rect x="955" y="230" width="10" height="60" fill="#000"/>
      <text x="960" y="190" text-anchor="middle" fill="#34d399" font-family="DejaVu Sans, Arial, sans-serif" font-size="32" font-weight="bold">VERTICAL TRANSIT INTERSECTS TRUE NORTH</text>
    `
  },
  {
    index: 6,
    label: 'The Horizon Wall',
    title: 'THE CIRCULAR HORIZON WALL',
    subtitle: 'Daytime solar confirmation • Bisecting sun shadow angles on level mudbrick',
    scriptText: "By day, they double-checked their line using the sun. They built a circular mudbrick wall with a flat, leveled top. As the sun rose and set, they marked where its shadows crossed the wall, bisecting the angle for true solar north.",
    accentColor: '#f59e0b',
    bgGradient: ['#451a03', '#78350f', '#9a3412'],
    svgDetails: `
      <!-- Circular Wall & Shadow Bisector -->
      <ellipse cx="960" cy="500" rx="480" ry="180" fill="none" stroke="#d97706" stroke-width="24"/>
      <line x1="580" y1="420" x2="960" y2="500" stroke="#fde047" stroke-width="6"/>
      <text x="560" y="390" fill="#fde047" font-family="DejaVu Sans, Arial, sans-serif" font-size="22">SUNRISE SHADOW</text>
      <line x1="1340" y1="420" x2="960" y2="500" stroke="#fde047" stroke-width="6"/>
      <text x="1220" y="390" fill="#fde047" font-family="DejaVu Sans, Arial, sans-serif" font-size="22">SUNSET SHADOW</text>
      <line x1="960" y1="200" x2="960" y2="700" stroke="#f59e0b" stroke-width="8"/>
      <text x="980" y="240" fill="#f59e0b" font-family="DejaVu Sans, Arial, sans-serif" font-size="28" font-weight="bold">BISECTED TRUE NORTH LINE</text>
    `
  },
  {
    index: 7,
    label: 'Water Foundation Level',
    title: 'OPTICAL WATER LEVELING',
    subtitle: 'Rock trenches filled with water created a base flat to within 1/2 inch',
    scriptText: "To ensure the entire thirteen-acre foundation was flat, they dug crisscrossing rock channels and flooded them with water. Once the water settled, it created an optical level accurate to within half an inch across the entire site.",
    accentColor: '#38bdf8',
    bgGradient: ['#082f49', '#0369a1', '#0284c7'],
    svgDetails: `
      <!-- Flooded Trenches Grid -->
      <rect x="420" y="320" width="1080" height="380" fill="#0369a1" stroke="#38bdf8" stroke-width="8"/>
      <line x1="420" y1="440" x2="1500" y2="440" stroke="#7dd3fc" stroke-width="12"/>
      <line x1="420" y1="560" x2="1500" y2="560" stroke="#7dd3fc" stroke-width="12"/>
      <line x1="780" y1="320" x2="780" y2="700" stroke="#7dd3fc" stroke-width="12"/>
      <line x1="1140" y1="320" x2="1140" y2="700" stroke="#7dd3fc" stroke-width="12"/>
      <text x="960" y="260" text-anchor="middle" fill="#e0f2fe" font-family="DejaVu Sans, Arial, sans-serif" font-size="32" font-weight="bold">13-ACRE BEDROCK WATER TRENCHES: &lt; 0.5 INCH ERROR</text>
    `
  },
  {
    index: 8,
    label: 'Precession Proof',
    title: 'THE MATHEMATICAL PROOF',
    subtitle: 'Khufu (2500 BC) and Khafre deviate by tiny fractions matching star drift',
    scriptText: "Here is the mind-blowing proof: over centuries, Earth's wobble slowly shifted those stars. And the Great Pyramid of Khufu, Khafre, and Menkaure deviate by tiny fractions that match the exact mathematical star drift over their construction years!",
    accentColor: '#10b981',
    bgGradient: ['#022c22', '#064e3b', '#047857'],
    svgDetails: `
      <!-- Alignment Error Matches Star Drift -->
      <rect x="450" y="240" width="1020" height="460" fill="#0f172a" stroke="#10b981" stroke-width="6" rx="16"/>
      <text x="960" y="320" text-anchor="middle" fill="#34d399" font-family="DejaVu Sans, Arial, sans-serif" font-size="34" font-weight="bold">PYRAMID DEVIATION MATCHES STAR DRIFT</text>
      <text x="520" y="420" fill="#ffffff" font-family="DejaVu Sans, Arial, sans-serif" font-size="26">• Khufu (2480 BC): 3′ west of north</text>
      <text x="520" y="490" fill="#ffffff" font-family="DejaVu Sans, Arial, sans-serif" font-size="26">• Khafre (2448 BC): 6′ east of north</text>
      <text x="520" y="560" fill="#ffffff" font-family="DejaVu Sans, Arial, sans-serif" font-size="26">• Rate of Change: EXACTLY matches Spence Precession Model</text>
      <text x="960" y="650" text-anchor="middle" fill="#facc15" font-family="DejaVu Sans, Arial, sans-serif" font-size="26" font-weight="bold">HISTORICAL PROOF OF ASTRONOMICAL SIGHTING</text>
    `
  },
  {
    index: 9,
    label: 'Conclusion and CTA',
    title: 'HUMAN INGENUITY UNLOCKED',
    subtitle: 'Share your thoughts in the comments • Subscribe to BunnyTales Studio!',
    scriptText: "No alien technology, just sheer human genius, string, and stars. Do you think modern architects could build this without digital tools? Tell us your theory in the comments, hit subscribe to join our BunnyTales expeditions, and we will see you in the next adventure!",
    accentColor: '#f43f5e',
    bgGradient: ['#4c0519', '#881337', '#be123c'],
    svgDetails: `
      <!-- Outro Card & Subscribe Pill -->
      <rect x="400" y="180" width="1120" height="540" fill="#18181b" stroke="#f43f5e" stroke-width="8" rx="24"/>
      <text x="960" y="280" text-anchor="middle" fill="#ffe4e6" font-family="DejaVu Sans, Arial, sans-serif" font-size="38" font-weight="bold">WHAT WOULD YOU EXPLORE NEXT?</text>
      <text x="960" y="350" text-anchor="middle" fill="#cbd5e1" font-family="DejaVu Sans, Arial, sans-serif" font-size="26">Drop your ancient engineering theories below!</text>
      <!-- Subscribe Button Pill -->
      <rect x="740" y="430" width="440" height="90" fill="#e11d48" rx="45"/>
      <text x="960" y="488" text-anchor="middle" fill="#ffffff" font-family="DejaVu Sans, Arial, sans-serif" font-size="34" font-weight="bold">▶ SUBSCRIBE</text>
      <text x="960" y="620" text-anchor="middle" fill="#f43f5e" font-family="DejaVu Sans, Arial, sans-serif" font-size="28" font-weight="bold">BUNNYTALES STUDIO</text>
    `
  }
];

async function getAudioDuration(filePath) {
  try {
    const dur = await getMediaDuration(filePath);
    return Number.isFinite(dur) && dur > 0 ? dur : 10;
  } catch (e) {
    return 10;
  }
}

async function buildScenes() {
  console.log('Preparing high-resolution composite scene graphics...');
  await fs.mkdir(ASSETS_DIR, { recursive: true });

  const bunnyResized = await sharp(BUNNY_AVATAR)
    .resize(360, 360, { fit: 'cover' })
    .composite([{
      input: Buffer.from('<svg width="360" height="360"><circle cx="180" cy="180" r="172" fill="#000" stroke="#ffe81f" stroke-width="12"/></svg>'),
      blend: 'dest-in'
    }])
    .toBuffer();

  const sceneAssets = [];

  for (const s of SCENES_CONFIG) {
    const svg = `
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg_${s.index}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="${s.bgGradient[0]}"/>
            <stop offset="50%" stop-color="${s.bgGradient[1]}"/>
            <stop offset="100%" stop-color="${s.bgGradient[2]}"/>
          </linearGradient>
        </defs>
        <rect width="1920" height="1080" fill="url(#bg_${s.index})"/>
        
        <!-- Header Banner -->
        <rect x="0" y="0" width="1920" height="120" fill="rgba(0,0,0,0.6)"/>
        <text x="80" y="55" fill="${s.accentColor}" font-family="DejaVu Sans, Arial, sans-serif" font-size="24" font-weight="bold" letter-spacing="3">BUNNYTALES STUDIO • EPISODE 2</text>
        <text x="80" y="95" fill="#ffffff" font-family="DejaVu Sans, Arial, sans-serif" font-size="32" font-weight="bold">${s.title}</text>
        
        <!-- Center Visual Details -->
        ${s.svgDetails}

        <!-- Bottom Narrative Card -->
        <rect x="420" y="860" width="1440" height="160" fill="rgba(15, 23, 42, 0.88)" stroke="${s.accentColor}" stroke-width="4" rx="20"/>
        <text x="460" y="920" fill="${s.accentColor}" font-family="DejaVu Sans, Arial, sans-serif" font-size="26" font-weight="bold">${s.label.toUpperCase()}</text>
        <text x="460" y="970" fill="#f8fafc" font-family="DejaVu Sans, Arial, sans-serif" font-size="24">${s.subtitle}</text>
      </svg>
    `;

    const imagePath = path.join(ASSETS_DIR, `pyramid_scene_${s.index}.jpg`);
    await sharp(Buffer.from(svg))
      .composite([
        { input: bunnyResized, top: 680, left: 60 }
      ])
      .jpeg({ quality: 95 })
      .toFile(imagePath);

    const audioPath = path.join(AUDIO_DIR, `scene_${s.index}.mp3`);
    const duration = await getAudioDuration(audioPath);

    sceneAssets.push({
      ...s,
      imagePath,
      audioPath,
      duration
    });

    console.log(`[Scene ${s.index}] Built image (${imagePath}) | Audio: ${audioPath} (${duration.toFixed(2)}s)`);
  }

  return sceneAssets;
}

async function buildThumbnail() {
  console.log('Generating high-CTR YouTube thumbnail (1280x720)...');
  const thumbPath = path.join(ASSETS_DIR, `thumbnail_pyramids_episode2.jpg`);
  
  const bunnyResizedThumb = await sharp(BUNNY_AVATAR)
    .resize(460, 460, { fit: 'cover' })
    .composite([{
      input: Buffer.from('<svg width="460" height="460"><circle cx="230" cy="230" r="220" fill="#000" stroke="#ffe81f" stroke-width="16"/></svg>'),
      blend: 'dest-in'
    }])
    .toBuffer();

  const thumbSvg = `
    <svg width="1280" height="720" viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#020617"/>
          <stop offset="60%" stop-color="#0f172a"/>
          <stop offset="100%" stop-color="#1e1b4b"/>
        </linearGradient>
      </defs>
      <rect width="1280" height="720" fill="url(#bg)"/>
      
      <!-- Cosmic Alignment Beam -->
      <line x1="820" y1="0" x2="820" y2="480" stroke="#00f5d4" stroke-width="8" stroke-dasharray="16,10"/>
      <circle cx="820" cy="140" r="24" fill="#00f5d4" filter="drop-shadow(0 0 30px #00f5d4)"/>
      <circle cx="820" cy="140" r="10" fill="#ffffff"/>

      <!-- Pyramid Silhouettes -->
      <polygon points="560,560 820,280 1080,560" fill="#d97706" stroke="#fbbf24" stroke-width="4"/>
      <polygon points="820,280 1080,560 1180,560" fill="#92400e"/>
      <polygon points="340,580 540,380 740,580" fill="#78350f"/>

      <!-- High CTR Badge Pills -->
      <rect x="420" y="40" width="820" height="110" fill="#e11d48" rx="20" stroke="#ffffff" stroke-width="5"/>
      <text x="830" y="115" text-anchor="middle" fill="#ffffff" font-family="DejaVu Sans, Arial, sans-serif" font-size="56" font-weight="900" letter-spacing="1">ALIGNED TO 0.05°?!</text>

      <rect x="460" y="170" width="740" height="80" fill="#ffe81f" rx="16" stroke="#000000" stroke-width="4"/>
      <text x="830" y="225" text-anchor="middle" fill="#000000" font-family="DejaVu Sans, Arial, sans-serif" font-size="42" font-weight="900">THE CELESTIAL SECRET</text>

      <rect x="520" y="580" width="680" height="90" fill="#0284c7" rx="18" stroke="#ffffff" stroke-width="4"/>
      <text x="860" y="640" text-anchor="middle" fill="#ffffff" font-family="DejaVu Sans, Arial, sans-serif" font-size="38" font-weight="bold">NO COMPASS • NO GPS</text>
    </svg>
  `;

  await sharp(Buffer.from(thumbSvg))
    .composite([
      { input: bunnyResizedThumb, top: 220, left: 30 }
    ])
    .jpeg({ quality: 95 })
    .toFile(thumbPath);

  console.log(`Thumbnail built successfully: ${thumbPath}`);
  return thumbPath;
}

async function updateDatabase(sceneAssets, thumbPath) {
  console.log('Updating database production and scene records...');
  const db = new Database();
  await db.initialize();

  // Update scenes in production_scenes
  for (const s of sceneAssets) {
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
        s.scriptText,
        s.subtitle,
        s.duration,
        s.imagePath,
        s.audioPath,
        PRODUCTION_ID,
        s.index
      ]
    );
  }

  // Update scripts table with full rich script
  const fullScript = SCENES_CONFIG.map(s => `[${s.label.toUpperCase()}]\n${s.scriptText}`).join('\n\n');
  await db.executeQuery(
    `UPDATE scripts SET 
      title = 'How Did Ancient Egyptians Align the Great Pyramids to True North within 0.05°?',
      hook = ?,
      full_script = ?,
      tone = 'educational_narrative',
      keywords = 'Ancient Egypt, Great Pyramid, True North, Giza engineering, celestial alignment, Kate Spence, archaeoastronomy'
     WHERE id = (SELECT script_id FROM productions WHERE id = ?)`,
    [SCENES_CONFIG[0].scriptText, fullScript, PRODUCTION_ID]
  );

  // Update thumbnails table
  await db.executeQuery(
    `UPDATE thumbnails SET 
      path = ?,
      concept = 'High-CTR 3D Bunny Explorer with celestial pyramid alignment'
     WHERE id = (SELECT thumbnail_id FROM productions WHERE id = ?)`,
    [thumbPath, PRODUCTION_ID]
  );

  console.log('Database records updated successfully!');
}

async function rebuildVideo(sceneAssets) {
  console.log('Rebuilding final video with burned-in subtitles via SceneRepairService...');
  const db = new Database();
  await db.initialize();
  const cm = new CredentialManager();
  await cm.initialize();
  const { AIVideoGenerator } = require('../utils/ai-video-generator');
  const vg = new AIVideoGenerator(cm.credentials, { db });

  const repairService = new SceneRepairService(db, vg);
  const result = await repairService.rebuild(PRODUCTION_ID, { burnSubtitles: true });
  console.log('Video rebuild complete!', JSON.stringify(result, null, 2));
  return result;
}

async function main() {
  const sceneAssets = await buildScenes();
  const thumbPath = await buildThumbnail();
  await updateDatabase(sceneAssets, thumbPath);
  const result = await rebuildVideo(sceneAssets);
  console.log('🎉 Episode 2 successfully produced and placed in Decision Queue!');
  console.log('Final Video Path:', result.finalVideo);
  console.log('Captions Path:', result.captions);
}

main().catch(err => {
  console.error('Build error:', err);
  process.exit(1);
});

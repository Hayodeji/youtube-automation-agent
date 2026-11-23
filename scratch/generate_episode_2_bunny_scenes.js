const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

const SOURCE_DIR = path.resolve('data/scene-assets/prod_1795219223739_9qv1ks9fhh_pqfac4enb4l');
const OUTPUT_DIR = path.resolve('data/assets');

async function createScenes() {
  console.log('Generating 10 scenes featuring the 3D Bunny Explorer character...');
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  // Prepare base images in 1920x1080
  const scene7_1080 = await sharp(path.join(SOURCE_DIR, 'bunny_scene_7.jpg')).resize(1920, 1080).toBuffer();
  const bunny7_crop = await sharp(scene7_1080).extract({ left: 0, top: 0, width: 680, height: 1080 }).toBuffer();

  const scene0_1080 = await sharp(path.join(SOURCE_DIR, 'bunny_scene_0.jpg')).resize(1920, 1080).toBuffer();
  const scene2_1080 = await sharp(path.join(SOURCE_DIR, 'bunny_scene_5.jpg')).resize(1920, 1080).toBuffer(); // Bunny holding compass
  const scene5_1080 = await sharp(path.join(SOURCE_DIR, 'bunny_scene_4.jpg')).resize(1920, 1080).toBuffer(); // Bunny with magnifying glass
  const scene9_1080 = await sharp(path.join(SOURCE_DIR, 'bunny_scene_9.jpg')).resize(1920, 1080).toBuffer(); // Bunny pointing at Subscribe Bell

  // Helper for easel scenes (scenes 1, 3, 4, 6, 7, 8)
  async function makeEaselScene(boardContentSvg, outputPath) {
    const fullBoardSvg = `
      <svg width="1240" height="825" viewBox="0 0 1240 825" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="slateGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#0f172a"/>
            <stop offset="100%" stop-color="#020617"/>
          </linearGradient>
        </defs>
        <rect width="1240" height="825" rx="16" fill="url(#slateGrad)"/>
        <rect x="8" y="8" width="1224" height="809" rx="12" fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-dasharray="8,6"/>
        ${boardContentSvg}
      </svg>
    `;

    return sharp(scene7_1080)
      .composite([
        { input: Buffer.from(fullBoardSvg), top: 120, left: 590 },
        { input: bunny7_crop, top: 0, left: 0 }
      ])
      .jpeg({ quality: 95 })
      .toFile(outputPath);
  }

  // SCENE 0: Hook - The Impossible Alignment
  console.log('Rendering Scene 0 (Hook)...');
  const scene0Overlay = `
    <svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="hookGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="rgba(15, 23, 42, 0.92)"/>
          <stop offset="100%" stop-color="rgba(15, 23, 42, 0.4)"/>
        </linearGradient>
      </defs>
      <!-- Top Banner -->
      <rect x="60" y="40" width="1800" height="150" rx="16" fill="url(#hookGrad)" stroke="#38bdf8" stroke-width="3"/>
      <text x="100" y="90" fill="#38bdf8" font-family="DejaVu Sans, Arial, sans-serif" font-size="24" font-weight="bold" letter-spacing="3">BUNNYTALES STUDIO • EPISODE 2</text>
      <text x="100" y="145" fill="#ffffff" font-family="DejaVu Sans, Arial, sans-serif" font-size="42" font-weight="bold">HOW DID ANCIENT EGYPTIANS ALIGN THE PYRAMIDS TO TRUE NORTH?</text>

      <!-- Center Pill Card -->
      <rect x="1080" y="240" width="760" height="420" rx="20" fill="rgba(15, 23, 42, 0.88)" stroke="#f59e0b" stroke-width="3"/>
      <text x="1120" y="300" fill="#f59e0b" font-family="DejaVu Sans, Arial, sans-serif" font-size="28" font-weight="bold" letter-spacing="2">THE IMPOSSIBLE ACCURACY</text>
      
      <circle cx="1140" cy="365" r="12" fill="#38bdf8"/>
      <text x="1170" y="373" fill="#f8fafc" font-family="DejaVu Sans, Arial, sans-serif" font-size="22">Error: off by just 0.05° (fraction of a hair!)</text>

      <circle cx="1140" cy="435" r="12" fill="#ef4444"/>
      <text x="1170" y="443" fill="#f8fafc" font-family="DejaVu Sans, Arial, sans-serif" font-size="22">No Magnetic Compasses</text>

      <circle cx="1140" cy="505" r="12" fill="#ef4444"/>
      <text x="1170" y="513" fill="#f8fafc" font-family="DejaVu Sans, Arial, sans-serif" font-size="22">No Telescopes or Optical Lenses</text>

      <circle cx="1140" cy="575" r="12" fill="#ef4444"/>
      <text x="1170" y="583" fill="#f8fafc" font-family="DejaVu Sans, Arial, sans-serif" font-size="22">No GPS or Satellite Navigation</text>

      <rect x="1120" y="615" width="680" height="2" fill="#38bdf8"/>
    </svg>
  `;
  await sharp(scene0_1080)
    .composite([{ input: Buffer.from(scene0Overlay), top: 0, left: 0 }])
    .jpeg({ quality: 95 })
    .toFile(path.join(OUTPUT_DIR, 'pyramid_scene_0.jpg'));

  // SCENE 1: Welcome to BunnyTales Studio
  console.log('Rendering Scene 1 (Intro)...');
  const scene1Board = `
    <!-- Header -->
    <text x="620" y="70" fill="#38bdf8" font-family="DejaVu Sans, Arial, sans-serif" font-size="32" font-weight="bold" text-anchor="middle" letter-spacing="3">WELCOME EXPLORERS!</text>
    <text x="620" y="115" fill="#fcd34d" font-family="DejaVu Sans, Arial, sans-serif" font-size="22" font-weight="bold" text-anchor="middle">BunnyTales Studio • Episode 2 Investigation</text>
    
    <!-- Pyramid Graphic -->
    <polygon points="620,160 860,420 380,420" fill="#78350f" stroke="#fbbf24" stroke-width="4"/>
    <polygon points="620,160 860,420 920,420" fill="#451a03"/>
    <line x1="620" y1="125" x2="620" y2="420" stroke="#38bdf8" stroke-width="4" stroke-dasharray="8,6"/>
    <circle cx="620" cy="125" r="8" fill="#38bdf8"/>
    <text x="640" y="130" fill="#38bdf8" font-family="DejaVu Sans, Arial, sans-serif" font-size="18" font-weight="bold">TRUE CELESTIAL NORTH</text>

    <!-- Info Box -->
    <rect x="140" y="450" width="960" height="180" rx="14" fill="rgba(30, 41, 59, 0.9)" stroke="#38bdf8" stroke-width="2"/>
    <text x="180" y="495" fill="#38bdf8" font-family="DejaVu Sans, Arial, sans-serif" font-size="22" font-weight="bold">THE GREAT PYRAMID OF GIZA</text>
    <text x="180" y="535" fill="#f8fafc" font-family="DejaVu Sans, Arial, sans-serif" font-size="19">• Built ~2560 BC (over 4,500 years ago) by Pharaoh Khufu</text>
    <text x="180" y="570" fill="#f8fafc" font-family="DejaVu Sans, Arial, sans-serif" font-size="19">• 2.3 million stone blocks aligned to True Geographic North</text>
    <text x="180" y="605" fill="#34d399" font-family="DejaVu Sans, Arial, sans-serif" font-size="19" font-weight="bold">• Off by just 0.057° (3.4 arcminutes) — impossible accuracy!</text>
  `;
  await makeEaselScene(scene1Board, path.join(OUTPUT_DIR, 'pyramid_scene_1.jpg'));

  // SCENE 2: The Compass Myth
  console.log('Rendering Scene 2 (The Compass Myth)...');
  const scene2Overlay = `
    <svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
      <!-- Top Myth Buster Banner -->
      <rect x="60" y="40" width="1800" height="150" rx="16" fill="rgba(15, 23, 42, 0.92)" stroke="#ef4444" stroke-width="4"/>
      <text x="100" y="90" fill="#ef4444" font-family="DejaVu Sans, Arial, sans-serif" font-size="26" font-weight="bold" letter-spacing="3">MYTH BUSTED • NO COMPASSES!</text>
      <text x="100" y="145" fill="#ffffff" font-family="DejaVu Sans, Arial, sans-serif" font-size="38" font-weight="bold">WHY MAGNETIC COMPASSES COULD NOT SOLVE THIS</text>

      <!-- Left Card: Myth Details -->
      <rect x="60" y="230" width="620" height="420" rx="18" fill="rgba(15, 23, 42, 0.9)" stroke="#ef4444" stroke-width="3"/>
      <text x="100" y="290" fill="#ef4444" font-family="DejaVu Sans, Arial, sans-serif" font-size="24" font-weight="bold">PROBLEM #1: WRONG ERA</text>
      <text x="100" y="335" fill="#f8fafc" font-family="DejaVu Sans, Arial, sans-serif" font-size="20">• Magnetic compass was invented</text>
      <text x="100" y="370" fill="#f8fafc" font-family="DejaVu Sans, Arial, sans-serif" font-size="20">  in China ~200 BC</text>
      <text x="100" y="405" fill="#fca5a5" font-family="DejaVu Sans, Arial, sans-serif" font-size="20">  (2,000+ years AFTER the Pyramids!)</text>

      <line x1="100" y1="440" x2="620" y2="440" stroke="#ef4444" stroke-width="1.5"/>

      <text x="100" y="485" fill="#ef4444" font-family="DejaVu Sans, Arial, sans-serif" font-size="24" font-weight="bold">PROBLEM #2: MAGNETIC DRIFT</text>
      <text x="100" y="530" fill="#f8fafc" font-family="DejaVu Sans, Arial, sans-serif" font-size="20">• Magnetic north moves constantly</text>
      <text x="100" y="565" fill="#f8fafc" font-family="DejaVu Sans, Arial, sans-serif" font-size="20">• Pyramids align to True Geographic North</text>
      <text x="100" y="600" fill="#34d399" font-family="DejaVu Sans, Arial, sans-serif" font-size="20" font-weight="bold">• The exact spin axis of Earth!</text>

      <!-- Red Stamp over Center -->
      <circle cx="1200" cy="380" r="110" fill="none" stroke="#ef4444" stroke-width="10"/>
      <line x1="1120" y1="300" x2="1280" y2="460" stroke="#ef4444" stroke-width="10"/>
      <text x="1200" y="530" fill="#ef4444" font-family="DejaVu Sans, Arial, sans-serif" font-size="28" font-weight="bold" text-anchor="middle">NOT INVENTED YET!</text>
    </svg>
  `;
  await sharp(scene2_1080)
    .composite([{ input: Buffer.from(scene2Overlay), top: 0, left: 0 }])
    .jpeg({ quality: 95 })
    .toFile(path.join(OUTPUT_DIR, 'pyramid_scene_2.jpg'));

  // SCENE 3: The North Star Plot Twist
  console.log('Rendering Scene 3 (North Star Twist)...');
  const scene3Board = `
    <!-- Header -->
    <text x="620" y="70" fill="#f59e0b" font-family="DejaVu Sans, Arial, sans-serif" font-size="32" font-weight="bold" text-anchor="middle" letter-spacing="3">THE NORTH STAR PLOT TWIST</text>
    <text x="620" y="115" fill="#38bdf8" font-family="DejaVu Sans, Arial, sans-serif" font-size="22" font-weight="bold" text-anchor="middle">Polaris Was NOT the North Star in 2500 BC!</text>

    <!-- Celestial Sphere Graphic -->
    <circle cx="620" cy="280" r="140" fill="none" stroke="#38bdf8" stroke-width="2" stroke-dasharray="6,6"/>
    
    <!-- True Celestial Pole (empty in 2500 BC) -->
    <circle cx="620" cy="280" r="10" fill="#ef4444"/>
    <circle cx="620" cy="280" r="24" fill="none" stroke="#ef4444" stroke-width="2" stroke-dasharray="4,4"/>
    <text x="620" y="250" fill="#ef4444" font-family="DejaVu Sans, Arial, sans-serif" font-size="20" font-weight="bold" text-anchor="middle">TRUE CELESTIAL POLE (EMPTY SKY!)</text>

    <!-- Polaris 25 degrees away in 2500 BC -->
    <circle cx="740" cy="200" r="12" fill="#64748b"/>
    <text x="760" y="205" fill="#94a3b8" font-family="DejaVu Sans, Arial, sans-serif" font-size="16">Polaris in 2500 BC (~25° away)</text>

    <!-- Earth Wobble Explanatory Note -->
    <rect x="140" y="440" width="960" height="180" rx="14" fill="rgba(30, 41, 59, 0.9)" stroke="#f59e0b" stroke-width="2"/>
    <text x="180" y="485" fill="#f59e0b" font-family="DejaVu Sans, Arial, sans-serif" font-size="22" font-weight="bold">AXIAL PRECESSION (EARTH'S WOBBLE)</text>
    <text x="180" y="525" fill="#f8fafc" font-family="DejaVu Sans, Arial, sans-serif" font-size="19">• Earth slowly wobbles like a spinning top every 26,000 years</text>
    <text x="180" y="560" fill="#f8fafc" font-family="DejaVu Sans, Arial, sans-serif" font-size="19">• 4,500 years ago, there was NO bright star marking True North!</text>
    <text x="180" y="595" fill="#38bdf8" font-family="DejaVu Sans, Arial, sans-serif" font-size="19" font-weight="bold">• So how did Egyptian astronomers find it?</text>
  `;
  await makeEaselScene(scene3Board, path.join(OUTPUT_DIR, 'pyramid_scene_3.jpg'));

  // SCENE 4: The Two-Star Secret
  console.log('Rendering Scene 4 (Two-Star Secret)...');
  const scene4Board = `
    <!-- Header -->
    <text x="620" y="70" fill="#38bdf8" font-family="DejaVu Sans, Arial, sans-serif" font-size="32" font-weight="bold" text-anchor="middle" letter-spacing="3">THE TWO-STAR SECRET</text>
    <text x="620" y="115" fill="#34d399" font-family="DejaVu Sans, Arial, sans-serif" font-size="22" font-weight="bold" text-anchor="middle">Discovered by Egyptologist Dr. Kate Spence</text>

    <!-- Two Stars Kochab and Mizar -->
    <!-- Kochab -->
    <circle cx="620" cy="180" r="15" fill="#fde047" filter="drop-shadow(0 0 12px #fde047)"/>
    <text x="620" y="155" fill="#fde047" font-family="DejaVu Sans, Arial, sans-serif" font-size="20" font-weight="bold" text-anchor="middle">KOCHAB (Little Dipper)</text>

    <!-- Connecting Vertical Axis -->
    <line x1="620" y1="180" x2="620" y2="440" stroke="#38bdf8" stroke-width="4" stroke-dasharray="8,6"/>

    <!-- True Celestial North at the exact midpoint! -->
    <circle cx="620" cy="310" r="12" fill="#ef4444"/>
    <circle cx="620" cy="310" r="26" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-dasharray="4,4"/>
    <text x="655" y="316" fill="#ef4444" font-family="DejaVu Sans, Arial, sans-serif" font-size="20" font-weight="bold">TRUE CELESTIAL NORTH</text>

    <!-- Mizar -->
    <circle cx="620" cy="440" r="15" fill="#fde047" filter="drop-shadow(0 0 12px #fde047)"/>
    <text x="620" y="480" fill="#fde047" font-family="DejaVu Sans, Arial, sans-serif" font-size="20" font-weight="bold" text-anchor="middle">MIZAR (Big Dipper)</text>

    <!-- Bottom summary box -->
    <rect x="140" y="515" width="960" height="120" rx="14" fill="rgba(30, 41, 59, 0.9)" stroke="#38bdf8" stroke-width="2"/>
    <text x="180" y="555" fill="#38bdf8" font-family="DejaVu Sans, Arial, sans-serif" font-size="20" font-weight="bold">THE SIMULTANEOUS TRANSIT METHOD</text>
    <text x="180" y="590" fill="#f8fafc" font-family="DejaVu Sans, Arial, sans-serif" font-size="18">When both stars stood vertically in the sky, their line intersected the True Pole!</text>
  `;
  await makeEaselScene(scene4Board, path.join(OUTPUT_DIR, 'pyramid_scene_4.jpg'));

  // SCENE 5: The Egyptian Merkhet & Plumb-Line
  console.log('Rendering Scene 5 (The Merkhet)...');
  const scene5Overlay = `
    <svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
      <!-- Top Banner -->
      <rect x="60" y="40" width="1800" height="150" rx="16" fill="rgba(15, 23, 42, 0.92)" stroke="#f59e0b" stroke-width="4"/>
      <text x="100" y="90" fill="#f59e0b" font-family="DejaVu Sans, Arial, sans-serif" font-size="26" font-weight="bold" letter-spacing="3">ANCIENT ENGINEERING TOOLKIT</text>
      <text x="100" y="145" fill="#ffffff" font-family="DejaVu Sans, Arial, sans-serif" font-size="38" font-weight="bold">THE MERKHET &amp; THE WEIGHTED PLUMB-LINE</text>

      <!-- Left Card: Sighting Tool Blueprint -->
      <rect x="60" y="230" width="700" height="520" rx="18" fill="rgba(15, 23, 42, 0.9)" stroke="#38bdf8" stroke-width="3"/>
      <text x="100" y="290" fill="#38bdf8" font-family="DejaVu Sans, Arial, sans-serif" font-size="26" font-weight="bold">THE MERKHET (SIGHTING SLOT)</text>
      
      <!-- Tool Diagram -->
      <rect x="100" y="310" width="280" height="30" rx="6" fill="#78350f" stroke="#fbbf24" stroke-width="2"/>
      <rect x="225" y="310" width="30" height="30" fill="#0f172a"/>
      <text x="410" y="335" fill="#f8fafc" font-family="DejaVu Sans, Arial, sans-serif" font-size="19">Wooden viewing bar with V-slot</text>

      <!-- Plumb Line Diagram -->
      <line x1="240" y1="340" x2="240" y2="470" stroke="#fcd34d" stroke-width="4"/>
      <circle cx="240" cy="485" r="18" fill="#d97706" stroke="#fbbf24" stroke-width="3"/>
      <text x="410" y="400" fill="#fcd34d" font-family="DejaVu Sans, Arial, sans-serif" font-size="19" font-weight="bold">Weighted Plumb-Bob</text>
      <text x="410" y="430" fill="#f8fafc" font-family="DejaVu Sans, Arial, sans-serif" font-size="18">• Gravity pulls cord perfectly vertical</text>
      <text x="410" y="460" fill="#f8fafc" font-family="DejaVu Sans, Arial, sans-serif" font-size="18">• Line held between astronomer and the stars</text>

      <!-- Operational rule -->
      <rect x="80" y="520" width="660" height="110" rx="12" fill="rgba(56, 189, 248, 0.12)" stroke="#38bdf8" stroke-width="2"/>
      <text x="100" y="555" fill="#34d399" font-family="DejaVu Sans, Arial, sans-serif" font-size="19" font-weight="bold">THE MOMENT OF ALIGNMENT:</text>
      <text x="100" y="585" fill="#f8fafc" font-family="DejaVu Sans, Arial, sans-serif" font-size="17">When Kochab, Mizar, and plumb-string lined up together:</text>
      <text x="100" y="612" fill="#f8fafc" font-family="DejaVu Sans, Arial, sans-serif" font-size="17">True North was transferred straight to the bedrock!</text>
    </svg>
  `;
  await sharp(scene5_1080)
    .composite([{ input: Buffer.from(scene5Overlay), top: 0, left: 0 }])
    .jpeg({ quality: 95 })
    .toFile(path.join(OUTPUT_DIR, 'pyramid_scene_5.jpg'));

  // SCENE 6: The Sun Check (Horizon Wall)
  console.log('Rendering Scene 6 (The Sun Check)...');
  const scene6Board = `
    <!-- Header -->
    <text x="620" y="70" fill="#f59e0b" font-family="DejaVu Sans, Arial, sans-serif" font-size="32" font-weight="bold" text-anchor="middle" letter-spacing="3">THE DAYTIME SUN CHECK</text>
    <text x="620" y="115" fill="#38bdf8" font-family="DejaVu Sans, Arial, sans-serif" font-size="22" font-weight="bold" text-anchor="middle">The Circular Horizon Wall (The Indian Circle Method)</text>

    <!-- Circular Horizon Diagram -->
    <ellipse cx="620" cy="300" rx="300" ry="120" fill="none" stroke="#f59e0b" stroke-width="3.5"/>
    <text x="620" y="200" fill="#f59e0b" font-family="DejaVu Sans, Arial, sans-serif" font-size="18" font-weight="bold" text-anchor="middle">LEVEL ARTIFICIAL HORIZON WALL</text>

    <!-- Center Gnomon Pole -->
    <line x1="620" y1="300" x2="620" y2="230" stroke="#f8fafc" stroke-width="4"/>
    <circle cx="620" cy="230" r="7" fill="#fde047"/>

    <!-- Sunrise & Sunset Shadows -->
    <line x1="620" y1="300" x2="420" y2="360" stroke="#ef4444" stroke-width="3" stroke-dasharray="6,4"/>
    <text x="360" y="375" fill="#ef4444" font-family="DejaVu Sans, Arial, sans-serif" font-size="16" font-weight="bold">Sunrise Shadow</text>

    <line x1="620" y1="300" x2="820" y2="360" stroke="#3b82f6" stroke-width="3" stroke-dasharray="6,4"/>
    <text x="840" y="375" fill="#3b82f6" font-family="DejaVu Sans, Arial, sans-serif" font-size="16" font-weight="bold">Sunset Shadow</text>

    <!-- Bisector Line to True North -->
    <line x1="620" y1="300" x2="620" y2="150" stroke="#34d399" stroke-width="4"/>
    <polygon points="620,135 612,150 628,150" fill="#34d399"/>
    <text x="640" y="160" fill="#34d399" font-family="DejaVu Sans, Arial, sans-serif" font-size="18" font-weight="bold">BISECTED ANGLE = TRUE NORTH</text>

    <!-- Info Box -->
    <rect x="140" y="470" width="960" height="160" rx="14" fill="rgba(30, 41, 59, 0.9)" stroke="#f59e0b" stroke-width="2"/>
    <text x="180" y="510" fill="#f59e0b" font-family="DejaVu Sans, Arial, sans-serif" font-size="20" font-weight="bold">HOW IT WORKED:</text>
    <text x="180" y="545" fill="#f8fafc" font-family="DejaVu Sans, Arial, sans-serif" font-size="18">• Flat circular mudbrick wall neutralized rugged desert topography</text>
    <text x="180" y="575" fill="#f8fafc" font-family="DejaVu Sans, Arial, sans-serif" font-size="18">• Marked shadow entry in morning, shadow exit in evening</text>
    <text x="180" y="605" fill="#34d399" font-family="DejaVu Sans, Arial, sans-serif" font-size="18" font-weight="bold">• Cutting the angle in half verified the night star alignment!</text>
  `;
  await makeEaselScene(scene6Board, path.join(OUTPUT_DIR, 'pyramid_scene_6.jpg'));

  // SCENE 7: Leveling the Foundation (Water Trenches)
  console.log('Rendering Scene 7 (Water Leveling)...');
  const scene7Board = `
    <!-- Header -->
    <text x="620" y="70" fill="#38bdf8" font-family="DejaVu Sans, Arial, sans-serif" font-size="32" font-weight="bold" text-anchor="middle" letter-spacing="3">LEVELING THE 13-ACRE BASE</text>
    <text x="620" y="115" fill="#34d399" font-family="DejaVu Sans, Arial, sans-serif" font-size="22" font-weight="bold" text-anchor="middle">Nature's Ultimate Spirit Level: Flooded Trenches</text>

    <!-- Trench Diagram -->
    <rect x="180" y="160" width="880" height="230" rx="14" fill="#1e293b" stroke="#38bdf8" stroke-width="3"/>
    
    <!-- Water Layer in Trench -->
    <rect x="200" y="260" width="840" height="110" fill="#0284c7" opacity="0.8"/>
    <line x1="200" y1="260" x2="1040" y2="260" stroke="#38bdf8" stroke-width="4"/>
    <text x="620" y="245" fill="#38bdf8" font-family="DejaVu Sans, Arial, sans-serif" font-size="20" font-weight="bold" text-anchor="middle">PERFECT HORIZONTAL WATERLINE</text>

    <!-- Wooden Pegs -->
    <rect x="320" y="225" width="14" height="75" fill="#b45309"/>
    <rect x="612" y="225" width="14" height="75" fill="#b45309"/>
    <rect x="900" y="225" width="14" height="75" fill="#b45309"/>
    <text x="620" y="325" fill="#ffffff" font-family="DejaVu Sans, Arial, sans-serif" font-size="18" font-weight="bold" text-anchor="middle">Flooded Bedrock Channels</text>

    <!-- Info Box -->
    <rect x="140" y="420" width="960" height="210" rx="14" fill="rgba(30, 41, 59, 0.9)" stroke="#38bdf8" stroke-width="2"/>
    <text x="180" y="460" fill="#38bdf8" font-family="DejaVu Sans, Arial, sans-serif" font-size="22" font-weight="bold">OPTICAL BEDROCK LEVELING:</text>
    <text x="180" y="495" fill="#f8fafc" font-family="DejaVu Sans, Arial, sans-serif" font-size="18">1. Grid of trenches chiseled across the entire 13-acre plateau</text>
    <text x="180" y="525" fill="#f8fafc" font-family="DejaVu Sans, Arial, sans-serif" font-size="18">2. Trenches filled with water — water naturally finds dead level</text>
    <text x="180" y="555" fill="#f8fafc" font-family="DejaVu Sans, Arial, sans-serif" font-size="18">3. Marks cut on stone posts, water drained, stone leveled to the mark</text>
    <text x="180" y="595" fill="#34d399" font-family="DejaVu Sans, Arial, sans-serif" font-size="20" font-weight="bold">RESULT: Base deviation less than 15 millimeters across 755 feet!</text>
  `;
  await makeEaselScene(scene7Board, path.join(OUTPUT_DIR, 'pyramid_scene_7.jpg'));

  // SCENE 8: The Precession Proof
  console.log('Rendering Scene 8 (The Precession Proof)...');
  const scene8Board = `
    <!-- Header -->
    <text x="620" y="70" fill="#a855f7" font-family="DejaVu Sans, Arial, sans-serif" font-size="32" font-weight="bold" text-anchor="middle" letter-spacing="3">THE PREDICTIVE PROOF</text>
    <text x="620" y="115" fill="#38bdf8" font-family="DejaVu Sans, Arial, sans-serif" font-size="22" font-weight="bold" text-anchor="middle">How Earth's Wobble Proved the Spence Method</text>

    <!-- Timeline Chart -->
    <rect x="160" y="160" width="920" height="260" rx="14" fill="#1e293b" stroke="#a855f7" stroke-width="3"/>
    
    <!-- Timeline Axis -->
    <line x1="220" y1="360" x2="1020" y2="360" stroke="#94a3b8" stroke-width="2.5"/>
    <text x="620" y="395" fill="#94a3b8" font-family="DejaVu Sans, Arial, sans-serif" font-size="16" text-anchor="middle">Pharaoh Reign Timeline (2600 BC - 2450 BC)</text>

    <!-- Data Points -->
    <circle cx="340" cy="310" r="12" fill="#f59e0b"/>
    <text x="340" y="280" fill="#f59e0b" font-family="DejaVu Sans, Arial, sans-serif" font-size="16" font-weight="bold" text-anchor="middle">Meidum</text>
    <text x="340" y="340" fill="#cbd5e1" font-family="DejaVu Sans, Arial, sans-serif" font-size="13" text-anchor="middle">-12' West</text>

    <circle cx="620" cy="210" r="16" fill="#34d399"/>
    <text x="620" y="185" fill="#34d399" font-family="DejaVu Sans, Arial, sans-serif" font-size="18" font-weight="bold" text-anchor="middle">KHUFU (Giza)</text>
    <text x="620" y="240" fill="#34d399" font-family="DejaVu Sans, Arial, sans-serif" font-size="14" font-weight="bold" text-anchor="middle">NEAR-ZERO ERROR (3.4')</text>

    <circle cx="880" cy="320" r="12" fill="#f59e0b"/>
    <text x="880" y="290" fill="#f59e0b" font-family="DejaVu Sans, Arial, sans-serif" font-size="16" font-weight="bold" text-anchor="middle">Khafre</text>
    <text x="880" y="350" fill="#cbd5e1" font-family="DejaVu Sans, Arial, sans-serif" font-size="13" text-anchor="middle">+6' East</text>

    <!-- Drift Curve Line -->
    <path d="M 340 310 Q 620 210 880 320" fill="none" stroke="#38bdf8" stroke-width="3.5" stroke-dasharray="8,6"/>

    <!-- Bottom summary box -->
    <rect x="140" y="450" width="960" height="180" rx="14" fill="rgba(30, 41, 59, 0.9)" stroke="#a855f7" stroke-width="2"/>
    <text x="180" y="490" fill="#a855f7" font-family="DejaVu Sans, Arial, sans-serif" font-size="20" font-weight="bold">THE SMOKING GUN OF ASTRONOMY:</text>
    <text x="180" y="525" fill="#f8fafc" font-family="DejaVu Sans, Arial, sans-serif" font-size="18">• Pyramids built BEFORE Khufu are skewed slightly west</text>
    <text x="180" y="555" fill="#f8fafc" font-family="DejaVu Sans, Arial, sans-serif" font-size="18">• Pyramids built AFTER Khufu are skewed slightly east</text>
    <text x="180" y="590" fill="#34d399" font-family="DejaVu Sans, Arial, sans-serif" font-size="18" font-weight="bold">• The errors match Earth's precessional wobble down to the arcminute!</text>
  `;
  await makeEaselScene(scene8Board, path.join(OUTPUT_DIR, 'pyramid_scene_8.jpg'));

  // SCENE 9: Outro - Call to Action
  console.log('Rendering Scene 9 (Outro & CTA)...');
  const scene9Overlay = `
    <svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
      <!-- Top Outro Banner -->
      <rect x="60" y="40" width="1800" height="150" rx="16" fill="rgba(15, 23, 42, 0.92)" stroke="#f59e0b" stroke-width="4"/>
      <text x="100" y="90" fill="#f59e0b" font-family="DejaVu Sans, Arial, sans-serif" font-size="26" font-weight="bold" letter-spacing="3">EXPLORATION COMPLETE • BUNNYTALES STUDIO</text>
      <text x="100" y="145" fill="#ffffff" font-family="DejaVu Sans, Arial, sans-serif" font-size="38" font-weight="bold">COULD YOU SOLVE TRUE NORTH WITH JUST TWO STARS?</text>

      <!-- Bottom Card above Subtitle zone -->
      <rect x="60" y="220" width="580" height="340" rx="18" fill="rgba(15, 23, 42, 0.9)" stroke="#38bdf8" stroke-width="3"/>
      <text x="100" y="280" fill="#38bdf8" font-family="DejaVu Sans, Arial, sans-serif" font-size="26" font-weight="bold">JOIN THE EXPLORERS!</text>
      
      <circle cx="120" cy="340" r="12" fill="#ef4444"/>
      <text x="150" y="348" fill="#f8fafc" font-family="DejaVu Sans, Arial, sans-serif" font-size="20">1. Like this video if you learned something!</text>

      <circle cx="120" cy="405" r="12" fill="#f59e0b"/>
      <text x="150" y="413" fill="#f8fafc" font-family="DejaVu Sans, Arial, sans-serif" font-size="20">2. Comment: What ancient wonder is next?</text>

      <circle cx="120" cy="470" r="12" fill="#34d399"/>
      <text x="150" y="478" fill="#f8fafc" font-family="DejaVu Sans, Arial, sans-serif" font-size="20">3. Subscribe &amp; ring the bell for Episode 3!</text>

      <rect x="100" y="505" width="480" height="3" fill="#38bdf8"/>
    </svg>
  `;
  await sharp(scene9_1080)
    .composite([{ input: Buffer.from(scene9Overlay), top: 0, left: 0 }])
    .jpeg({ quality: 95 })
    .toFile(path.join(OUTPUT_DIR, 'pyramid_scene_9.jpg'));

  console.log('All 10 scene images generated successfully with the 3D Bunny Explorer!');
}

createScenes().catch(err => {
  console.error('Error generating scenes:', err);
  process.exit(1);
});

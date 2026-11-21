const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const brainDir = '/home/w3irdsoul/.gemini/antigravity/brain/ee893a5c-deae-46ae-8290-f81532b82e29';
const scene1 = path.join(brainDir, 'bunny_explorer_aqueduct_blueprint_1795250313366.jpg');

async function renderLogosWithBunny() {
  console.log('Rendering branded logos with Bunny Mascot in center...');

  // 1. Crop Bunny Head & Chest perfectly (540x540 -> resize to 540x540)
  // Left: 680, Top: 20, Width: 520, Height: 520
  const bunnyMascotCircle = await sharp(scene1)
    .extract({ left: 680, top: 20, width: 520, height: 520 })
    .resize(520, 520)
    .modulate({ saturation: 1.25, brightness: 1.05 })
    .toBuffer();

  // Circular mask with subtle soft edge
  const maskSvg = `
    <svg width="520" height="520">
      <circle cx="260" cy="260" r="255" fill="white"/>
    </svg>
  `;
  const maskedBunny = await sharp(bunnyMascotCircle)
    .ensureAlpha()
    .composite([{ input: Buffer.from(maskSvg), blend: 'dest-in' }])
    .png()
    .toBuffer();

  // ==========================================
  // CONCEPT 1: Royal Blue & Gold Studio Emblem
  // ==========================================
  const svgConcept1 = `
    <svg width="800" height="800" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bgGrad" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#1E3C72"/>
          <stop offset="60%" stop-color="#2A5298"/>
          <stop offset="100%" stop-color="#0B132B"/>
        </radialGradient>
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FFF3B0"/>
          <stop offset="30%" stop-color="#FFD54F"/>
          <stop offset="70%" stop-color="#FFB300"/>
          <stop offset="100%" stop-color="#E65100"/>
        </linearGradient>
        <linearGradient id="ribbonGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#E63946"/>
          <stop offset="100%" stop-color="#9D0208"/>
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000000" flood-opacity="0.7"/>
        </filter>
      </defs>

      <!-- Main Background -->
      <circle cx="400" cy="400" r="390" fill="url(#bgGrad)"/>
      <circle cx="400" cy="400" r="380" fill="none" stroke="url(#goldGrad)" stroke-width="14" filter="url(#shadow)"/>
      <circle cx="400" cy="400" r="362" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
      
      <!-- Center Frame for Mascot -->
      <circle cx="400" cy="360" r="268" fill="none" stroke="url(#goldGrad)" stroke-width="10" filter="url(#shadow)"/>

      <!-- Animation Studio Star Accents -->
      <path d="M 120 280 L 125 295 L 140 295 L 128 305 L 132 320 L 120 310 L 108 320 L 112 305 L 100 295 L 115 295 Z" fill="#FFD54F"/>
      <path d="M 680 280 L 685 295 L 700 295 L 688 305 L 692 320 L 680 310 L 668 320 L 672 305 L 660 295 L 675 295 Z" fill="#FFD54F"/>
      <circle cx="160" cy="180" r="5" fill="#FFFFFF" opacity="0.8"/>
      <circle cx="640" cy="180" r="5" fill="#FFFFFF" opacity="0.8"/>
      <circle cx="400" cy="55" r="6" fill="#FFD54F"/>

      <!-- Lower Banner / Ribbon for Studio Name -->
      <g filter="url(#shadow)">
        <path d="M 110 615 Q 400 655 690 615 L 665 715 Q 400 755 135 715 Z" fill="url(#ribbonGrad)"/>
        <path d="M 110 615 Q 400 655 690 615" fill="none" stroke="url(#goldGrad)" stroke-width="6"/>
        <path d="M 135 715 Q 400 755 665 715" fill="none" stroke="url(#goldGrad)" stroke-width="6"/>
      </g>

      <!-- Brand Typography -->
      <text x="400" y="668" font-family="DejaVu Sans, Impact, Arial, sans-serif" font-size="46" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="3" stroke="#000000" stroke-width="3">
        BUNNY TALES
      </text>
      <text x="400" y="702" font-family="DejaVu Sans, Arial, sans-serif" font-size="22" font-weight="900" fill="#FFD54F" text-anchor="middle" letter-spacing="8">
        ★ STUDIO ★
      </text>
    </svg>
  `;

  // Base canvas with mascot placed at cx=400, cy=360 -> left=140, top=100
  const c1Bg = await sharp(Buffer.from(svgConcept1)).png().toBuffer();
  const c1Final = await sharp(c1Bg)
    .composite([
      { input: maskedBunny, top: 100, left: 140, blend: 'over' }
    ])
    .png()
    .toBuffer();

  // Re-composite ribbon & stars on top so ribbon overlays bottom of bunny circle
  const ribbonOverlay = `
    <svg width="800" height="800" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="goldGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FFF3B0"/>
          <stop offset="30%" stop-color="#FFD54F"/>
          <stop offset="70%" stop-color="#FFB300"/>
          <stop offset="100%" stop-color="#E65100"/>
        </linearGradient>
        <linearGradient id="ribbonGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#E63946"/>
          <stop offset="100%" stop-color="#9D0208"/>
        </linearGradient>
        <filter id="shadow2" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000000" flood-opacity="0.7"/>
        </filter>
      </defs>

      <!-- Center Gold Ring over Bunny -->
      <circle cx="400" cy="360" r="260" fill="none" stroke="url(#goldGrad2)" stroke-width="8" filter="url(#shadow2)"/>

      <!-- Lower Banner / Ribbon for Studio Name -->
      <g filter="url(#shadow2)">
        <path d="M 110 615 Q 400 655 690 615 L 665 715 Q 400 755 135 715 Z" fill="url(#ribbonGrad2)"/>
        <path d="M 110 615 Q 400 655 690 615" fill="none" stroke="url(#goldGrad2)" stroke-width="6"/>
        <path d="M 135 715 Q 400 755 665 715" fill="none" stroke="url(#goldGrad2)" stroke-width="6"/>
      </g>

      <!-- Brand Typography -->
      <text x="400" y="668" font-family="DejaVu Sans, Impact, Arial, sans-serif" font-size="46" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="3" stroke="#000000" stroke-width="3">
        BUNNY TALES
      </text>
      <text x="400" y="702" font-family="DejaVu Sans, Arial, sans-serif" font-size="22" font-weight="900" fill="#FFD54F" text-anchor="middle" letter-spacing="8">
        ★ STUDIO ★
      </text>
    </svg>
  `;

  const final1Jpg = path.join(brainDir, 'bunny_tales_studio_logo_concept1.jpg');
  await sharp(c1Final)
    .composite([{ input: Buffer.from(ribbonOverlay), blend: 'over' }])
    .jpeg({ quality: 98 })
    .toFile(final1Jpg);

  console.log('Saved Concept 1 with Bunny to:', final1Jpg);


  // ==========================================
  // CONCEPT 2: Modern Sunset Badge
  // ==========================================
  const svgConcept2 = `
    <svg width="800" height="800" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="sunsetGrad2" cx="50%" cy="40%" r="65%">
          <stop offset="0%" stop-color="#FF6B6B"/>
          <stop offset="50%" stop-color="#845EC2"/>
          <stop offset="100%" stop-color="#1B003A"/>
        </radialGradient>
        <linearGradient id="neonCyan2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#00FFFF"/>
          <stop offset="100%" stop-color="#0077B6"/>
        </linearGradient>
        <filter id="glow2" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000000" flood-opacity="0.6"/>
        </filter>
      </defs>

      <circle cx="400" cy="400" r="390" fill="url(#sunsetGrad2)"/>
      <circle cx="400" cy="400" r="380" fill="none" stroke="url(#neonCyan2)" stroke-width="14" filter="url(#glow2)"/>
      <circle cx="400" cy="400" r="362" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
    </svg>
  `;

  const c2Bg = await sharp(Buffer.from(svgConcept2)).png().toBuffer();
  const c2Mid = await sharp(c2Bg)
    .composite([{ input: maskedBunny, top: 100, left: 140, blend: 'over' }])
    .png()
    .toBuffer();

  const c2Overlay = `
    <svg width="800" height="800" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="neonCyan3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#00FFFF"/>
          <stop offset="100%" stop-color="#0077B6"/>
        </linearGradient>
        <filter id="glow3" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000000" flood-opacity="0.6"/>
        </filter>
      </defs>

      <circle cx="400" cy="360" r="260" fill="none" stroke="url(#neonCyan3)" stroke-width="8" filter="url(#glow3)"/>

      <!-- Lower Pill Badge -->
      <g filter="url(#glow3)">
        <rect x="130" y="615" width="540" height="90" rx="45" fill="#130924" stroke="url(#neonCyan3)" stroke-width="5"/>
      </g>

      <!-- Brand Text -->
      <text x="400" y="662" font-family="DejaVu Sans, Impact, Arial, sans-serif" font-size="42" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="2">
        BUNNY TALES
      </text>
      <text x="400" y="688" font-family="DejaVu Sans, Arial, sans-serif" font-size="18" font-weight="800" fill="#00FFFF" text-anchor="middle" letter-spacing="8">
        ★ STUDIO ★
      </text>
    </svg>
  `;

  const final2Jpg = path.join(brainDir, 'bunny_tales_studio_logo_concept2.jpg');
  await sharp(c2Mid)
    .composite([{ input: Buffer.from(c2Overlay), blend: 'over' }])
    .jpeg({ quality: 98 })
    .toFile(final2Jpg);

  console.log('Saved Concept 2 with Bunny to:', final2Jpg);

  // ==========================================
  // CONCEPT 3: Pure Hero Mascot Portrait
  // ==========================================
  const final3Jpg = path.join(brainDir, 'bunny_tales_studio_logo_concept3.jpg');
  const svgConcept3Ring = `
    <svg width="800" height="800" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="heroGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FFF3B0"/>
          <stop offset="30%" stop-color="#FFD54F"/>
          <stop offset="70%" stop-color="#FFB300"/>
          <stop offset="100%" stop-color="#E65100"/>
        </linearGradient>
        <filter id="hShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#000000" flood-opacity="0.8"/>
        </filter>
      </defs>
      <!-- Circular boundary safe ring for YouTube avatar -->
      <circle cx="400" cy="400" r="388" fill="none" stroke="url(#heroGold)" stroke-width="12" filter="url(#hShadow)"/>
      <circle cx="400" cy="400" r="372" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="3"/>
    </svg>
  `;

  const c3Base = await sharp(scene1)
    .extract({ left: 680, top: 20, width: 520, height: 520 })
    .resize(800, 800)
    .modulate({ saturation: 1.25, brightness: 1.05 })
    .toBuffer();

  await sharp(c3Base)
    .composite([{ input: Buffer.from(svgConcept3Ring), blend: 'over' }])
    .jpeg({ quality: 98 })
    .toFile(final3Jpg);

  console.log('Saved Concept 3 (Pure Hero Mascot) to:', final3Jpg);

  // Copy Concept 1 to data/assets/channel_profile.jpg
  fs.copyFileSync(final1Jpg, path.resolve('data/assets/channel_profile.jpg'));
}

renderLogosWithBunny().catch(console.error);

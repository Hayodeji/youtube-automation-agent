const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const brainDir = '/home/w3irdsoul/.gemini/antigravity/brain/ee893a5c-deae-46ae-8290-f81532b82e29';
const baseBunny = path.join(brainDir, 'ancient_city_water_aqueduct_bunny_1795250229435.jpg');

async function createStudioLogos() {
  console.log('Designing Bunny Tales Studio official channel logos...');

  // 1. Prepare circular mascot cutout from base image
  // Character head is around left: 860, top: 20, width: 500, height: 500
  const bunnyHead = await sharp(baseBunny)
    .extract({ left: 850, top: 20, width: 500, height: 500 })
    .resize(520, 520, { fit: 'cover' })
    .modulate({ saturation: 1.3, brightness: 1.08 })
    .toBuffer();

  // Make circular mask for the character
  const circleMaskSvg = `
    <svg width="520" height="520">
      <circle cx="260" cy="260" r="250" fill="white"/>
    </svg>
  `;
  const maskedBunny = await sharp(bunnyHead)
    .composite([{ input: Buffer.from(circleMaskSvg), blend: 'dest-in' }])
    .png()
    .toBuffer();

  // CONCEPT 1: Royal Blue & Gold Studio Emblem
  const svgConcept1 = `
    <svg width="800" height="800" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bgGrad" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#1E3C72"/>
          <stop offset="60%" stop-color="#2A5298"/>
          <stop offset="100%" stop-color="#0F172A"/>
        </radialGradient>
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FFE082"/>
          <stop offset="30%" stop-color="#FFD54F"/>
          <stop offset="70%" stop-color="#FFB300"/>
          <stop offset="100%" stop-color="#FFA000"/>
        </linearGradient>
        <linearGradient id="ribbonGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#FF3366"/>
          <stop offset="100%" stop-color="#C2185B"/>
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000000" flood-opacity="0.6"/>
        </filter>
        <filter id="ribbonShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#000000" flood-opacity="0.5"/>
        </filter>
      </defs>

      <!-- Background Disc -->
      <circle cx="400" cy="400" r="390" fill="url(#bgGrad)" />

      <!-- Outer Decorative Gold Ring -->
      <circle cx="400" cy="400" r="380" fill="none" stroke="url(#goldGrad)" stroke-width="12" filter="url(#glow)"/>
      <circle cx="400" cy="400" r="362" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
      <circle cx="400" cy="400" r="270" fill="none" stroke="rgba(255,213,79,0.3)" stroke-width="4" stroke-dasharray="10 8"/>

      <!-- Animation Studio Star Accents -->
      <path d="M 170 200 L 175 215 L 190 215 L 178 225 L 182 240 L 170 230 L 158 240 L 162 225 L 150 215 L 165 215 Z" fill="#FFD54F" opacity="0.8"/>
      <path d="M 630 200 L 635 215 L 650 215 L 638 225 L 642 240 L 630 230 L 618 240 L 622 225 L 610 215 L 625 215 Z" fill="#FFD54F" opacity="0.8"/>
      <circle cx="210" cy="140" r="4" fill="#FFFFFF" opacity="0.7"/>
      <circle cx="590" cy="140" r="4" fill="#FFFFFF" opacity="0.7"/>
      <circle cx="400" cy="65" r="5" fill="#FFD54F" opacity="0.9"/>

      <!-- Lower Banner / Ribbon for Brand Name -->
      <g filter="url(#ribbonShadow)">
        <path d="M 140 620 Q 400 660 660 620 L 640 700 Q 400 735 160 700 Z" fill="url(#ribbonGrad)"/>
        <!-- Golden Border on Ribbon -->
        <path d="M 140 620 Q 400 660 660 620" fill="none" stroke="url(#goldGrad)" stroke-width="5"/>
        <path d="M 160 700 Q 400 735 640 700" fill="none" stroke="url(#goldGrad)" stroke-width="5"/>
      </g>

      <!-- Brand Typography -->
      <!-- Main "BUNNY TALES" text -->
      <text x="400" y="662" font-family="DejaVu Sans, Impact, Arial, sans-serif" font-size="44" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="3" stroke="#000000" stroke-width="2">
        BUNNY TALES
      </text>
      <!-- Sub "STUDIO" text -->
      <text x="400" y="694" font-family="DejaVu Sans, Arial, sans-serif" font-size="22" font-weight="900" fill="#FFD54F" text-anchor="middle" letter-spacing="6">
        STUDIO
      </text>
    </svg>
  `;

  const concept1Bg = await sharp(Buffer.from(svgConcept1)).png().toBuffer();
  const concept1Final = path.join(brainDir, 'bunny_tales_studio_logo_concept1.png');
  const concept1Jpg = path.join(brainDir, 'bunny_tales_studio_logo_concept1.jpg');

  // Composite masked bunny into center (top: 100, left: 140)
  await sharp(concept1Bg)
    .composite([
      { input: maskedBunny, top: 110, left: 140, blend: 'over' }
    ])
    .toFile(concept1Final);

  // Convert to JPG for YouTube upload
  await sharp(concept1Final).jpeg({ quality: 98 }).toFile(concept1Jpg);
  console.log('Saved Concept 1 to:', concept1Jpg);


  // CONCEPT 2: Modern Sunset Gradient Badge (Warm, vibrant, bold)
  const svgConcept2 = `
    <svg width="800" height="800" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="sunsetGrad" cx="50%" cy="45%" r="65%">
          <stop offset="0%" stop-color="#FF6B6B"/>
          <stop offset="50%" stop-color="#845EC2"/>
          <stop offset="100%" stop-color="#2C003E"/>
        </radialGradient>
        <linearGradient id="neonCyan" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#00FFFF"/>
          <stop offset="100%" stop-color="#00B4D8"/>
        </linearGradient>
        <filter id="drop" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000000" flood-opacity="0.6"/>
        </filter>
      </defs>

      <!-- Outer Disc -->
      <circle cx="400" cy="400" r="390" fill="url(#sunsetGrad)"/>
      <circle cx="400" cy="400" r="375" fill="none" stroke="url(#neonCyan)" stroke-width="14" filter="url(#drop)"/>
      <circle cx="400" cy="400" r="355" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="3"/>

      <!-- Lower Pill Badge -->
      <g filter="url(#drop)">
        <rect x="130" y="615" width="540" height="90" rx="45" fill="#1A1423" stroke="url(#neonCyan)" stroke-width="4"/>
      </g>

      <!-- Brand Text -->
      <text x="400" y="662" font-family="DejaVu Sans, Impact, Arial, sans-serif" font-size="40" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="2">
        BUNNY TALES
      </text>
      <text x="400" y="688" font-family="DejaVu Sans, Arial, sans-serif" font-size="18" font-weight="800" fill="#00FFFF" text-anchor="middle" letter-spacing="8">
        ★ STUDIO ★
      </text>
    </svg>
  `;

  const concept2Bg = await sharp(Buffer.from(svgConcept2)).png().toBuffer();
  const concept2Final = path.join(brainDir, 'bunny_tales_studio_logo_concept2.png');
  const concept2Jpg = path.join(brainDir, 'bunny_tales_studio_logo_concept2.jpg');

  await sharp(concept2Bg)
    .composite([
      { input: maskedBunny, top: 110, left: 140, blend: 'over' }
    ])
    .toFile(concept2Final);

  await sharp(concept2Final).jpeg({ quality: 98 }).toFile(concept2Jpg);
  console.log('Saved Concept 2 to:', concept2Jpg);

  // Copy Concept 1 to data/assets/channel_profile.jpg
  fs.copyFileSync(concept1Jpg, path.resolve('data/assets/channel_profile.jpg'));
  console.log('Channel profile updated at data/assets/channel_profile.jpg');
}

createStudioLogos().catch(console.error);

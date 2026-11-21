const path = require('path');
const sharp = require('sharp');

const brainDir = '/home/w3irdsoul/.gemini/antigravity/brain/ee893a5c-deae-46ae-8290-f81532b82e29';

async function generateProfilePics() {
  console.log('Generating YouTube channel profile pictures (800x800)...');

  // Option 1: Sunset Adventurer (Scene 8) - Center Bunny around x=500, y=100..650
  // Size 550x550 -> resize to 800x800
  const opt1Path = path.join(brainDir, 'profile_pic_sunset_explorer.jpg');
  await sharp(path.join(brainDir, 'scene_8_sunset_aqueduct_1795250316320.jpg'))
    .extract({ left: 220, top: 100, width: 560, height: 560 })
    .resize(800, 800)
    .modulate({ saturation: 1.2, brightness: 1.05 })
    .jpeg({ quality: 95 })
    .toFile(opt1Path);
  console.log('Created Option 1:', opt1Path);

  // Option 2: Daylight Hero Bunny (Scene 0) - Center Bunny around x=1150, y=50..600
  // Size 550x550 -> resize to 800x800
  const opt2Path = path.join(brainDir, 'profile_pic_daylight_hero.jpg');
  await sharp(path.join(brainDir, 'ancient_city_water_aqueduct_bunny_1795250229435.jpg'))
    .extract({ left: 820, top: 20, width: 550, height: 550 })
    .resize(800, 800)
    .modulate({ saturation: 1.25, brightness: 1.08 })
    .jpeg({ quality: 95 })
    .toFile(opt2Path);
  console.log('Created Option 2:', opt2Path);

  // Option 3: Curious Explorer (Scene 2 - Looking down the well with curious eyes)
  const opt3Path = path.join(brainDir, 'profile_pic_curious_bunny.jpg');
  await sharp(path.join(brainDir, 'scene_2_the_question_1795250296426.jpg'))
    .resize(800, 800, { fit: 'cover', position: 'centre' })
    .modulate({ saturation: 1.2, brightness: 1.05 })
    .jpeg({ quality: 95 })
    .toFile(opt3Path);
  console.log('Created Option 3:', opt3Path);

  // Also save the recommended one to data/assets/channel_avatar.jpg
  const defaultAvatar = path.resolve('data/assets/channel_avatar.jpg');
  await sharp(opt2Path).toFile(defaultAvatar);
  console.log('Default channel avatar saved to:', defaultAvatar);
}

generateProfilePics().catch(console.error);


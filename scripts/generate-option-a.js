const fs = require('fs');
const path = require('path');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const dotenv = require('dotenv');

dotenv.config();

const API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'JBFqnCBsd6RMkjVDRZzb';
const PRODUCTION_ID = 'prod_1795219223739_9qv1ks9fhh_pqfac4enb4l';

const SCENES_DATA = [
  {
    position: 0,
    id: 'scene_22df2153-a9d5-4bd3-ab18-d221c0096c89',
    text: "Imagine living in a bustling ancient metropolis of over one million people, thousands of years before the invention of electricity or modern pumps. How on earth did everyone get fresh, clean drinking water every single day?",
    assetPath: 'data/scene-assets/prod_1795219223739_9qv1ks9fhh_pqfac4enb4l/scene_22df2153-a9d5-4bd3-ab18-d221c0096c89.png'
  },
  {
    position: 1,
    id: 'scene_ceb3d1e0-a422-4987-be8b-5207e77ea7cb',
    text: "Welcome to BunnyTales Studio. Today, we step back into the ancient world to uncover one of history's greatest engineering marvels: how ancient civilizations conquered physics and gravity to hydrate entire empires.",
    assetPath: 'data/scene-assets/prod_1795219223739_9qv1ks9fhh_pqfac4enb4l/scene_ceb3d1e0-a422-4987-be8b-5207e77ea7cb.png'
  },
  {
    position: 2,
    id: 'scene_b2c69b8f-0314-4b30-bce0-30af335dbc0a',
    text: "When cities like ancient Rome, Alexandria, or Carthage expanded, local rivers and shallow wells quickly turned into contaminated sludge. Without modern motors, how could you transport millions of gallons of fresh water across hundreds of miles of rugged mountains and deep valleys?",
    assetPath: 'data/scene-assets/prod_1795219223739_9qv1ks9fhh_pqfac4enb4l/scene_b2c69b8f-0314-4b30-bce0-30af335dbc0a.png'
  },
  {
    position: 3,
    id: 'scene_b5214c0c-0f7d-4943-aaff-5fe34c152280',
    text: "The secret began miles away, high up in pristine mountain springs. Ancient Roman architects and surveyors scouted out crystal-clear alpine water, testing its clarity, mineral purity, and year-round flow before laying a single foundation stone.",
    assetPath: 'data/scene-assets/prod_1795219223739_9qv1ks9fhh_pqfac4enb4l/scene_b5214c0c-0f7d-4943-aaff-5fe34c152280.png'
  },
  {
    position: 4,
    id: 'scene_bc7be045-b2dd-418e-b120-8d35f1e875c5',
    text: "Then came the true masterpiece of ancient physics: the aqueduct. Using nothing but gravity, master builders erected monumental tiered stone arches with an astonishingly precise downhill slope—often dropping less than an inch every hundred yards—keeping water flowing continuously without overflowing or stagnating.",
    assetPath: 'data/scene-assets/prod_1795219223739_9qv1ks9fhh_pqfac4enb4l/scene_bc7be045-b2dd-418e-b120-8d35f1e875c5.png'
  },
  {
    position: 5,
    id: 'scene_6f5be5db-ad42-4c13-8c30-69898c4664bb',
    text: "When the water arrived at the city perimeter, it emptied into colossal subterranean storage palaces called cisterns. Marvels like the ancient Basilica Cistern held tens of millions of gallons of crystal reserves, keeping entire populations alive through droughts and wartime sieges.",
    assetPath: 'data/scene-assets/prod_1795219223739_9qv1ks9fhh_pqfac4enb4l/scene_6f5be5db-ad42-4c13-8c30-69898c4664bb.png'
  },
  {
    position: 6,
    id: 'scene_a6d7917c-ddea-4c3e-90c2-baebd8805461',
    text: "From these underground reservoirs, lead and terracotta piping channeled pressurized clean water to thousands of public street fountains, imperial bathhouses, and private villas. For the first time in human history, clean water was a civil right, transforming ancient daily life.",
    assetPath: 'data/scene-assets/prod_1795219223739_9qv1ks9fhh_pqfac4enb4l/scene_a6d7917c-ddea-4c3e-90c2-baebd8805461.png'
  },
  {
    position: 7,
    id: 'scene_58d307e0-df22-4d8d-a44b-b36dee4aa945',
    text: "The ancient formula was as elegant as it was formidable: natural alpine springs, gravity-fed stone aqueducts, massive subterranean reservoirs, and an intricate citywide distribution network.",
    assetPath: 'data/scene-assets/prod_1795219223739_9qv1ks9fhh_pqfac4enb4l/scene_58d307e0-df22-4d8d-a44b-b36dee4aa945.png'
  },
  {
    position: 8,
    id: 'scene_a26edbca-2059-4da1-aa3f-66eedecaf7f3',
    text: "These structures were engineered with such extraordinary resilience that some, like Rome's Aqua Virgo, are still delivering fresh water to public fountains more than two thousand years later.",
    assetPath: 'data/scene-assets/prod_1795219223739_9qv1ks9fhh_pqfac4enb4l/scene_a26edbca-2059-4da1-aa3f-66eedecaf7f3.png'
  },
  {
    position: 9,
    id: 'scene_20a001f4-b4a6-4ea1-a339-77f114cfafbf',
    text: "If you enjoyed this journey into ancient engineering, subscribe to BunnyTales Studio and hit the notification bell for more deep dives into history and science. What ancient wonder should we explore next? Let us know in the comments below.",
    assetPath: 'data/scene-assets/prod_1795219223739_9qv1ks9fhh_pqfac4enb4l/scene_20a001f4-b4a6-4ea1-a339-77f114cfafbf.png'
  }
];

const { getMediaDuration } = require('../utils/ffmpeg');

async function generateTTS(text, outputPath) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;
  const response = await axios({
    method: 'POST',
    url,
    data: {
      text,
      model_id: 'eleven_turbo_v2_5', // fast, reliable, natural
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.8,
        style: 0.1,
        use_speaker_boost: true
      }
    },
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': API_KEY
    },
    responseType: 'stream'
  });

  const writer = fs.createWriteStream(outputPath);
  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on('finish', () => resolve(outputPath));
    writer.on('error', reject);
  });
}

async function main() {
  console.log('Starting ElevenLabs TTS generation for 10 scenes...');
  const audioDir = path.join(__dirname, `../data/audio/scenes/${PRODUCTION_ID}`);
  fs.mkdirSync(audioDir, { recursive: true });

  const db = new sqlite3.Database('data/youtube_automation.db');

  for (const scene of SCENES_DATA) {
    const filename = `00${scene.position}_r2.mp3`;
    const outputPath = path.join(audioDir, filename);
    const relAudioPath = `data/audio/scenes/${PRODUCTION_ID}/${filename}`;
    
    console.log(`Generating audio for Scene ${scene.position}...`);
    await generateTTS(scene.text, outputPath);
    
    const duration = await getMediaDuration(outputPath);
    console.log(`Scene ${scene.position} generated: duration = ${duration.toFixed(2)}s`);

    await new Promise((resolve, reject) => {
      db.run(`
        UPDATE production_scenes
        SET script_text = ?,
            duration = ?,
            audio_path = ?,
            asset_path = ?,
            asset_type = 'image',
            asset_origin = 'generated',
            status = 'ready',
            narration_status = 'current',
            narration_provider = 'elevenlabs',
            narration_model = 'eleven_turbo_v2_5',
            narration_generated_at = CURRENT_TIMESTAMP,
            rights_confirmed = 1,
            locked = 0
        WHERE id = ?
      `, [scene.text, duration, relAudioPath, scene.assetPath, scene.id], err => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // Update thumbnail to high-res Pont du Gard / Roman architecture
  console.log('Updating thumbnail asset...');
  const thumbnailSrc = path.resolve('data/scene-assets/prod_1795219223739_9qv1ks9fhh_pqfac4enb4l/scene_bc7be045-b2dd-418e-b120-8d35f1e875c5.png');
  const thumbnailDest = path.resolve('data/assets/thumbnail_1795219226670.jpg');
  
  // Use ffmpeg to resize and save as JPEG thumbnail
  const { runFFmpeg } = require('../utils/ffmpeg');
  await runFFmpeg(['-y', '-i', thumbnailSrc, '-vf', 'scale=1280:720', '-q:v', '2', thumbnailDest]);

  db.close();
  console.log('All 10 scene audios generated and database updated successfully!');
}

main().catch(err => {
  console.error('Error during generation:', err);
  process.exit(1);
});


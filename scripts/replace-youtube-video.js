const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { CredentialManager } = require('../utils/credential-manager');

const PRODUCTION_ID = 'prod_1795219223739_9qv1ks9fhh_pqfac4enb4l';
const REAL_VIDEO_PATH = path.resolve('data/videos/prod_1795219223739_9qv1ks9fhh_pqfac4enb4l_burned_subtitles.mp4');
const CAPTIONS_PATH = path.resolve('data/captions/prod_1795219223739_9qv1ks9fhh_pqfac4enb4l_repair_1795253126241.srt');

async function uploadRealVideo() {
  console.log('Uploading real video to YouTube...');
  
  if (!fs.existsSync(REAL_VIDEO_PATH)) {
    throw new Error('Real video file not found at: ' + REAL_VIDEO_PATH);
  }
  const fileSize = fs.statSync(REAL_VIDEO_PATH).size;
  console.log(`Real video verified: ${REAL_VIDEO_PATH} (${(fileSize / (1024 * 1024)).toFixed(2)} MB)`);

  const cm = new CredentialManager();
  await cm.loadCredentials();
  await cm.loadTokens();
  const youtube = cm.getYouTubeClient();

  const title = "How Did Ancient Cities Get Their Water? | Ancient Engineering Explained";
  const description = `How did ancient cities like Rome get clean water for over a million people before electricity and modern pumps? Discover the incredible engineering of gravity aqueducts, subterranean cisterns, and lead pipe distribution in this deep dive!

⏱️ TIMESTAMPS:
00:00 - The Ancient Water Mystery
00:14 - Welcome to BunnyTales Studio
00:28 - Why Rivers and Shallow Wells Failed
00:45 - Scouting Alpine Mountain Springs
01:00 - The Gravity Aqueduct Masterpiece
01:21 - Subterranean Cistern Palaces
01:38 - Street Fountains & Ancient Plumbing
01:55 - The 4-Part Engineering Formula
02:08 - The 2,000-Year Legacy (Aqua Virgo)
02:18 - Outro & What to Explore Next

#ancienthistory #engineering #romanempire #aqueducts #bunnytales`;

  // Safe tags with no punctuation, no question marks
  const safeTags = [
    "ancient cities",
    "roman engineering",
    "aqueducts",
    "ancient history",
    "water supply",
    "ancient technology",
    "bunnytales studio",
    "engineering marvels",
    "roman aqueduct",
    "ancient rome",
    "how it works",
    "documentary",
    "history documentary"
  ];

  console.log('Uploading video stream...');
  const videoStream = fs.createReadStream(REAL_VIDEO_PATH);
  const uploadRes = await youtube.videos.insert({
    part: 'snippet,status',
    requestBody: {
      snippet: {
        title,
        description,
        tags: safeTags,
        categoryId: '27', // Education
        defaultLanguage: 'en',
        defaultAudioLanguage: 'en'
      },
      status: {
        privacyStatus: 'public',
        selfDeclaredMadeForKids: false
      }
    },
    media: {
      body: videoStream
    }
  });

  const newVideoId = uploadRes.data.id;
  const newVideoUrl = `https://www.youtube.com/watch?v=${newVideoId}`;
  console.log(`\n========================================`);
  console.log(`SUCCESS! REAL VIDEO IS LIVE ON YOUTUBE!`);
  console.log(`Video ID: ${newVideoId}`);
  console.log(`Watch URL: ${newVideoUrl}`);
  console.log(`========================================\n`);

  // Upload Captions
  if (fs.existsSync(CAPTIONS_PATH)) {
    try {
      console.log('Uploading captions track...');
      const captionsContent = fs.readFileSync(CAPTIONS_PATH, 'utf8');
      await youtube.captions.insert({
        part: 'snippet',
        requestBody: {
          snippet: {
            videoId: newVideoId,
            language: 'en',
            name: 'English',
            isDraft: false
          }
        },
        media: {
          mimeType: '*/*',
          body: captionsContent
        }
      });
      console.log('Captions uploaded successfully!');
    } catch (err) {
      console.warn('Captions upload warning:', err.message);
    }
  }

  // Update SQLite database
  const db = new sqlite3.Database('data/youtube_automation.db');
  await new Promise((resolve, reject) => {
    db.run(`
      UPDATE publish_schedule
      SET youtube_id = ?,
          youtube_url = ?,
          status = 'published',
          published_at = CURRENT_TIMESTAMP,
          error_message = null
      WHERE production_id = ?
    `, [newVideoId, newVideoUrl, PRODUCTION_ID], err => {
      if (err) reject(err); else resolve();
    });
  });

  await new Promise((resolve, reject) => {
    db.run(`
      UPDATE productions
      SET status = 'published'
      WHERE id = ?
    `, [PRODUCTION_ID], err => {
      if (err) reject(err); else resolve();
    });
  });

  db.close();
  console.log('Database updated with verified YouTube URL:', newVideoUrl);
}

uploadRealVideo().catch(err => {
  console.error('Fatal upload error:', err);
  process.exit(1);
});

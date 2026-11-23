require('dotenv').config({ override: true });
const fs = require('fs');
const path = require('path');
const { CredentialManager } = require('../utils/credential-manager');

const VIDEO_ID = process.argv[2] || 'VKJXGMbApUM';
const THUMBNAIL_PATH = process.argv[3] || path.resolve('data/assets/thumbnail_pyramids_episode2.jpg');

async function uploadThumbnail() {
  console.log(`Setting custom thumbnail for video ${VIDEO_ID}...`);
  console.log(`Thumbnail file: ${THUMBNAIL_PATH}`);

  if (!fs.existsSync(THUMBNAIL_PATH)) {
    throw new Error(`Thumbnail file does not exist: ${THUMBNAIL_PATH}`);
  }

  const cm = new CredentialManager();
  await cm.initialize();
  const youtube = cm.getYouTubeClient();

  try {
    const res = await youtube.thumbnails.set({
      videoId: VIDEO_ID,
      media: {
        mimeType: 'image/jpeg',
        body: fs.createReadStream(THUMBNAIL_PATH)
      }
    });

    console.log('✅ SUCCESS! Custom thumbnail uploaded and applied to YouTube video:');
    console.log(`   Video URL: https://www.youtube.com/watch?v=${VIDEO_ID}`);
    console.log('   Response thumbnails:', res.data.items?.[0] || res.data);
  } catch (error) {
    if (error.code === 403 && error.message.includes("permissions to upload and set custom video thumbnails")) {
      console.error('\n❌ YouTube Permission Block:');
      console.error('YouTube requires a one-time channel phone verification to enable custom thumbnails.');
      console.error('Please visit: https://www.youtube.com/verify');
      console.error('Complete the 1-minute SMS verification, then re-run this script:');
      console.error(`node scripts/upload-episode-2-thumbnail.js ${VIDEO_ID}\n`);
    } else {
      console.error('❌ Failed to upload thumbnail:', error.message);
    }
    process.exit(1);
  }
}

uploadThumbnail();


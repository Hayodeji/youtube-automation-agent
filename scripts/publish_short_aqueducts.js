require('dotenv').config({ override: true });
const fs = require('fs');
const path = require('path');
const { CredentialManager } = require('../utils/credential-manager');

const SHORT_VIDEO_PATH = path.resolve('data/shorts/short_aqueducts/How_Rome_Conquered_Gravity_Short_9x16.mp4');
const PARENT_VIDEO_ID = 'MMSzLS6Lf3k';
const PARENT_URL = `https://www.youtube.com/watch?v=${PARENT_VIDEO_ID}`;

async function main() {
  console.log('=== Publishing Short #1 (Aqueducts) to YouTube ===');
  console.log(`Video File: ${SHORT_VIDEO_PATH}`);

  if (!fs.existsSync(SHORT_VIDEO_PATH)) {
    throw new Error(`Video file does not exist: ${SHORT_VIDEO_PATH}`);
  }

  const cm = new CredentialManager();
  await cm.initialize();
  const youtube = cm.getYouTubeClient();

  const title = "How Ancient Rome Conquered Gravity Without Electricity! 🏛️🌊 #shorts #history #engineering";
  const description = `Imagine hydrating over one million people thousands of years before electricity or modern pumps! Master builders dropped water less than an inch every 100 yards using pure gravity.\n\nWatch the full documentary on BunnyTales Studio:\n${PARENT_URL}\n\n#Shorts #AncientRome #Aqueducts #Engineering #History #BunnyTalesStudio`;
  const tags = ["Shorts", "Ancient Rome", "Aqueducts", "History", "Engineering", "Ancient Civilizations", "BunnyTales Studio"];

  console.log('Uploading Short #1 to YouTube...');
  const res = await youtube.videos.insert({
    part: 'snippet,status',
    requestBody: {
      snippet: {
        title,
        description,
        tags,
        categoryId: '27', // Education
        defaultLanguage: 'en'
      },
      status: {
        privacyStatus: 'public',
        selfDeclaredMadeForKids: false
      }
    },
    media: {
      mimeType: 'video/mp4',
      body: fs.createReadStream(SHORT_VIDEO_PATH)
    }
  });

  const shortId = res.data.id;
  const shortUrl = `https://www.youtube.com/shorts/${shortId}`;
  console.log(`\n🎉 SUCCESS! Short #1 published to YouTube:`);
  console.log(`- Video ID: ${shortId}`);
  console.log(`- Short URL: ${shortUrl}`);
  console.log(`- Privacy: ${res.data.status?.privacyStatus}`);

  // Post top comment with direct link to parent video
  console.log('\nPosting pinned comment with full episode link...');
  try {
    await youtube.commentThreads.insert({
      part: 'snippet',
      requestBody: {
        snippet: {
          videoId: shortId,
          topLevelComment: {
            snippet: {
              textOriginal: `🐰 Watch the full ancient engineering expedition here ➡️ ${PARENT_URL}`
            }
          }
        }
      }
    });
    console.log('✅ Comment posted successfully!');
  } catch (err) {
    console.log('Notice: Comment posting deferred:', err.message);
  }

  console.log('\n======================================================');
  console.log('📌 YOUTUBE STUDIO ACTION REQUIRED (2 CLICKS):');
  console.log(`1. Open this direct Studio link:`);
  console.log(`   https://studio.youtube.com/video/${shortId}/edit`);
  console.log(`2. Under "Related video", select:`);
  console.log(`   Episode #1 ("How Did Ancient Civilizations Supply Water to 1 Million People?")`);
  console.log(`3. Click "Save"`);
  console.log('======================================================\n');

  return { shortId, shortUrl };
}

main().catch(err => {
  console.error('Publishing failed:', err);
  process.exit(1);
});


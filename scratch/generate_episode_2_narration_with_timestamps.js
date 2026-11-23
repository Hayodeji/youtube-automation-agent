const fs = require('fs');
const path = require('path');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config({ override: true });

const API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'JBFqnCBsd6RMkjVDRZzb';
const MODEL_ID = 'eleven_turbo_v2_5';
const PRODUCTION_ID = 'prod_1795444208615_cn3e938zfm_pzdkmt0cgoo';
const AUDIO_DIR = path.resolve(`data/audio/scenes/${PRODUCTION_ID}`);

const SCRIPT_SCENES = [
  {
    index: 0,
    label: 'The Impossible Precision',
    text: "Imagine building a giant 480-foot stone mountain, and lining it up with true north almost perfectly—off by just a fraction of a hair! And doing it 4,500 years before GPS, before telescopes, and before compasses even existed! How on Earth did ancient builders pull off this impossible trick?"
  },
  {
    index: 1,
    label: 'Welcome to BunnyTales Studio',
    text: "Hey fellow explorers, I'm Bunny, and welcome back to BunnyTales Studio! Today, we're putting on our explorer goggles to solve one of the greatest ancient puzzles: how the builders of the Great Pyramid of Giza locked onto true north with 0.05-degree accuracy!"
  },
  {
    index: 2,
    label: 'The Compass Myth',
    text: "Now, your first guess might be: 'Easy, they just used a compass!' But hold your carrots—magnetic compasses weren't invented for another two thousand years! And even worse, magnetic north actually drifts around like a lost tourist. The Egyptians wanted true geographic north: the exact spin axis of planet Earth!"
  },
  {
    index: 3,
    label: 'The North Star Twist',
    text: "So you think: 'Okay, then they just looked up at the North Star, right?' Well, here's the plot twist: in 2500 BC, our North Star, Polaris, wasn't anywhere near north! Because Earth slowly wobbles like a spinning top, 4,500 years ago, true north was just an empty patch of dark sky. There was literally no star there to follow!"
  },
  {
    index: 4,
    label: 'The Celestial Secret',
    text: "So how did they find north without a guide star? Egyptologist Dr. Kate Spence uncovered their brilliant trick. Ancient astronomers noticed two bright stars circling on opposite sides of that empty pole: Kochab in the Little Dipper, and Mizar in the Big Dipper."
  },
  {
    index: 5,
    label: 'The Egyptian Merkhet',
    text: "Whenever those two stars lined up vertically in the night sky, the imaginary line between them cut straight through true north! An Egyptian surveyor held up a simple wooden viewing slot called a Merkhet, and dropped a weighted string called a plumb-line. When the string crossed both stars at once, BAM—true north was locked onto the ground!"
  },
  {
    index: 6,
    label: 'The Sun Check',
    text: "To double-check their line during the day, they used the sun! They built a smooth, circular mudbrick wall with a flat rim to create an artificial horizon. By marking where the sun rose and set over the wall, they cut the angle right down the middle to verify their line. Simple, but pure genius!"
  },
  {
    index: 7,
    label: 'Leveling the Foundation',
    text: "And how did they keep the pyramid's massive 13-acre foundation completely flat? No lasers needed! They dug crisscrossing trenches into the bedrock and flooded them with water. Because water always finds dead level, they marked the waterline, drained the water, and chiseled the stone down to the mark. A natural spirit level!"
  },
  {
    index: 8,
    label: 'The Precession Proof',
    text: "Here is the mind-blowing proof that this really happened: because Earth wobbles over centuries, those two stars slowly drifted. And when modern astronomers checked pyramids built by different pharaohs over time, their tiny alignment errors matched that exact celestial wobble! The stars left a receipt in the stone!"
  },
  {
    index: 9,
    label: 'Wrap-up and Outro',
    text: "No alien lasers, no lost futuristic tech—just sheer human curiosity, a piece of string, and the night sky. Could you have figured out true north with just two stars? Let me know in the comments below, hit that subscribe button for more adventures with Bunny, and keep exploring!"
  }
];

// Helper to split word list into natural, rhythmic subtitle phrases (3-6 words, ~25-35 chars max, respecting punctuation)
function groupWordsIntoSubtitles(words, sceneOffsetSeconds) {
  const subtitles = [];
  let currentGroup = [];
  let currentLength = 0;

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const endsWithPunctuation = /[.!?:;—,]$/.test(w.word);
    currentGroup.push(w);
    currentLength += w.word.length + 1;

    // Split if punctuation reached and we have at least 2 words, or if length exceeded 28 chars, or max 5 words
    const shouldSplit = (endsWithPunctuation && currentGroup.length >= 2) ||
                        (currentLength >= 28) ||
                        (currentGroup.length >= 5) ||
                        (i === words.length - 1);

    if (shouldSplit && currentGroup.length > 0) {
      const phraseText = currentGroup.map(item => item.word).join(' ');
      const start = currentGroup[0].start + sceneOffsetSeconds;
      const end = currentGroup[currentGroup.length - 1].end + sceneOffsetSeconds;
      subtitles.push({
        text: phraseText,
        start,
        end: Math.max(end, start + 0.5) // minimum duration 0.5s for readability
      });
      currentGroup = [];
      currentLength = 0;
    }
  }

  // Prevent gap flickers between consecutive subtitles within 0.2s
  for (let i = 0; i < subtitles.length - 1; i++) {
    if (subtitles[i + 1].start - subtitles[i].end < 0.2 && subtitles[i + 1].start > subtitles[i].end) {
      subtitles[i].end = subtitles[i + 1].start;
    }
  }

  return subtitles;
}

function formatSrtTimestamp(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

async function main() {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
  console.log(`Starting narration generation with timestamps for ${SCRIPT_SCENES.length} scenes...`);

  const results = [];
  let totalVideoDuration = 0;
  const allSubtitles = [];

  for (const scene of SCRIPT_SCENES) {
    console.log(`\nGenerating Scene ${scene.index}: "${scene.label}"...`);
    const outputPath = path.join(AUDIO_DIR, `scene_${scene.index}.mp3`);
    const timestampJsonPath = path.join(AUDIO_DIR, `scene_${scene.index}_alignment.json`);

    const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/with-timestamps`;
    const res = await axios.post(url, {
      text: scene.text,
      model_id: MODEL_ID,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.8,
        style: 0.15,
        use_speaker_boost: true
      }
    }, {
      headers: {
        'xi-api-key': API_KEY,
        'Content-Type': 'application/json'
      }
    });

    const audioBuffer = Buffer.from(res.data.audio_base64, 'base64');
    fs.writeFileSync(outputPath, audioBuffer);
    fs.writeFileSync(timestampJsonPath, JSON.stringify(res.data.alignment, null, 2));

    // Parse characters into words
    const chars = res.data.alignment.characters;
    const starts = res.data.alignment.character_start_times_seconds;
    const ends = res.data.alignment.character_end_times_seconds;

    const words = [];
    let currentWord = '';
    let wordStart = null;
    let wordEnd = null;

    for (let i = 0; i < chars.length; i++) {
      const c = chars[i];
      if (/\S/.test(c)) {
        if (wordStart === null) wordStart = starts[i];
        wordEnd = ends[i];
        currentWord += c;
      } else if (currentWord) {
        words.push({ word: currentWord, start: wordStart, end: wordEnd });
        currentWord = '';
        wordStart = null;
        wordEnd = null;
      }
    }
    if (currentWord) words.push({ word: currentWord, start: wordStart, end: wordEnd });

    // Scene duration from audio or end of last word (+0.4s natural breathing tail)
    const lastWordEnd = words.length ? words[words.length - 1].end : 10;
    const sceneDuration = parseFloat((lastWordEnd + 0.4).toFixed(3));

    console.log(`Scene ${scene.index} audio saved: ${(audioBuffer.length / 1024).toFixed(1)} KB, duration: ${sceneDuration}s, words: ${words.length}`);

    // Generate precision subtitles for this scene
    const sceneSubs = groupWordsIntoSubtitles(words, totalVideoDuration);
    allSubtitles.push(...sceneSubs);

    results.push({
      index: scene.index,
      label: scene.label,
      text: scene.text,
      audioPath: outputPath,
      duration: sceneDuration,
      wordsCount: words.length
    });

    totalVideoDuration += sceneDuration;
  }

  // Write SRT file
  const captionsDir = path.resolve('data/captions');
  fs.mkdirSync(captionsDir, { recursive: true });
  const srtPath = path.join(captionsDir, `${PRODUCTION_ID}_precision.srt`);

  let srtContent = '';
  allSubtitles.forEach((sub, i) => {
    srtContent += `${i + 1}\n`;
    srtContent += `${formatSrtTimestamp(sub.start)} --> ${formatSrtTimestamp(sub.end)}\n`;
    srtContent += `${sub.text}\n\n`;
  });

  fs.writeFileSync(srtPath, srtContent, 'utf8');
  console.log(`\nGenerated master SRT with ${allSubtitles.length} precision subtitle cues: ${srtPath}`);
  console.log(`Total narration runtime: ${totalVideoDuration.toFixed(2)} seconds (${Math.floor(totalVideoDuration / 60)}m ${Math.floor(totalVideoDuration % 60)}s)`);

  // Write scene summary json
  fs.writeFileSync(path.join(AUDIO_DIR, 'narration_manifest.json'), JSON.stringify({
    productionId: PRODUCTION_ID,
    totalDuration: totalVideoDuration,
    scenes: results,
    subtitlesCount: allSubtitles.length,
    srtPath
  }, null, 2));

  console.log('Narration generation complete!');
}

main().catch(err => {
  console.error('Fatal error generating narration:', err.response?.data || err.message);
  process.exit(1);
});


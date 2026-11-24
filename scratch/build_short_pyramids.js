const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { spawnSync } = require('child_process');
const dotenv = require('dotenv');
const { getFFmpegPath } = require('../utils/ffmpeg');

dotenv.config({ override: true });

const FFMPEG = getFFmpegPath();
const API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'JBFqnCBsd6RMkjVDRZzb';
const MODEL_ID = 'eleven_turbo_v2_5';

const OUTPUT_DIR = path.resolve('data/shorts/short_pyramids');
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const BEATS = [
  {
    id: 'beat_0_hook',
    label: 'The Visceral Hook',
    text: "Look at this alignment—it is off by just a hair! And ancient builders did it without a compass or GPS!",
    badge: "0.05° ACCURACY. NO COMPASS?!",
    image: path.resolve('data/assets/pyramid_scene_0.jpg')
  },
  {
    id: 'beat_1_twist',
    label: 'The Cosmic Twist',
    text: "And they couldn't just follow the North Star either—because 4,500 years ago, Polaris wasn't in the north!",
    badge: "POLARIS WAS MISSING!",
    image: path.resolve('data/assets/pyramid_scene_3.jpg')
  },
  {
    id: 'beat_2_reveal',
    label: 'The Clever Reveal',
    text: "Instead, they watched two opposite stars circle the pole. When they lined up vertically, an Egyptian surveyor dropped a weighted string—locking True North onto the sand with absolute perfection.",
    badge: "2 STARS + 1 STRING = TRUE NORTH",
    image: path.resolve('data/assets/pyramid_scene_5.jpg')
  },
  {
    id: 'beat_3_cta',
    label: 'The Open Loop & CTA',
    text: "Wait until you see how they leveled 13 acres of rock using just water—tap the related video right here above my name to watch the full expedition! Because...",
    badge: "TAP BELOW FOR WATER SECRET 👇",
    image: path.resolve('data/assets/pyramid_scene_9.jpg')
  }
];

function formatSrtTimestamp(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

function groupWordsIntoSubtitles(words, offset) {
  const subtitles = [];
  let currentGroup = [];
  let currentLen = 0;

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const endsWithPunct = /[.!?:;—,]$/.test(w.word);
    currentGroup.push(w);
    currentLen += w.word.length + 1;

    const shouldSplit = (endsWithPunct && currentGroup.length >= 2) ||
                        (currentLen >= 20) ||
                        (currentGroup.length >= 4) ||
                        (i === words.length - 1);

    if (shouldSplit && currentGroup.length > 0) {
      const phrase = currentGroup.map(item => item.word).join(' ');
      const start = currentGroup[0].start + offset;
      const end = currentGroup[currentGroup.length - 1].end + offset;
      subtitles.push({
        text: phrase.toUpperCase(),
        start,
        end: Math.max(end, start + 0.45)
      });
      currentGroup = [];
      currentLen = 0;
    }
  }

  // Smooth small gaps
  for (let i = 0; i < subtitles.length - 1; i++) {
    if (subtitles[i + 1].start - subtitles[i].end < 0.15 && subtitles[i + 1].start > subtitles[i].end) {
      subtitles[i].end = subtitles[i + 1].start;
    }
  }

  return subtitles;
}

function getAudioDuration(filePath, lastCharEnd) {
  const res = spawnSync(FFMPEG, ['-i', filePath], { encoding: 'utf8' });
  const match = (res.stderr || '').match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
  if (match) {
    return parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseFloat(match[3]);
  }
  return lastCharEnd || 6.0;
}

async function main() {
  console.log('=== STEP 1: Generating Snappy Short Narration with Timestamps ===');
  let currentTimeline = 0;
  const audioFiles = [];
  const beatDurations = [];
  const allSubtitles = [];

  for (let i = 0; i < BEATS.length; i++) {
    const beat = BEATS[i];
    console.log(`Generating Beat ${i}: ${beat.label}...`);
    const audioPath = path.join(OUTPUT_DIR, `${beat.id}.mp3`);
    const alignPath = path.join(OUTPUT_DIR, `${beat.id}_align.json`);

    let alignment;
    if (fs.existsSync(audioPath) && fs.existsSync(alignPath)) {
      console.log(`Using cached audio: ${audioPath}`);
      alignment = JSON.parse(fs.readFileSync(alignPath, 'utf8'));
    } else {
      const res = await axios.post(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/with-timestamps`, {
        text: beat.text,
        model_id: MODEL_ID,
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.85,
          style: 0.25,
          use_speaker_boost: true
        }
      }, {
        headers: {
          'xi-api-key': API_KEY,
          'Content-Type': 'application/json'
        }
      });

      const audioBuffer = Buffer.from(res.data.audio_base64, 'base64');
      fs.writeFileSync(audioPath, audioBuffer);
      fs.writeFileSync(alignPath, JSON.stringify(res.data.alignment, null, 2));
      alignment = res.data.alignment;
    }

    const chars = alignment.characters;
    const starts = alignment.character_start_times_seconds;
    const ends = alignment.character_end_times_seconds;
    const lastCharEnd = ends.length ? ends[ends.length - 1] : 6.0;

    const duration = getAudioDuration(audioPath, lastCharEnd);
    beatDurations.push(duration);
    audioFiles.push(audioPath);

    // Extract words
    const words = [];
    let curWord = '';
    let wStart = null;
    let wEnd = null;

    for (let j = 0; j < chars.length; j++) {
      const c = chars[j];
      if (/\S/.test(c)) {
        if (wStart === null) wStart = starts[j];
        wEnd = ends[j];
        curWord += c;
      } else if (curWord) {
        words.push({ word: curWord, start: wStart, end: wEnd });
        curWord = '';
        wStart = null;
      }
    }
    if (curWord) words.push({ word: curWord, start: wStart, end: wEnd });

    const beatSubs = groupWordsIntoSubtitles(words, currentTimeline);
    allSubtitles.push(...beatSubs);
    currentTimeline += duration;
  }

  console.log(`\nTotal Short duration: ${currentTimeline.toFixed(2)} seconds across ${BEATS.length} beats`);

  // Concatenate audio tracks
  const concatListPath = path.join(OUTPUT_DIR, 'audio_concat.txt');
  fs.writeFileSync(concatListPath, audioFiles.map(f => `file '${f}'`).join('\n'));
  const combinedAudioPath = path.join(OUTPUT_DIR, 'short_narration_mix.mp3');
  spawnSync(FFMPEG, ['-y', '-f', 'concat', '-safe', '0', '-i', concatListPath, '-c', 'copy', combinedAudioPath]);

  // Generate Master SRT file
  const srtPath = path.join(OUTPUT_DIR, 'short_precision.srt');
  let srtContent = '';
  allSubtitles.forEach((cue, index) => {
    srtContent += `${index + 1}\n${formatSrtTimestamp(cue.start)} --> ${formatSrtTimestamp(cue.end)}\n${cue.text}\n\n`;
  });
  fs.writeFileSync(srtPath, srtContent);
  console.log(`Generated ${allSubtitles.length} precision subtitle cues: ${srtPath}`);

  // Build each video beat segment in 9:16 (1080x1920)
  console.log('\n=== STEP 2: Building 9:16 Visual Segments with Kinetic Framing ===');
  const segmentFiles = [];

  for (let i = 0; i < BEATS.length; i++) {
    const beat = BEATS[i];
    const duration = beatDurations[i];
    const segPath = path.join(OUTPUT_DIR, `seg_${i}.mp4`);

    // In 9:16 (1080x1920):
    // Background: Blurred ambient scale filling 1080x1920
    // Foreground: 1080x1080 centered crop of scene image with smooth zoom
    const badgeText = beat.badge.replace(/'/g, "\\'");
    
    // Beat 3 (CTA): Add pointer arrow text at lower-left (y=1400, x=100)
    let extraDrawtext = '';
    if (i === 3) {
      extraDrawtext = `,drawtext=text='👇 WATCH FULL VIDEO':fontcolor=yellow:fontsize=48:box=1:boxcolor=black@0.85:boxborderw=18:x=100:y=1400:enable='gte(t,1.0)'`;
    }

    const filter = `[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=24:3[bg];[0:v]scale=1080:1080:force_original_aspect_ratio=increase,crop=1080:1080,zoompan=z='min(zoom+0.0006,1.08)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1080:fps=30[fg];[bg][fg]overlay=0:420[comp];[comp]drawtext=text='${badgeText}':fontcolor=white:fontsize=44:box=1:boxcolor=black@0.8:boxborderw=16:x=(w-text_w)/2:y=280${extraDrawtext}[v]`;

    const res = spawnSync(FFMPEG, [
      '-y',
      '-loop', '1',
      '-t', String(duration),
      '-i', beat.image,
      '-i', audioFiles[i],
      '-filter_complex', filter,
      '-map', '[v]',
      '-map', '1:a',
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-shortest',
      segPath
    ]);

    if (res.status !== 0) {
      console.error(`Error rendering segment ${i}:`, res.stderr?.toString());
      throw new Error(`FFmpeg segment ${i} failed`);
    }
    console.log(`Rendered segment ${i} (${duration.toFixed(2)}s): ${segPath}`);
    segmentFiles.push(segPath);
  }

  // Concatenate all 4 segments into continuous Short
  console.log('\n=== STEP 3: Concatenating and Burning Center-Screen Captions ===');
  const videoConcatList = path.join(OUTPUT_DIR, 'video_concat.txt');
  fs.writeFileSync(videoConcatList, segmentFiles.map(f => `file '${f}'`).join('\n'));
  const rawShortPath = path.join(OUTPUT_DIR, 'short_raw.mp4');
  spawnSync(FFMPEG, ['-y', '-f', 'concat', '-safe', '0', '-i', videoConcatList, '-c', 'copy', rawShortPath]);

  // Burn in high-contrast centered captions (FontSize=22, MarginV=360, lower center safe zone)
  const finalBurnedPath = path.join(OUTPUT_DIR, 'short_pyramids_final_9x16.mp4');
  const escapedSrt = srtPath.replace(/\\/g, '/').replace(/:/g, '\\:');
  const subtitleFilter = `subtitles='${escapedSrt}':force_style='FontName=Arial,FontSize=22,Bold=1,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=3.5,Shadow=1,Alignment=2,MarginV=360'`;

  const burnRes = spawnSync(FFMPEG, [
    '-y',
    '-i', rawShortPath,
    '-vf', subtitleFilter,
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '20',
    '-c:a', 'copy',
    finalBurnedPath
  ]);

  if (burnRes.status !== 0) {
    console.error('Subtitle burning failed:', burnRes.stderr?.toString());
    throw new Error('Subtitle burn failed');
  }

  const probeRes = spawnSync(FFMPEG, ['-i', finalBurnedPath], { encoding: 'utf8' });
  const durMatch = (probeRes.stderr || '').match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
  const durSec = durMatch ? parseInt(durMatch[1]) * 3600 + parseInt(durMatch[2]) * 60 + parseFloat(durMatch[3]) : 'unknown';
  const stats = fs.statSync(finalBurnedPath);

  console.log('\n🎉 SUCCESS! Vertical 9:16 Short Generated:');
  console.log(`- Path: ${finalBurnedPath}`);
  console.log(`- Duration: ${durSec}s`);
  console.log(`- Size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

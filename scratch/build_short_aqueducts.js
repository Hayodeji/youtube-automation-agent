const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { getFFmpegPath } = require('../utils/ffmpeg');

const FFMPEG = getFFmpegPath();
const AUDIO_DIR = path.resolve('data/audio/scenes/prod_1795219223739_9qv1ks9fhh_pqfac4enb4l');
const ASSETS_DIR = path.resolve('data/scene-assets/prod_1795219223739_9qv1ks9fhh_pqfac4enb4l');
const OUTPUT_DIR = path.resolve('data/shorts/short_aqueducts');

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function formatAssTimestamp(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const cs = Math.floor((seconds % 1) * 100);
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

async function main() {
  console.log('=== STEP 1: Slicing Master Studio Audio for Short #1 ===');

  const CUTS = [
    {
      id: 'beat_0',
      sourceAudio: path.join(AUDIO_DIR, '000_r2.mp3'),
      startSec: 0.0,
      endSec: 9.20,
      badge: '1 MILLION PEOPLE. NO PUMPS?!',
      image: path.join(ASSETS_DIR, 'bunny_scene_0.jpg'),
      subtitles: [
        { text: 'IMAGINE LIVING IN AN ANCIENT METROPOLIS', start: 0.0, end: 3.2 },
        { text: 'OF OVER ONE MILLION PEOPLE', start: 3.2, end: 5.5 },
        { text: 'BEFORE ELECTRICITY OR MODERN PUMPS!', start: 5.5, end: 9.2 }
      ]
    },
    {
      id: 'beat_1',
      sourceAudio: path.join(AUDIO_DIR, '004_r2.mp3'),
      startSec: 0.0,
      endSec: 8.80,
      badge: 'CONQUERING GRAVITY WITH STONE',
      image: path.join(ASSETS_DIR, 'bunny_scene_4.jpg'),
      subtitles: [
        { text: 'THEN CAME THE MASTERPIECE OF PHYSICS:', start: 0.0, end: 3.8 },
        { text: 'THE MONUMENTAL ROMAN AQUEDUCT!', start: 3.8, end: 8.8 }
      ]
    },
    {
      id: 'beat_2',
      sourceAudio: path.join(AUDIO_DIR, '004_r2.mp3'),
      startSec: 8.80,
      endSec: 18.20,
      badge: 'DROPPING 1 INCH EVERY 100 YARDS!',
      image: path.join(ASSETS_DIR, 'bunny_scene_5.jpg'),
      subtitles: [
        { text: 'USING NOTHING BUT PURE GRAVITY', start: 0.0, end: 3.2 },
        { text: 'DROPPING LESS THAN AN INCH EVERY 100 YARDS', start: 3.2, end: 6.8 },
        { text: 'WATER FLOWED CONTINUOUSLY ACROSS MOUNTAINS!', start: 6.8, end: 9.4 }
      ]
    },
    {
      id: 'beat_3',
      sourceAudio: path.join(AUDIO_DIR, '008_r2.mp3'),
      startSec: 0.0,
      endSec: 8.50,
      badge: 'STILL WORKING AFTER 2,000 YEARS!',
      image: path.join(ASSETS_DIR, 'bunny_scene_9.jpg'),
      subtitles: [
        { text: 'SOME ARE STILL DELIVERING FRESH WATER', start: 0.0, end: 4.2 },
        { text: 'TO PUBLIC FOUNTAINS 2,000 YEARS LATER!', start: 4.2, end: 8.5 }
      ]
    }
  ];

  let currentTimeline = 0;
  const audioSlices = [];
  const beatDurations = [];
  const allSubtitles = [];
  const badges = [];

  for (let i = 0; i < CUTS.length; i++) {
    const cut = CUTS[i];
    const duration = cut.endSec - cut.startSec;
    const sliceAudioPath = path.join(OUTPUT_DIR, `${cut.id}_slice.mp3`);

    console.log(`Processing Beat ${i}: ${cut.id} (${duration.toFixed(2)}s)...`);

    spawnSync(FFMPEG, [
      '-y',
      '-ss', String(cut.startSec),
      '-t', String(duration),
      '-i', cut.sourceAudio,
      '-af', `afade=t=in:ss=0:d=0.04,afade=t=out:st=${(duration - 0.05).toFixed(2)}:d=0.04`,
      '-c:a', 'libmp3lame',
      '-b:a', '192k',
      sliceAudioPath
    ]);

    audioSlices.push(sliceAudioPath);
    beatDurations.push(duration);

    badges.push({
      text: cut.badge,
      start: currentTimeline,
      end: currentTimeline + duration
    });

    cut.subtitles.forEach(s => {
      allSubtitles.push({
        text: s.text,
        start: s.start + currentTimeline,
        end: s.end + currentTimeline
      });
    });

    currentTimeline += duration;
  }

  console.log(`\nTotal Short Duration: ${currentTimeline.toFixed(2)} seconds`);

  // Build ASS Subtitles
  const assPath = path.join(OUTPUT_DIR, 'short_aqueducts.ass');
  let assContent = `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: TopBadge,Arial,42,&H00FFFFFF,&H000000FF,&H00000000,&H85000000,-1,0,0,0,100,100,0,0,3,14,0,8,40,40,260,1
Style: MainDialogue,Arial,52,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,5,2,2,60,60,460,1
Style: LowerLeftCTA,Arial,42,&H0000FFFF,&H000000FF,&H00000000,&HA0000000,-1,0,0,0,100,100,0,0,3,14,0,1,80,60,340,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  badges.forEach(b => {
    assContent += `Dialogue: 0,${formatAssTimestamp(b.start)},${formatAssTimestamp(b.end)},TopBadge,,0,0,0,,${b.text}\n`;
  });

  allSubtitles.forEach(s => {
    assContent += `Dialogue: 1,${formatAssTimestamp(s.start)},${formatAssTimestamp(s.end)},MainDialogue,,0,0,0,,${s.text}\n`;
  });

  const ctaStart = currentTimeline - 6.0;
  assContent += `Dialogue: 2,${formatAssTimestamp(ctaStart)},${formatAssTimestamp(currentTimeline)},LowerLeftCTA,,0,0,0,,👇 TAP RELATED VIDEO FOR FULL STORY\n`;

  fs.writeFileSync(assPath, assContent);
  console.log(`Generated styled ASS subtitles: ${assPath}`);

  // Build 9:16 Video Segments
  console.log('\n=== STEP 2: Building 9:16 Visual Segments with 3D Bunny ===');
  const segmentFiles = [];

  for (let i = 0; i < CUTS.length; i++) {
    const cut = CUTS[i];
    const duration = beatDurations[i];
    const segPath = path.join(OUTPUT_DIR, `${cut.id}_video.mp4`);

    const filter = `[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=24:3[bg];[0:v]scale=1080:1080:force_original_aspect_ratio=increase,crop=1080:1080,zoompan=z='min(zoom+0.0006,1.06)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1080:fps=30[fg];[bg][fg]overlay=0:420[v]`;

    const res = spawnSync(FFMPEG, [
      '-y',
      '-loop', '1',
      '-t', String(duration),
      '-i', cut.image,
      '-i', audioSlices[i],
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

    segmentFiles.push(segPath);
    console.log(`Rendered segment ${i} (${duration.toFixed(2)}s)`);
  }

  // Concatenate segments
  console.log('\n=== STEP 3: Concatenating Segments and Burning Centered Subtitles ===');
  const concatTxt = path.join(OUTPUT_DIR, 'segments_list.txt');
  fs.writeFileSync(concatTxt, segmentFiles.map(f => `file '${f}'`).join('\n'));
  const rawPath = path.join(OUTPUT_DIR, 'short_raw_concat.mp4');
  const concatRes = spawnSync(FFMPEG, ['-y', '-f', 'concat', '-safe', '0', '-i', concatTxt, '-c', 'copy', rawPath]);

  if (concatRes.status !== 0) {
    console.error('Concat failed:', concatRes.stderr?.toString());
    throw new Error('Concat failed');
  }

  const finalShortPath = path.join(OUTPUT_DIR, 'How_Rome_Conquered_Gravity_Short_9x16.mp4');
  const escapedAss = assPath.replace(/\\/g, '/').replace(/:/g, '\\:');
  const subtitleFilter = `subtitles='${escapedAss}'`;

  const burn = spawnSync(FFMPEG, [
    '-y',
    '-i', rawPath,
    '-vf', subtitleFilter,
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '20',
    '-c:a', 'copy',
    finalShortPath
  ]);

  if (burn.status !== 0) {
    console.error('Subtitle burning failed:', burn.stderr?.toString());
    throw new Error('Burn failed');
  }

  const stat = fs.statSync(finalShortPath);
  console.log('\n🎉 SUCCESS! Master Vertical 9:16 Short Created:');
  console.log(`- Path: ${finalShortPath}`);
  console.log(`- Size: ${(stat.size / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`- Duration: ${currentTimeline.toFixed(2)}s`);
}

main().catch(console.error);


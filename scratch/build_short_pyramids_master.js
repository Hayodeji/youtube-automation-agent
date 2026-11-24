const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { getFFmpegPath } = require('../utils/ffmpeg');

const FFMPEG = getFFmpegPath();
const AUDIO_DIR = path.resolve('data/audio/scenes/prod_1795444208615_cn3e938zfm_pzdkmt0cgoo');
const ASSETS_DIR = path.resolve('data/assets');
const OUTPUT_DIR = path.resolve('data/shorts/short_pyramids');

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function formatAssTimestamp(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const cs = Math.floor((seconds % 1) * 100);
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

function extractWords(alignJsonPath, startCut, endCut) {
  const data = JSON.parse(fs.readFileSync(alignJsonPath, 'utf8'));
  const chars = data.characters;
  const starts = data.character_start_times_seconds;
  const ends = data.character_end_times_seconds;

  const words = [];
  let curWord = '';
  let wStart = null;
  let wEnd = null;

  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    if (/\S/.test(c)) {
      if (wStart === null) wStart = starts[i];
      wEnd = ends[i];
      curWord += c;
    } else if (curWord) {
      if (wStart >= startCut - 0.1 && wEnd <= endCut + 0.1) {
        words.push({ word: curWord, start: Math.max(0, wStart - startCut), end: Math.max(0, wEnd - startCut) });
      }
      curWord = '';
      wStart = null;
    }
  }
  if (curWord && wStart >= startCut - 0.1 && wEnd <= endCut + 0.1) {
    words.push({ word: curWord, start: Math.max(0, wStart - startCut), end: Math.max(0, wEnd - startCut) });
  }
  return words;
}

function groupIntoSubtitles(words, offset) {
  const subs = [];
  let grp = [];
  let curLen = 0;

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const punct = /[.!?:;—,]$/.test(w.word);
    grp.push(w);
    curLen += w.word.length + 1;

    const shouldSplit = (punct && grp.length >= 2) ||
                        (curLen >= 20) ||
                        (grp.length >= 4) ||
                        (i === words.length - 1);

    if (shouldSplit && grp.length > 0) {
      const text = grp.map(x => x.word).join(' ').toUpperCase();
      const s = grp[0].start + offset;
      const e = grp[grp.length - 1].end + offset;
      subs.push({ text, start: s, end: Math.max(e, s + 0.45) });
      grp = [];
      curLen = 0;
    }
  }

  // Smooth gaps
  for (let i = 0; i < subs.length - 1; i++) {
    if (subs[i + 1].start - subs[i].end < 0.15 && subs[i + 1].start > subs[i].end) {
      subs[i].end = subs[i + 1].start;
    }
  }
  return subs;
}

async function main() {
  console.log('=== STEP 1: Slicing Master Studio Audio ===');

  const CUTS = [
    {
      id: 'beat_0',
      sourceAudio: path.join(AUDIO_DIR, 'scene_0.mp3'),
      alignJson: path.join(AUDIO_DIR, 'scene_0_alignment.json'),
      startSec: 0.0,
      endSec: 8.85,
      badge: '0.05° ACCURACY. NO COMPASS?!',
      image: path.join(ASSETS_DIR, 'pyramid_scene_0.jpg')
    },
    {
      id: 'beat_1',
      sourceAudio: path.join(AUDIO_DIR, 'scene_3.mp3'),
      alignJson: path.join(AUDIO_DIR, 'scene_3_alignment.json'),
      startSec: 4.45,
      endSec: 11.90,
      badge: 'NO NORTH STAR IN 2500 BC!',
      image: path.join(ASSETS_DIR, 'pyramid_scene_3.jpg')
    },
    {
      id: 'beat_2',
      sourceAudio: path.join(AUDIO_DIR, 'scene_5.mp3'),
      alignJson: path.join(AUDIO_DIR, 'scene_5_alignment.json'),
      startSec: 0.0,
      endSec: 12.10,
      badge: '2 STARS + 1 STRING = TRUE NORTH',
      image: path.join(ASSETS_DIR, 'pyramid_scene_5.jpg')
    },
    {
      id: 'beat_3',
      sourceAudio: path.join(AUDIO_DIR, 'scene_7.mp3'),
      alignJson: path.join(AUDIO_DIR, 'scene_7_alignment.json'),
      startSec: 0.0,
      endSec: 6.80,
      badge: 'THE WATER SECRET',
      image: path.join(ASSETS_DIR, 'pyramid_scene_9.jpg')
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

    const words = extractWords(cut.alignJson, cut.startSec, cut.endSec);
    const subs = groupIntoSubtitles(words, currentTimeline);
    allSubtitles.push(...subs);

    currentTimeline += duration;
  }

  console.log(`\nTotal Short Duration: ${currentTimeline.toFixed(2)} seconds`);

  // Build ASS Subtitle File with 3 Distinct Layers (Badges, Dialogue, CTA)
  const assPath = path.join(OUTPUT_DIR, 'short_pyramids.ass');
  let assContent = `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: TopBadge,Arial,42,&H00FFFFFF,&H000000FF,&H00000000,&H85000000,-1,0,0,0,100,100,0,0,3,14,0,8,40,40,260,1
Style: MainDialogue,Arial,54,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,5,2,2,60,60,460,1
Style: LowerLeftCTA,Arial,42,&H0000FFFF,&H000000FF,&H00000000,&HA0000000,-1,0,0,0,100,100,0,0,3,14,0,1,80,60,340,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  // Add Top Badges
  badges.forEach(b => {
    assContent += `Dialogue: 0,${formatAssTimestamp(b.start)},${formatAssTimestamp(b.end)},TopBadge,,0,0,0,,${b.text}\n`;
  });

  // Add Main Dialogue
  allSubtitles.forEach(s => {
    assContent += `Dialogue: 1,${formatAssTimestamp(s.start)},${formatAssTimestamp(s.end)},MainDialogue,,0,0,0,,${s.text}\n`;
  });

  // Add Lower-Left CTA on final beat
  const ctaStart = currentTimeline - 6.0;
  assContent += `Dialogue: 2,${formatAssTimestamp(ctaStart)},${formatAssTimestamp(currentTimeline)},LowerLeftCTA,,0,0,0,,👇 TAP RELATED VIDEO FOR FULL STORY\n`;

  fs.writeFileSync(assPath, assContent);
  console.log(`Generated styled ASS subtitles: ${assPath}`);

  // Build 9:16 Video Segments (no drawtext, 100% stable filters)
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

  // Burn in ASS subtitles
  const finalShortPath = path.join(OUTPUT_DIR, 'How_Egyptians_Aligned_The_Pyramids_Short_9x16.mp4');
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

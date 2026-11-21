const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { runFFmpeg, getMediaDuration } = require('../utils/ffmpeg');

const PRODUCTION_ID = 'prod_1795219223739_9qv1ks9fhh_pqfac4enb4l';
const inputVideo = path.resolve('data/videos/prod_1795219223739_9qv1ks9fhh_pqfac4enb4l_repair_1795253126241.mp4');
const captionsPath = path.resolve('data/captions/prod_1795219223739_9qv1ks9fhh_pqfac4enb4l_repair_1795253126241.srt');
const outputVideo = path.resolve('data/videos/prod_1795219223739_9qv1ks9fhh_pqfac4enb4l_burned_subtitles.mp4');

async function burnSubtitles() {
  console.log('Burning subtitles onto video...');
  console.log('Input:', inputVideo);
  console.log('Captions:', captionsPath);
  console.log('Output:', outputVideo);

  const escapedCaptions = captionsPath
    .replaceAll('\\', '/')
    .replace(':', '\\:')
    .replaceAll("'", "\\'");

  const subtitleFilter = `subtitles='${escapedCaptions}':force_style='FontName=DejaVu Sans,FontSize=22,Bold=1,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=2.5,Shadow=1.5,Alignment=2,MarginV=55'`;

  const args = [
    '-y',
    '-i', inputVideo,
    '-vf', subtitleFilter,
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '22',
    '-c:a', 'copy',
    outputVideo
  ];

  console.log('Running FFmpeg...');
  await runFFmpeg(args);

  const stats = fs.statSync(outputVideo);
  const duration = await getMediaDuration(outputVideo);
  console.log(`Video created successfully: ${stats.size} bytes, duration: ${duration.toFixed(2)}s`);

  // Update production assets in SQLite
  const db = new sqlite3.Database('data/youtube_automation.db');
  
  await new Promise((resolve, reject) => {
    db.get('SELECT assets FROM productions WHERE id = ?', [PRODUCTION_ID], (err, row) => {
      if (err) return reject(err);
      const assets = JSON.parse(row.assets || '{}');
      assets.finalVideo = {
        ...assets.finalVideo,
        path: outputVideo,
        previousPath: inputVideo,
        fileSize: stats.size,
        duration: duration,
        subtitlesBurned: true
      };
      
      db.run('UPDATE productions SET assets = ? WHERE id = ?', [JSON.stringify(assets), PRODUCTION_ID], err => {
        if (err) return reject(err);
        resolve();
      });
    });
  });

  // Update schedule metadata if scheduled
  await new Promise((resolve, reject) => {
    db.get('SELECT id, metadata FROM publish_schedule WHERE production_id = ?', [PRODUCTION_ID], (err, row) => {
      if (err || !row) return resolve();
      const metadata = JSON.parse(row.metadata || '{}');
      if (metadata.video) {
        metadata.video.path = outputVideo;
        metadata.video.fileSize = stats.size;
        metadata.video.duration = duration;
        metadata.video.subtitlesBurned = true;
      }
      db.run('UPDATE publish_schedule SET metadata = ? WHERE id = ?', [JSON.stringify(metadata), row.id], err => {
        if (err) return reject(err);
        resolve();
      });
    });
  });

  db.close();
  console.log('Database updated successfully with burned-in subtitle video!');
}

burnSubtitles().catch(err => {
  console.error('Error burning subtitles:', err);
  process.exit(1);
});


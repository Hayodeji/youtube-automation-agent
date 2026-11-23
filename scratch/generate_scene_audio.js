const path = require('path');
const fs = require('fs');
require('dotenv').config({ override: true });
const { AIVideoGenerator } = require('../utils/ai-video-generator');

const scenes = [
  {
    index: 0,
    text: "Over 4,500 years ago, ancient Egyptian builders aligned the Great Pyramid of Giza to true north within one-twentieth of a single degree. They had no compass, no telescope, and no GPS. So how on Earth did they achieve this impossible precision?"
  },
  {
    index: 1,
    text: "Welcome back, fellow explorers, to BunnyTales Studio! Today, we are uncovering one of the greatest engineering marvels in human history: the secret celestial alignment of the Great Pyramids."
  },
  {
    index: 2,
    text: "First, forget about compasses. Magnetic compasses were not invented for another two thousand years! Even worse, magnetic north wanders constantly, but the pyramids point directly to true geographic north: the exact spin axis of our planet."
  },
  {
    index: 3,
    text: "You might think they just used the North Star, Polaris. But here is the twist: in 2500 BC, Polaris was not the north star at all! Because of Earth's slow 26,000-year axial wobble, there was no bright star at true celestial north."
  },
  {
    index: 4,
    text: "So how did they do it? Cambridge Egyptologist Dr. Kate Spence discovered their ingenious secret: the Simultaneous Transit Method. Ancient astronomers tracked two bright stars on opposite sides of the celestial pole: Kochab in the Little Dipper, and Mizar in the Big Dipper."
  },
  {
    index: 5,
    text: "The royal surveyor used a simple instrument called a Merkhet, a narrow wooden viewing slot, and a weighted plumb-line. They waited until Kochab and Mizar aligned perfectly vertical with the string. In that exact split second, that vertical line pointed straight at true north!"
  },
  {
    index: 6,
    text: "By day, they double-checked their line using the sun. They built a circular mudbrick wall with a flat, leveled top. As the sun rose and set, they marked where its shadows crossed the wall, bisecting the angle for true solar north."
  },
  {
    index: 7,
    text: "To ensure the entire thirteen-acre foundation was flat, they dug crisscrossing rock channels and flooded them with water. Once the water settled, it created an optical level accurate to within half an inch across the entire site."
  },
  {
    index: 8,
    text: "Here is the mind-blowing proof: over centuries, Earth's wobble slowly shifted those stars. And the Great Pyramid of Khufu, Khafre, and Menkaure deviate by tiny fractions that match the exact mathematical star drift over their construction years!"
  },
  {
    index: 9,
    text: "No alien technology, just sheer human genius, string, and stars. Do you think modern architects could build this without digital tools? Tell us your theory in the comments, hit subscribe to join our BunnyTales expeditions, and we will see you in the next adventure!"
  }
];

async function main() {
  const vg = new AIVideoGenerator();
  const dir = path.join(__dirname, '../data/audio/scenes/prod_1795444208615_cn3e938zfm_pzdkmt0cgoo');
  fs.mkdirSync(dir, { recursive: true });

  console.log(`Generating audio for ${scenes.length} scenes using ElevenLabs...`);
  for (const s of scenes) {
    const audioPath = path.join(dir, `scene_${s.index}.mp3`);
    console.log(`[Scene ${s.index}] Generating TTS: "${s.text.slice(0, 50)}..."`);
    await vg.generateTTSAudio(s.text, audioPath);
    console.log(`[Scene ${s.index}] Done! File size: ${fs.statSync(audioPath).size} bytes`);
  }
  console.log('All scene audio generated successfully!');
}

main().catch(console.error);


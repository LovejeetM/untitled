// test-render.js
const fs = require('fs');
const path = require('path');
const { generateSlideImage, closeBrowser } = require('./slide');

const ROOT = path.join(__dirname, './');
const TEMPLATES_DIR = path.join(ROOT, './templates');
const MANIFEST = require(path.join(ROOT, './manifest.json'));

function loadTemplate(name) {
  const tplInfo = MANIFEST.templates[name];
  if (!tplInfo) throw new Error(`Template "${name}" not found`);
  const filePath = path.join(TEMPLATES_DIR, tplInfo.file);
  return fs.readFileSync(filePath, 'utf8');
}

function fillTemplate(tpl, data) {
  return tpl.replace(/{{\s*([A-Z0-9_]+)\s*}}/gi, (_, key) => {
    const val = data[key];
    if (Array.isArray(val)) {
      if (key === 'POINTS' || key === 'ITEMS') {
        return val.map(v => `<li>${v}</li>`).join('');
      }
      return val.join(', ');
    }
    return val || '';
  });
}

(async () => {
  const slides = [
    {
      template: 'title',
      data: {
        TITLE: 'My Awesome Presentation',
        SUBTITLE: 'Generated with Puppeteer',
        BACKGROUND_IMAGE: 'https://via.placeholder.com/150'
      }
    },
    {
      template: 'content_image',
      data: {
        TITLE: 'Main Points',
        POINTS: ['First point', 'Second point', 'Third point'],
        IMAGE: 'https://via.placeholder.com/400x300'
      }
    },
    {
      template: 'quote',
      data: {
        QUOTE: 'Innovation distinguishes between a leader and a follower.',
        AUTHOR: 'Steve Jobs'
      }
    }
  ];

  const outDir = path.join(__dirname, 'test-out');
  fs.mkdirSync(outDir, { recursive: true });

  for (let i = 0; i < slides.length; i++) {
    const { template, data } = slides[i];
    const tpl = loadTemplate(template);
    const html = fillTemplate(tpl, data);
    const outPath = path.join(outDir, `slide-${i + 1}.png`);
    console.log(`Rendering ${template} -> ${outPath}`);
    await generateSlideImage({ contentHtml: html, outputPath: outPath, preset: 'high' });
  }

  await closeBrowser();
})();

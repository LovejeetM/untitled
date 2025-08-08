// loader.js
const fs = require('fs');
const path = require('path');
const { generateSlideImage } = require('./slide'); 

const ROOT = path.join(__dirname, 'ppt-templates');
const TEMPLATES_DIR = path.join(ROOT, 'templates');
const MANIFEST = path.join(ROOT, 'manifest.json');

let manifest = null;
const templateCache = new Map();

function loadManifest() {
  if (!manifest) {
    manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  }
  return manifest;
}

function loadTemplateByName(name) {
  const m = loadManifest();
  const info = m.templates[name];
  if (!info) throw new Error(`Template ${name} not found in manifest`);
  if (templateCache.has(info.file)) return templateCache.get(info.file);
  const filePath = path.join(TEMPLATES_DIR, info.file);
  const tpl = fs.readFileSync(filePath, 'utf8');
  templateCache.set(info.file, tpl);
  return tpl;
}

// dataList: [{template: 'title', data: {...}}, {template: 'content_image', data: {...}} ...]
// preset: 'low'|'medium'|'high'
async function renderSlides(dataList, preset = 'high', outFolder = './out') {
  if (!fs.existsSync(outFolder)) fs.mkdirSync(outFolder, { recursive: true });

  
  for (let i = 0; i < dataList.length; i++) {
    const { template, data } = dataList[i];
    const inner = loadTemplateByName(template);
    
    const htmlInner = inner.replace(/{{\s*([A-Z0-9_]+)\s*}}/gi, (m, key) => {
      const val = data[key];
      if (Array.isArray(val)) {
        if (key === 'POINTS' || key === 'ITEMS') return val.map(it => `<li>${it}</li>`).join('');
        return val.join(', ');
      }
      return val ?? '';
    });

    const outputPath = path.join(outFolder, `slide-${String(i+1).padStart(2,'0')}.png`);
    await generateSlideImage({ contentHtml: htmlInner, outputPath, preset });
  }
}

module.exports = { renderSlides, loadTemplateByName };

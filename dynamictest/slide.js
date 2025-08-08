// generate-slide.js
const puppeteer = require('puppeteer');


let browserInstance = null;
async function getBrowser() {
  if (!browserInstance) {
    browserInstance = await puppeteer.launch({ headless: true });
  }
  return browserInstance;
}

async function generateSlideImage({ contentHtml, outputPath, preset = 'high' }) {
  const resolutions = {
    low: { width: 960, height: 540, scale: 0.8 },
    medium: { width: 1280, height: 720, scale: 1.0 },
    high: { width: 1920, height: 1080, scale: 1.2 }
  };
  const { width, height, scale } = resolutions[preset] || resolutions.high;

  const browser = await getBrowser();
  const page = await browser.newPage();
  await page.setViewport({ width, height });

  // Wrap in full HTML with CSS vars
  const fullHtml = `
  <html>
  <head>
    <style>
      body {
        margin: 0;
        background: #111;
        color: white;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        height: 100%;
        font-family: 'Arial', sans-serif;
        --title-font: ${scale * 48}px;
        --base-font: ${scale * 24}px;
        --padding: ${scale * 40}px;
        --gap: ${scale * 30}px;
        --accent: #00ffe0;
        --muted-color: #ccc;
      }
      h1,h2,h3,p,ul,ol,blockquote {
        margin: 0;
        padding: 0;
      }
    </style>
  </head>
  <body>
    ${contentHtml}
  </body>
  </html>
  `;

  await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: outputPath });
  await page.close();
}

async function closeBrowser() {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}

module.exports = { generateSlideImage, closeBrowser };

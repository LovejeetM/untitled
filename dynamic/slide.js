const puppeteer = require("puppeteer");

/**
 * Map resolution mode to slide dimensions and scaling factor
 */
const resolutionPresets = {
  low: { width: 1280, height: 720, scaleFactor: 1 },
  medium: { width: 1920, height: 1080, scaleFactor: 1.5 },
  high: { width: 2400, height: 1350, scaleFactor: 2 }
};

/**
 * Creates a full HTML string for a slide.
 * Scaling is handled by `scaleFactor`.
 */
function createFullHtml(contentHtml, width, height, scaleFactor) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap');
            * { box-sizing: border-box; }
            body { margin: 0; padding: 0; background-color: transparent; }

            .slide-container {
                width: ${width}px;
                height: ${height}px;
                background-color: #050515;
                background-image:
                    linear-gradient(135deg, rgba(0, 200, 255, 0.1) 0%, transparent 25%, transparent 75%, rgba(150, 0, 255, 0.1) 100%),
                    radial-gradient(circle at 10% 10%, rgba(0, 150, 255, 0.15) 0%, transparent 40%),
                    radial-gradient(circle at 90% 80%, rgba(100, 0, 255, 0.15) 0%, transparent 40%);
                border: ${2 * scaleFactor}px solid rgba(50, 150, 255, 0.3);
                box-shadow: 0 0 ${50 * scaleFactor}px rgba(0, 0, 0, 0.8) inset, 
                            0 0 ${30 * scaleFactor}px rgba(0, 225, 255, 0.3);
                border-radius: ${20 * scaleFactor}px;
                padding: ${40 * scaleFactor}px ${60 * scaleFactor}px;
                font-family: 'Inter', sans-serif;
                color: #e0e0e0;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: flex-start;
                text-align: left;
            }

            .slide-container h2 {
                font-size: ${50 * scaleFactor}px;
                font-weight: 700;
                width: 100%;
                text-align: left;
                margin: 0 0 ${30 * scaleFactor}px 0;
                padding-bottom: ${15 * scaleFactor}px;
                border-bottom: ${2 * scaleFactor}px solid rgba(255, 255, 255, 0.2);
                color: #00c6ff;
            }

            .content-area {
                display: flex;
                flex-direction: row;
                width: 100%;
                height: 100%;
                gap: ${40 * scaleFactor}px;
                align-items: stretch;
            }

            .text-content {
                flex: 1;
                display: flex;
                flex-direction: column;
                justify-content: center;
            }

            .text-content ul { list-style: none; padding-left: 0; margin: 0; }

            .text-content li {
                font-size: ${24 * scaleFactor}px;
                line-height: 1.5;
                color: #b0b8c4;
                padding-left: ${20 * scaleFactor}px;
                margin-bottom: ${15 * scaleFactor}px;
                position: relative;
            }

            .text-content li::before {
                content: '»';
                position: absolute;
                left: 0;
                top: 0.05em;
                color: #00c6ff;
                font-weight: 700;
            }

            .visual-content {
                flex: 1.2; /* increased image space */
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .visual-content img {
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
                border-radius: ${10 * scaleFactor}px;
            }
        </style>
    </head>
    <body>
        <div class="slide-container" id="target-slide">${contentHtml}</div>
    </body>
    </html>
  `;
}

/**
 * Generates a single slide image
 */
async function generateSlide(contentHtml, outputPath, resolutionMode = "high") {
  const { width, height, scaleFactor } = resolutionPresets[resolutionMode] || resolutionPresets.high;

  let browser;
  try {
    console.log(`Launching browser for ${resolutionMode} resolution...`);
    browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    await page.setViewport({ width, height, deviceScaleFactor: 1 });

    const fullHtml = createFullHtml(contentHtml, width, height, scaleFactor);
    await page.setContent(fullHtml, { waitUntil: "networkidle0" });

    const element = await page.$("#target-slide");
    if (!element) throw new Error("Slide element not found.");

    console.log("Taking screenshot...");
    await element.screenshot({ path: outputPath, omitBackground: true });

    console.log(`Slide generated successfully: ${outputPath}`);
  } catch (err) {
    console.error("Error generating slide:", err);
  } finally {
    if (browser) await browser.close();
  }
}

// Example usage:
const slideContent = `
    <h2>Project Architecture Overview</h2>
    <div class="content-area">
        <div class="text-content">
            <ul>
                <li>User requests are sent to a secure API gateway.</li>
                <li>A job queue manages incoming generation tasks.</li>
                <li>Worker nodes use Puppeteer to create media.</li>
                <li>Final assets are stored in a cloud bucket.</li>
            </ul>
        </div>
        <div class="visual-content">
            <img src="https://www.cs.cornell.edu/projects/megadepth/demo1.png" alt="Architecture Diagram" />
        </div>
    </div>
`;

// Generate in low, medium, or high resolution
generateSlide(slideContent, "./slide.png", "medium");

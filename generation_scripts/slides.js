const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function generateContentSlideImage(contentHtml, outputPath, width, height) {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    await page.setViewport({ width, height, deviceScaleFactor: 2 });

    const fullHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap');

                * {
                    box-sizing: border-box;
                }
                body {
                    margin: 0;
                    padding: 0;
                    background-color: transparent;
                }
                .slide-container {
                    width: ${width}px;
                    height: ${height}px;
                    background-color: #050515;
                    background-image:
                        linear-gradient(135deg, rgba(0, 200, 255, 0.1) 0%, transparent 25%, transparent 75%, rgba(150, 0, 255, 0.1) 100%),
                        radial-gradient(circle at 10% 10%, rgba(0, 150, 255, 0.15) 0%, transparent 40%),
                        radial-gradient(circle at 90% 80%, rgba(100, 0, 255, 0.15) 0%, transparent 40%);
                    border: 2px solid rgba(50, 150, 255, 0.3);
                    box-shadow:
                        0 0 50px rgba(0, 0, 0, 0.8) inset,
                        0 0 30px rgba(0, 225, 255, 0.3);
                    border-radius: 20px;
                    padding: 60px 80px;
                    font-family: 'Inter', sans-serif;
                    color: #e0e0e0;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: flex-start;
                    text-align: left;
                }
                .slide-container h2 {
                    font-size: 7em;
                    font-weight: 700;
                    width: 100%;
                    text-align: left;
                    margin: 0 0 50px 0;
                    padding-bottom: 25px;
                    border-bottom: 2px solid rgba(255, 255, 255, 0.2);
                    color: #00c6ff;
                }
                .content-area {
                    display: flex;
                    flex-direction: row;
                    width: 100%;
                    height: 100%;
                    gap: 60px;
                    align-items: stretch;
                }
                .text-content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                }
                .text-content ul {
                    list-style: none;
                    padding-left: 0;
                    margin: 0;
                }
                .text-content li {
                    font-size: 3.2em;
                    line-height: 1.7;
                    color: #b0b8c4;
                    padding-left: 1.5em;
                    margin-bottom: 30px;
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
                    flex: 1.0;  /* 1.2*/
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .visual-content img {
                    max-width: 100%;
                    max-height: 100%;
                    object-fit: contain;
                    border-radius: 10px;
                }
            </style>
        </head>
        <body>
            <div class="slide-container" id="target-slide">
                ${contentHtml}
            </div>
        </body>
        </html>
    `;

    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
    const element = await page.$('#target-slide');
    await element.screenshot({ path: outputPath, omitBackground: true });
    console.log(`Content slide image successfully generated and saved to ${outputPath}`);
    await browser.close();
}

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

generateContentSlideImage(
    slideContent,
    './slide.png',
    2400,  // 2400
    1350    // 1350
).catch(console.error);
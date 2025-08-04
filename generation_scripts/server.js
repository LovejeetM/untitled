const express = require('express');
const { initBrowser, getBrowser } = require('./generation_scripts');

const app = express();
const port = 3000;

app.use(express.json({ limit: '10mb' }));


function createFullHtml(contentHtml, width, height) {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head><meta charset="UTF-8"><style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap'); body { margin: 0; } .slide-container { width: ${width}px; height: ${height}px; /*...rest of css...*/ background-color: #050515; } .visual-content img { max-width: 100%; max-height: 100%; object-fit: contain; }</style></head>
        <body><div class="slide-container" id="target-slide">${contentHtml}</div></body>
        </html>
    `;
}

app.post('/generate/image', async (req, res) => {
    const { contentHtml, width, height } = req.body;
    if (!contentHtml || !width || !height) {
        return res.status(400).send({ error: 'Missing required fields: contentHtml, width, height' });
    }

    let page = null;
    try {
        const browser = getBrowser();
        page = await browser.newPage();

        await page.setViewport({ width, height, deviceScaleFactor: 2 });
        const fullHtml = createFullHtml(contentHtml, width, height);
        await page.setContent(fullHtml, { waitUntil: 'networkidle0' });

        const element = await page.$('#target-slide');
        if (!element) {
            throw new Error('Could not find #target-slide');
        }

        const imageBuffer = await element.screenshot({ type: 'png', omitBackground: true });

        res.set('Content-Type', 'image/png');
        res.send(imageBuffer);
    } catch (error) {
        console.error('Image generation failed:', error);
        res.status(500).send({ error: 'Failed to generate image.' });
    } finally {
        if (page) {
            await page.close();
        }
    }
});

app.post('/generate/pdf', async (req, res) => {
    const { contentHtml, pdfOptions = {} } = req.body;
    if (!contentHtml) {
        return res.status(400).send({ error: 'Missing required field: contentHtml' });
    }

    let page = null;
    try {
        const browser = getBrowser();
        page = await browser.newPage();
        await page.setContent(contentHtml, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            ...pdfOptions,
        });
        
        res.set('Content-Type', 'application/pdf');
        res.send(pdfBuffer);
    } catch (error) {
        console.error('PDF generation failed:', error);
        res.status(500).send({ error: 'Failed to generate PDF.' });
    } finally {
        if (page) {
            await page.close();
        }
    }
});

initBrowser().then(() => {
    app.listen(port, () => {
        console.log(`Puppeteer server listening on http://localhost:${port}`);
    });
}).catch(console.error);
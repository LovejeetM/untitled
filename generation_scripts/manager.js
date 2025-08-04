const puppeteer = require('puppeteer');

let browserInstance = null;

const initBrowser = async () => {
    if (browserInstance) {
        return browserInstance;
    }
    console.log('Launching a new persistent browser instance...');
    browserInstance = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    return browserInstance;
};

const getBrowser = () => {
    if (!browserInstance) {
        throw new Error('Browser has not been initialized. Please call initBrowser() first.');
    }
    return browserInstance;
};

module.exports = { initBrowser, getBrowser };

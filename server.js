const express = require('express');
const { chromium } = require('playwright');

const app = express();

app.get('/scrape', async (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).send('Missing url param');

    let browser;
    try {
        browser = await chromium.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--window-size=1920,1080',
                '--disable-blink-features=AutomationControlled'
            ]
        });

        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            locale: 'it-IT',
            viewport: { width: 1920, height: 1080 }
        });

        const page = await context.newPage();

        await page.addInitScript(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        });

        // Naviga all'indirizzo richiesto
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
        
        // Attende qualche istante per consentire il superamento di eventuali verifiche iniziali
        await page.waitForTimeout(3000);

        const htmlContent = await page.content();
        await browser.close();

        res.status(200).send(htmlContent);

    } catch (error) {
        if (browser) await browser.close();
        res.status(500).send('Errore durante lo scraping: ' + error.message);
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Server JW-Scraper avviato sulla porta ${PORT}`);
});
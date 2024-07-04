const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.post('/scrape', async (req, res) => {
    const topic = req.body.topic;
    if (!topic) {
        return res.status(400).send({ error: 'Topic is required' });
    }

    try {
        const browser = await puppeteer.launch({ headless: false});
        const page = await browser.newPage();
        await page.goto(`https://medium.com/search?q=${encodeURIComponent(topic)}`, { waitUntil: 'networkidle2' });

        // Ensure the page has loaded and the articles are available
        await page.waitForSelector('.ab.cn .co.bg.cp.cq.cr.cs', { timeout: 20000 });

        const articles = await page.$$eval('.co.bg.cp.cq.cr.cs', articles => {
        
            return articles.map(article => {
                const titleElement = article.querySelector('h3') || article.querySelector('h2');
                const title = titleElement ? titleElement.innerText : null;
                const authorElement = article.querySelector('p.be.b.ik.z.ee.hl.ef.eg');
                const author = authorElement ? authorElement.innerText : null;
                const linkElement = article.closest('a');
                const link = linkElement ? linkElement.href : null;
                return title && author && link ? { title, author, link } : null;
            }).filter(Boolean).slice(0, 5);
        });

        console.log('Articles:', articles);

        await browser.close();

        res.send(articles);
    } catch (error) {
        console.error('Error during scraping:', error);
        res.status(500).send({ error: 'Failed to scrape articles' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

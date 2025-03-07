const express = require("express");
const cors = require("cors");
const puppeteer = require("puppeteer-core");
// const {executablePath} = require("puppeteer-core")

const getChromeExecutablePath = require('./getExecutablePath');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());


let scrapedArticles = []; // In-memory storage for articles

app.post("/scrape", async (req, res) => {
  const topic = req.body.topic;
  if (!topic) {
    return res.status(400).send({ error: "Topic is required" });
  }

  try {
    const executablePath = getChromeExecutablePath();
        const browser = await puppeteer.launch({
            headless: true,
            executablePath: executablePath,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu'
            ]
        });
  //   const browser = await puppeteer.launch({
  //     headless: true,
  //     ignoreHTTPSErrors: true,
  //     executablePath: executablePath(), // Path for Chrome in Render environment
  //           args: [
  //               '--no-sandbox',
  //               '--disable-setuid-sandbox',
  //               '--disable-dev-shm-usage',
  //               '--disable-accelerated-2d-canvas',
  //               '--disable-gpu'
  //           ]
  // });
    const page = await browser.newPage();
    await page.goto(
      `https://medium.com/search?q=${encodeURIComponent(topic)}`,
      { waitUntil: "networkidle2" }
    );

    // Ensure the page has loaded and the articles are available
    const a = await page.waitForSelector(".ab.cn", { timeout: 50000 });

    const articles = await page.evaluate(() => {
      const articleElements = document.querySelectorAll(".co.bg.cp.cq.cr.cs");
      const articlesData = [];
      const articlesFilter = articleElements[1].querySelectorAll("article");

      articlesFilter.forEach(article => {
        const titleElement = article.querySelector("h2");
        const title = titleElement ? titleElement.innerText : null;
        const authorElement = article.querySelector(
          "p.be.b.ik.z.ee.hl.ef.eg.eh.ei.ej.ek.bj"
        );
        const author = authorElement ? authorElement.innerText : null;
        const dateElement = article.querySelector('.hw.ab.fv.ae .ab.q');
        const date = dateElement? dateElement.innerText:null
        const dataHrefElement = article.querySelector("[data-href]");
        const dataHref = dataHrefElement
          ? dataHrefElement.getAttribute("data-href")
          : null;
        articlesData.push({
          title: title,
          author: author,
          date: date.split('\n')[0],
          link: dataHref
        });
      });

      return articlesData.filter(Boolean).slice(0, 5);
    })
    scrapedArticles = articles; 
    await browser.close();

    res.send(articles);
  } catch (error) {
    console.error("Error during scraping:", error);
    res.status(500).send({ error: "Failed to scrape articles" });
  }
});
app.get('/',(req,res)=>{
  res.send("APP is Running")
})
app.get('/articles', (req, res) => {
  res.send(scrapedArticles);
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

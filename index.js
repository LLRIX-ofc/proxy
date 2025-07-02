const express = require('express');
const puppeteer = require('puppeteer');
const app = express();

app.get('/proxy/*', async (req, res) => {
  const targetUrl = req.url.replace('/proxy/', '');
  if (!targetUrl.startsWith('http')) {
    return res.status(400).send('Invalid URL');
  }

  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Disable CSP for the page (so browser doesn’t block framing)
    await page.setBypassCSP(true);

    await page.goto(targetUrl, { waitUntil: 'networkidle2' });

    // Remove frame-busting scripts by injecting JS
    await page.evaluate(() => {
      // Overwrite frame busting JS
      Object.defineProperty(window, 'top', { get: () => window });
      window.onbeforeunload = null;
      window.onunload = null;
    });

    // Get final HTML after JS runs
    const content = await page.content();

    await browser.close();

    res.set('Content-Type', 'text/html');
    res.send(content);

  } catch (err) {
    res.status(500).send('Error loading page: ' + err.message);
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

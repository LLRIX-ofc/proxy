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
    // Intercept network requests
    await page.setRequestInterception(true);
    page.on('request', (interceptedRequest) => {
      const requestUrl = interceptedRequest.url();
      // Rewrite URL to go through proxy, but avoid double-proxying
      if (requestUrl.startsWith(targetUrl) && !requestUrl.startsWith(req.protocol + '://' + req.get('host') + '/proxy/')) {
        const proxiedUrl = `/proxy/${requestUrl}`;
        interceptedRequest.continue({ url: proxiedUrl });
      } else {
        interceptedRequest.continue();
      }
    });

    // Modify a tags and form actions to point to the proxy
    let content = await page.content();
    const baseUrl = req.protocol + '://' + req.get('host') + '/proxy/';

    // Rewrite absolute URLs
    content = content.replace(new RegExp(`(href|src|action)=["'](https?://[^"']+)["']`, 'gi'), (match, attr, url) => {
      if (url.startsWith(targetUrl)) { // Only rewrite URLs from the target domain
        return `${attr}="${baseUrl}${url}"`;
      }
      return match; // Keep external links as they are
    });

    // Rewrite relative URLs
    content = content.replace(new RegExp(`(href|src|action)=["'](?!(?:https?://|#|javascript:))([^"']+)["']`, 'gi'), (match, attr, url) => {
      // Construct absolute URL based on the target URL
      const absoluteUrl = new URL(url, targetUrl).href;
      return `${attr}="${baseUrl}${absoluteUrl}"`;
    });


    await browser.close();

    res.set('Content-Type', 'text/html');
    res.send(content);

  } catch (err) {
    console.error('Error loading page:', err);
    res.status(500).send('Error loading page: ' + err.message);
  }
});

// Serve static files (for index.html)
app.use(express.static('public'));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT} at http://localhost:${PORT}`));

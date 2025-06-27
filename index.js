const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/proxy', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).json({ error: 'Missing URL parameter' });

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: { ...req.headers, host: undefined }, // remove host header to avoid host mismatch
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body),
    });

    // Forward status and headers
    res.status(response.status);
    response.headers.forEach((value, name) => {
      res.setHeader(name, value);
    });

    const buffer = await response.buffer();
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fetch failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Universal proxy running on port ${PORT}`);
});

const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());

// Universal proxy route
app.use('/proxy', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).json({ error: 'Missing URL parameter' });

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: req.headers,
      body: req.method === 'GET' ? undefined : req.body,
    });

    // Forward status and headers
    res.status(response.status);
    response.headers.forEach((value, name) => {
      res.setHeader(name, value);
    });

    // Pipe response to client
    response.body.pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fetch failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Universal proxy running on port ${PORT}`);
});

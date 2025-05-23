const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());

app.get('/api/suggest', async (req, res) => {
  const q = req.query.q;
  if (!q) return res.status(400).json({ error: 'Missing query' });

  try {
    const response = await fetch(`https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(q)}`);
    const data = await response.json();
    res.json(data[1]); // Array of suggestions
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fetch failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy running on port ${PORT}`);
});

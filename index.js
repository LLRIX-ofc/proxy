import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());

app.get('/api/suggest', async (req, res) => {
  const q = req.query.q as string;
  if (!q) return res.status(400).json({ error: 'Missing query param' });

  try {
    const response = await fetch(`https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(q)}`);
    const data = await response.json();
    res.json(data[1]);
  } catch (err) {
    console.error('Suggestion fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy running on http://localhost:${PORT}`);
});

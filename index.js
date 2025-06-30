import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const PORT = process.env.PORT || 3000;

// Dynamic proxy route: /proxy?url=https://example.com
app.use('/proxy', (req, res, next) => {
  const target = req.query.url;
  if (!target) {
    res.status(400).send('Missing target URL. Use /proxy?url=https://example.com');
    return;
  }

  createProxyMiddleware({
    target,
    changeOrigin: true,
    secure: false,
    pathRewrite: {
      '^/proxy': '',
    },
    onError: (err, req, res) => {
      console.error('Proxy error:', err);
      res.status(500).send('Proxy error');
    },
  })(req, res, next);
});

app.get('/', (req, res) => {
  res.send('Proxy server is running. Use /proxy?url=https://example.com');
});

app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});

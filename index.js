const express = require("express");
const Unblocker = require("unblocker");
const app = express();

// Use unblocker middleware on /proxy/ path
app.use(Unblocker({
  prefix: '/proxy/',
  // optionally add requestMiddleware here if needed
}));

// No other routes here — server only proxies

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});

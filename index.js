const express = require("express");
const Unblocker = require("unblocker");
const app = express();

const unblocker = Unblocker({
  prefix: '/proxy/',
});

app.use(unblocker);

// Middleware to strip frame-blocking headers from proxied responses
app.use('/proxy/', (req, res, next) => {
  // Hook into res.writeHead to modify headers before sending
  const writeHead = res.writeHead;
  res.writeHead = function(statusCode, headers) {
    if (typeof headers === 'object') {
      delete headers['x-frame-options'];
      delete headers['X-Frame-Options'];
      delete headers['content-security-policy'];
      delete headers['Content-Security-Policy'];
      delete headers['content-security-policy-report-only'];
      delete headers['Content-Security-Policy-Report-Only'];
    }
    return writeHead.apply(this, arguments);
  };
  next();
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});

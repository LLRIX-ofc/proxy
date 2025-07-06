import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import url from "url";

const app = express();

app.use("/proxy", (req, res, next) => {
  const parsedUrl = url.parse(req.url, true);
  const targetFullUrl = parsedUrl.path.slice(1); // Remove leading slash

  if (!targetFullUrl.startsWith("http")) {
    return res.status(400).send("Invalid target URL");
  }

  const targetObj = url.parse(targetFullUrl);

  // Create dynamic proxy middleware
  createProxyMiddleware({
    target: targetObj.protocol + "//" + targetObj.host,
    changeOrigin: true,
    pathRewrite: (path, req) => {
      const originalPath = url.parse(req.url).path;
      // Remove "/proxy/<target_origin>" prefix
      const pathParts = originalPath.split("/");
      pathParts.splice(0, 3); // remove ['', 'proxy', 'https:']
      return "/" + pathParts.join("/");
    },
    onProxyReq: (proxyReq, req, res) => {
      // Overwrite Host header to match the target
      proxyReq.setHeader("Host", targetObj.host);
      proxyReq.removeHeader("Via");
      proxyReq.removeHeader("X-Forwarded-For");
      proxyReq.removeHeader("X-Forwarded-Host");
      proxyReq.removeHeader("X-Forwarded-Proto");
    },
    onProxyRes: (proxyRes, req, res) => {
      delete proxyRes.headers["via"];
      delete proxyRes.headers["x-forwarded-for"];
      delete proxyRes.headers["x-forwarded-host"];
      delete proxyRes.headers["x-forwarded-proto"];
    },
    ws: true,
    secure: false, // Accept self-signed
  })(req, res, next);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Proxy running on port ${PORT}`);
});

import express from "express";
import proxy from "express-http-proxy";
import url from "url";

const app = express();

// Universal proxy route
app.use("/proxy", proxy((req) => {
  const targetUrl = req.url.slice(1); // Remove leading "/"
  const parsed = url.parse(targetUrl);
  const targetHost = parsed.protocol + "//" + parsed.host;

  return targetHost;
}, {
  proxyReqPathResolver: (req) => {
    const parsed = url.parse(req.url.slice(1));
    return parsed.path;
  },
  proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
    const parsed = url.parse(srcReq.url.slice(1));
    proxyReqOpts.headers['Host'] = parsed.host;
    proxyReqOpts.headers['Origin'] = parsed.protocol + "//" + parsed.host;
    proxyReqOpts.headers['Referer'] = parsed.protocol + "//" + parsed.host;
    delete proxyReqOpts.headers['x-forwarded-for'];
    delete proxyReqOpts.headers['x-forwarded-host'];
    delete proxyReqOpts.headers['x-forwarded-proto'];
    return proxyReqOpts;
  },
  userResDecorator: function(proxyRes, proxyResData, userReq, userRes) {
    let data = proxyResData.toString('utf8');
    if (proxyRes.headers['content-type'] && proxyRes.headers['content-type'].includes('text/html')) {
      data = data.replace(/(href|src|action)=["'](.*?)["']/g, (match, p1, p2) => {
        if (p2.startsWith("http")) {
          return `${p1}="/proxy/${p2}"`;
        } else if (p2.startsWith("/")) {
          return `${p1}="/proxy/${parsed.protocol}//${parsed.host}${p2}"`;
        } else {
          return `${p1}="/proxy/${parsed.protocol}//${parsed.host}/${p2}"`;
        }
      });
    }
    return data;
  }
}));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));

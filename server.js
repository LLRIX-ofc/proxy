const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");
const { JSDOM } = require("jsdom");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: "*" }));
app.use(express.json());

app.get("/fetch", async (req, res) => {
    let url = req.query.url;
    if (!url) return res.status(400).send("URL is required");

    // If no domain ending, search Google
    if (!/\.\w{2,}/.test(url)) {
        url = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
    } else if (!url.startsWith("http")) {
        url = "https://" + url;
    }

    try {
        const response = await fetch(url, {
            headers: { "User-Agent": "Mozilla/5.0" }
        });

        let contentType = response.headers.get("content-type");

        if (contentType.includes("text/html")) {
            let html = await response.text();
            let dom = new JSDOM(html);

            dom.window.document.querySelectorAll("a").forEach(link => {
                let href = link.getAttribute("href");
                if (href && !href.startsWith("#") && !href.startsWith("javascript")) {
                    link.setAttribute("href", `/fetch?url=${encodeURIComponent(new URL(href, url).href)}`);
                }
            });

            return res.send(dom.serialize());
        } else {
            return res.send(await response.buffer());
        }

    } catch (error) {
        res.status(500).send("Error fetching the website: " + error.message);
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");
const { JSDOM } = require("jsdom"); // Needed to modify links

const app = express();
const PORT = 3000;

app.use(cors({ origin: "*" })); // Allow all origins
app.use(express.json());

app.get("/fetch", async (req, res) => {
    let url = req.query.url;
    if (!url) return res.status(400).send("URL is required");

    if (!url.startsWith("http")) {
        url = "https://" + url; // Ensure HTTPS
    }

    try {
        const response = await fetch(url, {
            headers: { "User-Agent": "Mozilla/5.0" } // Prevent blocking
        });

        let contentType = response.headers.get("content-type");

        if (contentType.includes("text/html")) {
            let html = await response.text();
            let dom = new JSDOM(html);

            // Modify all links to go through the proxy
            dom.window.document.querySelectorAll("a").forEach(link => {
                let href = link.getAttribute("href");
                if (href && !href.startsWith("#") && !href.startsWith("javascript")) {
                    link.setAttribute("href", `/fetch?url=${encodeURIComponent(new URL(href, url).href)}`);
                }
            });

            return res.send(dom.serialize());
        } else {
            return res.send(await response.buffer()); // Return other content types as is
        }

    } catch (error) {
        res.status(500).send("Error fetching the website: " + error.message);
    }
});

app.listen(PORT, () => {
    console.log(`Server running at https://marshy-superficial-horse.glitch.me/`);
});

const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/fetch', async (req, res) => {
    let url = req.query.url;

    if (!url) {
        return res.status(400).send('No URL provided');
    }

    // Ensure URL starts with http/https
    if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
    }

    try {
        const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        let headers = { ...response.headers.raw() };

        // Remove security headers that block embedding
        delete headers['x-frame-options'];
        if (headers['content-security-policy']) {
            headers['content-security-policy'] = headers['content-security-policy'].map(
                (policy) => policy.replace(/frame-ancestors [^;]+;/, '')
            );
        }

        res.set(headers);
        const body = await response.text();
        res.send(body);
    } catch (error) {
        res.status(500).send('Error fetching the URL');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));

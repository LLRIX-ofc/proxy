const express = require('express');
const request = require('request');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/fetch', (req, res) => {
    let url = req.query.url;

    if (!url) {
        return res.status(400).send('No URL provided');
    }

    // Ensure URL starts with http/https
    if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
    }

    request(
        { url, headers: { 'User-Agent': 'Mozilla/5.0' } },
        (error, response, body) => {
            if (error) {
                return res.status(500).send('Error fetching the URL');
            }

            let headers = { ...response.headers };

            // Remove security headers that block embedding
            delete headers['x-frame-options'];
            if (headers['content-security-policy']) {
                headers['content-security-policy'] = headers['content-security-policy'].replace(/frame-ancestors [^;]+;/, '');
            }

            res.set(headers);
            res.send(body);
        }
    );
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));

import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
app.use(cors());

app.get('/fetch', async (req, res) => {
    let url = req.query.url;
    
    console.log(`Received request for: ${url}`); // Debugging
    
    if (!url) {
        return res.status(400).send('No URL provided');
    }

    // Ensure URL starts with http/https
    if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
    }

    try {
        console.log(`Fetching: ${url}`); // Debugging
        const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });

        console.log(`Response status: ${response.status}`); // Debugging
        
        // Convert headers to a valid format (avoid arrays)
        let headers = {};
        response.headers.forEach((value, key) => {
            headers[key] = value; // Ensure headers are strings, not arrays
        });

        // Remove problematic headers
        delete headers['x-frame-options'];

        if (headers['content-security-policy']) {
            headers['content-security-policy'] = headers['content-security-policy'].replace(/frame-ancestors [^;]+;/, '');
        }

        // Set headers safely
        Object.entries(headers).forEach(([key, value]) => {
            res.setHeader(key, value);
        });

        const body = await response.text();
        res.send(body);
    } catch (error) {
        console.error('Fetch error:', error); // Debugging
        res.status(500).send('Error fetching the URL');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));

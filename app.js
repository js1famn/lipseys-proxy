const express = require('express');
const app = express();

app.use(express.json());
app.use(express.text());
app.use(express.raw({ type: '*/*' }));

app.use(async (req, res) => {
  try {
    const targetUrl = `https://api.lipseys.com${req.path}${req.url.includes('?') ? '?' + req.url.split('?')[1] : ''}`;
    console.log(`Proxying: ${req.method} ${targetUrl}`);

    const headers = {};
    if (req.headers['authorization']) headers['authorization'] = req.headers['authorization'];
    if (req.headers['content-type']) headers['content-type'] = req.headers['content-type'];
    headers['accept'] = 'application/json';

    let body = undefined;
    if (!['GET', 'HEAD'].includes(req.method)) {
      if (req.body !== undefined && req.body !== null) {
        body = typeof req.body === 'string' ? req.body
             : Buffer.isBuffer(req.body) ? req.body
             : JSON.stringify(req.body);
      }
    }

    const response = await fetch(targetUrl, { method: req.method, headers, body });

    console.log(`Response: ${response.status}`);
    const data = await response.text();
    res.status(response.status)
       .set('content-type', response.headers.get('content-type') || 'application/json')
       .send(data);
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(process.env.PORT || 3000, () => console.log('Proxy running'));

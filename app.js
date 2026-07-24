const express = require('express');
const app = express();

app.use(async (req, res) => {
  try {
    const targetUrl = `https://api.lipseys.com${req.path}${req.url.includes('?') ? '?' + req.url.split('?')[1] : ''}`;
    console.log(`Proxying: ${req.method} ${targetUrl}`);

    const headers = {};
    if (req.headers['authorization']) headers['authorization'] = req.headers['authorization'];
    if (req.headers['content-type']) headers['content-type'] = req.headers['content-type'];
    headers['accept'] = 'application/json';

    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body),
    });

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

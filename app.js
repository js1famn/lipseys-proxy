// lipseys-proxy/app.js
// Deploy to Render.com — proxies all requests to api.lipseys.com
// Appends a crypto.randomUUID() nonce to every outbound URL so Cloudflare
// never serves a cached auth response (fixes stale token bug).

const express = require('express');
const crypto  = require('crypto');
const app     = express();

app.use(express.json());
app.use(express.text({ type: '*/*' }));

app.use(async (req, res) => {
  try {
    // Build target URL with UUID nonce — Cloudflare caches by URL,
    // so a URL it has never seen before always gets a fresh response.
    const hasQs    = req.url.includes('?');
    const existing = hasQs ? req.url.slice(req.url.indexOf('?') + 1) + '&' : '';
    const targetUrl = `https://api.lipseys.com${req.path}?${existing}_n=${crypto.randomUUID()}`;

    console.log(`[proxy] ${req.method} ${targetUrl}`);

    // Forward relevant headers; always send cache-busting directives
    const headers = {
      'accept':        'application/json',
      'cache-control': 'no-cache, no-store',
      'pragma':        'no-cache',
    };
    if (req.headers['content-type']) {
      headers['content-type'] = req.headers['content-type'];
    }
    // Lipsey's requires capital-T Token header
    const token = req.headers['token'] || req.headers['Token'];
    if (token) headers['Token'] = token;

    // Build request body for non-GET methods
    let body = undefined;
    if (!['GET', 'HEAD'].includes(req.method)) {
      if (typeof req.body === 'object' && req.body !== null) {
        body = JSON.stringify(req.body);
        headers['content-type'] = 'application/json';
      } else if (typeof req.body === 'string' && req.body.length > 0) {
        body = req.body;
      }
    }

    const response = await fetch(targetUrl, { method: req.method, headers, body });
    console.log(`[proxy] response ${response.status}`);

    const data = await response.text();

    // Strip caching headers on the way back so our server doesn't cache either
    res
      .status(response.status)
      .set('content-type', response.headers.get('content-type') || 'application/json')
      .set('cache-control', 'no-store')
      .send(data);

  } catch (err) {
    console.error('[proxy] error:', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[proxy] running on port ${PORT}`));

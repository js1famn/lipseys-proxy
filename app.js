app.use(express.json());
app.use(express.text({ type: '*/*' }));

app.use(async (req, res) => {
  try {
    const qs = req.url.includes('?') ? '?' + req.url.split('?').slice(1).join('?') : '';
    const targetUrl = `https://api.lipseys.com${req.path}${qs}`;
    console.log(`Proxying: ${req.method} ${targetUrl}`);

    const headers = { 'accept': 'application/json' };
    if (req.headers['authorization']) headers['authorization'] = req.headers['authorization'];
    if (req.headers['content-type']) headers['content-type'] = req.headers['content-type'];
    // Forward token with correct casing (Lipsey's requires capital T)
    const token = req.headers['token'] || req.headers['Token'];
    if (token) headers['Token'] = token;

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

const express = require('express');
const app = express();

app.use(async (req, res) => {
  const url = `https://api.lipseys.com${req.path}${req.url.includes('?') ? '?' + req.url.split('?')[1] : ''}`;
  
  const headers = {};
  if (req.headers['authorization']) headers['authorization'] = req.headers['authorization'];
  if (req.headers['content-type']) headers['content-type'] = req.headers['content-type'];

  const response = await fetch(url, {
    method: req.method,
    headers,
    body: ['GET','HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body),
  });

  const data = await response.text();
  res.status(response.status).set('content-type', response.headers.get('content-type') || 'application/json').send(data);
});

app.listen(process.env.PORT || 3000);

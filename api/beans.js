export default async function handler(req, res) {
  const APP_PASSWORD = process.env.RATIO_APP_PASSWORD || 'ratio2026';
  const STORE_KEY = 'green-bean-inventory';

  const providedPassword = req.headers['x-app-password'] || '';
  if (providedPassword !== APP_PASSWORD) {
    res.status(401).json({ error: 'Incorrect password' });
    return;
  }

  try {
    if (req.method === 'GET') {
      const data = await kvGet(STORE_KEY);
      res.status(200).json({ beans: data || null });
      return;
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const beans = body && body.beans;
      if (!Array.isArray(beans)) {
        res.status(400).json({ error: 'Expected { beans: [...] }' });
        return;
      }
      await kvSet(STORE_KEY, beans);
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error', err);
    res.status(500).json({ error: 'Server error', detail: String(err && err.message || err) });
  }
}

async function kvGet(key) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) throw new Error('KV environment variables not configured');

  const resp = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!resp.ok) throw new Error('KV get failed: ' + resp.status);
  const data = await resp.json();
  if (data.result == null) return null;
  try {
    return JSON.parse(data.result);
  } catch (e) {
    return data.result;
  }
}

async function kvSet(key, value) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) throw new Error('KV environment variables not configured');

  const resp = await fetch(`${url}/set/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(JSON.stringify(value))
  });
  if (!resp.ok) throw new Error('KV set failed: ' + resp.status);
}

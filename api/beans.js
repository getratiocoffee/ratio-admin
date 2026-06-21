import { createClient } from 'redis';

let cachedClient = null;

async function getRedisClient() {
  if (cachedClient && cachedClient.isOpen) return cachedClient;
  const url = process.env.REDIS_URL;
  if (!url) throw new Error('REDIS_URL environment variable not configured');
  const client = createClient({ url });
  await client.connect();
  cachedClient = client;
  return client;
}

export default async function handler(req, res) {
  const APP_PASSWORD = process.env.RATIO_APP_PASSWORD || 'ratio2026';
  const STORE_KEY = 'green-bean-inventory';

  const providedPassword = req.headers['x-app-password'] || '';
  if (providedPassword !== APP_PASSWORD) {
    res.status(401).json({ error: 'Incorrect password' });
    return;
  }

  try {
    const client = await getRedisClient();

    if (req.method === 'GET') {
      const raw = await client.get(STORE_KEY);
      const beans = raw ? JSON.parse(raw) : null;
      res.status(200).json({ beans });
      return;
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const beans = body && body.beans;
      if (!Array.isArray(beans)) {
        res.status(400).json({ error: 'Expected { beans: [...] }' });
        return;
      }
      await client.set(STORE_KEY, JSON.stringify(beans));
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error', err);
    res.status(500).json({ error: 'Server error', detail: String(err && err.message || err) });
  }
}

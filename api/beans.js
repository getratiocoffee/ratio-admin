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

const ALLOWED_KEYS = {
  beans: 'green-bean-inventory',
  contacts: 'roaster-contacts',
  transfers: 'transfer-history',
  invoices: 'invoice-log',
};

export default async function handler(req, res) {
  const APP_PASSWORD = process.env.RATIO_APP_PASSWORD || 'ratio2026';

  const providedPassword = req.headers['x-app-password'] || '';
  if (providedPassword !== APP_PASSWORD) {
    res.status(401).json({ error: 'Incorrect password' });
    return;
  }

  const dataset = (req.query && req.query.dataset) || 'beans';
  const storeKey = ALLOWED_KEYS[dataset];
  if (!storeKey) {
    res.status(400).json({ error: 'Unknown dataset' });
    return;
  }

  try {
    const client = await getRedisClient();

    if (req.method === 'GET') {
      const raw = await client.get(storeKey);
      const items = raw ? JSON.parse(raw) : null;
      res.status(200).json({ items });
      return;
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const items = body && body.items;
      if (!Array.isArray(items)) {
        res.status(400).json({ error: 'Expected { items: [...] }' });
        return;
      }
      await client.set(storeKey, JSON.stringify(items));
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error', err);
    res.status(500).json({ error: 'Server error', detail: String(err && err.message || err) });
  }
}


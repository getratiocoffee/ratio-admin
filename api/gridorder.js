import { createClient } from 'redis';

const client = createClient({ url: process.env.REDIS_URL });
client.on('error', () => {});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!client.isOpen) await client.connect();

  if (req.method === 'GET') {
    const val = await client.get('gridOrder');
    return res.status(200).json({ order: val ? JSON.parse(val) : null });
  }

  if (req.method === 'POST') {
    const { order } = req.body;
    // Accept both array (legacy) and object (new format)
    if (!order) return res.status(400).json({ error: 'Invalid order' });
    await client.set('gridOrder', JSON.stringify(order));
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'DELETE') {
    await client.del('gridOrder');
    return res.status(200).json({ ok: true });
  }

  res.status(405).end();
}

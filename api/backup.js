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

// Datasets included in a backup. Customer personal details ('customer-details')
// are intentionally excluded for privacy — matching the in-app export.
const BACKUP_KEYS = {
  beans: 'green-bean-inventory',
  contacts: 'roaster-contacts',
  transfers: 'transfer-history',
  invoices: 'invoice-log',
  staff: 'staff-contacts',
  timesheets: 'staff-timesheets',
  na: 'staff-na-requests',
  sensory: 'sensory-sessions',
  roasted: 'roasted-beans',
  handover: 'handover-data',
};

// Datasets stored as plain objects (everything else is an array).
const OBJECT_KEYS = { handover: true };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const TRANSFER_PIN = process.env.TRANSFER_PIN || '';
  if (!TRANSFER_PIN) {
    res.status(500).json({ error: 'TRANSFER_PIN not configured' });
    return;
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  const provided = (body && body.pin) || '';
  if (provided !== TRANSFER_PIN) {
    res.status(401).json({ error: 'Incorrect PIN' });
    return;
  }

  const action = body.action || 'export';

  try {
    const client = await getRedisClient();

    // ----- Export: read every backup dataset straight from Redis -----
    if (action === 'export') {
      const data = {};
      for (const [name, key] of Object.entries(BACKUP_KEYS)) {
        const raw = await client.get(key);
        if (OBJECT_KEYS[name]) {
          data[name] = raw ? JSON.parse(raw) : {};
        } else {
          data[name] = raw ? JSON.parse(raw) : [];
        }
      }
      res.status(200).json({ ok: true, data });
      return;
    }

    // ----- Import: overwrite each dataset present in the uploaded file -----
    if (action === 'import') {
      const data = body.data;
      if (!data || typeof data !== 'object') {
        res.status(400).json({ error: 'Expected { data: {...} }' });
        return;
      }
      for (const [name, key] of Object.entries(BACKUP_KEYS)) {
        if (!(name in data)) continue; // only restore datasets included in the file
        const val = data[name];
        if (OBJECT_KEYS[name]) {
          if (val && typeof val === 'object') await client.set(key, JSON.stringify(val));
        } else if (Array.isArray(val)) {
          await client.set(key, JSON.stringify(val));
        }
      }
      res.status(200).json({ ok: true });
      return;
    }

    res.status(400).json({ error: 'Unknown action' });
  } catch (err) {
    console.error('backup API error', err);
    res.status(500).json({ error: 'Server error', detail: String(err && err.message || err) });
  }
}

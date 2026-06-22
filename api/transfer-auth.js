export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const TRANSFER_PIN = process.env.TRANSFER_PIN || '';
  if (!TRANSFER_PIN) {
    res.status(500).json({ error: 'TRANSFER_PIN not configured' });
    return;
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const provided = (body && body.pin) || '';

  if (provided !== TRANSFER_PIN) {
    res.status(401).json({ error: 'Incorrect PIN' });
    return;
  }

  res.status(200).json({ ok: true });
}

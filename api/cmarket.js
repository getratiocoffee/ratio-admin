export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const history = req.query.history === '1';

  // Map the UI's range labels (and raw Yahoo ranges) to a valid Yahoo range string.
  const RANGE_MAP = {
    '1M': '1mo', '3M': '3mo', '6M': '6mo', '1Y': '1y',
    '1mo': '1mo', '3mo': '3mo', '6mo': '6mo', '1y': '1y'
  };

  try {
    const headers = { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' };

    if (history) {
      // Daily closes for the requested range (defaults to 6 months)
      const yRange = RANGE_MAP[req.query.range] || '6mo';
      const url = 'https://query1.finance.yahoo.com/v8/finance/chart/KC=F?interval=1d&range=' + yRange;
      const r = await fetch(url, { headers });
      if (!r.ok) throw new Error('Yahoo fetch failed: ' + r.status);
      const data = await r.json();
      const result = data?.chart?.result?.[0];
      const timestamps = result?.timestamp;
      const closes = result?.indicators?.quote?.[0]?.close;
      if (!timestamps || !closes) throw new Error('No history data');
      const points = timestamps.map((t, i) => ({
        t: t * 1000,
        c: closes[i] ? parseFloat(closes[i].toFixed(2)) : null
      })).filter(p => p.c !== null);
      res.setHeader('Cache-Control', 's-maxage=3600');
      return res.status(200).json({ history: points });
    }

    // Current price
    res.setHeader('Cache-Control', 's-maxage=300');
    const url = 'https://query1.finance.yahoo.com/v8/finance/chart/KC=F?interval=1d&range=5d';
    const r = await fetch(url, { headers });
    if (!r.ok) throw new Error('Yahoo fetch failed: ' + r.status);
    const data = await r.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta) throw new Error('No data');
    const price = meta.regularMarketPrice;
    const prevClose = meta.chartPreviousClose || meta.previousClose;
    const change = price - prevClose;
    res.status(200).json({
      price: price.toFixed(2),
      prevClose: prevClose.toFixed(2),
      change: change.toFixed(2),
      changePct: ((change / prevClose) * 100).toFixed(2),
      high: meta.regularMarketDayHigh?.toFixed(2) || null,
      low: meta.regularMarketDayLow?.toFixed(2) || null,
      time: meta.regularMarketTime ? new Date(meta.regularMarketTime * 1000).toISOString() : null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

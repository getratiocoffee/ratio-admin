export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300'); // cache 5 mins

  try {
    // Yahoo Finance - KC=F is Coffee C Futures
    const url = 'https://query1.finance.yahoo.com/v8/finance/chart/KC=F?interval=1d&range=5d';
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) throw new Error('Yahoo fetch failed: ' + response.status);

    const data = await response.json();
    const meta = data?.chart?.result?.[0]?.meta;
    const quotes = data?.chart?.result?.[0]?.indicators?.quote?.[0];
    const timestamps = data?.chart?.result?.[0]?.timestamp;

    if (!meta || !quotes) throw new Error('No data');

    const price = meta.regularMarketPrice;
    const prevClose = meta.chartPreviousClose || meta.previousClose;
    const change = price - prevClose;
    const changePct = (change / prevClose) * 100;
    const dayHigh = meta.regularMarketDayHigh;
    const dayLow = meta.regularMarketDayLow;
    const time = meta.regularMarketTime;

    res.status(200).json({
      price: price.toFixed(2),
      prevClose: prevClose.toFixed(2),
      change: change.toFixed(2),
      changePct: changePct.toFixed(2),
      high: dayHigh ? dayHigh.toFixed(2) : null,
      low: dayLow ? dayLow.toFixed(2) : null,
      time: time ? new Date(time * 1000).toISOString() : null,
      currency: meta.currency,
      symbol: meta.symbol
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

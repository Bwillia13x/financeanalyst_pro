// Market Data Normalizer
// Maps backend/RT payload shapes into the widget/validator expected shape
// - Maps price -> currentPrice
// - Derives change and changePercent when missing
// - Provides fallbacks for dayHigh/dayLow/volume/marketCap

export const normalizeQuote = (raw = {}, prevWidget = {}) => {
  const price = typeof raw.price === 'number'
    ? raw.price
    : (typeof raw.currentPrice === 'number' ? raw.currentPrice : undefined);

  const previousClose = typeof raw.previousClose === 'number'
    ? raw.previousClose
    : (typeof prevWidget.currentValue === 'number' ? prevWidget.currentValue : undefined);

  const change = typeof raw.change === 'number'
    ? raw.change
    : (typeof price === 'number' && typeof previousClose === 'number'
      ? price - previousClose
      : undefined);

  const changePercent = typeof raw.changePercent === 'number'
    ? raw.changePercent
    : (typeof change === 'number' && typeof previousClose === 'number' && previousClose !== 0
      ? (change / previousClose) * 100
      : undefined);

  return {
    symbol: raw.symbol || prevWidget.symbol,
    currentPrice: price,
    previousClose,
    change,
    changePercent,
    volume: raw.volume ?? prevWidget.volume ?? null,
    marketCap: raw.marketCap ?? prevWidget.marketCap ?? null,
    dayHigh: raw.dayHigh ?? prevWidget.dayHigh ?? null,
    dayLow: raw.dayLow ?? prevWidget.dayLow ?? null,
    source: raw.source || 'BACKEND_PROXY',
    timestamp: raw.timestamp || new Date().toISOString()
  };
};

export default { normalizeQuote };

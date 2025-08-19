import { describe, it, expect } from 'vitest';

import { normalizeQuote } from '../marketDataNormalizer';

describe('normalizeQuote', () => {
  it('maps price to currentPrice', () => {
    const raw = { symbol: 'AAPL', price: 150, previousClose: 148 };
    const n = normalizeQuote(raw, {});
    expect(n.currentPrice).toBe(150);
    expect(n.symbol).toBe('AAPL');
  });

  it('derives change and changePercent when missing and previousClose present', () => {
    const raw = { price: 105, previousClose: 100 };
    const n = normalizeQuote(raw, {});
    expect(n.change).toBeCloseTo(5, 6);
    expect(n.changePercent).toBeCloseTo(5, 6);
  });

  it('derives previousClose from prevWidget.currentValue if missing', () => {
    const raw = { price: 210 };
    const prev = { currentValue: 200 };
    const n = normalizeQuote(raw, prev);
    expect(n.previousClose).toBe(200);
    expect(n.change).toBeCloseTo(10, 6);
    expect(n.changePercent).toBeCloseTo(5, 6);
  });

  it('keeps provided change and changePercent when present', () => {
    const raw = { price: 110, previousClose: 100, change: 12, changePercent: 12 };
    const n = normalizeQuote(raw, {});
    expect(n.change).toBe(12);
    expect(n.changePercent).toBe(12);
  });

  it('uses fallbacks for dayHigh/dayLow/volume/marketCap from prevWidget else null', () => {
    const raw = { price: 100 };
    const prev = { dayHigh: 120, dayLow: 90, volume: 5000000, marketCap: 1000000000 };
    const n1 = normalizeQuote(raw, prev);
    expect(n1.dayHigh).toBe(120);
    expect(n1.dayLow).toBe(90);
    expect(n1.volume).toBe(5000000);
    expect(n1.marketCap).toBe(1000000000);

    const n2 = normalizeQuote(raw, {});
    expect(n2.dayHigh).toBeNull();
    expect(n2.dayLow).toBeNull();
    expect(n2.volume).toBeNull();
    expect(n2.marketCap).toBeNull();
  });

  it('defaults source and timestamp when missing', () => {
    const raw = { price: 99 };
    const n = normalizeQuote(raw, {});
    expect(n.source).toBe('BACKEND_PROXY');
    expect(typeof n.timestamp).toBe('string');
  });

  it('accepts raw.currentPrice too', () => {
    const raw = { currentPrice: 123.45, previousClose: 120 };
    const n = normalizeQuote(raw, {});
    expect(n.currentPrice).toBe(123.45);
    expect(n.change).toBeCloseTo(3.45, 6);
  });

  it('does not compute changePercent if previousClose is zero or undefined', () => {
    const raw1 = { price: 100, previousClose: 0 };
    const n1 = normalizeQuote(raw1, {});
    expect(n1.change).toBe(100);
    expect(n1.changePercent).toBeUndefined();

    const raw2 = { price: 100 };
    const n2 = normalizeQuote(raw2, {});
    expect(n2.change).toBeUndefined();
    expect(n2.changePercent).toBeUndefined();
  });
});

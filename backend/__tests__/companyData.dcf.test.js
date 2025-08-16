import { mapFmpDcfResponse } from '../routes/companyData.js';

describe('mapFmpDcfResponse', () => {
  test('handles "Stock Price" key from FMP', () => {
    const input = {
      symbol: 'AAPL',
      dcf: '165.42',
      date: '2025-08-15',
      'Stock Price': '187.35'
    };

    const out = mapFmpDcfResponse(input);

    expect(out).toEqual({
      symbol: 'AAPL',
      dcfValue: 165.42,
      stockPrice: 187.35,
      date: '2025-08-15'
    });
  });

  test('handles Stock_Price variant', () => {
    const input = {
      symbol: 'MSFT',
      dcf: 310.1,
      date: '2025-08-15',
      Stock_Price: 320.55
    };

    const out = mapFmpDcfResponse(input);

    expect(out).toEqual({
      symbol: 'MSFT',
      dcfValue: 310.1,
      stockPrice: 320.55,
      date: '2025-08-15'
    });
  });

  test('handles stockPrice camelCase variant', () => {
    const input = {
      symbol: 'GOOGL',
      dcf: '140.00',
      date: '2025-08-15',
      stockPrice: '155.25'
    };

    const out = mapFmpDcfResponse(input);

    expect(out).toEqual({
      symbol: 'GOOGL',
      dcfValue: 140.0,
      stockPrice: 155.25,
      date: '2025-08-15'
    });
  });

  test('returns null for stockPrice when no key present', () => {
    const input = {
      symbol: 'AMZN',
      dcf: '180.5',
      date: '2025-08-15'
    };

    const out = mapFmpDcfResponse(input);

    expect(out).toEqual({
      symbol: 'AMZN',
      dcfValue: 180.5,
      stockPrice: null,
      date: '2025-08-15'
    });
  });

  test('returns null for dcfValue when missing', () => {
    const input = {
      symbol: 'NVDA',
      date: '2025-08-15',
      stockPrice: '800.00'
    };

    const out = mapFmpDcfResponse(input);

    expect(out).toEqual({
      symbol: 'NVDA',
      dcfValue: null,
      stockPrice: 800.0,
      date: '2025-08-15'
    });
  });
});

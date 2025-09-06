import apiService from './apiService.js';

let started = false;

async function warmupOnce() {
  try {
    const tasks = [
      () => apiService.makeApiRequest({ service: 'yahoo', endpoint: 'AAPL', params: { range: '1d', interval: '1m' }, cacheType: 'market', cacheTtl: 60 }).catch(() => null),
      () => apiService.makeApiRequest({ service: 'yahoo', endpoint: 'MSFT', params: { range: '1d', interval: '1m' }, cacheType: 'market', cacheTtl: 60 }).catch(() => null),
      () => apiService.makeApiRequest({ service: 'fmp', endpoint: '/income-statement/AAPL', params: { period: 'annual', limit: 3 }, cacheType: 'financial', cacheTtl: 21600 }).catch(() => null),
      () => apiService.makeApiRequest({ service: 'fred', endpoint: 'series/observations', params: { series_id: 'DGS10', limit: 1, sort_order: 'desc' }, cacheType: 'economic', cacheTtl: 1800 }).catch(() => null)
    ];
    await Promise.all(tasks.map(fn => fn()));
  } catch {
    // swallow
  }
}

export function startBackgroundRefresh() {
  if (started) return;
  if (process.env.BACKGROUND_REFRESH !== 'true') return;
  if (process.env.NODE_ENV === 'test') return;
  started = true;
  const intervalSec = parseInt(process.env.BACKGROUND_REFRESH_INTERVAL_SEC || '300', 10); // 5 min
  console.log(`🔄 Background refresh enabled (every ${intervalSec}s)`);
  // initial warmup
  warmupOnce();
  setInterval(warmupOnce, intervalSec * 1000).unref?.();
}

export default { startBackgroundRefresh };


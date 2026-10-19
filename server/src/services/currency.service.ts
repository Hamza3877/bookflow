import { SUPPORTED_CURRENCIES } from '../config/constants';

// Prices are stored in PKR. These rates are only for showing an estimate in
// another currency. Live rates come from a free API; if it is down we use these.
const FALLBACK_RATES: Record<string, number> = {
  PKR: 1,
  USD: 0.0036,
  EUR: 0.0033,
  GBP: 0.0028,
  AED: 0.013,
};

let cache: { rates: Record<string, number>; fetchedAt: number; live: boolean } | null = null;
const SIX_HOURS = 6 * 60 * 60 * 1000;

export async function getRates() {
  if (cache && Date.now() - cache.fetchedAt < SIX_HOURS) return cache;

  try {
    const response = await fetch('https://open.er-api.com/v6/latest/PKR', { signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error(`Rates API returned ${response.status}`);
    const data = (await response.json()) as { rates?: Record<string, number> };
    const rates: Record<string, number> = {};
    for (const code of SUPPORTED_CURRENCIES) {
      const value = data.rates?.[code];
      if (typeof value !== 'number') throw new Error(`Missing rate for ${code}`);
      rates[code] = value;
    }
    cache = { rates, fetchedAt: Date.now(), live: true };
  } catch (err) {
    console.warn('Using fallback currency rates:', (err as Error).message);
    cache = { rates: FALLBACK_RATES, fetchedAt: Date.now() - SIX_HOURS + 10 * 60 * 1000, live: false };
  }
  return cache;
}

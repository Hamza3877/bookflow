import { describe, expect, it } from 'vitest';
import { calculatePrice } from '../src/services/pricing.service';
import { canTransition } from '../src/services/bookingState';
import { parseDate } from '../src/utils/dates';

const rules = { pricePerDay: 10000, weekendMultiplier: 1.2, longStayDiscountPercent: 10, currency: 'PKR' };
const d = (text: string) => parseDate(text)!;

describe('calculatePrice', () => {
  it('charges the normal price on weekdays', () => {
    // Mon 2026-11-02 to Wed 2026-11-04 = 2 weekday nights
    const price = calculatePrice(rules, d('2026-11-02'), d('2026-11-04'));
    expect(price.nights).toBe(2);
    expect(price.weekendSurcharge).toBe(0);
    expect(price.total).toBe(20000);
  });

  it('adds a surcharge for Friday and Saturday nights', () => {
    // Fri 2026-11-06 to Sun 2026-11-08 = Fri + Sat nights
    const price = calculatePrice(rules, d('2026-11-06'), d('2026-11-08'));
    expect(price.weekendSurcharge).toBe(4000);
    expect(price.total).toBe(24000);
  });

  it('gives a discount for stays of 7 nights or more', () => {
    // Mon 2026-11-02 to Mon 2026-11-09 = 7 nights, 2 of them weekend nights
    const price = calculatePrice(rules, d('2026-11-02'), d('2026-11-09'));
    expect(price.nights).toBe(7);
    expect(price.discount).toBe(7400);
    expect(price.total).toBe(66600);
  });
});

describe('booking state machine', () => {
  it('allows the normal path', () => {
    expect(canTransition('HELD', 'CONFIRMED')).toBe(true);
    expect(canTransition('CONFIRMED', 'COMPLETED')).toBe(true);
  });
  it('blocks impossible moves', () => {
    expect(canTransition('CANCELLED', 'CONFIRMED')).toBe(false);
    expect(canTransition('EXPIRED', 'CONFIRMED')).toBe(false);
  });
});

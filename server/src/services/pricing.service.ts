import { countNights } from '../utils/dates';

export interface PriceRules {
  pricePerDay: number;
  weekendMultiplier: number; // 1.2 = Fri/Sat nights cost 20% more
  longStayDiscountPercent: number; // applied from 7 nights
  currency: string;
}

export interface PriceBreakdown {
  nights: number;
  baseTotal: number;
  weekendSurcharge: number;
  discount: number;
  total: number;
  currency: string;
}

export const LONG_STAY_FROM_NIGHTS = 7;

// Friday and Saturday nights are "weekend" nights.
function isWeekendNight(date: Date) {
  const day = date.getUTCDay();
  return day === 5 || day === 6;
}

// Pure function (no database) so it is easy to test and to explain.
export function calculatePrice(rules: PriceRules, start: Date, end: Date): PriceBreakdown {
  const nights = countNights(start, end);
  const baseTotal = rules.pricePerDay * nights;

  let weekendNights = 0;
  for (let i = 0; i < nights; i++) {
    const night = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    if (isWeekendNight(night)) weekendNights++;
  }
  const weekendSurcharge = Math.round(weekendNights * rules.pricePerDay * (rules.weekendMultiplier - 1));

  const subtotal = baseTotal + weekendSurcharge;
  const discount =
    nights >= LONG_STAY_FROM_NIGHTS ? Math.round((subtotal * rules.longStayDiscountPercent) / 100) : 0;

  return {
    nights,
    baseTotal,
    weekendSurcharge,
    discount,
    total: subtotal - discount,
    currency: rules.currency,
  };
}

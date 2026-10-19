import { BookingStatus } from '../types';

export function formatMoney(amountInPkr: number, currency: string, rates?: Record<string, number>) {
  const rate = currency === 'PKR' ? 1 : rates?.[currency] ?? 1;
  const shownCurrency = currency !== 'PKR' && !rates ? 'PKR' : currency;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: shownCurrency,
    maximumFractionDigits: 0,
  }).format(amountInPkr * (shownCurrency === 'PKR' ? 1 : rate));
}

export const STATUS_STYLES: Record<BookingStatus, { label: string; className: string }> = {
  HELD: { label: 'Awaiting payment', className: 'bg-amber-100 text-amber-800' },
  CONFIRMED: { label: 'Confirmed', className: 'bg-emerald-100 text-emerald-800' },
  COMPLETED: { label: 'Completed', className: 'bg-slate-200 text-slate-700' },
  CANCELLED: { label: 'Cancelled', className: 'bg-rose-100 text-rose-800' },
  EXPIRED: { label: 'Expired', className: 'bg-slate-100 text-slate-500' },
};

export const TYPE_LABELS: Record<string, string> = {
  car: 'Car',
  villa: 'Villa',
  apartment: 'Apartment',
  studio: 'Studio',
};

export const CITIES: Record<string, { lat: number; lng: number }> = {
  Karachi: { lat: 24.8607, lng: 67.0011 },
  Lahore: { lat: 31.5204, lng: 74.3587 },
  Islamabad: { lat: 33.6844, lng: 73.0479 },
  Murree: { lat: 33.907, lng: 73.3943 },
  Hunza: { lat: 36.3167, lng: 74.6573 },
  Skardu: { lat: 35.2971, lng: 75.6333 },
};

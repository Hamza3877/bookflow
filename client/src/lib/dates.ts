// All dates in the app are plain "YYYY-MM-DD" text, handled in UTC,
// so there are no time-zone surprises between the browser and the server.

export function todayText(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDays(text: string, days: number): string {
  const date = new Date(`${text}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function nightsBetween(start: string, end: string): number {
  return Math.round((Date.parse(end) - Date.parse(start)) / 86400000);
}

export function formatDate(text: string, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) {
  return new Date(`${text.slice(0, 10)}T00:00:00.000Z`).toLocaleDateString('en-GB', { ...options, timeZone: 'UTC' });
}

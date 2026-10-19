const DAY_MS = 24 * 60 * 60 * 1000;

// "2026-11-05" -> Date at midnight UTC. Returns null if the text is not a real date.
export function parseDate(text: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const date = new Date(`${text}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function toDateText(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function todayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

// Every night from start (included) to end (excluded).
export function eachNight(start: Date, end: Date): Date[] {
  const nights: Date[] = [];
  for (let t = start.getTime(); t < end.getTime(); t += DAY_MS) {
    nights.push(new Date(t));
  }
  return nights;
}

export function countNights(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / DAY_MS);
}

import { LISTING_TYPES } from '../config/constants';
import { aiEnabled, env } from '../config/env';
import { toDateText, todayUtc } from '../utils/dates';

export interface SearchFilters {
  city?: string;
  type?: string;
  maxPrice?: number;
  guests?: number;
  startDate?: string;
  endDate?: string;
}

const KNOWN_CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Murree', 'Hunza', 'Skardu'];
const TYPE_WORDS: Record<string, string> = {
  car: 'car', suv: 'car', sedan: 'car', van: 'car', vehicle: 'car',
  villa: 'villa', house: 'villa', cottage: 'villa',
  apartment: 'apartment', flat: 'apartment',
  studio: 'studio',
};

const addDays = (date: Date, days: number) => new Date(date.getTime() + days * 86400000);

// Fallback that needs no API key: simple keyword and pattern matching.
export function parseWithRules(query: string): SearchFilters {
  const text = query.toLowerCase();
  const filters: SearchFilters = {};

  const city = KNOWN_CITIES.find((c) => text.includes(c.toLowerCase()));
  if (city) filters.city = city;

  for (const [word, type] of Object.entries(TYPE_WORDS)) {
    if (new RegExp(`\\b${word}s?\\b`).test(text)) {
      filters.type = type;
      break;
    }
  }

  const price = text.match(/(?:under|below|less than|max|upto|up to)\s*(?:rs\.?|pkr)?\s*(\d+(?:\.\d+)?)\s*(k)?/);
  if (price) filters.maxPrice = Math.round(Number(price[1]) * (price[2] ? 1000 : 1));

  const guests = text.match(/(\d+)\s*(?:people|persons|guests|pax|seater|seats?|-seater)/) || text.match(/for\s+(\d+)\b/);
  if (guests) filters.guests = Number(guests[1]);

  const today = todayUtc();
  if (text.includes('weekend')) {
    const daysToFriday = (5 - today.getUTCDay() + 7) % 7;
    const friday = addDays(today, daysToFriday);
    filters.startDate = toDateText(friday);
    filters.endDate = toDateText(addDays(friday, 2));
  } else if (text.includes('tomorrow')) {
    filters.startDate = toDateText(addDays(today, 1));
    filters.endDate = toDateText(addDays(today, 2));
  }
  return filters;
}

// Uses Google Gemini (free tier) to understand the sentence. Any failure falls back to rules.
async function parseWithGemini(query: string): Promise<SearchFilters> {
  const prompt = `Today is ${toDateText(todayUtc())}. Convert this rental search request into JSON.
Allowed keys: city (string), type (one of ${LISTING_TYPES.join(', ')}), maxPrice (number, PKR per night),
guests (number), startDate (YYYY-MM-DD), endDate (YYYY-MM-DD, check-out day).
Only include keys the request clearly mentions. Reply with JSON only.
Request: "${query.replace(/"/g, "'")}"`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY! },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0 },
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`Gemini returned ${response.status}`);

  const data = (await response.json()) as any;
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
  const parsed = JSON.parse(raw);

  // Keep only values we trust, whatever the model sent back.
  const filters: SearchFilters = {};
  if (typeof parsed.city === 'string') filters.city = parsed.city;
  if (LISTING_TYPES.includes(parsed.type)) filters.type = parsed.type;
  if (Number(parsed.maxPrice) > 0) filters.maxPrice = Number(parsed.maxPrice);
  if (Number(parsed.guests) > 0) filters.guests = Number(parsed.guests);
  const isDate = (v: unknown) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
  if (isDate(parsed.startDate) && isDate(parsed.endDate)) {
    filters.startDate = parsed.startDate;
    filters.endDate = parsed.endDate;
  }
  return filters;
}

export async function parseSearchQuery(query: string): Promise<{ filters: SearchFilters; source: 'ai' | 'rules' }> {
  if (aiEnabled) {
    try {
      return { filters: await parseWithGemini(query), source: 'ai' };
    } catch (err) {
      console.warn('AI search failed, using rules:', (err as Error).message);
    }
  }
  return { filters: parseWithRules(query), source: 'rules' };
}

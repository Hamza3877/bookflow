import { z } from 'zod';
import { LISTING_TYPES } from '../../config/constants';

export const listingBodySchema = z.object({
  title: z.string().trim().min(5, 'Title is too short').max(120),
  description: z.string().trim().min(20, 'Write at least 20 characters').max(4000),
  type: z.enum(LISTING_TYPES),
  city: z.string().trim().min(2).max(60),
  address: z.string().trim().max(200).default(''),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  pricePerDay: z.coerce.number().int().min(1).max(10_000_000),
  maxGuests: z.coerce.number().int().min(1).max(30),
  images: z.array(z.string().url()).min(1, 'Add at least one image').max(8),
  amenities: z.array(z.string().trim().min(1).max(40)).max(15).default([]),
  weekendMultiplier: z.coerce.number().min(1).max(3).default(1.2),
  longStayDiscountPercent: z.coerce.number().min(0).max(50).default(10),
  isActive: z.boolean().default(true),
});

const dateText = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

// Query-string values arrive as text, so we use z.coerce to turn them into numbers.
export const searchSchema = z.object({
  q: z.string().trim().max(80).optional(),
  city: z.string().trim().max(60).optional(),
  type: z.enum(LISTING_TYPES).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  guests: z.coerce.number().int().min(1).optional(),
  startDate: dateText.optional(),
  endDate: dateText.optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().min(1).max(500).default(25),
  sort: z.enum(['popular', 'priceAsc', 'priceDesc', 'rating']).default('popular'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(30).default(9),
});

export const activeSchema = z.object({ isActive: z.boolean() });

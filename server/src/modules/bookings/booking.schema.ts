import { z } from 'zod';

const dateText = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the format YYYY-MM-DD');

export const quoteSchema = z.object({
  listingId: z.string().length(24, 'Invalid listing'),
  startDate: dateText,
  endDate: dateText,
});

export const createBookingSchema = quoteSchema.extend({
  guests: z.coerce.number().int().min(1).max(30),
});

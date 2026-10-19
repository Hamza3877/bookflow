export const ROLES = ['customer', 'owner', 'admin'] as const;
export type Role = (typeof ROLES)[number];

export const LISTING_TYPES = ['car', 'villa', 'apartment', 'studio'] as const;
export type ListingType = (typeof LISTING_TYPES)[number];

export const BOOKING_STATUSES = ['HELD', 'CONFIRMED', 'CANCELLED', 'EXPIRED', 'COMPLETED'] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

// How long a customer has to pay after picking dates.
export const HOLD_MINUTES = 10;
// Longest single booking, in nights.
export const MAX_NIGHTS = 30;

export const SUPPORTED_CURRENCIES = ['PKR', 'USD', 'EUR', 'GBP', 'AED'] as const;

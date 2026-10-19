export type Role = 'customer' | 'owner' | 'admin';
export type ListingType = 'car' | 'villa' | 'apartment' | 'studio';
export type BookingStatus = 'HELD' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED' | 'COMPLETED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  tenantId?: string;
}

export interface Listing {
  id: string;
  tenantId: string;
  title: string;
  description: string;
  type: ListingType;
  city: string;
  address: string;
  lat: number;
  lng: number;
  pricePerDay: number;
  currency: string;
  maxGuests: number;
  images: string[];
  amenities: string[];
  weekendMultiplier: number;
  longStayDiscountPercent: number;
  isActive: boolean;
  ratingAvg: number;
  ratingCount: number;
  business?: { id: string; name: string } | null;
}

export interface PriceBreakdown {
  nights: number;
  baseTotal: number;
  weekendSurcharge: number;
  discount: number;
  total: number;
  currency: string;
}

export interface Booking {
  id: string;
  reference: string;
  listingId: string;
  listing?: { id: string; title: string; city: string; type: ListingType; image?: string };
  customerName?: string;
  startDate: string;
  endDate: string;
  guests: number;
  status: BookingStatus;
  price: PriceBreakdown;
  holdExpiresAt?: string;
  paidAt?: string;
  createdAt?: string;
  reviewed?: boolean;
}

export interface Review {
  id: string;
  rating: number;
  comment: string;
  author: string;
  createdAt: string;
}

export interface SearchFilters {
  city?: string;
  type?: string;
  maxPrice?: number;
  guests?: number;
  startDate?: string;
  endDate?: string;
}

export interface OwnerDashboard {
  totalRevenue: number;
  totalBookings: number;
  activeListings: number;
  occupancyPercent: number;
  revenueByMonth: { month: string; revenue: number }[];
  statusCounts: { status: BookingStatus; count: number }[];
  topListings: { listingId: string; title: string; revenue: number; bookings: number }[];
  upcomingCheckIns: { id: string; reference: string; startDate: string; guests: number; listingTitle: string; customerName: string }[];
}

export interface Paged<T> {
  items: T[];
  page: number;
  total: number;
  totalPages: number;
}

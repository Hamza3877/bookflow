import { http } from './client';
import { Booking, Listing, OwnerDashboard, Paged, PriceBreakdown, Review, SearchFilters, User } from '../types';

// Every call to the server lives here, so pages never build URLs by hand.

export interface SessionResponse {
  user: User;
  accessToken: string;
}

export const authApi = {
  login: (body: { email: string; password: string }) => http.post<SessionResponse>('/auth/login', body).then((r) => r.data),
  register: (body: Record<string, unknown>) => http.post<SessionResponse>('/auth/register', body).then((r) => r.data),
  refresh: () => http.post<SessionResponse>('/auth/refresh').then((r) => r.data),
  logout: () => http.post('/auth/logout').then((r) => r.data),
};

export const listingsApi = {
  search: (params: Record<string, string>) => http.get<Paged<Listing>>('/listings', { params }).then((r) => r.data),
  get: (id: string) => http.get<Listing>(`/listings/${id}`).then((r) => r.data),
  availability: (id: string) => http.get<{ bookedDates: string[] }>(`/listings/${id}/availability`).then((r) => r.data),
  reviews: (id: string) => http.get<{ items: Review[] }>(`/listings/${id}/reviews`).then((r) => r.data),
  mine: () => http.get<{ items: Listing[] }>('/listings/mine').then((r) => r.data),
  create: (body: unknown) => http.post<Listing>('/listings', body).then((r) => r.data),
  update: (id: string, body: unknown) => http.put<Listing>(`/listings/${id}`, body).then((r) => r.data),
  setActive: (id: string, isActive: boolean) => http.patch<Listing>(`/listings/${id}/active`, { isActive }).then((r) => r.data),
  remove: (id: string) => http.delete(`/listings/${id}`).then((r) => r.data),
};

export const bookingsApi = {
  quote: (body: { listingId: string; startDate: string; endDate: string }) =>
    http.post<{ price: PriceBreakdown; available: boolean }>('/bookings/quote', body).then((r) => r.data),
  create: (body: { listingId: string; startDate: string; endDate: string; guests: number }) =>
    http.post<Booking>('/bookings', body).then((r) => r.data),
  mine: () => http.get<{ items: Booking[] }>('/bookings/mine').then((r) => r.data),
  tenant: (status?: string) => http.get<{ items: Booking[] }>('/bookings/tenant', { params: status ? { status } : {} }).then((r) => r.data),
  get: (id: string) => http.get<Booking>(`/bookings/${id}`).then((r) => r.data),
  cancel: (id: string) => http.post<Booking>(`/bookings/${id}/cancel`).then((r) => r.data),
  checkout: (id: string) => http.post<{ url: string | null }>(`/bookings/${id}/checkout`).then((r) => r.data),
  payTest: (id: string) => http.post<Booking>(`/bookings/${id}/pay-test`).then((r) => r.data),
  verifyPayment: (id: string) => http.post<Booking>(`/bookings/${id}/verify-payment`).then((r) => r.data),
};

export const reviewsApi = {
  add: (listingId: string, body: { bookingId: string; rating: number; comment: string }) =>
    http.post(`/listings/${listingId}/reviews`, body).then((r) => r.data),
};

export const dashboardApi = {
  owner: () => http.get<OwnerDashboard>('/dashboard/owner').then((r) => r.data),
};

export const adminApi = {
  overview: () => http.get<{ users: number; tenants: number; listings: number; bookings: number; revenue: number }>('/admin/overview').then((r) => r.data),
  users: () => http.get<{ items: { id: string; name: string; email: string; role: string; createdAt: string }[] }>('/admin/users').then((r) => r.data),
  tenants: () =>
    http.get<{ items: { id: string; name: string; city: string; owner: string; listings: number; createdAt: string }[] }>('/admin/tenants').then((r) => r.data),
  audit: () =>
    http.get<{ items: { id: string; actor: string; action: string; entity: string; entityId?: string; createdAt: string }[] }>('/admin/audit').then((r) => r.data),
};

export const aiApi = {
  parseSearch: (query: string) =>
    http.post<{ filters: SearchFilters; source: 'ai' | 'rules' }>('/ai/parse-search', { query }).then((r) => r.data),
};

export const currencyApi = {
  rates: () => http.get<{ base: string; rates: Record<string, number>; live: boolean }>('/currency/rates').then((r) => r.data),
};

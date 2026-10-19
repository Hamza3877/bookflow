import { Request, Response } from 'express';
import { FilterQuery, Types } from 'mongoose';
import { BookedDay } from '../../models/BookedDay';
import { Booking } from '../../models/Booking';
import { Listing } from '../../models/Listing';
import { Tenant } from '../../models/Tenant';
import { AppError } from '../../utils/AppError';
import { asyncHandler } from '../../utils/asyncHandler';
import { audit } from '../../utils/audit';
import { parseDate, todayUtc } from '../../utils/dates';
import { searchSchema } from './listing.schema';

const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Turns the Mongo document into the shape the website uses (lat/lng instead of GeoJSON).
function toDto(listing: InstanceType<typeof Listing>) {
  const obj = listing.toObject();
  const [lng, lat] = obj.location?.coordinates ?? [0, 0];
  const { location, __v, ...rest } = obj as any;
  return { ...rest, id: listing._id.toString(), lat, lng };
}

// Converts the form fields (lat, lng) back into what we store.
function toDocument(body: any) {
  const { lat, lng, ...rest } = body;
  return { ...rest, location: { type: 'Point', coordinates: [lng, lat] } };
}

const SORTS = {
  popular: { ratingCount: -1, ratingAvg: -1 },
  priceAsc: { pricePerDay: 1 },
  priceDesc: { pricePerDay: -1 },
  rating: { ratingAvg: -1, ratingCount: -1 },
} as const;

export const searchListings = asyncHandler(async (req: Request, res: Response) => {
  const f = searchSchema.parse(req.query);
  const filter: FilterQuery<any> = { isActive: true };

  if (f.q) {
    const regex = new RegExp(escapeRegex(f.q), 'i');
    filter.$or = [{ title: regex }, { city: regex }, { description: regex }];
  }
  if (f.city) filter.city = new RegExp(`^${escapeRegex(f.city)}$`, 'i');
  if (f.type) filter.type = f.type;
  if (f.guests) filter.maxGuests = { $gte: f.guests };
  if (f.minPrice !== undefined || f.maxPrice !== undefined) {
    filter.pricePerDay = {
      ...(f.minPrice !== undefined && { $gte: f.minPrice }),
      ...(f.maxPrice !== undefined && { $lte: f.maxPrice }),
    };
  }
  // "Near me": everything within radiusKm of the point (6378.1 = earth radius in km)
  if (f.lat !== undefined && f.lng !== undefined) {
    filter.location = { $geoWithin: { $centerSphere: [[f.lng, f.lat], f.radiusKm / 6378.1] } };
  }

  // Availability: hide listings that have any booked night inside the chosen dates.
  if (f.startDate && f.endDate) {
    const start = parseDate(f.startDate);
    const end = parseDate(f.endDate);
    if (!start || !end || end <= start) throw new AppError(400, 'Check-out must be after check-in');
    const busyIds = await BookedDay.distinct('listingId', { date: { $gte: start, $lt: end } });
    filter._id = { $nin: busyIds };
  }

  const [items, total] = await Promise.all([
    Listing.find(filter)
      .sort(SORTS[f.sort] as any)
      .skip((f.page - 1) * f.limit)
      .limit(f.limit),
    Listing.countDocuments(filter),
  ]);

  res.json({
    items: items.map(toDto),
    page: f.page,
    total,
    totalPages: Math.max(1, Math.ceil(total / f.limit)),
  });
});

export const getListing = asyncHandler(async (req: Request, res: Response) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) throw new AppError(404, 'Listing not found');
  const tenant = await Tenant.findById(listing.tenantId);
  res.json({ ...toDto(listing), business: tenant ? { id: tenant._id.toString(), name: tenant.name } : null });
});

// Booked nights for the calendar (today until 1 year ahead).
export const getAvailability = asyncHandler(async (req: Request, res: Response) => {
  const from = todayUtc();
  const to = new Date(from.getTime() + 365 * 86400000);
  const days = await BookedDay.find({ listingId: req.params.id, date: { $gte: from, $lt: to } }).select('date');
  res.json({ bookedDates: days.map((d) => d.date.toISOString().slice(0, 10)) });
});

export const myListings = asyncHandler(async (req: Request, res: Response) => {
  const listings = await Listing.find({ tenantId: req.user!.tenantId }).sort({ createdAt: -1 });
  res.json({ items: listings.map(toDto) });
});

export const createListing = asyncHandler(async (req: Request, res: Response) => {
  const listing = await Listing.create({ ...toDocument(req.body), tenantId: req.user!.tenantId });
  audit(req.user!.id, 'listing.create', 'Listing', listing._id.toString());
  res.status(201).json(toDto(listing));
});

// Owners may only touch listings that belong to their own business.
async function findOwnListing(req: Request) {
  const listing = await Listing.findById(req.params.id);
  if (!listing) throw new AppError(404, 'Listing not found');
  if (listing.tenantId.toString() !== req.user!.tenantId) throw new AppError(403, 'This is not your listing');
  return listing;
}

export const updateListing = asyncHandler(async (req: Request, res: Response) => {
  const listing = await findOwnListing(req);
  listing.set(toDocument(req.body));
  await listing.save();
  audit(req.user!.id, 'listing.update', 'Listing', listing._id.toString());
  res.json(toDto(listing));
});

// Quick on/off switch used by the "Active" toggle in the owner's listing table.
export const setListingActive = asyncHandler(async (req: Request, res: Response) => {
  const listing = await findOwnListing(req);
  listing.isActive = req.body.isActive;
  await listing.save();
  audit(req.user!.id, listing.isActive ? 'listing.activate' : 'listing.deactivate', 'Listing', listing._id.toString());
  res.json(toDto(listing));
});

export const deleteListing = asyncHandler(async (req: Request, res: Response) => {
  const listing = await findOwnListing(req);
  if (await Booking.exists({ listingId: listing._id as Types.ObjectId })) {
    throw new AppError(409, 'This listing has bookings. Deactivate it instead of deleting.');
  }
  await listing.deleteOne();
  audit(req.user!.id, 'listing.delete', 'Listing', listing._id.toString());
  res.json({ ok: true });
});

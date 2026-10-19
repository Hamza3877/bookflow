import { Types } from 'mongoose';
import { BookingStatus, HOLD_MINUTES, MAX_NIGHTS } from '../config/constants';
import { BookedDay } from '../models/BookedDay';
import { Booking } from '../models/Booking';
import { Listing } from '../models/Listing';
import { AppError } from '../utils/AppError';
import { countNights, eachNight, todayUtc } from '../utils/dates';
import { assertTransition } from './bookingState';
import { calculatePrice } from './pricing.service';

type ListingDoc = InstanceType<typeof Listing>;
type BookingDoc = InstanceType<typeof Booking>;

function makeReference() {
  return 'BF-' + Math.random().toString(36).slice(2, 8).toUpperCase();
}

// Shared checks for the quote and the real booking.
export function validateStay(listing: ListingDoc, start: Date, end: Date, guests?: number) {
  if (!listing.isActive) throw new AppError(400, 'This listing is not available right now');
  if (start < todayUtc()) throw new AppError(400, 'Check-in cannot be in the past');
  const nights = countNights(start, end);
  if (nights < 1) throw new AppError(400, 'Check-out must be after check-in');
  if (nights > MAX_NIGHTS) throw new AppError(400, `You can book at most ${MAX_NIGHTS} nights at a time`);
  if (guests && guests > listing.maxGuests) {
    throw new AppError(400, `This listing allows up to ${listing.maxGuests} guests`);
  }
}

export function quoteFor(listing: ListingDoc, start: Date, end: Date) {
  return calculatePrice(
    {
      pricePerDay: listing.pricePerDay,
      weekendMultiplier: listing.weekendMultiplier,
      longStayDiscountPercent: listing.longStayDiscountPercent,
      currency: listing.currency,
    },
    start,
    end
  );
}

// Reserve every night. The unique index on BookedDay throws error 11000
// if any night is already taken, and then we undo what we inserted.
async function reserveNights(listingId: Types.ObjectId, bookingId: Types.ObjectId, start: Date, end: Date) {
  const docs = eachNight(start, end).map((date) => ({ listingId, bookingId, date }));
  try {
    await BookedDay.insertMany(docs, { ordered: true });
  } catch (err: any) {
    await BookedDay.deleteMany({ bookingId });
    if (err?.code === 11000 || err?.writeErrors) {
      throw new AppError(409, 'Sorry, some of those dates were just booked. Please pick other dates.', 'DATES_TAKEN');
    }
    throw err;
  }
}

export async function releaseNights(bookingId: Types.ObjectId | string) {
  await BookedDay.deleteMany({ bookingId });
}

// Step 1 of booking: hold the dates for HOLD_MINUTES so the customer can pay.
export async function createHold(params: {
  listing: ListingDoc;
  customerId: string;
  start: Date;
  end: Date;
  guests: number;
}) {
  const { listing, customerId, start, end, guests } = params;
  validateStay(listing, start, end, guests);

  const bookingId = new Types.ObjectId();
  await reserveNights(listing._id, bookingId, start, end);

  try {
    return await Booking.create({
      _id: bookingId,
      reference: makeReference(),
      listingId: listing._id,
      tenantId: listing.tenantId,
      customerId,
      startDate: start,
      endDate: end,
      guests,
      status: 'HELD',
      price: quoteFor(listing, start, end),
      holdExpiresAt: new Date(Date.now() + HOLD_MINUTES * 60 * 1000),
    });
  } catch (err) {
    await releaseNights(bookingId); // never leave dates locked without a booking
    throw err;
  }
}

// Marks a held booking as paid. Safe to call twice (Stripe may send the same event twice).
export async function confirmBooking(booking: BookingDoc) {
  if (booking.status === 'CONFIRMED') return booking;
  assertTransition(booking.status as BookingStatus, 'CONFIRMED');
  if (booking.holdExpiresAt && booking.holdExpiresAt < new Date()) {
    throw new AppError(409, 'This hold has expired. Please start a new booking.', 'HOLD_EXPIRED');
  }
  booking.status = 'CONFIRMED';
  booking.paidAt = new Date();
  booking.holdExpiresAt = undefined;
  return booking.save();
}

export async function cancelBooking(booking: BookingDoc) {
  assertTransition(booking.status as BookingStatus, 'CANCELLED');
  booking.status = 'CANCELLED';
  booking.cancelledAt = new Date();
  await booking.save();
  await releaseNights(booking._id);
  return booking;
}

// Background job helper: free the dates of holds nobody paid for.
export async function expireOldHolds() {
  const stale = await Booking.find({ status: 'HELD', holdExpiresAt: { $lt: new Date() } });
  for (const booking of stale) {
    booking.status = 'EXPIRED';
    await booking.save();
    await releaseNights(booking._id);
  }
  return stale.length;
}

// Background job helper: confirmed stays whose check-out day has arrived are completed.
export async function completeFinishedStays() {
  const result = await Booking.updateMany(
    { status: 'CONFIRMED', endDate: { $lte: todayUtc() } },
    { $set: { status: 'COMPLETED' } }
  );
  return result.modifiedCount;
}

import { Request, Response } from 'express';
import { stripeEnabled } from '../../config/env';
import { BookedDay } from '../../models/BookedDay';
import { Booking } from '../../models/Booking';
import { Listing } from '../../models/Listing';
import { Review } from '../../models/Review';
import { User } from '../../models/User';
import { cancelBooking, confirmBooking, createHold, quoteFor, validateStay } from '../../services/booking.service';
import { createCheckoutSession, retrieveSession } from '../../services/stripe.service';
import { AppError } from '../../utils/AppError';
import { asyncHandler } from '../../utils/asyncHandler';
import { audit } from '../../utils/audit';
import { eachNight, parseDate } from '../../utils/dates';

type BookingDoc = InstanceType<typeof Booking>;

function mustParseDates(startDate: string, endDate: string) {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  if (!start || !end) throw new AppError(400, 'Invalid dates');
  return { start, end };
}

// Shape sent to the website. Listing and customer info are added when we have them.
function toDto(
  booking: BookingDoc,
  extra: { listing?: any; customerName?: string; reviewed?: boolean } = {}
) {
  return {
    id: booking._id.toString(),
    reference: booking.reference,
    listingId: booking.listingId.toString(),
    listing: extra.listing
      ? {
          id: extra.listing._id.toString(),
          title: extra.listing.title,
          city: extra.listing.city,
          type: extra.listing.type,
          image: extra.listing.images?.[0],
        }
      : undefined,
    customerName: extra.customerName,
    startDate: booking.startDate.toISOString().slice(0, 10),
    endDate: booking.endDate.toISOString().slice(0, 10),
    guests: booking.guests,
    status: booking.status,
    price: booking.price,
    holdExpiresAt: booking.holdExpiresAt,
    paidAt: booking.paidAt,
    createdAt: (booking as any).createdAt,
    reviewed: extra.reviewed,
  };
}

// Adds listing / customer details to a list of bookings with only two extra queries.
async function decorate(bookings: BookingDoc[], withCustomers = false) {
  const listings = await Listing.find({ _id: { $in: bookings.map((b) => b.listingId) } });
  const listingMap = new Map(listings.map((l) => [l._id.toString(), l]));

  const customerMap = new Map<string, string>();
  if (withCustomers) {
    const users = await User.find({ _id: { $in: bookings.map((b) => b.customerId) } });
    users.forEach((u) => customerMap.set(u._id.toString(), u.name));
  }

  const reviews = await Review.find({ bookingId: { $in: bookings.map((b) => b._id) } }).select('bookingId');
  const reviewedIds = new Set(reviews.map((r) => r.bookingId.toString()));

  return bookings.map((b) =>
    toDto(b, {
      listing: listingMap.get(b.listingId.toString()),
      customerName: customerMap.get(b.customerId.toString()),
      reviewed: reviewedIds.has(b._id.toString()),
    })
  );
}

// Loads a booking and checks that the current user is allowed to see it.
async function loadBooking(req: Request, options: { customerOnly?: boolean } = {}) {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new AppError(404, 'Booking not found');

  const user = req.user!;
  const isCustomer = booking.customerId.toString() === user.id;
  const isBusinessOwner = user.role === 'owner' && booking.tenantId.toString() === user.tenantId;
  const isAdmin = user.role === 'admin';

  if (options.customerOnly ? !isCustomer : !(isCustomer || isBusinessOwner || isAdmin)) {
    throw new AppError(403, 'You cannot access this booking');
  }
  return booking;
}

// ---------- handlers ----------

// Price preview. Public, so visitors can see the cost before logging in.
export const quote = asyncHandler(async (req: Request, res: Response) => {
  const { listingId, startDate, endDate } = req.body;
  const { start, end } = mustParseDates(startDate, endDate);
  const listing = await Listing.findById(listingId);
  if (!listing) throw new AppError(404, 'Listing not found');

  validateStay(listing, start, end);
  const taken = await BookedDay.exists({
    listingId: listing._id,
    date: { $in: eachNight(start, end) },
  });
  res.json({ price: quoteFor(listing, start, end), available: !taken });
});

export const createBooking = asyncHandler(async (req: Request, res: Response) => {
  const { listingId, startDate, endDate, guests } = req.body;
  const { start, end } = mustParseDates(startDate, endDate);
  const listing = await Listing.findById(listingId);
  if (!listing) throw new AppError(404, 'Listing not found');

  const booking = await createHold({ listing, customerId: req.user!.id, start, end, guests });
  audit(req.user!.id, 'booking.hold', 'Booking', booking._id.toString());
  res.status(201).json(toDto(booking, { listing }));
});

export const myBookings = asyncHandler(async (req: Request, res: Response) => {
  const bookings = await Booking.find({ customerId: req.user!.id }).sort({ createdAt: -1 }).limit(100);
  res.json({ items: await decorate(bookings) });
});

export const tenantBookings = asyncHandler(async (req: Request, res: Response) => {
  const filter: Record<string, unknown> = { tenantId: req.user!.tenantId };
  if (typeof req.query.status === 'string' && req.query.status) filter.status = req.query.status;
  const bookings = await Booking.find(filter).sort({ createdAt: -1 }).limit(200);
  res.json({ items: await decorate(bookings, true) });
});

export const getBooking = asyncHandler(async (req: Request, res: Response) => {
  const booking = await loadBooking(req);
  const [item] = await decorate([booking]);
  res.json(item);
});

export const cancel = asyncHandler(async (req: Request, res: Response) => {
  const booking = await loadBooking(req);
  await cancelBooking(booking);
  audit(req.user!.id, 'booking.cancel', 'Booking', booking._id.toString());
  res.json(toDto(booking));
});

// Makes sure the booking can still be paid for.
function assertPayable(booking: BookingDoc) {
  if (booking.status !== 'HELD') throw new AppError(409, 'This booking is not waiting for payment');
  if (booking.holdExpiresAt && booking.holdExpiresAt < new Date()) {
    throw new AppError(409, 'This hold has expired. Please start a new booking.', 'HOLD_EXPIRED');
  }
}

// Starts a Stripe Checkout. Without a Stripe key we answer { url: null } and the website shows the test payment form.
export const checkout = asyncHandler(async (req: Request, res: Response) => {
  const booking = await loadBooking(req, { customerOnly: true });
  assertPayable(booking);

  if (!stripeEnabled) return res.json({ url: null });

  const [listing, customer] = await Promise.all([Listing.findById(booking.listingId), User.findById(booking.customerId)]);
  const session = await createCheckoutSession({
    bookingId: booking._id.toString(),
    reference: booking.reference,
    title: listing?.title ?? 'BookFlow stay',
    amount: booking.price!.total!,
    currency: booking.price!.currency!,
    customerEmail: customer!.email,
  });
  booking.stripeSessionId = session.id;
  await booking.save();
  res.json({ url: session.url });
});

// Built-in test payment, used only when Stripe is not connected.
export const payTest = asyncHandler(async (req: Request, res: Response) => {
  if (stripeEnabled) throw new AppError(400, 'Test payments are disabled while Stripe is connected');
  const booking = await loadBooking(req, { customerOnly: true });
  assertPayable(booking);
  await confirmBooking(booking);
  audit(req.user!.id, 'booking.paid', 'Booking', booking._id.toString(), { method: 'test' });
  res.json(toDto(booking));
});

// After Stripe redirects back, we double-check the payment with Stripe (works even without webhooks).
export const verifyPayment = asyncHandler(async (req: Request, res: Response) => {
  const booking = await loadBooking(req, { customerOnly: true });
  if (stripeEnabled && booking.stripeSessionId && booking.status === 'HELD') {
    const session = await retrieveSession(booking.stripeSessionId);
    if (session.payment_status === 'paid') {
      await confirmBooking(booking);
      audit(req.user!.id, 'booking.paid', 'Booking', booking._id.toString(), { method: 'stripe' });
    }
  }
  res.json(toDto(booking));
});

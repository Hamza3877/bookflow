import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { BookedDay } from '../../models/BookedDay';
import { Booking } from '../../models/Booking';
import { Listing } from '../../models/Listing';
import { User } from '../../models/User';
import { asyncHandler } from '../../utils/asyncHandler';
import { todayUtc } from '../../utils/dates';

const PAID = ['CONFIRMED', 'COMPLETED'];

// Last 6 month labels like "2026-05", so months with no sales still show as 0.
function lastSixMonths() {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (5 - i), 1));
    return d.toISOString().slice(0, 7);
  });
}

export const ownerDashboard = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = new Types.ObjectId(req.user!.tenantId);
  const months = lastSixMonths();
  const firstMonth = new Date(`${months[0]}-01T00:00:00.000Z`);
  const today = todayUtc();
  const in30Days = new Date(today.getTime() + 30 * 86400000);

  const [totals, monthly, statusRows, topRows, listings, upcoming] = await Promise.all([
    Booking.aggregate([
      { $match: { tenantId, status: { $in: PAID } } },
      { $group: { _id: null, revenue: { $sum: '$price.total' }, bookings: { $sum: 1 } } },
    ]),
    Booking.aggregate([
      { $match: { tenantId, status: { $in: PAID }, paidAt: { $gte: firstMonth } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$paidAt' } }, revenue: { $sum: '$price.total' } } },
    ]),
    Booking.aggregate([{ $match: { tenantId } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Booking.aggregate([
      { $match: { tenantId, status: { $in: PAID } } },
      { $group: { _id: '$listingId', revenue: { $sum: '$price.total' }, bookings: { $sum: 1 } } },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
    ]),
    Listing.find({ tenantId }).select('title isActive'),
    Booking.find({ tenantId, status: 'CONFIRMED', startDate: { $gte: today } }).sort({ startDate: 1 }).limit(5),
  ]);

  // Occupancy = booked nights in the next 30 days / available nights in those 30 days.
  const activeIds = listings.filter((l) => l.isActive).map((l) => l._id);
  const bookedNights = activeIds.length
    ? await BookedDay.countDocuments({ listingId: { $in: activeIds }, date: { $gte: today, $lt: in30Days } })
    : 0;
  const occupancyPercent = activeIds.length ? Math.round((bookedNights / (activeIds.length * 30)) * 100) : 0;

  const titles = new Map(listings.map((l) => [l._id.toString(), l.title]));
  const customers = await User.find({ _id: { $in: upcoming.map((b) => b.customerId) } });
  const customerNames = new Map(customers.map((u) => [u._id.toString(), u.name]));
  const monthlyMap = new Map(monthly.map((m) => [m._id as string, m.revenue as number]));

  res.json({
    totalRevenue: totals[0]?.revenue ?? 0,
    totalBookings: totals[0]?.bookings ?? 0,
    activeListings: activeIds.length,
    occupancyPercent,
    revenueByMonth: months.map((month) => ({ month, revenue: monthlyMap.get(month) ?? 0 })),
    statusCounts: statusRows.map((s) => ({ status: s._id, count: s.count })),
    topListings: topRows.map((t) => ({
      listingId: t._id.toString(),
      title: titles.get(t._id.toString()) ?? 'Removed listing',
      revenue: t.revenue,
      bookings: t.bookings,
    })),
    upcomingCheckIns: upcoming.map((b) => ({
      id: b._id.toString(),
      reference: b.reference,
      startDate: b.startDate.toISOString().slice(0, 10),
      guests: b.guests,
      listingTitle: titles.get(b.listingId.toString()) ?? '',
      customerName: customerNames.get(b.customerId.toString()) ?? 'Guest',
    })),
  });
});

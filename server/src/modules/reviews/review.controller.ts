import { Request, Response } from 'express';
import { z } from 'zod';
import { Booking } from '../../models/Booking';
import { Listing } from '../../models/Listing';
import { Review } from '../../models/Review';
import { User } from '../../models/User';
import { AppError } from '../../utils/AppError';
import { asyncHandler } from '../../utils/asyncHandler';

export const reviewSchema = z.object({
  bookingId: z.string().length(24),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).default(''),
});

export const listReviews = asyncHandler(async (req: Request, res: Response) => {
  const reviews = await Review.find({ listingId: req.params.listingId }).sort({ createdAt: -1 }).limit(50);
  const users = await User.find({ _id: { $in: reviews.map((r) => r.customerId) } });
  const names = new Map(users.map((u) => [u._id.toString(), u.name]));

  res.json({
    items: reviews.map((r) => ({
      id: r._id.toString(),
      rating: r.rating,
      comment: r.comment,
      author: names.get(r.customerId.toString()) ?? 'Guest',
      createdAt: (r as any).createdAt,
    })),
  });
});

export const addReview = asyncHandler(async (req: Request, res: Response) => {
  const { bookingId, rating, comment } = req.body;
  const booking = await Booking.findById(bookingId);

  if (!booking || booking.customerId.toString() !== req.user!.id) throw new AppError(404, 'Booking not found');
  if (booking.listingId.toString() !== req.params.listingId) throw new AppError(400, 'Booking is for another listing');
  if (booking.status !== 'COMPLETED') throw new AppError(409, 'You can review a stay after it is completed');
  if (await Review.exists({ bookingId })) throw new AppError(409, 'You already reviewed this stay');

  const review = await Review.create({
    listingId: booking.listingId,
    bookingId,
    customerId: req.user!.id,
    rating,
    comment,
  });

  // Keep the listing's average rating up to date.
  const stats = await Review.aggregate([
    { $match: { listingId: booking.listingId } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  await Listing.updateOne(
    { _id: booking.listingId },
    { ratingAvg: Math.round(stats[0].avg * 10) / 10, ratingCount: stats[0].count }
  );

  res.status(201).json({ id: review._id.toString() });
});

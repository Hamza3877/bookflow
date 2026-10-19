import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { addReview, listReviews, reviewSchema } from './review.controller';

export const reviewRouter = Router();

reviewRouter.get('/listings/:listingId/reviews', listReviews);
reviewRouter.post('/listings/:listingId/reviews', requireAuth, requireRole('customer'), validateBody(reviewSchema), addReview);

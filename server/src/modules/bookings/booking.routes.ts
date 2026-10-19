import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import {
  cancel,
  checkout,
  createBooking,
  getBooking,
  myBookings,
  payTest,
  quote,
  tenantBookings,
  verifyPayment,
} from './booking.controller';
import { createBookingSchema, quoteSchema } from './booking.schema';

export const bookingRouter = Router();

bookingRouter.post('/quote', validateBody(quoteSchema), quote);

bookingRouter.use(requireAuth);
bookingRouter.post('/', requireRole('customer'), validateBody(createBookingSchema), createBooking);
bookingRouter.get('/mine', requireRole('customer'), myBookings);
bookingRouter.get('/tenant', requireRole('owner'), tenantBookings);

bookingRouter.get('/:id', getBooking);
bookingRouter.post('/:id/cancel', cancel);
bookingRouter.post('/:id/checkout', requireRole('customer'), checkout);
bookingRouter.post('/:id/pay-test', requireRole('customer'), payTest);
bookingRouter.post('/:id/verify-payment', requireRole('customer'), verifyPayment);

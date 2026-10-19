import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler, notFound } from './middleware/errorHandler';
import { adminRouter } from './modules/admin/admin.routes';
import { aiRouter } from './modules/ai/ai.routes';
import { authRouter } from './modules/auth/auth.routes';
import { bookingRouter } from './modules/bookings/booking.routes';
import { currencyRouter } from './modules/currency/currency.routes';
import { dashboardRouter } from './modules/dashboard/dashboard.routes';
import { listingRouter } from './modules/listings/listing.routes';
import { paymentRouter } from './modules/payments/payment.routes';
import { reviewRouter } from './modules/reviews/review.routes';

export const app = express();

// Needed on hosts like Render so rate limiting sees the real visitor IP.
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL.split(','), credentials: true }));

// Stripe webhook first: it needs the raw body, not parsed JSON.
app.use('/api/payments', express.raw({ type: 'application/json' }), paymentRouter);

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 600, standardHeaders: true, legacyHeaders: false }));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 40, standardHeaders: true, legacyHeaders: false }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use('/api/auth', authRouter);
app.use('/api/listings', listingRouter);
app.use('/api/bookings', bookingRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/admin', adminRouter);
app.use('/api/ai', aiRouter);
app.use('/api/currency', currencyRouter);
app.use('/api', reviewRouter);

app.use(notFound);
app.use(errorHandler);

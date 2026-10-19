import { Request, Response, Router } from 'express';
import { env, stripeEnabled } from '../../config/env';
import { Booking } from '../../models/Booking';
import { confirmBooking } from '../../services/booking.service';
import { constructWebhookEvent } from '../../services/stripe.service';
import { audit } from '../../utils/audit';

export const paymentRouter = Router();

// Stripe calls this URL after a payment. The body must stay "raw" so the
// signature can be verified, which is why app.ts mounts this before express.json().
paymentRouter.post('/webhook', async (req: Request, res: Response) => {
  if (!stripeEnabled || !env.STRIPE_WEBHOOK_SECRET) return res.status(404).json({ message: 'Stripe webhook is not configured' });

  let event;
  try {
    event = constructWebhookEvent(req.body as Buffer, req.headers['stripe-signature'] as string);
  } catch {
    return res.status(400).json({ message: 'Invalid signature' });
  }

  if (event.type === 'checkout.session.completed') {
    const bookingId = (event.data.object as { metadata?: { bookingId?: string } }).metadata?.bookingId;
    try {
      const booking = bookingId ? await Booking.findById(bookingId) : null;
      if (booking) {
        await confirmBooking(booking); // does nothing if it is already confirmed
        audit(undefined, 'booking.paid', 'Booking', bookingId, { method: 'stripe-webhook' });
      }
    } catch (err) {
      // We still answer 200 so Stripe does not retry forever; the problem is logged.
      console.error('Webhook could not confirm booking:', (err as Error).message);
    }
  }
  res.json({ received: true });
});

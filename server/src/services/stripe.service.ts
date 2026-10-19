import Stripe from 'stripe';
import { env, stripeEnabled } from '../config/env';

// Created only when a Stripe key is present. Without a key the app uses the built-in test payment.
const stripe = stripeEnabled ? new Stripe(env.STRIPE_SECRET_KEY!) : null;

function client() {
  if (!stripe) throw new Error('Stripe is not configured');
  return stripe;
}

export async function createCheckoutSession(params: {
  bookingId: string;
  reference: string;
  title: string;
  amount: number; // whole currency units (e.g. rupees)
  currency: string;
  customerEmail: string;
}) {
  return client().checkout.sessions.create({
    mode: 'payment',
    customer_email: params.customerEmail,
    client_reference_id: params.bookingId,
    metadata: { bookingId: params.bookingId },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: params.currency.toLowerCase(),
          unit_amount: Math.round(params.amount * 100), // Stripe wants the smallest unit
          product_data: { name: `${params.title} (${params.reference})` },
        },
      },
    ],
    success_url: `${env.CLIENT_URL}/payment/success?booking=${params.bookingId}`,
    cancel_url: `${env.CLIENT_URL}/checkout/${params.bookingId}`,
  });
}

export function retrieveSession(sessionId: string) {
  return client().checkout.sessions.retrieve(sessionId);
}

export function constructWebhookEvent(rawBody: Buffer, signature: string) {
  return client().webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET ?? '');
}

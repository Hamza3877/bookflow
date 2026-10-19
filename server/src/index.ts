import mongoose from 'mongoose';
import { app } from './app';
import { connectDb } from './config/db';
import { aiEnabled, env, stripeEnabled } from './config/env';
import { startBookingJobs } from './jobs/bookingJobs';

async function main() {
  await connectDb();
  // Make sure unique and geo indexes exist before taking traffic (the double-booking guard depends on them).
  await mongoose.syncIndexes();

  const timer = startBookingJobs();
  const server = app.listen(env.PORT, () => {
    console.log(`API running on http://localhost:${env.PORT}`);
    console.log(`Payments: ${stripeEnabled ? 'Stripe' : 'built-in test mode'} | Search: ${aiEnabled ? 'Gemini AI' : 'rule-based'}`);
  });

  // Close cleanly when the host stops the app.
  const shutdown = () => {
    clearInterval(timer);
    server.close(() => mongoose.disconnect().then(() => process.exit(0)));
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => {
  console.error('Could not start the server:', err.message);
  process.exit(1);
});

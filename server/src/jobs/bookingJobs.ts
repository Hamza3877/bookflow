import { completeFinishedStays, expireOldHolds } from '../services/booking.service';

// Runs every minute: frees unpaid holds and completes finished stays.
export function startBookingJobs() {
  const run = async () => {
    try {
      const expired = await expireOldHolds();
      const completed = await completeFinishedStays();
      if (expired || completed) console.log(`Jobs: ${expired} holds expired, ${completed} stays completed`);
    } catch (err) {
      console.error('Booking job failed:', (err as Error).message);
    }
  };
  run();
  return setInterval(run, 60 * 1000);
}

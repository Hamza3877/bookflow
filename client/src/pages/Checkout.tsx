import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Clock, Lock } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useParams } from 'react-router-dom';
import { getErrorMessage } from '../api/client';
import { bookingsApi } from '../api/endpoints';
import { PriceBreakdown } from '../components/bookings/PriceBreakdown';
import { Button } from '../components/ui/Button';
import { ErrorState, Spinner } from '../components/ui/Feedback';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useMoney } from '../hooks/useMoney';
import { formatDate } from '../lib/dates';

// Counts down to the moment the hold ends.
function useCountdown(until?: string) {
  const [seconds, setSeconds] = useState(() => (until ? Math.max(0, Math.floor((Date.parse(until) - Date.now()) / 1000)) : 0));
  useEffect(() => {
    if (!until) return;
    const tick = () => setSeconds(Math.max(0, Math.floor((Date.parse(until) - Date.now()) / 1000)));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [until]);
  return seconds;
}

export default function Checkout() {
  useDocumentTitle('Checkout');
  const { id = '' } = useParams();
  const queryClient = useQueryClient();
  const { money } = useMoney();
  const [showTestForm, setShowTestForm] = useState(false);

  const { data: booking, isLoading, error } = useQuery({ queryKey: ['booking', id], queryFn: () => bookingsApi.get(id) });
  const secondsLeft = useCountdown(booking?.holdExpiresAt);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['booking', id] });

  const startPayment = useMutation({
    mutationFn: () => bookingsApi.checkout(id),
    onSuccess: ({ url }) => (url ? (window.location.href = url) : setShowTestForm(true)),
    onError: (err) => { toast.error(getErrorMessage(err)); refresh(); },
  });

  const testPay = useMutation({
    mutationFn: () => bookingsApi.payTest(id),
    onSuccess: () => { toast.success('Payment received'); refresh(); queryClient.invalidateQueries({ queryKey: ['my-bookings'] }); },
    onError: (err) => { toast.error(getErrorMessage(err)); refresh(); },
  });

  if (isLoading) return <Spinner label="Loading your booking" />;
  if (error || !booking) return <div className="mx-auto max-w-xl px-4 py-16"><ErrorState message={getErrorMessage(error)} /></div>;

  const expired = booking.status === 'EXPIRED' || (booking.status === 'HELD' && secondsLeft === 0);
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-extrabold sm:text-3xl">Checkout</h1>

      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_380px]">
        <section className="card p-5 sm:p-6">
          {booking.status === 'CONFIRMED' || booking.status === 'COMPLETED' ? (
            <div className="py-6 text-center">
              <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" aria-hidden />
              <h2 className="mt-3 text-xl font-bold">Your booking is confirmed</h2>
              <p className="mt-1 text-slate-600">Reference <strong>{booking.reference}</strong></p>
              <Link to="/bookings" className="mt-6 inline-block rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">View my bookings</Link>
            </div>
          ) : booking.status === 'CANCELLED' ? (
            <p className="py-6 text-center text-slate-600">This booking was cancelled.</p>
          ) : expired ? (
            <div className="py-6 text-center">
              <Clock className="mx-auto h-12 w-12 text-slate-400" aria-hidden />
              <h2 className="mt-3 text-xl font-bold">Your hold has expired</h2>
              <p className="mt-1 text-slate-600">The dates were released so other guests can book them.</p>
              <Link to={`/listings/${booking.listingId}`} className="mt-6 inline-block rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">Pick dates again</Link>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between rounded-xl bg-amber-50 px-4 py-3 text-amber-900">
                <span className="flex items-center gap-2 text-sm font-medium"><Clock className="h-4 w-4" aria-hidden /> We are holding your dates</span>
                <span className="font-mono text-lg font-bold" aria-live="polite">{mm}:{ss}</span>
              </div>

              <h2 className="mt-6 text-lg font-bold">Payment</h2>

              {!showTestForm ? (
                <>
                  <p className="mt-1 text-sm text-slate-600">You will pay {money(booking.price.total)} securely.</p>
                  <Button className="mt-5 w-full" loading={startPayment.isPending} onClick={() => startPayment.mutate()}>
                    <Lock className="h-4 w-4" aria-hidden /> Pay {money(booking.price.total)}
                  </Button>
                </>
              ) : (
                <div className="mt-3">
                  <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800">Test mode: no real money is charged. This card is pre-filled.</p>
                  <div className="mt-4 space-y-3">
                    <label className="block text-sm"><span className="mb-1.5 block font-medium">Card number</span><input className="field" value="4242 4242 4242 4242" readOnly /></label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="block text-sm"><span className="mb-1.5 block font-medium">Expiry</span><input className="field" value="12 / 34" readOnly /></label>
                      <label className="block text-sm"><span className="mb-1.5 block font-medium">CVC</span><input className="field" value="123" readOnly /></label>
                    </div>
                  </div>
                  <Button className="mt-5 w-full" loading={testPay.isPending} onClick={() => testPay.mutate()}>Confirm payment</Button>
                </div>
              )}
            </>
          )}
        </section>

        <aside className="card h-fit p-5">
          <div className="flex gap-3">
            {booking.listing?.image && <img src={booking.listing.image} alt="" className="h-20 w-24 rounded-lg object-cover" />}
            <div>
              <p className="font-semibold leading-tight">{booking.listing?.title}</p>
              <p className="text-sm text-slate-500">{booking.listing?.city}</p>
            </div>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 border-y border-slate-200 py-4 text-sm">
            <div><dt className="text-slate-500">Check-in</dt><dd className="font-semibold">{formatDate(booking.startDate)}</dd></div>
            <div><dt className="text-slate-500">Check-out</dt><dd className="font-semibold">{formatDate(booking.endDate)}</dd></div>
            <div><dt className="text-slate-500">Guests</dt><dd className="font-semibold">{booking.guests}</dd></div>
            <div><dt className="text-slate-500">Reference</dt><dd className="font-semibold">{booking.reference}</dd></div>
          </dl>
          <div className="mt-4"><PriceBreakdown price={booking.price} /></div>
        </aside>
      </div>
    </div>
  );
}

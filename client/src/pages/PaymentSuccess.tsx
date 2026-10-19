import { useQuery } from '@tanstack/react-query';
import { CheckCircle2 } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { getErrorMessage } from '../api/client';
import { bookingsApi } from '../api/endpoints';
import { ErrorState, Spinner } from '../components/ui/Feedback';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

// Stripe sends the customer here after paying. We ask the server to double-check the payment.
export default function PaymentSuccess() {
  useDocumentTitle('Payment');
  const bookingId = useSearchParams()[0].get('booking') ?? '';
  const { data, isLoading, error } = useQuery({
    queryKey: ['verify', bookingId],
    queryFn: () => bookingsApi.verifyPayment(bookingId),
    enabled: !!bookingId,
    retry: false,
  });

  if (isLoading) return <Spinner label="Confirming your payment" />;
  if (error || !data) return <div className="mx-auto max-w-xl px-4 py-16"><ErrorState message={getErrorMessage(error)} /></div>;

  const paid = data.status === 'CONFIRMED' || data.status === 'COMPLETED';
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <CheckCircle2 className={`mx-auto h-16 w-16 ${paid ? 'text-emerald-500' : 'text-slate-300'}`} aria-hidden />
      <h1 className="mt-4 text-2xl font-extrabold">{paid ? 'Payment received' : 'We have not received your payment yet'}</h1>
      <p className="mt-2 text-slate-600">{paid ? `Your booking ${data.reference} is confirmed.` : 'If you were charged, it can take a minute to show up. Check your bookings shortly.'}</p>
      <Link to="/bookings" className="mt-6 inline-block rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">Go to my bookings</Link>
    </div>
  );
}

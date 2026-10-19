import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { getErrorMessage } from '../api/client';
import { bookingsApi } from '../api/endpoints';
import { PriceBreakdown } from '../components/bookings/PriceBreakdown';
import { ReviewModal } from '../components/bookings/ReviewModal';
import { StatusBadge } from '../components/bookings/StatusBadge';
import { Button } from '../components/ui/Button';
import { EmptyState, ErrorState, Spinner } from '../components/ui/Feedback';
import { Modal } from '../components/ui/Modal';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useMoney } from '../hooks/useMoney';
import { formatDate } from '../lib/dates';
import { Booking } from '../types';

const TABS = [
  { key: 'upcoming', label: 'Upcoming', statuses: ['HELD', 'CONFIRMED'] },
  { key: 'past', label: 'Past', statuses: ['COMPLETED'] },
  { key: 'closed', label: 'Cancelled or expired', statuses: ['CANCELLED', 'EXPIRED'] },
];

export default function MyBookings() {
  useDocumentTitle('My bookings');
  const queryClient = useQueryClient();
  const { money } = useMoney();
  const [tab, setTab] = useState('upcoming');
  const [reviewing, setReviewing] = useState<Booking | null>(null);
  const [details, setDetails] = useState<Booking | null>(null);

  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['my-bookings'], queryFn: bookingsApi.mine });

  const cancel = useMutation({
    mutationFn: (id: string) => bookingsApi.cancel(id),
    onSuccess: () => { toast.success('Booking cancelled'); queryClient.invalidateQueries({ queryKey: ['my-bookings'] }); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const confirmCancel = (booking: Booking) => {
    if (window.confirm(`Cancel booking ${booking.reference}?`)) cancel.mutate(booking.id);
  };

  const current = TABS.find((t) => t.key === tab)!;
  const items = (data?.items ?? []).filter((b) => current.statuses.includes(b.status));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-extrabold sm:text-3xl">My bookings</h1>

      <div className="mt-5 flex gap-2 overflow-x-auto" role="tablist">
        {TABS.map((t) => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${tab === t.key ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {isLoading ? <Spinner label="Loading bookings" /> : error ? <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} /> : items.length === 0 ? (
          <EmptyState title="Nothing here yet" text="When you book a place, it shows up here." action={<Link to="/" className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">Find a place</Link>} />
        ) : items.map((b) => (
          <article key={b.id} className="card flex flex-col gap-4 p-4 sm:flex-row">
            {b.listing?.image && <img src={b.listing.image} alt="" className="h-36 w-full rounded-xl object-cover sm:h-auto sm:w-44" />}
            <div className="flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <Link to={`/listings/${b.listingId}`} className="font-semibold hover:underline">{b.listing?.title}</Link>
                  <p className="text-sm text-slate-500">{b.listing?.city} - Ref {b.reference}</p>
                </div>
                <StatusBadge status={b.status} />
              </div>
              <p className="mt-2 text-sm text-slate-700">{formatDate(b.startDate)} to {formatDate(b.endDate)} - {b.guests} guest{b.guests > 1 ? 's' : ''}</p>
              <p className="mt-1 font-bold">{money(b.price.total)}</p>

              <div className="mt-3 flex flex-wrap gap-2">
                {b.status === 'HELD' && <Link to={`/checkout/${b.id}`} className="rounded-lg bg-saffron-500 px-3 py-1.5 text-sm font-semibold text-ink hover:bg-saffron-400">Pay now</Link>}
                {(b.status === 'HELD' || b.status === 'CONFIRMED') && <Button size="sm" variant="secondary" onClick={() => confirmCancel(b)} loading={cancel.isPending && cancel.variables === b.id}>Cancel</Button>}
                {b.status === 'COMPLETED' && !b.reviewed && <Button size="sm" onClick={() => setReviewing(b)}>Leave a review</Button>}
                {b.status === 'COMPLETED' && b.reviewed && <span className="py-1.5 text-sm text-slate-500">Reviewed</span>}
                <Button size="sm" variant="ghost" onClick={() => setDetails(b)}>Price details</Button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <ReviewModal booking={reviewing} onClose={() => setReviewing(null)} />
      <Modal open={!!details} title={`Booking ${details?.reference ?? ''}`} onClose={() => setDetails(null)}>
        {details && <PriceBreakdown price={details.price} />}
      </Modal>
    </div>
  );
}

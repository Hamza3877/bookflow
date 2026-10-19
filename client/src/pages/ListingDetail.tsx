import { useMutation, useQuery } from '@tanstack/react-query';
import { Check, MapPin, Star, Users } from 'lucide-react';
import { lazy, Suspense, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getErrorMessage } from '../api/client';
import { bookingsApi, listingsApi } from '../api/endpoints';
import { PriceBreakdown } from '../components/bookings/PriceBreakdown';
import { AvailabilityCalendar } from '../components/listings/AvailabilityCalendar';
import { Button } from '../components/ui/Button';
import { ErrorState, Skeleton, Spinner } from '../components/ui/Feedback';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useMoney } from '../hooks/useMoney';
import { formatDate } from '../lib/dates';
import { TYPE_LABELS } from '../lib/format';
import { useAppDispatch, useAppSelector } from '../store';
import { clearDraft, saveDraft } from '../store/bookingDraftSlice';

const MapView = lazy(() => import('../components/listings/MapView'));

export default function ListingDetail() {
  const { id = '' } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const draft = useAppSelector((s) => s.bookingDraft);
  const { money } = useMoney();

  const [imageIndex, setImageIndex] = useState(0);
  const [start, setStart] = useState<string | null>(searchParams.get('start'));
  const [end, setEnd] = useState<string | null>(searchParams.get('end'));
  const [guests, setGuests] = useState(Number(searchParams.get('guests') ?? 1));

  const listingQuery = useQuery({ queryKey: ['listing', id], queryFn: () => listingsApi.get(id) });
  const availability = useQuery({ queryKey: ['availability', id], queryFn: () => listingsApi.availability(id) });
  const reviews = useQuery({ queryKey: ['reviews', id], queryFn: () => listingsApi.reviews(id) });
  const listing = listingQuery.data;
  useDocumentTitle(listing?.title ?? 'Listing');

  // Came back from the login page? Restore the dates the visitor had chosen.
  useEffect(() => {
    if (draft.listingId === id && draft.startDate) {
      setStart(draft.startDate);
      setEnd(draft.endDate);
      setGuests(draft.guests);
      dispatch(clearDraft());
    }
  }, [draft, id, dispatch]);

  const quote = useQuery({
    queryKey: ['quote', id, start, end],
    queryFn: () => bookingsApi.quote({ listingId: id, startDate: start!, endDate: end! }),
    enabled: !!start && !!end,
    retry: false,
  });

  const reserve = useMutation({
    mutationFn: () => bookingsApi.create({ listingId: id, startDate: start!, endDate: end!, guests }),
    onSuccess: (booking) => navigate(`/checkout/${booking.id}`),
    onError: (err) => {
      toast.error(getErrorMessage(err));
      availability.refetch(); // someone may have just taken those dates
      quote.refetch();
    },
  });

  if (listingQuery.isLoading) return <Spinner label="Loading listing" />;
  if (listingQuery.error || !listing) return <div className="mx-auto max-w-xl px-4 py-16"><ErrorState message={getErrorMessage(listingQuery.error)} /></div>;

  const onReserve = () => {
    if (!user) {
      dispatch(saveDraft({ listingId: id, startDate: start, endDate: end, guests }));
      return navigate('/login', { state: { from: `/listings/${id}` } });
    }
    reserve.mutate();
  };

  const weekendPercent = Math.round((listing.weekendMultiplier - 1) * 100);
  const canReserve = !!quote.data?.available && !!start && !!end;
  const quoteError = quote.error ? getErrorMessage(quote.error) : null;

  let buttonLabel = 'Reserve';
  if (!start || !end) buttonLabel = 'Choose your dates';
  else if (quote.data && !quote.data.available) buttonLabel = 'Dates not available';
  else if (!user) buttonLabel = 'Log in to reserve';

  const wrongRole = !!user && user.role !== 'customer';

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <nav className="mb-4 text-sm text-slate-500"><Link to="/" className="hover:underline">Explore</Link> / {listing.city}</nav>
      <h1 className="text-2xl font-extrabold sm:text-3xl">{listing.title}</h1>
      <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
        <span className="flex items-center gap-1"><MapPin className="h-4 w-4" aria-hidden />{listing.address ? `${listing.address}, ` : ''}{listing.city}</span>
        {listing.ratingCount > 0 && (
          <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-saffron-500 text-saffron-500" aria-hidden />{listing.ratingAvg.toFixed(1)} ({listing.ratingCount} reviews)</span>
        )}
      </p>

      {/* gallery */}
<div className="mt-5 grid gap-3 md:grid-cols-[2fr_1fr]">
        <img src={listing.images[imageIndex]} alt={listing.title} className="aspect-[16/10] w-full rounded-2xl bg-slate-200 object-cover" />
        <div className="grid grid-cols-3 gap-3 md:grid-cols-1 md:grid-rows-3">
          {listing.images.slice(0, 3).map((src, i) => (
            <button key={src} onClick={() => setImageIndex(i)} aria-label={`Show photo ${i + 1}`} className={`overflow-hidden rounded-xl ring-2 transition ${i === imageIndex ? 'ring-brand-500' : 'ring-transparent hover:ring-brand-200'}`}>
              <img src={src} alt="" loading="lazy" className="aspect-[16/10] h-full w-full object-cover md:aspect-auto" />
            </button>
          ))}
        </div>
      </div>



      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-8">
          <section>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
              <span className="rounded-full bg-brand-50 px-3 py-1 font-semibold text-brand-700">{TYPE_LABELS[listing.type]}</span>
              <span className="flex items-center gap-1"><Users className="h-4 w-4" aria-hidden /> Up to {listing.maxGuests} guests</span>
              {listing.business && <span>Hosted by <strong>{listing.business.name}</strong></span>}
            </div>
            <p className="mt-4 max-w-prose whitespace-pre-line leading-relaxed text-slate-700">{listing.description}</p>
          </section>

          {listing.amenities.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-bold">What is included</h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                {listing.amenities.map((a) => (
                  <li key={a} className="flex items-center gap-2 text-sm text-slate-700"><Check className="h-4 w-4 text-brand-600" aria-hidden />{a}</li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className="mb-3 text-lg font-bold">Pricing rules</h2>
            <ul className="space-y-1 text-sm text-slate-700">
              <li>Base price is {money(listing.pricePerDay)} per night.</li>
              {weekendPercent > 0 && <li>Friday and Saturday nights cost {weekendPercent}% more.</li>}
              {listing.longStayDiscountPercent > 0 && <li>Stays of 7 nights or more get {listing.longStayDiscountPercent}% off.</li>}
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold">Location</h2>
            <div className="card h-64 overflow-hidden p-1">
              <Suspense fallback={<Skeleton className="h-full w-full" />}><MapView listings={[listing]} /></Suspense>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold">Reviews</h2>
            {reviews.data && reviews.data.items.length > 0 ? (
              <ul className="space-y-4">
                {reviews.data.items.map((r) => (
                  <li key={r.id} className="card p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{r.author}</p>
                      <span className="flex items-center gap-1 text-sm"><Star className="h-4 w-4 fill-saffron-500 text-saffron-500" aria-hidden />{r.rating}</span>
                    </div>
                    {r.comment && <p className="mt-1 text-sm text-slate-600">{r.comment}</p>}
                    <p className="mt-2 text-xs text-slate-400">{formatDate(r.createdAt)}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No reviews yet. Guests can review after their stay is completed.</p>
            )}
          </section>
        </div>

        {/* booking panel */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-5">
            <p className="mb-4"><span className="text-2xl font-extrabold">{money(listing.pricePerDay)}</span><span className="text-slate-500"> / night</span></p>

            <AvailabilityCalendar
              bookedDates={availability.data?.bookedDates ?? []}
              start={start}
              end={end}
              onChange={(s, e) => { setStart(s); setEnd(e); }}
            />

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">Check-in</p><p className="font-semibold">{start ? formatDate(start, { day: 'numeric', month: 'short' }) : '-'}</p></div>
              <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">Check-out</p><p className="font-semibold">{end ? formatDate(end, { day: 'numeric', month: 'short' }) : '-'}</p></div>
            </div>

            <label className="mt-3 block text-sm">
              <span className="mb-1.5 block font-medium text-slate-700">Guests</span>
              <select className="field" value={guests} onChange={(e) => setGuests(Number(e.target.value))}>
                {Array.from({ length: listing.maxGuests }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n} guest{n > 1 ? 's' : ''}</option>)}
              </select>
            </label>

            <div className="mt-5 min-h-[3rem]" aria-live="polite">
              {quote.isFetching && <Skeleton className="h-24 w-full" />}
              {!quote.isFetching && quote.data && <PriceBreakdown price={quote.data.price} pricePerDay={listing.pricePerDay} />}
              {!quote.isFetching && quoteError && <p className="text-sm text-rose-600">{quoteError}</p>}
              {!quote.isFetching && quote.data && !quote.data.available && <p className="mt-2 text-sm text-rose-600">Some of these nights are already booked. Pick other dates.</p>}
            </div>

            <Button className="mt-4 w-full" loading={reserve.isPending} disabled={!canReserve || wrongRole} onClick={onReserve}>
              {buttonLabel}
            </Button>
            {wrongRole && <p className="mt-2 text-center text-xs text-slate-500">Only customer accounts can book. Log in as a customer to reserve.</p>}
            <p className="mt-3 text-center text-xs text-slate-500">Your dates are held for 10 minutes while you pay.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

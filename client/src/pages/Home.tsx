import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { List, Map as MapIcon } from 'lucide-react';
import { lazy, Suspense, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getErrorMessage } from '../api/client';
import { listingsApi } from '../api/endpoints';
import { ListingCard, ListingCardSkeleton } from '../components/listings/ListingCard';
import { SearchPanel } from '../components/listings/SearchPanel';
import { Button } from '../components/ui/Button';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/Feedback';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

// The map code is large, so it only loads when someone opens the map view.
const MapView = lazy(() => import('../components/listings/MapView'));

export default function Home() {
  useDocumentTitle('Find your next stay or ride');
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState<'list' | 'map'>('list');

  const apiParams = Object.fromEntries(params.entries());
  const page = Number(params.get('page') ?? 1);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['listings', params.toString()],
    queryFn: () => listingsApi.search(apiParams),
    placeholderData: keepPreviousData,
  });

  // Dates and guests are passed on to the listing page so the visitor does not pick them twice.
  const carry = new URLSearchParams();
  (['startDate', 'endDate', 'guests'] as const).forEach((k) => {
    const value = params.get(k);
    if (value) carry.set(k === 'startDate' ? 'start' : k === 'endDate' ? 'end' : 'guests', value);
  });

  const goToPage = (next: number) => {
    const copy = new URLSearchParams(params);
    copy.set('page', String(next));
    setParams(copy);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <section className="bg-brand-800 text-white">
        <div className="mx-auto max-w-7xl px-4 pb-24 pt-12 sm:px-6 sm:pt-16">
          <h1 className="max-w-2xl text-3xl font-extrabold leading-tight sm:text-5xl">Cars, villas and apartments, held for you while you pay.</h1>
          <p className="mt-4 max-w-xl text-base text-brand-100 sm:text-lg">
            Pick your dates, see the full price up front and book from local businesses across Pakistan. No double bookings, ever.
          </p>
        </div>
      </section>

      <div className="mx-auto -mt-16 max-w-7xl px-4 pb-16 sm:px-6">
        <SearchPanel params={params} onChange={setParams} />

        <div className="mb-4 mt-8 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {isLoading ? 'Searching...' : `${data?.total ?? 0} place${data?.total === 1 ? '' : 's'} found`}
            {isFetching && !isLoading && <span className="ml-2 text-sm font-normal text-slate-400">updating</span>}
          </h2>
          <div className="flex gap-1 rounded-lg bg-white p-1 shadow-sm ring-1 ring-slate-200">
            <Button size="sm" variant={view === 'list' ? 'primary' : 'ghost'} onClick={() => setView('list')}><List className="h-4 w-4" aria-hidden /> List</Button>
            <Button size="sm" variant={view === 'map' ? 'primary' : 'ghost'} onClick={() => setView('map')}><MapIcon className="h-4 w-4" aria-hidden /> Map</Button>
          </div>
        </div>

        {error ? (
          <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />
        ) : isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => <ListingCardSkeleton key={i} />)}
          </div>
        ) : data && data.items.length === 0 ? (
          <EmptyState
            title="Nothing matches those filters"
            text="Try other dates, a different city or a higher price limit."
            action={<Button variant="secondary" onClick={() => setParams(new URLSearchParams())}>Clear all filters</Button>}
          />
        ) : view === 'map' ? (
          <div className="card h-[520px] overflow-hidden p-1">
            <Suspense fallback={<Skeleton className="h-full w-full" />}>
              <MapView listings={data?.items ?? []} search={carry.toString()} />
            </Suspense>
          </div>
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {data?.items.map((listing) => <ListingCard key={listing.id} listing={listing} search={carry.toString()} />)}
            </div>
            {data && data.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-3">
                <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => goToPage(page - 1)}>Previous</Button>
                <span className="text-sm text-slate-600">Page {page} of {data.totalPages}</span>
                <Button variant="secondary" size="sm" disabled={page >= data.totalPages} onClick={() => goToPage(page + 1)}>Next</Button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

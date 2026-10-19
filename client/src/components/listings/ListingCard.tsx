import { Star, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMoney } from '../../hooks/useMoney';
import { TYPE_LABELS } from '../../lib/format';
import { Listing } from '../../types';

export function ListingCard({ listing, search }: { listing: Listing; search?: string }) {
  const { money } = useMoney();

  return (
    <Link
      to={`/listings/${listing.id}${search ? `?${search}` : ''}`}
      className="card group block overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-200">
        <img
          src={listing.images[0]}
          alt={listing.title}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-ink">
          {TYPE_LABELS[listing.type]}
        </span>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 font-semibold">{listing.title}</h3>
          {listing.ratingCount > 0 && (
            <span className="flex shrink-0 items-center gap-1 text-sm font-medium">
              <Star className="h-4 w-4 fill-saffron-500 text-saffron-500" aria-hidden />
              {listing.ratingAvg.toFixed(1)}
              <span className="font-normal text-slate-400">({listing.ratingCount})</span>
            </span>
          )}
        </div>
        <p className="mt-0.5 text-sm text-slate-500">{listing.city}</p>
        <div className="mt-3 flex items-center justify-between">
          <p>
            <span className="text-lg font-bold">{money(listing.pricePerDay)}</span>
            <span className="text-sm text-slate-500"> / night</span>
          </p>
          <span className="flex items-center gap-1 text-sm text-slate-500">
            <Users className="h-4 w-4" aria-hidden /> {listing.maxGuests}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function ListingCardSkeleton() {
  return (
    <div className="card overflow-hidden" aria-hidden>
      <div className="aspect-[4/3] animate-pulse bg-slate-200" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-slate-200" />
        <div className="h-5 w-1/2 animate-pulse rounded bg-slate-200" />
      </div>
    </div>
  );
}

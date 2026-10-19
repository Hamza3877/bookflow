import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { getErrorMessage } from '../../api/client';
import { listingsApi } from '../../api/endpoints';
import { Button } from '../../components/ui/Button';
import { EmptyState, ErrorState, Spinner } from '../../components/ui/Feedback';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { TYPE_LABELS } from '../../lib/format';

export default function OwnerListings() {
  useDocumentTitle('My listings');
  const queryClient = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['owner-listings'], queryFn: listingsApi.mine });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['owner-listings'] });

  const toggle = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => listingsApi.setActive(id, isActive),
    onSuccess: refresh,
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => listingsApi.remove(id),
    onSuccess: () => { toast.success('Listing deleted'); refresh(); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold sm:text-3xl">My listings</h1>
        <Link to="/owner/listings/new"><Button><Plus className="h-4 w-4" aria-hidden /> Add listing</Button></Link>
      </div>

      <div className="mt-6">
        {isLoading ? <Spinner label="Loading listings" /> : error ? <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} /> : data!.items.length === 0 ? (
          <EmptyState title="No listings yet" text="Add your first car, villa or apartment to start taking bookings." action={<Link to="/owner/listings/new"><Button>Add listing</Button></Link>} />
        ) : (
          <div className="card divide-y divide-slate-100">
            {data!.items.map((l) => (
              <div key={l.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <img src={l.images[0]} alt="" className="h-20 w-full rounded-lg object-cover sm:w-32" />
                <div className="flex-1">
                  <p className="font-semibold">{l.title}</p>
                  <p className="text-sm text-slate-500">{TYPE_LABELS[l.type]} - {l.city} - PKR {l.pricePerDay.toLocaleString('en-US')} / night</p>
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={l.isActive} onChange={(e) => toggle.mutate({ id: l.id, isActive: e.target.checked })} />
                  {l.isActive ? 'Active' : 'Hidden'}
                </label>
                <div className="flex gap-2">
                  <Link to={`/owner/listings/${l.id}/edit`}><Button size="sm" variant="secondary"><Pencil className="h-4 w-4" aria-hidden /> Edit</Button></Link>
                  <Button size="sm" variant="ghost" aria-label={`Delete ${l.title}`} onClick={() => window.confirm(`Delete "${l.title}"?`) && remove.mutate(l.id)}>
                    <Trash2 className="h-4 w-4 text-rose-600" aria-hidden />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

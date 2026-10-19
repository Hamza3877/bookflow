import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../api/client';
import { bookingsApi } from '../../api/endpoints';
import { StatusBadge } from '../../components/bookings/StatusBadge';
import { Button } from '../../components/ui/Button';
import { EmptyState, ErrorState, Spinner } from '../../components/ui/Feedback';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { formatDate } from '../../lib/dates';
import { STATUS_STYLES } from '../../lib/format';

export default function OwnerBookings() {
  useDocumentTitle('Bookings');
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('');

  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['owner-bookings', status], queryFn: () => bookingsApi.tenant(status) });

  const cancel = useMutation({
    mutationFn: (id: string) => bookingsApi.cancel(id),
    onSuccess: () => { toast.success('Booking cancelled'); queryClient.invalidateQueries({ queryKey: ['owner-bookings'] }); queryClient.invalidateQueries({ queryKey: ['owner-dashboard'] }); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold sm:text-3xl">Bookings</h1>
        <select aria-label="Filter by status" className="field w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {Object.entries(STATUS_STYLES).map(([value, s]) => <option key={value} value={value}>{s.label}</option>)}
        </select>
      </div>

      <div className="mt-6">
        {isLoading ? <Spinner label="Loading bookings" /> : error ? <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} /> : data!.items.length === 0 ? (
          <EmptyState title="No bookings found" text="Bookings from customers will show up here." />
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Reference</th>
                  <th className="px-4 py-3 font-medium">Guest</th>
                  <th className="px-4 py-3 font-medium">Listing</th>
                  <th className="px-4 py-3 font-medium">Dates</th>
                  <th className="px-4 py-3 font-medium">Total (PKR)</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data!.items.map((b) => (
                  <tr key={b.id}>
                    <td className="px-4 py-3 font-medium">{b.reference}</td>
                    <td className="px-4 py-3">{b.customerName ?? '-'}</td>
                    <td className="px-4 py-3">{b.listing?.title}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(b.startDate, { day: 'numeric', month: 'short' })} to {formatDate(b.endDate, { day: 'numeric', month: 'short' })}</td>
                    <td className="px-4 py-3">{b.price.total.toLocaleString('en-US')}</td>
                    <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                    <td className="px-4 py-3 text-right">
                      {(b.status === 'HELD' || b.status === 'CONFIRMED') && (
                        <Button size="sm" variant="secondary" loading={cancel.isPending && cancel.variables === b.id} onClick={() => window.confirm(`Cancel booking ${b.reference}?`) && cancel.mutate(b.id)}>Cancel</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

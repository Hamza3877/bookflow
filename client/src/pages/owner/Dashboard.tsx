import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getErrorMessage } from '../../api/client';
import { dashboardApi } from '../../api/endpoints';
import { StatusBadge } from '../../components/bookings/StatusBadge';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/Feedback';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { formatDate } from '../../lib/dates';
import { STATUS_STYLES } from '../../lib/format';

const pkr = (n: number) => `PKR ${new Intl.NumberFormat('en-US').format(n)}`;
const PIE_COLORS: Record<string, string> = { CONFIRMED: '#24828D', COMPLETED: '#94A3B8', HELD: '#E8A33D', CANCELLED: '#E11D48', EXPIRED: '#CBD5E1' };

function monthLabel(month: string) {
  return new Date(`${month}-01T00:00:00Z`).toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' });
}

export default function OwnerDashboard() {
  useDocumentTitle('Dashboard');
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['owner-dashboard'], queryFn: dashboardApi.owner });

  if (error) return <div className="mx-auto max-w-xl px-4 py-16"><ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} /></div>;

  const stats = [
    { label: 'Revenue', value: data ? pkr(data.totalRevenue) : '' },
    { label: 'Paid bookings', value: data?.totalBookings.toString() ?? '' },
    { label: 'Occupancy, next 30 days', value: data ? `${data.occupancyPercent}%` : '' },
    { label: 'Active listings', value: data?.activeListings.toString() ?? '' },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-extrabold sm:text-3xl">Dashboard</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-4 sm:p-5">
            <p className="text-sm text-slate-500">{s.label}</p>
            {isLoading ? <Skeleton className="mt-2 h-8 w-24" /> : <p className="mt-1 text-xl font-extrabold sm:text-2xl">{s.value}</p>}
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="card p-5 lg:col-span-2">
          <h2 className="font-bold">Revenue, last 6 months</h2>
          <div className="mt-4 h-64">
            {isLoading ? <Skeleton className="h-full w-full" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data!.revenueByMonth.map((m) => ({ ...m, label: monthLabel(m.month) }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} width={48} tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))} />
                  <Tooltip formatter={(v: number) => [pkr(v), 'Revenue']} cursor={{ fill: '#EEF7F7' }} />
                  <Bar dataKey="revenue" fill="#1A6772" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="card p-5">
          <h2 className="font-bold">Bookings by status</h2>
          <div className="mt-4 h-64">
            {isLoading ? <Skeleton className="h-full w-full" /> : data!.statusCounts.length === 0 ? <p className="pt-16 text-center text-sm text-slate-500">No bookings yet</p> : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data!.statusCounts} dataKey="count" nameKey="status" innerRadius={50} outerRadius={80} paddingAngle={2}>
                    {data!.statusCounts.map((s) => <Cell key={s.status} fill={PIE_COLORS[s.status]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number, name: string) => [v, STATUS_STYLES[name as keyof typeof STATUS_STYLES]?.label ?? name]} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="card p-5 lg:col-span-1">
          <h2 className="font-bold">Top listings</h2>
          {isLoading ? <Skeleton className="mt-4 h-40 w-full" /> : data!.topListings.length === 0 ? <p className="mt-4 text-sm text-slate-500">No paid bookings yet.</p> : (
            <ol className="mt-4 space-y-3">
              {data!.topListings.map((t) => (
                <li key={t.listingId} className="flex items-center justify-between gap-3 text-sm">
                  <span className="line-clamp-1 font-medium">{t.title}</span>
                  <span className="shrink-0 text-slate-600">{pkr(t.revenue)}</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="card p-5 lg:col-span-2">
          <h2 className="font-bold">Upcoming check-ins</h2>
          {isLoading ? <Skeleton className="mt-4 h-40 w-full" /> : data!.upcomingCheckIns.length === 0 ? (
            <div className="mt-4"><EmptyState title="No check-ins coming up" text="Confirmed bookings with a future check-in appear here." /></div>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {data!.upcomingCheckIns.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                  <div><p className="font-semibold">{c.customerName}</p><p className="text-slate-500">{c.listingTitle}</p></div>
                  <div className="text-right"><p className="font-medium">{formatDate(c.startDate)}</p><p className="text-slate-500">{c.guests} guest{c.guests > 1 ? 's' : ''} - {c.reference}</p></div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

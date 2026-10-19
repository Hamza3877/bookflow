import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { getErrorMessage } from '../../api/client';
import { adminApi } from '../../api/endpoints';
import { ErrorState, Skeleton } from '../../components/ui/Feedback';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { formatDate } from '../../lib/dates';

const TABS = ['Overview', 'Users', 'Businesses', 'Audit log'] as const;
type Tab = (typeof TABS)[number];

function Table({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
          <tr>{head.map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j} className="px-4 py-3">{cell}</td>)}</tr>)}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminPanel() {
  useDocumentTitle('Admin');
  const [tab, setTab] = useState<Tab>('Overview');

  const overview = useQuery({ queryKey: ['admin', 'overview'], queryFn: adminApi.overview, enabled: tab === 'Overview' });
  const users = useQuery({ queryKey: ['admin', 'users'], queryFn: adminApi.users, enabled: tab === 'Users' });
  const tenants = useQuery({ queryKey: ['admin', 'tenants'], queryFn: adminApi.tenants, enabled: tab === 'Businesses' });
  const audit = useQuery({ queryKey: ['admin', 'audit'], queryFn: adminApi.audit, enabled: tab === 'Audit log' });

  const active = { Overview: overview, Users: users, Businesses: tenants, 'Audit log': audit }[tab];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-extrabold sm:text-3xl">Platform admin</h1>

      <div className="mt-5 flex gap-2 overflow-x-auto" role="tablist">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${tab === t ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}`}>{t}</button>
        ))}
      </div>

      <div className="mt-6">
        {active.error ? <ErrorState message={getErrorMessage(active.error)} onRetry={() => active.refetch()} /> : active.isLoading ? <Skeleton className="h-48 w-full" /> : (
          <>
            {tab === 'Overview' && overview.data && (
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
                {[
                  ['Users', overview.data.users], ['Businesses', overview.data.tenants], ['Listings', overview.data.listings],
                  ['Bookings', overview.data.bookings], ['Paid revenue (PKR)', overview.data.revenue.toLocaleString('en-US')],
                ].map(([label, value]) => (
                  <div key={label} className="card p-5"><p className="text-sm text-slate-500">{label}</p><p className="mt-1 text-2xl font-extrabold">{value}</p></div>
                ))}
              </div>
            )}
            {tab === 'Users' && users.data && <Table head={['Name', 'Email', 'Role', 'Joined']} rows={users.data.items.map((u) => [u.name, u.email, u.role, formatDate(u.createdAt)])} />}
            {tab === 'Businesses' && tenants.data && <Table head={['Business', 'City', 'Owner', 'Listings']} rows={tenants.data.items.map((t) => [t.name, t.city, t.owner, t.listings])} />}
            {tab === 'Audit log' && audit.data && <Table head={['When', 'Who', 'Action', 'Item']} rows={audit.data.items.map((a) => [new Date(a.createdAt).toLocaleString('en-GB'), a.actor, a.action, a.entity])} />}
          </>
        )}
      </div>
    </div>
  );
}

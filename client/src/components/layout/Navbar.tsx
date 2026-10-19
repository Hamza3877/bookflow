import { AnimatePresence, motion } from 'framer-motion';
import { LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuthActions } from '../../hooks/useAuthActions';
import { useAppDispatch, useAppSelector } from '../../store';
import { Currency, CURRENCIES, setCurrency } from '../../store/uiSlice';
import { Logo } from './Logo';

// Which links each kind of user sees.
const LINKS = {
  guest: [{ to: '/', label: 'Explore' }],
  customer: [
    { to: '/', label: 'Explore' },
    { to: '/bookings', label: 'My bookings' },
  ],
  owner: [
    { to: '/owner', label: 'Dashboard', end: true },
    { to: '/owner/listings', label: 'Listings' },
    { to: '/owner/bookings', label: 'Bookings' },
  ],
  admin: [{ to: '/admin', label: 'Admin' }],
};

export function Navbar() {
  const user = useAppSelector((s) => s.auth.user);
  const currency = useAppSelector((s) => s.ui.currency);
  const dispatch = useAppDispatch();
  const { logout } = useAuthActions();
  const [open, setOpen] = useState(false);

  const links = LINKS[user?.role ?? 'guest'] as { to: string; label: string; end?: boolean }[];
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-md px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'}`;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link to="/" aria-label="BookFlow home"><Logo /></Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end ?? l.to === '/'} className={linkClass}>{l.label}</NavLink>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <select
            aria-label="Currency"
            value={currency}
            onChange={(e) => dispatch(setCurrency(e.target.value as Currency))}
            className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
          >
            {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          {user ? (
            <>
              <span className="text-sm text-slate-600">{user.name}</span>
              <button onClick={logout} className="flex items-center gap-1 rounded-md px-2 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100">
                <LogOut className="h-4 w-4" aria-hidden /> Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Log in</Link>
              <Link to="/register" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700">Sign up</Link>
            </>
          )}
        </div>

        <button className="rounded-md p-2 md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Menu" aria-expanded={open}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-slate-200 bg-white md:hidden"
          >
            <nav className="flex flex-col gap-1 p-4" onClick={() => setOpen(false)}>
              {links.map((l) => (
                <NavLink key={l.to} to={l.to} end={l.end ?? l.to === '/'} className={linkClass}>{l.label}</NavLink>
              ))}
              {user ? (
                <button onClick={logout} className="rounded-md px-3 py-2 text-left text-sm font-medium text-slate-600 hover:bg-slate-100">
                  Log out ({user.name})
                </button>
              ) : (
                <>
                  <NavLink to="/login" className={linkClass}>Log in</NavLink>
                  <NavLink to="/register" className={linkClass}>Sign up</NavLink>
                </>
              )}
              <select
                aria-label="Currency"
                value={currency}
                onChange={(e) => dispatch(setCurrency(e.target.value as Currency))}
                onClick={(e) => e.stopPropagation()}
                className="mt-2 rounded-md border border-slate-300 bg-white px-2 py-2 text-sm"
              >
                {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

import { motion } from 'framer-motion';
import { Outlet, useLocation } from 'react-router-dom';
import { Logo } from './Logo';
import { Navbar } from './Navbar';

export function Layout() {
  const { pathname } = useLocation();
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      {/* A short fade when the page changes. */}
      <motion.main key={pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.18 }} className="flex-1">
        <Outlet />
      </motion.main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:px-6">
          <Logo />
          <p>Cars, villas and apartments from local businesses. Payments run in test mode.</p>
        </div>
      </footer>
    </div>
  );
}

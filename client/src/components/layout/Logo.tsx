export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
      <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden>
        <rect width="32" height="32" rx="8" className="fill-brand-600" />
        <path d="M9 8h8a4.5 4.5 0 0 1 2.2 8.4A4.8 4.8 0 0 1 17.5 25H9V8Zm4 3.5v3.7h3.6a1.85 1.85 0 0 0 0-3.7H13Zm0 7v3.2h4.2a1.6 1.6 0 0 0 0-3.2H13Z" fill="#fff" />
        <circle cx="24" cy="9" r="2.5" className="fill-saffron-500" />
      </svg>
      <span className={light ? 'text-white' : 'text-ink'}>BookFlow</span>
    </span>
  );
}

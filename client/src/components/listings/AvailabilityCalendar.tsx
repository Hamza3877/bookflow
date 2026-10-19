import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { addDays, todayText } from '../../lib/dates';

interface Props {
  bookedDates: string[]; // nights that are already taken
  start: string | null; // check-in
  end: string | null; // check-out
  onChange: (start: string | null, end: string | null) => void;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function AvailabilityCalendar({ bookedDates, start, end, onChange }: Props) {
  const today = todayText();
  const booked = useMemo(() => new Set(bookedDates), [bookedDates]);
  const [month, setMonth] = useState(() => (start ?? today).slice(0, 7)); // "YYYY-MM"

  const firstOfMonth = new Date(`${month}-01T00:00:00.000Z`);
  const daysInMonth = new Date(Date.UTC(firstOfMonth.getUTCFullYear(), firstOfMonth.getUTCMonth() + 1, 0)).getUTCDate();
  const leadingBlanks = (firstOfMonth.getUTCDay() + 6) % 7; // week starts on Monday

  const cells: (string | null)[] = [
    ...Array<null>(leadingBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`),
  ];

  const goToMonth = (offset: number) => {
    const d = new Date(Date.UTC(firstOfMonth.getUTCFullYear(), firstOfMonth.getUTCMonth() + offset, 1));
    setMonth(d.toISOString().slice(0, 7));
  };

  // Can this day be the check-out? Only if every night from check-in up to the day before is free.
  const canCheckOut = (day: string) => {
    if (!start || day <= start) return false;
    for (let d = start; d < day; d = addDays(d, 1)) if (booked.has(d)) return false;
    return true;
  };

  const handleClick = (day: string) => {
    const choosingEnd = start && !end && canCheckOut(day);
    if (choosingEnd) return onChange(start, day);
    if (day < today || booked.has(day)) return;
    onChange(day, null); // start a new selection
  };

  const monthLabel = firstOfMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const canGoBack = month > today.slice(0, 7);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <button type="button" onClick={() => goToMonth(-1)} disabled={!canGoBack} aria-label="Previous month" className="rounded-md p-1.5 hover:bg-slate-100 disabled:opacity-30">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="text-sm font-semibold">{monthLabel}</p>
        <button type="button" onClick={() => goToMonth(1)} aria-label="Next month" className="rounded-md p-1.5 hover:bg-slate-100">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center text-xs text-slate-400">
        {WEEKDAYS.map((w) => <span key={w}>{w}</span>)}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (!day) return <span key={`blank-${i}`} />;
          const isPast = day < today;
          const isBooked = booked.has(day);
          const selectableAsEnd = !!start && !end && canCheckOut(day);
          const disabled = (isPast || isBooked) && !selectableAsEnd;
          const isStart = day === start;
          const isEnd = day === end;
          const inRange = !!start && !!end && day > start && day < end;

          let style = 'text-ink hover:bg-brand-50';
          if (inRange) style = 'bg-brand-100 text-brand-900';
          if (isStart || isEnd) style = 'bg-brand-600 text-white';
          if (disabled) style = isBooked && !isPast ? 'bg-rose-50 text-rose-300 line-through' : 'text-slate-300';

          return (
            <button
              key={day}
              type="button"
              disabled={disabled}
              onClick={() => handleClick(day)}
              aria-label={`${day}${isBooked ? ' (booked)' : ''}`}
              aria-pressed={isStart || isEnd}
              className={`mx-auto h-9 w-9 rounded-full text-sm transition ${style} ${disabled ? 'cursor-not-allowed' : ''}`}
            >
              {Number(day.slice(8))}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-brand-600" /> Selected</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-rose-100" /> Booked</span>
        {start && (
          <button type="button" className="ml-auto font-semibold text-brand-700 hover:underline" onClick={() => onChange(null, null)}>
            Clear dates
          </button>
        )}
      </div>
    </div>
  );
}

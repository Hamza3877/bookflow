import { Crosshair, Sparkles } from 'lucide-react';
import { FormEvent, useState } from 'react';
import toast from 'react-hot-toast';
import { aiApi } from '../../api/endpoints';
import { addDays, todayText } from '../../lib/dates';
import { CITIES, TYPE_LABELS } from '../../lib/format';
import { Button } from '../ui/Button';

interface Props {
  params: URLSearchParams;
  onChange: (next: URLSearchParams) => void;
}

const PRICE_STEPS = [10000, 15000, 25000, 40000];
const GUEST_STEPS = [1, 2, 3, 4, 5, 6, 8, 10];
const EXAMPLES = ['7 seater in Karachi this weekend under 30k', 'villa in Hunza for 6 people', 'studio in Lahore under 10k'];

export function SearchPanel({ params, onChange }: Props) {
  const [sentence, setSentence] = useState('');
  const [thinking, setThinking] = useState(false);
  const [source, setSource] = useState<'ai' | 'rules' | null>(null);

  // Change some filters and go back to page 1. An empty value removes the filter.
  const update = (changes: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
    next.delete('page');
    onChange(next);
  };

  const smartSearch = async (text: string) => {
    if (text.trim().length < 3) return toast.error('Describe what you are looking for in a few words');
    setThinking(true);
    try {
      const { filters, source } = await aiApi.parseSearch(text);
      setSource(source);
      if (Object.keys(filters).length === 0) toast('We could not pick out any filters. Try adding a city or type.');
      // Replace the old filters with what we understood.
      update({
        city: filters.city,
        type: filters.type,
        maxPrice: filters.maxPrice?.toString(),
        guests: filters.guests?.toString(),
        startDate: filters.startDate,
        endDate: filters.endDate,
        lat: undefined,
        lng: undefined,
      });
    } catch {
      toast.error('Smart search is unavailable right now. Use the filters below.');
    } finally {
      setThinking(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    smartSearch(sentence);
  };

  const nearMe = () => {
    if (!navigator.geolocation) return toast.error('Your browser does not support location');
    navigator.geolocation.getCurrentPosition(
      (pos) => update({ lat: pos.coords.latitude.toFixed(4), lng: pos.coords.longitude.toFixed(4), city: undefined }),
      () => toast.error('Could not get your location. Please allow location access.')
    );
  };

  const startDate = params.get('startDate') ?? '';
  const endDate = params.get('endDate') ?? '';
  const maxPrice = params.get('maxPrice') ?? '';
  const priceOptions = maxPrice && !PRICE_STEPS.includes(Number(maxPrice)) ? [...PRICE_STEPS, Number(maxPrice)].sort((a, b) => a - b) : PRICE_STEPS;
  const hasFilters = ['city', 'type', 'maxPrice', 'guests', 'startDate', 'endDate', 'lat'].some((k) => params.get(k));

  return (
    <div className="card p-4 sm:p-5">
      <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Sparkles className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-saffron-600" aria-hidden />
          <input
            value={sentence}
            onChange={(e) => setSentence(e.target.value)}
            className="field py-3 pl-10"
            placeholder="Describe it: 7 seater in Karachi this weekend under 30k"
            aria-label="Smart search"
            maxLength={200}
          />
        </div>
        <Button type="submit" variant="accent" loading={thinking} className="sm:px-6">Smart search</Button>
      </form>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span>Try:</span>
        {EXAMPLES.map((example) => (
          <button key={example} type="button" onClick={() => { setSentence(example); smartSearch(example); }} className="rounded-full bg-slate-100 px-2.5 py-1 transition hover:bg-brand-50 hover:text-brand-700">
            {example}
          </button>
        ))}
        {source && <span className="ml-auto rounded-full bg-brand-50 px-2.5 py-1 font-medium text-brand-700">{source === 'ai' ? 'Understood by Gemini AI' : 'Understood by smart rules'}</span>}
      </div>

      <hr className="my-4 border-slate-200" />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
        <select aria-label="City" className="field" value={params.get('city') ?? ''} onChange={(e) => update({ city: e.target.value, lat: undefined, lng: undefined })}>
          <option value="">Any city</option>
          {Object.keys(CITIES).map((c) => <option key={c}>{c}</option>)}
        </select>
        <select aria-label="Type" className="field" value={params.get('type') ?? ''} onChange={(e) => update({ type: e.target.value })}>
          <option value="">Any type</option>
          {Object.entries(TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <input
          type="date" aria-label="Check-in" className="field" min={todayText()} value={startDate}
          onChange={(e) => {
            const value = e.target.value;
            if (!value) return update({ startDate: undefined, endDate: undefined });
            update({ startDate: value, endDate: endDate > value ? endDate : addDays(value, 1) });
          }}
        />
        <input
          type="date" aria-label="Check-out" className="field" min={startDate ? addDays(startDate, 1) : todayText()} value={endDate}
          onChange={(e) => update({ endDate: e.target.value, startDate: startDate || (e.target.value ? addDays(e.target.value, -1) : undefined) })}
        />
        <select aria-label="Guests" className="field" value={params.get('guests') ?? ''} onChange={(e) => update({ guests: e.target.value })}>
          <option value="">Any guests</option>
          {GUEST_STEPS.map((n) => <option key={n} value={n}>{n}+ guests</option>)}
        </select>
        <select aria-label="Maximum price" className="field" value={maxPrice} onChange={(e) => update({ maxPrice: e.target.value })}>
          <option value="">Any price</option>
          {priceOptions.map((p) => <option key={p} value={p}>Up to {p.toLocaleString('en-US')}</option>)}
        </select>
        <select aria-label="Sort" className="field" value={params.get('sort') ?? 'popular'} onChange={(e) => update({ sort: e.target.value === 'popular' ? undefined : e.target.value })}>
          <option value="popular">Most popular</option>
          <option value="rating">Top rated</option>
          <option value="priceAsc">Price: low to high</option>
          <option value="priceDesc">Price: high to low</option>
        </select>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button type="button" variant={params.get('lat') ? 'primary' : 'secondary'} size="sm" onClick={params.get('lat') ? () => update({ lat: undefined, lng: undefined }) : nearMe}>
          <Crosshair className="h-4 w-4" aria-hidden /> {params.get('lat') ? 'Near you (25 km)' : 'Near me'}
        </Button>
        {hasFilters && (
          <Button type="button" variant="ghost" size="sm" onClick={() => { setSource(null); setSentence(''); onChange(new URLSearchParams()); }}>
            Clear all filters
          </Button>
        )}
      </div>
    </div>
  );
}

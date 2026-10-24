import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import { getErrorMessage } from '../../api/client';
import { listingsApi } from '../../api/endpoints';
import { ImageUploader } from '../../components/listings/ImageUploader';
import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/Field';
import { Spinner } from '../../components/ui/Feedback';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { CITIES, TYPE_LABELS } from '../../lib/format';

// Every input is kept as text while typing and converted to numbers when saving.
const EMPTY = {
  title: '', description: '', type: 'car', city: 'Karachi', address: '',
  lat: String(CITIES.Karachi.lat), lng: String(CITIES.Karachi.lng),
  pricePerDay: '', maxGuests: '4', weekendMultiplier: '1.2', longStayDiscountPercent: '10',
  amenities: '', images: '', isActive: true,
};

export default function ListingForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  useDocumentTitle(isEdit ? 'Edit listing' : 'New listing');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY);

  const existing = useQuery({ queryKey: ['listing', id], queryFn: () => listingsApi.get(id!), enabled: isEdit });

  // Fill the form when we are editing.
  useEffect(() => {
    const l = existing.data;
    if (!l) return;
    setForm({
      title: l.title, description: l.description, type: l.type, city: l.city, address: l.address,
      lat: String(l.lat), lng: String(l.lng), pricePerDay: String(l.pricePerDay), maxGuests: String(l.maxGuests),
      weekendMultiplier: String(l.weekendMultiplier), longStayDiscountPercent: String(l.longStayDiscountPercent),
      amenities: l.amenities.join(', '), images: l.images.join('\n'), isActive: l.isActive,
    });
  }, [existing.data]);

  const save = useMutation({
    mutationFn: () => {
      const body = {
        title: form.title, description: form.description, type: form.type, city: form.city, address: form.address,
        lat: Number(form.lat), lng: Number(form.lng),
        pricePerDay: Number(form.pricePerDay), maxGuests: Number(form.maxGuests),
        weekendMultiplier: Number(form.weekendMultiplier), longStayDiscountPercent: Number(form.longStayDiscountPercent),
        amenities: form.amenities.split(',').map((a) => a.trim()).filter(Boolean),
        images: form.images.split('\n').map((i) => i.trim()).filter(Boolean),
        isActive: form.isActive,
      };
      return isEdit ? listingsApi.update(id!, body) : listingsApi.create(body);
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Listing saved' : 'Listing created');
      queryClient.invalidateQueries({ queryKey: ['owner-listings'] });
      queryClient.invalidateQueries({ queryKey: ['listing'] });
      navigate('/owner/listings');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  if (isEdit && existing.isLoading) return <Spinner label="Loading listing" />;

  const set = (key: keyof typeof EMPTY) => (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value });

  const onCityChange = (city: string) => {
    const point = CITIES[city];
    setForm({ ...form, city, lat: String(point.lat), lng: String(point.lng) });
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate();
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-extrabold sm:text-3xl">{isEdit ? 'Edit listing' : 'Add a listing'}</h1>

      <form onSubmit={onSubmit} className="card mt-6 space-y-5 p-5 sm:p-6">
        <Field label="Title"><input required minLength={5} maxLength={120} className="field" value={form.title} onChange={set('title')} placeholder="Toyota Corolla Altis 2023" /></Field>
        <Field label="Description" hint="At least 20 characters. Mention what makes it a good choice.">
          <textarea required minLength={20} maxLength={4000} className="field min-h-32" value={form.description} onChange={set('description')} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Type">
            <select className="field" value={form.type} onChange={set('type')}>{Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
          </Field>
          <Field label="City">
            <select className="field" value={form.city} onChange={(e) => onCityChange(e.target.value)}>{Object.keys(CITIES).map((c) => <option key={c}>{c}</option>)}</select>
          </Field>
        </div>

        <Field label="Address"><input maxLength={200} className="field" value={form.address} onChange={set('address')} placeholder="Clifton Block 5" /></Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Latitude" hint="Pre-filled from the city. In Google Maps, right-click a spot to copy exact numbers."><input required type="number" step="any" className="field" value={form.lat} onChange={set('lat')} /></Field>
          <Field label="Longitude"><input required type="number" step="any" className="field" value={form.lng} onChange={set('lng')} /></Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Price per night (PKR)"><input required type="number" min={1} step={1} className="field" value={form.pricePerDay} onChange={set('pricePerDay')} /></Field>
          <Field label="Maximum guests"><input required type="number" min={1} max={30} step={1} className="field" value={form.maxGuests} onChange={set('maxGuests')} /></Field>
          <Field label="Weekend multiplier" hint="1.2 means Friday and Saturday nights cost 20% more."><input required type="number" min={1} max={3} step="0.05" className="field" value={form.weekendMultiplier} onChange={set('weekendMultiplier')} /></Field>
          <Field label="Long-stay discount (%)" hint="Applied from 7 nights."><input required type="number" min={0} max={50} step={1} className="field" value={form.longStayDiscountPercent} onChange={set('longStayDiscountPercent')} /></Field>
        </div>

        <Field label="Amenities" hint="Separate with commas"><input className="field" value={form.amenities} onChange={set('amenities')} placeholder="WiFi, Parking, Air conditioning" /></Field>
              <div>
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Photos</span>
          <ImageUploader
            images={form.images.split('\n').map((i) => i.trim()).filter(Boolean)}
            onChange={(list) => setForm({ ...form, images: list.join('\n') })}
          />
          <span className="mt-1 block text-xs text-slate-500">The first photo is the cover. Add at least one.</span>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
          Visible to customers
        </label>

        <div className="flex justify-end gap-2 border-t border-slate-200 pt-5">
          <Button type="button" variant="ghost" onClick={() => navigate('/owner/listings')}>Cancel</Button>
          <Button type="submit" loading={save.isPending}>{isEdit ? 'Save changes' : 'Create listing'}</Button>
        </div>
      </form>
    </div>
  );
}

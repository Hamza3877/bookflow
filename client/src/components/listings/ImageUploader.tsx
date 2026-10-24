import { ImagePlus, Star, Trash2 } from 'lucide-react';
import { ChangeEvent, DragEvent, useRef, useState } from 'react';
import toast from 'react-hot-toast';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined;
const MAX_PHOTOS = 8;
const MAX_MB = 5;

interface Props {
  images: string[];
  onChange: (images: string[]) => void;
}

// Sends one photo to Cloudinary and returns a resized, compressed link.
async function uploadPhoto(file: File): Promise<string> {
  const body = new FormData();
  body.append('file', file);
  body.append('upload_preset', UPLOAD_PRESET!);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body });
  if (!response.ok) throw new Error('Upload failed');
  const data = (await response.json()) as { secure_url: string };
  return data.secure_url.replace('/upload/', '/upload/f_auto,q_auto,w_1200/');
}

export function ImageUploader({ images, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [link, setLink] = useState('');
  const canUpload = Boolean(CLOUD_NAME && UPLOAD_PRESET);

  const handleFiles = async (fileList: FileList | File[]) => {
    const room = MAX_PHOTOS - images.length;
    if (room <= 0) return toast.error(`You can add up to ${MAX_PHOTOS} photos`);

    const files = Array.from(fileList)
      .slice(0, room)
      .filter((file) => {
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image`);
          return false;
        }
        if (file.size > MAX_MB * 1024 * 1024) {
          toast.error(`${file.name} is bigger than ${MAX_MB} MB`);
          return false;
        }
        return true;
      });
    if (files.length === 0) return;

    setUploading(files.length);
    const results = await Promise.allSettled(files.map(uploadPhoto));
    const uploaded = results
      .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
      .map((r) => r.value);
    if (uploaded.length < files.length) toast.error('Some photos could not be uploaded. Please try again.');
    setUploading(0);
    onChange([...images, ...uploaded]);
  };

  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files);
    e.target.value = ''; // lets the same file be picked again
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const makeCover = (index: number) => onChange([images[index], ...images.filter((_, i) => i !== index)]);
  const remove = (index: number) => onChange(images.filter((_, i) => i !== index));

  const addLink = () => {
    const url = link.trim();
    if (!/^https?:\/\//.test(url)) return toast.error('Paste a full link starting with https://');
    if (images.length >= MAX_PHOTOS) return toast.error(`You can add up to ${MAX_PHOTOS} photos`);
    onChange([...images, url]);
    setLink('');
  };

  return (
    <div>
      {canUpload ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className="flex flex-col items-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center transition hover:border-brand-400"
        >
          <ImagePlus className="h-8 w-8 text-brand-600" aria-hidden />
          <p className="mt-2 text-sm font-medium">Drag photos here, or</p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Choose photos
          </button>
          <p className="mt-2 text-xs text-slate-500">Up to {MAX_PHOTOS} photos, {MAX_MB} MB each</p>
          <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={onPick} />
        </div>
      ) : (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Photo upload is not set up yet. You can paste image links below.
        </p>
      )}

      {(images.length > 0 || uploading > 0) && (
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {images.map((src, i) => (
            <li key={src + i} className="relative overflow-hidden rounded-lg ring-1 ring-slate-200">
              <img src={src} alt={`Photo ${i + 1}`} className="aspect-[4/3] w-full object-cover" />
              {i === 0 && (
                <span className="absolute left-1.5 top-1.5 rounded bg-brand-600 px-1.5 py-0.5 text-xs font-semibold text-white">Cover</span>
              )}
              <div className="absolute bottom-1.5 right-1.5 flex gap-1">
                {i !== 0 && (
                  <button type="button" onClick={() => makeCover(i)} aria-label="Make cover photo" className="rounded bg-white/95 p-1.5 shadow hover:bg-white">
                    <Star className="h-4 w-4" />
                  </button>
                )}
                <button type="button" onClick={() => remove(i)} aria-label="Remove photo" className="rounded bg-white/95 p-1.5 shadow hover:bg-white">
                  <Trash2 className="h-4 w-4 text-rose-600" />
                </button>
              </div>
            </li>
          ))}
          {Array.from({ length: uploading }, (_, i) => (
            <li key={`loading-${i}`} className="aspect-[4/3] animate-pulse rounded-lg bg-slate-200" aria-label="Uploading" />
          ))}
        </ul>
      )}

      <div className="mt-3 flex gap-2">
        <input className="field" placeholder="Or paste an image link (https://...)" value={link} onChange={(e) => setLink(e.target.value)} />
        <button type="button" onClick={addLink} className="shrink-0 rounded-lg border border-slate-300 px-3 text-sm font-semibold hover:bg-slate-50">
          Add
        </button>
      </div>
    </div>
  );
}
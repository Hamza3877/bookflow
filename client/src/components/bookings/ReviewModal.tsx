import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../api/client';
import { reviewsApi } from '../../api/endpoints';
import { Booking } from '../../types';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

export function ReviewModal({ booking, onClose }: { booking: Booking | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const mutation = useMutation({
    mutationFn: () => reviewsApi.add(booking!.listingId, { bookingId: booking!.id, rating, comment }),
    onSuccess: () => {
      toast.success('Thanks for your review!');
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['listing'] });
      setComment('');
      onClose();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <Modal open={!!booking} title="Rate your stay" onClose={onClose}>
      <p className="mb-3 text-sm text-slate-600">{booking?.listing?.title}</p>
      <div className="mb-4 flex gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} star${n > 1 ? 's' : ''}`} aria-checked={rating === n} role="radio">
            <Star className={`h-8 w-8 transition ${n <= rating ? 'fill-saffron-500 text-saffron-500' : 'text-slate-300'}`} />
          </button>
        ))}
      </div>
      <textarea
        className="field min-h-24"
        placeholder="What did you like? (optional)"
        maxLength={1000}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button loading={mutation.isPending} onClick={() => mutation.mutate()}>Submit review</Button>
      </div>
    </Modal>
  );
}

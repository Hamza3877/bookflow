import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Remembers the dates a visitor picked while they log in, so they do not have to pick them again.
interface Draft {
  listingId: string | null;
  startDate: string | null;
  endDate: string | null;
  guests: number;
}

const initialState: Draft = { listingId: null, startDate: null, endDate: null, guests: 1 };

const draftSlice = createSlice({
  name: 'bookingDraft',
  initialState,
  reducers: {
    saveDraft: (_state, action: PayloadAction<Draft>) => action.payload,
    clearDraft: () => initialState,
  },
});

export const { saveDraft, clearDraft } = draftSlice.actions;
export default draftSlice.reducer;

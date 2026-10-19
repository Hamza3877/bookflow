import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export const CURRENCIES = ['PKR', 'USD', 'EUR', 'GBP', 'AED'] as const;
export type Currency = (typeof CURRENCIES)[number];

function savedCurrency(): Currency {
  try {
    const value = localStorage.getItem('bf_currency') as Currency | null;
    return value && CURRENCIES.includes(value) ? value : 'PKR';
  } catch {
    return 'PKR';
  }
}

const uiSlice = createSlice({
  name: 'ui',
  initialState: { currency: savedCurrency() },
  reducers: {
    setCurrency(state, action: PayloadAction<Currency>) {
      state.currency = action.payload;
      try {
        localStorage.setItem('bf_currency', action.payload);
      } catch {
        /* storage can be blocked, the choice just will not be remembered */
      }
    },
  },
});

export const { setCurrency } = uiSlice.actions;
export default uiSlice.reducer;

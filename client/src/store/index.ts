import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { setAccessToken, setAuthHandlers } from '../api/client';
import authReducer, { sessionEnded, sessionStarted } from './authSlice';
import bookingDraftReducer from './bookingDraftSlice';
import uiReducer from './uiSlice';

export const store = configureStore({
  reducer: { auth: authReducer, ui: uiReducer, bookingDraft: bookingDraftReducer },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Keep the axios client in sync with the logged-in user.
store.subscribe(() => setAccessToken(store.getState().auth.accessToken));
setAuthHandlers({
  onRefreshed: (data) => store.dispatch(sessionStarted(data as Parameters<typeof sessionStarted>[0])),
  onSessionLost: () => store.dispatch(sessionEnded()),
});

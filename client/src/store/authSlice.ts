import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { authApi, SessionResponse } from '../api/endpoints';
import { User } from '../types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  // "loading" while we check if the visitor already has a valid session cookie.
  status: 'loading' | 'ready';
}

const initialState: AuthState = { user: null, accessToken: null, status: 'loading' };

// Runs once when the app opens: if the refresh cookie is valid we are logged in again.
export const restoreSession = createAsyncThunk('auth/restore', async () => {
  try {
    return await authApi.refresh();
  } catch {
    return null;
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    sessionStarted(state, action: PayloadAction<SessionResponse>) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.status = 'ready';
    },
    sessionEnded(state) {
      state.user = null;
      state.accessToken = null;
      state.status = 'ready';
    },
  },
  extraReducers: (builder) => {
    builder.addCase(restoreSession.fulfilled, (state, action) => {
      state.user = action.payload?.user ?? null;
      state.accessToken = action.payload?.accessToken ?? null;
      state.status = 'ready';
    });
  },
});

export const { sessionStarted, sessionEnded } = authSlice.actions;
export default authSlice.reducer;

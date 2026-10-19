import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi, SessionResponse } from '../api/endpoints';
import { sessionEnded, sessionStarted } from '../store/authSlice';
import { useAppDispatch } from '../store';

// Login, register and logout in one place.
export function useAuthActions() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const start = (session: SessionResponse) => {
    dispatch(sessionStarted(session));
    return session;
  };

  const login = async (email: string, password: string) => start(await authApi.login({ email, password }));
  const register = async (body: Record<string, unknown>) => start(await authApi.register(body));

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      dispatch(sessionEnded());
      queryClient.clear(); // forget private data from the previous user
      navigate('/');
    }
  };

  return { login, register, logout };
}

// Where each role lands after logging in.
export function homeFor(role: string) {
  if (role === 'owner') return '/owner';
  if (role === 'admin') return '/admin';
  return '/';
}

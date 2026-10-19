import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api';

export const http = axios.create({ baseURL, withCredentials: true });

// ---- access token handling ----
// The access token lives in memory only (never localStorage), so scripts injected
// into the page cannot steal it. The refresh cookie is httpOnly for the same reason.
let accessToken: string | null = null;
export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

interface AuthHandlers {
  onRefreshed: (data: unknown) => void;
  onSessionLost: () => void;
}
let handlers: AuthHandlers | null = null;
export const setAuthHandlers = (h: AuthHandlers) => {
  handlers = h;
};

http.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

// If the access token expired, get a new one with the refresh cookie and repeat the request once.
let refreshing: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  try {
    const { data } = await axios.post(`${baseURL}/auth/refresh`, {}, { withCredentials: true });
    handlers?.onRefreshed(data);
    return true;
  } catch {
    handlers?.onSessionLost();
    return false;
  }
}

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ code?: string }>) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    if (error.response?.status === 401 && error.response.data?.code === 'TOKEN_EXPIRED' && original && !original._retried) {
      original._retried = true;
      refreshing = refreshing ?? refreshSession().finally(() => (refreshing = null));
      if (await refreshing) return http(original);
    }
    return Promise.reject(error);
  }
);

// Turns any error into a message we can show to the user.
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return (error.response?.data as { message?: string } | undefined)?.message ?? 'Network problem. Please check your connection.';
  }
  return error instanceof Error ? error.message : 'Something went wrong';
}

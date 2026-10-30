import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : '';

function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('cashify-auth') || localStorage.getItem('sstelecom-auth') || localStorage.getItem('minttechnologies-auth') || localStorage.getItem('fhoneify-auth');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.state?.accessToken) return parsed.state.accessToken;
    }
    const directToken = localStorage.getItem('accessToken');
    if (directToken) return directToken;
    return null;
  } catch {
    return localStorage.getItem('accessToken') || null;
  }
}

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const configUrl = error.config?.url || '';
      const path = window.location.pathname;
      
      // Do not globally redirect if it's an OTP error (like "Invalid OTP") or if we are on the Quote page (which has its own modal)
      if (!configUrl.includes('/api/auth/otp') && !path.startsWith('/auth') && !path.startsWith('/quote')) {
        localStorage.removeItem('cashify-auth');
        window.location.href = '/auth';
      }
    }
    return Promise.reject(error);
  }
);

export { api };
export default api;

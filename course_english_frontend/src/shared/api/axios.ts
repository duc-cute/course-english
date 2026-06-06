import axios from "axios";
import { AUTH_STORAGE_KEY } from "../auth/token";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return config;
  }

  try {
    const parsed = JSON.parse(raw) as { token?: string };
    const accessToken = parsed.token ? (JSON.parse(parsed.token) as string) : null;
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
  } catch {
    // ignore malformed storage
  }

  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error.response?.data ?? error),
);

export default api;

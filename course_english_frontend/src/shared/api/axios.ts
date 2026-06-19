import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { handleSessionExpired, refreshAccessToken } from "../auth/authSession";
import { isAccessTokenExpired } from "../auth/jwtUtils";
import { getAccessToken } from "../auth/token";

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

function isAuthRequest(url?: string): boolean {
  if (!url) {
    return false;
  }
  return (
    url.includes("/auth/login") ||
    url.includes("/auth/google") ||
    url.includes("/auth/refresh") ||
    url.includes("/auth/register") ||
    url.includes("/auth/forgot-password") ||
    url.includes("/auth/reset-password")
  );
}

function isUnauthorizedResponse(status?: number, data?: unknown): boolean {
  if (status === 401) {
    return true;
  }
  if (data && typeof data === "object" && "statusCode" in data) {
    return (data as { statusCode?: number }).statusCode === 401;
  }
  return false;
}

api.interceptors.request.use(async (config) => {
  if (isAuthRequest(config.url)) {
    return config;
  }

  let accessToken = getAccessToken();
  if (accessToken && isAccessTokenExpired(accessToken)) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      accessToken = refreshed;
    }
  }

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  async (error: AxiosError) => {
    const responseData = error.response?.data;
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (
      originalRequest &&
      !originalRequest._retry &&
      !isAuthRequest(originalRequest.url) &&
      !originalRequest.headers?.["x-no-retry"] &&
      isUnauthorizedResponse(error.response?.status, responseData)
    ) {
      originalRequest._retry = true;

      const newToken = await refreshAccessToken();
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      }

      handleSessionExpired();
    }

    return Promise.reject(responseData ?? error);
  },
);

export default api;

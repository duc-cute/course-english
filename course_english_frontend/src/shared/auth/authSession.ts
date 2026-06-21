import axios from "axios";
import type { ApiResponse, LoginResponseData } from "../api/types";
import { paths } from "../constants/paths";
import { clearAccessToken, setAccessToken } from "./token";
import { cacheLoginUserProfile, clearCachedUserProfile } from "./userProfileCache";

export const AUTH_SESSION_EXPIRED_EVENT = "auth:session-expired";
export const AUTH_TOKEN_REFRESHED_EVENT = "auth:token-refreshed";

let refreshInFlight: Promise<string | null> | null = null;

function dispatchAuthEvent(name: string, detail?: unknown): void {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

export async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  const baseURL = import.meta.env.VITE_API_URL as string | undefined;
  if (!baseURL) {
    return null;
  }

  refreshInFlight = axios
    .get<ApiResponse<LoginResponseData>>(`${baseURL}/auth/refresh`, {
      withCredentials: true,
      headers: { "x-no-retry": "1" },
    })
    .then((response) => {
      const token = response.data?.data?.access_token;
      const user = response.data?.data?.user;
      if (!token) {
        return null;
      }
      setAccessToken(token);
      cacheLoginUserProfile(user);
      dispatchAuthEvent(AUTH_TOKEN_REFRESHED_EVENT, token);
      return token;
    })
    .catch(() => null)
    .finally(() => {
      refreshInFlight = null;
    });

  return refreshInFlight;
}

export function handleSessionExpired(): void {
  clearAccessToken();
  clearCachedUserProfile();
  dispatchAuthEvent(AUTH_SESSION_EXPIRED_EVENT);

  const path = window.location.pathname;
  if (path === `/${paths.LOGIN}` || path.endsWith(`/${paths.LOGIN}`)) {
    return;
  }

  const from = encodeURIComponent(path);
  window.location.assign(`/${paths.LOGIN}?reason=session-expired&from=${from}`);
}

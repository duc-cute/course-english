export const AUTH_STORAGE_KEY = "persist:shop/user";

export function getAccessToken(): string | null {
  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as { token?: string };
    if (!parsed.token) {
      return null;
    }
    const token = JSON.parse(parsed.token) as string;
    return typeof token === "string" && token.length > 0 ? token : null;
  } catch {
    return null;
  }
}

export function setAccessToken(token: string) {
  window.localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({ token: JSON.stringify(token) }),
  );
}

export function clearAccessToken() {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

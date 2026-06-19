export const AUTH_STORAGE_KEY = "persist:shop/user";

type AccessTokenListener = (token: string | null) => void;
const accessTokenListeners = new Set<AccessTokenListener>();

function notifyAccessTokenChange(token: string | null): void {
  accessTokenListeners.forEach((listener) => listener(token));
}

export function subscribeAccessTokenChange(listener: AccessTokenListener): () => void {
  accessTokenListeners.add(listener);
  return () => {
    accessTokenListeners.delete(listener);
  };
}

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
  notifyAccessTokenChange(token);
}

export function clearAccessToken() {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  notifyAccessTokenChange(null);
}

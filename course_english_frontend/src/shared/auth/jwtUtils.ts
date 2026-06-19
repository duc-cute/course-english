type JwtPayload = {
  exp?: number;
  roles?: string[];
  role?: string;
};

function decodeJwtPayload(token: string): JwtPayload | null {
  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const json = atob(padded);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

/** True when JWT `exp` is in the past (with optional skew buffer). */
export function isAccessTokenExpired(token: string, skewSeconds = 30): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) {
    return false;
  }

  const expiresAtMs = payload.exp * 1000;
  return Date.now() >= expiresAtMs - skewSeconds * 1000;
}

export function getAccessTokenExpiresAtMs(token: string): number | null {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) {
    return null;
  }
  return payload.exp * 1000;
}

export function getRolesFromAccessToken(token: string): string[] {
  const payload = decodeJwtPayload(token);
  if (!payload) {
    return [];
  }

  const roles = Array.isArray(payload.roles)
    ? payload.roles.filter((role): role is string => typeof role === "string")
    : [];

  if (typeof payload.role === "string" && payload.role.trim()) {
    const normalized = payload.role.trim();
    if (!roles.includes(normalized)) {
      roles.push(normalized);
    }
  }

  return roles;
}

export function getUserIdFromAccessToken(token: string): string | null {
  const payload = decodeJwtPayload(token) as { duccute?: { id?: string } } | null;
  const id = payload?.duccute?.id?.trim();
  return id || null;
}

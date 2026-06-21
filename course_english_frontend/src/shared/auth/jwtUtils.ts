type JwtPayload = {
  exp?: number;
  roles?: string[];
  role?: string;
  name?: string;
  email?: string;
  sub?: string;
  username?: string;
};

/** Base64url JWT segment → UTF-8 JSON string (atob alone breaks Vietnamese). */
function base64UrlToUtf8(segment: string): string {
  const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder("utf-8").decode(bytes);
}

export function decodeJwtPayload(token: string): JwtPayload | null {
  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }

  try {
    return JSON.parse(base64UrlToUtf8(parts[1])) as JwtPayload;
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

type DuccuteClaim = {
  id?: string;
  name?: string;
  email?: string;
};

export function getDuccuteFromAccessToken(token: string): DuccuteClaim | null {
  const payload = decodeJwtPayload(token) as { duccute?: DuccuteClaim } | null;
  return payload?.duccute ?? null;
}

export function getUserIdFromAccessToken(token: string): string | null {
  const id = getDuccuteFromAccessToken(token)?.id?.trim();
  return id || null;
}

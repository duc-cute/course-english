import { getAccessToken } from "../../../shared/auth/token";

export type StudentAccountInfo = {
  displayName: string;
  email: string | null;
};

function readJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const segment = token.split(".")[1];
    if (!segment) return null;
    return JSON.parse(atob(segment)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function normalizeName(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  const value = raw.trim();
  if (value.includes("@")) {
    const local = value.split("@")[0]?.trim();
    return local || null;
  }
  return value;
}

function normalizeEmail(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  const value = raw.trim();
  return value.includes("@") ? value : null;
}

/** Display name + email from JWT claims. */
export function getStudentAccountInfo(): StudentAccountInfo {
  const token = getAccessToken();
  if (!token) {
    return { displayName: "bạn", email: null };
  }

  const payload = readJwtPayload(token);
  if (!payload) {
    return { displayName: "bạn", email: null };
  }

  const email =
    normalizeEmail(payload.email) ??
    normalizeEmail(payload.sub) ??
    normalizeEmail(payload.username);

  const displayName =
    normalizeName(payload.name) ??
    (email ? normalizeName(email.split("@")[0]) : null) ??
    normalizeName(payload.sub) ??
    normalizeName(payload.username) ??
    "bạn";

  return { displayName, email };
}

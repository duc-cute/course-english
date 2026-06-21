import { decodeJwtPayload, getDuccuteFromAccessToken } from "../../../shared/auth/jwtUtils";
import { getCachedDisplayName } from "../../../shared/auth/userProfileCache";
import { getAccessToken } from "../../../shared/auth/token";

export type StudentAccountInfo = {
  displayName: string;
  email: string | null;
};

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

/** Display name + email from cached profile or JWT claims. */
export function getStudentAccountInfo(): StudentAccountInfo {
  const token = getAccessToken();
  if (!token) {
    return { displayName: "bạn", email: null };
  }

  const payload = decodeJwtPayload(token);
  if (!payload) {
    return { displayName: "bạn", email: null };
  }

  const duccute = getDuccuteFromAccessToken(token);

  const email =
    normalizeEmail(duccute?.email) ??
    normalizeEmail(payload.email) ??
    normalizeEmail(payload.sub) ??
    normalizeEmail(payload.username);

  const displayName =
    getCachedDisplayName() ??
    normalizeName(duccute?.name) ??
    normalizeName(payload.name) ??
    (email ? normalizeName(email.split("@")[0]) : null) ??
    "bạn";

  return { displayName, email };
}

import { decodeJwtPayload } from "./jwtUtils";

type GoogleIdTokenPayload = {
  picture?: string;
  name?: string;
  email?: string;
};

function normalizeText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

/** Read profile fields embedded in Google Sign-In ID token (JWT). */
export function readGoogleIdTokenProfile(idToken: string): {
  picture: string | null;
  name: string | null;
  email: string | null;
} {
  const payload = decodeJwtPayload(idToken) as GoogleIdTokenPayload | null;
  if (!payload) {
    return { picture: null, name: null, email: null };
  }

  return {
    picture: normalizeText(payload.picture),
    name: normalizeText(payload.name),
    email: normalizeText(payload.email),
  };
}

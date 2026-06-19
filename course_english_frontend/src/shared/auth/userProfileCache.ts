const USER_PROFILE_STORAGE_KEY = "course-english:user-profile";

type CachedUserProfile = {
  avatarUrl?: string | null;
};

function readProfile(): CachedUserProfile | null {
  const raw = window.localStorage.getItem(USER_PROFILE_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as CachedUserProfile;
  } catch {
    return null;
  }
}

export function getCachedAvatarUrl(): string | null {
  const url = readProfile()?.avatarUrl?.trim();
  return url || null;
}

export function setCachedAvatarUrl(avatarUrl: string | null | undefined): void {
  const trimmed = avatarUrl?.trim();
  if (!trimmed) {
    window.localStorage.removeItem(USER_PROFILE_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(
    USER_PROFILE_STORAGE_KEY,
    JSON.stringify({ avatarUrl: trimmed } satisfies CachedUserProfile),
  );
}

export function clearCachedUserProfile(): void {
  window.localStorage.removeItem(USER_PROFILE_STORAGE_KEY);
}

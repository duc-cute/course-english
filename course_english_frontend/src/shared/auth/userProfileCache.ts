const USER_PROFILE_STORAGE_KEY = "course-english:user-profile";

type CachedUserProfile = {
  displayName?: string | null;
  avatarUrl?: string | null;
};

function readProfile(): CachedUserProfile {
  const raw = window.localStorage.getItem(USER_PROFILE_STORAGE_KEY);
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw) as CachedUserProfile;
  } catch {
    return {};
  }
}

function writeProfile(partial: CachedUserProfile): void {
  const merged = { ...readProfile(), ...partial };
  const cleaned: CachedUserProfile = {};

  const displayName = merged.displayName?.trim();
  const avatarUrl = merged.avatarUrl?.trim();

  if (displayName) {
    cleaned.displayName = displayName;
  }
  if (avatarUrl) {
    cleaned.avatarUrl = avatarUrl;
  }

  if (Object.keys(cleaned).length === 0) {
    window.localStorage.removeItem(USER_PROFILE_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(cleaned));
}

export function getCachedDisplayName(): string | null {
  const name = readProfile().displayName?.trim();
  return name || null;
}

export function getCachedAvatarUrl(): string | null {
  const url = readProfile().avatarUrl?.trim();
  return url || null;
}

export function cacheLoginUserProfile(user?: {
  name?: string | null;
  avatarUrl?: string | null;
}): void {
  if (!user) {
    return;
  }

  writeProfile({
    displayName: user.name?.trim() || null,
    avatarUrl: user.avatarUrl?.trim() || null,
  });
}

/** @deprecated Prefer cacheLoginUserProfile */
export function setCachedAvatarUrl(avatarUrl: string | null | undefined): void {
  writeProfile({ avatarUrl: avatarUrl?.trim() || null });
}

export function clearCachedUserProfile(): void {
  window.localStorage.removeItem(USER_PROFILE_STORAGE_KEY);
}

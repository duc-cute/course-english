import { useEffect, useState } from "react";
import { apiGetFeatureFlags, type FeatureFlags } from "../api/systemConfig";
import { normalizeVocabularyAudioAccent } from "../constants/systemConfigKeys";

const FEATURE_FLAGS_STORAGE_KEY = "course_english_feature_flags";

const DEFAULT_FLAGS: FeatureFlags = {
  dictionaryEnrichEnabled: true,
  vocabularyAudioEnabled: true,
  vocabularyAudioAccent: "UK",
  studentSelfRegistrationEnabled: true,
};

function normalizeFlags(data: Partial<FeatureFlags>): FeatureFlags {
  return {
    dictionaryEnrichEnabled: data.dictionaryEnrichEnabled !== false,
    vocabularyAudioEnabled: data.vocabularyAudioEnabled !== false,
    vocabularyAudioAccent: normalizeVocabularyAudioAccent(data.vocabularyAudioAccent),
    studentSelfRegistrationEnabled: data.studentSelfRegistrationEnabled !== false,
  };
}

function readFlagsFromStorage(): FeatureFlags | null {
  try {
    const raw = window.localStorage.getItem(FEATURE_FLAGS_STORAGE_KEY);
    if (!raw) return null;
    return normalizeFlags(JSON.parse(raw) as Partial<FeatureFlags>);
  } catch {
    return null;
  }
}

function persistFlagsToStorage(flags: FeatureFlags) {
  try {
    window.localStorage.setItem(FEATURE_FLAGS_STORAGE_KEY, JSON.stringify(flags));
  } catch {
    /* quota / private mode */
  }
}

let cachedFlags: FeatureFlags | null = readFlagsFromStorage();
let inflight: Promise<FeatureFlags> | null = null;

async function loadFeatureFlags(): Promise<FeatureFlags> {
  if (cachedFlags) return cachedFlags;
  if (inflight) return inflight;

  inflight = apiGetFeatureFlags()
    .then((response) => {
      const data = (response?.result ?? response?.data ?? DEFAULT_FLAGS) as Partial<FeatureFlags>;
      cachedFlags = normalizeFlags(data);
      persistFlagsToStorage(cachedFlags);
      return cachedFlags;
    })
    .catch(() => cachedFlags ?? DEFAULT_FLAGS)
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

export function getCachedFeatureFlags(): FeatureFlags {
  return cachedFlags ?? readFlagsFromStorage() ?? DEFAULT_FLAGS;
}

export function invalidateFeatureFlagsCache() {
  cachedFlags = null;
  try {
    window.localStorage.removeItem(FEATURE_FLAGS_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function useFeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlags>(getCachedFeatureFlags());
  const [loading, setLoading] = useState(!cachedFlags);

  useEffect(() => {
    let active = true;
    void loadFeatureFlags().then((data) => {
      if (active) {
        setFlags(data);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return { flags, loading };
}

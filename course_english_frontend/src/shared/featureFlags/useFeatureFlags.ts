import { useEffect, useState } from "react";
import { apiGetFeatureFlags, type FeatureFlags } from "../api/systemConfig";
import { normalizeVocabularyAudioAccent } from "../constants/systemConfigKeys";

const DEFAULT_FLAGS: FeatureFlags = {
  dictionaryEnrichEnabled: true,
  vocabularyAudioEnabled: true,
  vocabularyAudioAccent: "UK",
  studentSelfRegistrationEnabled: true,
};

let cachedFlags: FeatureFlags | null = null;
let inflight: Promise<FeatureFlags> | null = null;

async function loadFeatureFlags(): Promise<FeatureFlags> {
  if (cachedFlags) return cachedFlags;
  if (inflight) return inflight;

  inflight = apiGetFeatureFlags()
    .then((response) => {
      const data = (response?.result ?? response?.data ?? DEFAULT_FLAGS) as FeatureFlags;
      cachedFlags = {
        dictionaryEnrichEnabled: data.dictionaryEnrichEnabled !== false,
        vocabularyAudioEnabled: data.vocabularyAudioEnabled !== false,
        vocabularyAudioAccent: normalizeVocabularyAudioAccent(data.vocabularyAudioAccent),
        studentSelfRegistrationEnabled: data.studentSelfRegistrationEnabled !== false,
      };
      return cachedFlags;
    })
    .catch(() => DEFAULT_FLAGS)
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

export function invalidateFeatureFlagsCache() {
  cachedFlags = null;
}

export function useFeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlags>(cachedFlags ?? DEFAULT_FLAGS);
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

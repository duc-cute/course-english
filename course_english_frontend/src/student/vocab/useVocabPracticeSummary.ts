import { useCallback, useEffect, useMemo, useState } from "react";
import {
  apiGetVocabularyPracticeSummary,
  type VocabularyPracticeSummaryItem,
} from "../../shared/api/vocabularyPracticeAttempt";

export function useVocabPracticeSummary(vocabularySetIds: string[]) {
  const idsKey = useMemo(
    () => [...new Set(vocabularySetIds.filter(Boolean))].sort().join(","),
    [vocabularySetIds],
  );

  const [bySetId, setBySetId] = useState<Record<string, VocabularyPracticeSummaryItem>>({});
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    const ids = idsKey ? idsKey.split(",") : [];
    if (ids.length === 0) {
      setBySetId({});
      return;
    }
    setLoading(true);
    try {
      const items = await apiGetVocabularyPracticeSummary(ids);
      const map: Record<string, VocabularyPracticeSummaryItem> = {};
      for (const item of items) {
        map[item.vocabularySetId] = item;
      }
      setBySetId(map);
    } catch {
      setBySetId({});
    } finally {
      setLoading(false);
    }
  }, [idsKey]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return { bySetId, loading, refetch: fetchData };
}

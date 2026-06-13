import { useCallback, useEffect, useState } from "react";
import { apiGetVocabularySetById, type VocabularySetRecord } from "../../shared/api/vocabularySet";
import type { ApiResponse } from "../../shared/api/types";

export function useVocabSetDetail(setId: string | undefined) {
  const [set, setSet] = useState<VocabularySetRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchDetail = useCallback(async () => {
    if (!setId) {
      setSet(null);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = (await apiGetVocabularySetById(setId)) as ApiResponse<VocabularySetRecord>;
      const data = response?.result ?? response?.data;
      if (!data?.id) {
        setSet(null);
        setError("Bộ từ vựng không tồn tại.");
        return;
      }
      if (data.status && data.status !== "PUBLISHED") {
        setSet(null);
        setError("Bộ từ vựng chưa được publish.");
        return;
      }
      setSet(data);
    } catch (err) {
      setSet(null);
      setError((err as { message?: string })?.message || "Không thể tải bộ từ vựng.");
    } finally {
      setLoading(false);
    }
  }, [setId]);

  useEffect(() => {
    void fetchDetail();
  }, [fetchDetail]);

  return { set, loading, error, refetch: fetchDetail };
}

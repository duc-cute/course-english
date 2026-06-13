import { useCallback, useEffect, useState } from "react";
import {
  apiSearchVocabularySets,
  type VocabularySetRecord,
  type VocabularySetsPaginationResult,
} from "../../shared/api/vocabularySet";
import type { ApiResponse } from "../../shared/api/types";

export type UsePublishedVocabSetsOptions = {
  classroomId?: string | null;
  enrolledOnly?: boolean;
};

function unwrapRows(response: ApiResponse<VocabularySetsPaginationResult>): VocabularySetRecord[] {
  const raw = response?.data?.result ?? response?.result;
  if (Array.isArray(raw)) return raw;
  return (raw as VocabularySetsPaginationResult | undefined)?.result ?? [];
}

export function usePublishedVocabSets(searchText: string, options: UsePublishedVocabSetsOptions = {}) {
  const { classroomId = null, enrolledOnly = true } = options;

  const [rows, setRows] = useState<VocabularySetRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, unknown> = {
        page: 0,
        size: 50,
        status: "PUBLISHED",
      };
      const trimmed = searchText.trim();
      if (trimmed) params.keyword = trimmed;
      if (enrolledOnly) params.enrolledOnly = true;
      if (classroomId) params.classroomId = classroomId;

      const response = await apiSearchVocabularySets(params);
      setRows(unwrapRows(response as ApiResponse<VocabularySetsPaginationResult>));
    } catch (err) {
      setRows([]);
      setError((err as { message?: string })?.message || "Không thể tải bộ từ vựng.");
    } finally {
      setLoading(false);
    }
  }, [searchText, classroomId, enrolledOnly]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return { rows, loading, error, refetch: fetchData };
}

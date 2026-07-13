import { useCallback, useEffect, useState } from "react";
import {
  apiGetStudentAssignedVocabSets,
  type VocabularySetAssignmentRecord,
} from "../../shared/api/vocabularySetAssignment";
import type { ApiResponse } from "../../shared/api/types";

export function useAssignedVocabSets(classroomId?: string | null) {
  const [rows, setRows] = useState<VocabularySetAssignmentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiGetStudentAssignedVocabSets(classroomId);
      const data = response as ApiResponse<VocabularySetAssignmentRecord[]>;
      const list = data?.data ?? (Array.isArray(data?.result) ? data.result : null);
      setRows(Array.isArray(list) ? list : []);
    } catch (err) {
      setRows([]);
      setError((err as { message?: string })?.message || "Không thể tải bộ từ được giao.");
    } finally {
      setLoading(false);
    }
  }, [classroomId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return { rows, loading, error, refetch: fetchData };
}

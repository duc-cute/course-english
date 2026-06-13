import { useCallback, useEffect, useState } from "react";
import {
  apiGetMyEnrollments,
  type EnrollmentsPaginationResult,
  type EnrollmentRecord,
} from "../../shared/api/enrollment";
import type { ApiResponse } from "../../shared/api/types";

export type StudentClassroomOption = {
  classroomId: string;
  classroomName: string;
};

function unwrapEnrollmentRows(response: ApiResponse<EnrollmentsPaginationResult>): EnrollmentRecord[] {
  const raw = response?.data?.result ?? response?.result;
  if (Array.isArray(raw)) return raw;
  return (raw as EnrollmentsPaginationResult | undefined)?.result ?? [];
}

export function useStudentEnrollments() {
  const [classrooms, setClassrooms] = useState<StudentClassroomOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchEnrollments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiGetMyEnrollments();
      const rows = unwrapEnrollmentRows(response as ApiResponse<EnrollmentsPaginationResult>);
      const active = rows.filter((row) => row.status !== "INACTIVE" && row.classroomId);

      const seen = new Set<string>();
      const options: StudentClassroomOption[] = [];
      for (const row of active) {
        const id = row.classroomId!;
        if (seen.has(id)) continue;
        seen.add(id);
        options.push({
          classroomId: id,
          classroomName: row.classroomName?.trim() || "Lớp học",
        });
      }

      options.sort((a, b) => a.classroomName.localeCompare(b.classroomName, "vi"));
      setClassrooms(options);
    } catch (err) {
      setClassrooms([]);
      setError((err as { message?: string })?.message || "Không thể tải thông tin ghi danh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchEnrollments();
  }, [fetchEnrollments]);

  return {
    classrooms,
    hasEnrollment: classrooms.length > 0,
    loading,
    error,
    refetch: fetchEnrollments,
  };
}

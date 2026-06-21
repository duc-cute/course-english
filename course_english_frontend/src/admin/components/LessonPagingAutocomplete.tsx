import { PagingAutocomplete, type FetchPageFn } from "./PagingAutocomplete";
import { apiGetLessons, type LessonRecord, type LessonsPaginationResult } from "../../shared/api/lesson";
import type { ApiResponse } from "../../shared/api/types";

type LessonPagingAutocompleteProps = {
  value: LessonRecord | null;
  onChange: (value: LessonRecord | null) => void;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
};

function lessonKey(item: LessonRecord) {
  return item.id || item.slug || item.title;
}

function lessonSecondary(item: LessonRecord): string | null {
  const parts: string[] = [];
  if (item.subjectName) parts.push(item.subjectName);
  if (item.status === "PUBLISHED") parts.push("Published");
  else if (item.status === "DRAFT") parts.push("Draft");
  return parts.length ? parts.join(" · ") : null;
}

export function LessonPagingAutocomplete({
  value,
  onChange,
  disabled = false,
  error = false,
  helperText,
}: LessonPagingAutocompleteProps) {
  const fetchPage: FetchPageFn<LessonRecord> = async ({ page, size, search }) => {
    const params: Record<string, unknown> = { page, size, sort: "title,asc" };
    const trimmed = search.trim();
    if (trimmed) params.keyword = trimmed;
    const response = await apiGetLessons(params);
    const wrapped = response as ApiResponse<LessonsPaginationResult> & LessonsPaginationResult;
    const list = wrapped?.data?.result ?? wrapped?.result ?? [];
    const meta = wrapped?.data?.meta ?? wrapped?.meta;
    const total = meta?.total ?? list.length;
    return { items: list, total };
  };

  return (
    <PagingAutocomplete<LessonRecord>
      multiple={false}
      value={value}
      onChange={(val) => onChange((val as LessonRecord | null) ?? null)}
      fetchPage={fetchPage}
      getOptionLabel={(l) => l.title}
      getOptionKey={lessonKey}
      renderSecondaryLine={lessonSecondary}
      disabled={disabled}
      error={error}
      helperText={helperText}
      placeholder="Chọn bài học (tuỳ chọn)..."
    />
  );
}

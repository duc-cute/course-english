import { PagingAutocomplete, type FetchPageFn } from "./PagingAutocomplete";
import { apiGetSubjects, type SubjectRecord, type SubjectsPaginationResult } from "../../shared/api/subject";
import type { ApiResponse } from "../../shared/api/types";

type SubjectPagingAutocompleteProps = {
  multiple?: boolean;
  value: SubjectRecord | SubjectRecord[] | null;
  onChange: (value: SubjectRecord | SubjectRecord[] | null) => void;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  classroomId?: string;
};

function subjectKey(item: SubjectRecord) {
  return item.id || item.name;
}

export function SubjectPagingAutocomplete({
  multiple = false,
  value,
  onChange,
  disabled = false,
  error = false,
  helperText,
  classroomId,
}: SubjectPagingAutocompleteProps) {
  const fetchPage: FetchPageFn<SubjectRecord> = async ({ page, size, search }) => {
    const params: Record<string, unknown> = { page, size, sort: "displayOrder,asc" };
    const trimmed = search.trim();
    if (trimmed) params.keyword = trimmed;
    if (classroomId) params.classroomId = classroomId;
    const response = await apiGetSubjects(params);
    const wrapped = response as ApiResponse<SubjectsPaginationResult> & SubjectsPaginationResult;
    const list = wrapped?.data?.result ?? wrapped?.result ?? [];
    const meta = wrapped?.data?.meta ?? wrapped?.meta;
    const total = meta?.total ?? list.length;
    return { items: list, total };
  };

  return (
    <PagingAutocomplete<SubjectRecord>
      multiple={multiple}
      value={value}
      onChange={(val) => onChange((val as SubjectRecord | SubjectRecord[] | null) ?? (multiple ? [] : null))}
      fetchPage={fetchPage}
      getOptionLabel={(s) => s.name}
      getOptionKey={subjectKey}
      renderSecondaryLine={(s) => s.classroomName || null}
      disabled={disabled}
      error={error}
      helperText={helperText}
      placeholder="Chọn môn học..."
    />
  );
}

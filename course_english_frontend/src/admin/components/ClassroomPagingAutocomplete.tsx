import { PagingAutocomplete, type FetchPageFn } from "./PagingAutocomplete";
import {
  apiGetClassrooms,
  type ClassroomRecord,
  type ClassroomsPaginationResult,
} from "../../shared/api/classroom";
import type { ApiResponse } from "../../shared/api/types";

type ClassroomPagingAutocompleteProps = {
  multiple?: boolean;
  value: ClassroomRecord | ClassroomRecord[] | null;
  onChange: (value: ClassroomRecord | ClassroomRecord[] | null) => void;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
};

function classroomKey(item: ClassroomRecord) {
  return item.id || item.code || item.name;
}

export function ClassroomPagingAutocomplete({
  multiple = false,
  value,
  onChange,
  disabled = false,
  error = false,
  helperText,
}: ClassroomPagingAutocompleteProps) {
  const fetchPage: FetchPageFn<ClassroomRecord> = async ({ page, size, search }) => {
    const params: Record<string, unknown> = { page, size, sort: "name,asc" };
    const trimmed = search.trim();
    if (trimmed) params.keyword = trimmed;
    const response = await apiGetClassrooms(params);
    const wrapped = response as ApiResponse<ClassroomsPaginationResult> & ClassroomsPaginationResult;
    const list = wrapped?.data?.result ?? wrapped?.result ?? [];
    const meta = wrapped?.data?.meta ?? wrapped?.meta;
    const total = meta?.total ?? list.length;
    return { items: list, total };
  };

  return (
    <PagingAutocomplete<ClassroomRecord>
      multiple={multiple}
      value={value}
      onChange={(val) => onChange((val as ClassroomRecord | ClassroomRecord[] | null) ?? (multiple ? [] : null))}
      fetchPage={fetchPage}
      getOptionLabel={(c) => c.name}
      getOptionKey={classroomKey}
      renderSecondaryLine={(c) => c.code || null}
      disabled={disabled}
      error={error}
      helperText={helperText}
      placeholder="Chọn lớp học..."
    />
  );
}

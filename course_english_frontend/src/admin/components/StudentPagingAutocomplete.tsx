import { PagingAutocomplete, type FetchPageFn } from "./PagingAutocomplete";
import { apiGetUsers } from "../../shared/api/user";
import type { ApiResponse, UserRecord } from "../../shared/api/types";

type StudentPagingAutocompleteProps = {
  value: UserRecord | null;
  onChange: (value: UserRecord | null) => void;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
};

function userKey(item: UserRecord) {
  return String(item.id);
}

export function StudentPagingAutocomplete({
  value,
  onChange,
  disabled = false,
  error = false,
  helperText,
}: StudentPagingAutocompleteProps) {
  const fetchPage: FetchPageFn<UserRecord> = async ({ page, size, search }) => {
    const params: Record<string, unknown> = { page, size, sort: "name,asc", roleName: "STUDENT_ROLE" };
    const trimmed = search.trim();
    if (trimmed) {
      params.keyword = trimmed;
    }

    const response = (await apiGetUsers(params)) as ApiResponse<{ result?: UserRecord[]; meta?: { total?: number } }> & {
      result?: UserRecord[];
      meta?: { total?: number };
    };
    const items = response?.data?.result ?? response?.result ?? [];
    const total = response?.meta?.total ?? response?.data?.meta?.total ?? items.length;
    return { items, total };
  };

  return (
    <PagingAutocomplete<UserRecord>
      multiple={false}
      value={value}
      onChange={(val) => onChange((val as UserRecord | null) ?? null)}
      fetchPage={fetchPage}
      getOptionLabel={(u) => u.name || u.email}
      getOptionKey={userKey}
      renderSecondaryLine={(u) => u.email || null}
      disabled={disabled}
      error={error}
      helperText={helperText}
      placeholder="Chọn học sinh..."
    />
  );
}

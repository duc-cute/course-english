import { PagingAutocomplete, type FetchPageFn } from "./PagingAutocomplete";
import { apiGetRoles, type RoleRecord, type RolesPaginationResult } from "../../shared/api/role";
import type { ApiResponse } from "../../shared/api/types";

type RolePagingAutocompleteProps = {
  multiple?: boolean;
  value: RoleRecord | RoleRecord[] | null;
  onChange: (roles: RoleRecord | RoleRecord[] | null) => void;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
};

function roleKey(role: RoleRecord) {
  return role.id || role.name;
}

export function RolePagingAutocomplete({
  multiple = true,
  value,
  onChange,
  disabled = false,
  error = false,
  helperText,
}: RolePagingAutocompleteProps) {
  const fetchRoles: FetchPageFn<RoleRecord> = async ({ page, size, search }) => {
    const params: Record<string, unknown> = {
      page,
      size,
      sort: "name,asc",
    };
    const trimmed = search.trim();
    if (trimmed) params.keyword = trimmed;

    const response = await apiGetRoles(params);
    const wrapped = response as ApiResponse<RolesPaginationResult> & RolesPaginationResult;
    const list = wrapped?.data?.result ?? wrapped?.result ?? [];
    const meta = wrapped?.data?.meta ?? wrapped?.meta;
    const totalCount = meta?.total ?? list.length;
    return { items: list, total: totalCount };
  };

  return (
    <PagingAutocomplete<RoleRecord>
      multiple={multiple}
      value={value}
      onChange={(val) => onChange((val as RoleRecord | RoleRecord[] | null) ?? (multiple ? [] : null))}
      fetchPage={fetchRoles}
      getOptionLabel={(r) => r.name}
      getOptionKey={roleKey}
      renderSecondaryLine={(r) => (r.code && r.code !== r.name ? r.code : null)}
      disabled={disabled}
      error={error}
      helperText={helperText}
      placeholder={multiple ? "Chọn vai trò..." : "Chọn vai trò để lọc..."}
    />
  );
}

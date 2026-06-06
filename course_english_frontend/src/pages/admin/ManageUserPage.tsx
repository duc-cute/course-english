import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Skeleton,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  AdminCatalogToolbar,
  ConfirmDialog,
  RolePagingAutocomplete,
  TablePaginationField,
} from "../../admin/components";
import type { RoleRecord } from "../../shared/api/role";
import {
  apiCreateUser,
  apiDeleteUser,
  apiGetUserById,
  apiGetUsers,
  apiUpdateUserByAdmin,
} from "../../shared/api/user";
import type { ApiResponse, UserRecord } from "../../shared/api/types";
import {
  muBtnSmOutlined,
  muBtnSmPrimary,
  muCard,
  muCardTitle,
  muDialogFooter,
  muDialogPaper,
  muEmptyState,
  muFieldLabel,
  muFooterBtnOutlined,
  muFooterBtnPrimary,
  muHighlightBox,
  muHighlightSubTitle,
  muPageShell,
  muPageTitle,
  muRequired,
  muRoleAdmin,
  muRoleUser,
  muTableWrap,
  muTd,
  muTextFieldSx,
  muTh,
} from "./manageUserUiStyles";
import "../../styles/manage-user.css";

type UserForm = {
  id: number | string | null;
  email: string;
  password: string;
  name: string;
};

const defaultValues: UserForm = {
  id: null,
  email: "",
  password: "",
  name: "",
};

function toRoleRecords(names?: string[]): RoleRecord[] {
  if (!names?.length) return [];
  return names.filter(Boolean).map((name) => ({ id: name, name, code: name }));
}

function getUserRoleNames(user: UserRecord): string[] {
  if (user.roles?.length) return user.roles;
  if (user.role?.includes(",")) {
    return user.role.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
  }
  return user.role ? [user.role] : [];
}

function RoleBadge({ role }: { role?: string }) {
  if (role === "ADMIN_ROLE") {
    return <span style={muRoleAdmin}>Quản trị</span>;
  }
  if (role === "USER_ROLE") {
    return <span style={muRoleUser}>Người dùng</span>;
  }
  return <span style={muRoleUser}>{role || "—"}</span>;
}

export function ManageUserPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [searchText, setSearchText] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleRecord | null>(null);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [openForm, setOpenForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);

  const [openDelete, setOpenDelete] = useState(false);
  const [deletingUser, setDeletingUser] = useState<UserRecord | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<RoleRecord[]>([]);
  const [roleFieldError, setRoleFieldError] = useState("");

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserForm>({ defaultValues });

  const isEditMode = useMemo(() => !!editingUser?.id, [editingUser]);

  const normalizePagination = (responseData: ApiResponse<{ result?: UserRecord[] }>) => {
    const content = responseData?.data?.result ?? responseData?.result ?? [];
    const total = responseData?.meta?.total ?? 0;
    return {
      content: Array.isArray(content) ? content : [],
      total: Number.isFinite(total) ? total : 0,
    };
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params: Record<string, unknown> = {
        page,
        size,
        sort: "id,desc",
      };

      const trimmed = searchText.trim();
      if (trimmed) params.keyword = trimmed;
      if (roleFilter?.name) params.roleName = roleFilter.name;

      const response = await apiGetUsers(params);
      const parsed = normalizePagination(response as ApiResponse<{ result?: UserRecord[] }>);
      setUsers(parsed.content);
      setTotalElements(parsed.total);
    } catch (err) {
      const message = (err as { message?: string })?.message || "Không thể tải danh sách người dùng.";
      setError(message);
      setUsers([]);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [page, size, searchText, roleFilter]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const handleSearch = () => {
    setPage(0);
    setSearchText(searchInput);
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setSearchText("");
    setRoleFilter(null);
    setPage(0);
  };

  const handleOpenCreate = () => {
    setEditingUser(null);
    reset(defaultValues);
    setSelectedRoles([]);
    setRoleFieldError("");
    setOpenForm(true);
  };

  const handleOpenEdit = async (user: UserRecord) => {
    setEditingUser(user);
    setError("");

    try {
      const data = await apiGetUserById(user.id);
      const detail = (data as ApiResponse<UserRecord>)?.result ?? (data as ApiResponse<UserRecord>)?.data ?? user;

      const roleNames = getUserRoleNames(detail as UserRecord);
      reset({
        id: detail?.id ?? user.id,
        email: detail?.email ?? user.email ?? "",
        password: "",
        name: detail?.name ?? user.name ?? "",
      });
      setSelectedRoles(toRoleRecords(roleNames));
      setRoleFieldError("");
    } catch {
      reset({
        id: user.id,
        email: user.email ?? "",
        password: "",
        name: user.name ?? "",
      });
      setSelectedRoles(toRoleRecords(getUserRoleNames(user)));
      setRoleFieldError("");
    }
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setEditingUser(null);
    reset(defaultValues);
    setSelectedRoles([]);
    setRoleFieldError("");
  };

  const onSubmit = async (values: UserForm) => {
    const roleNames = selectedRoles.map((r) => r.name).filter(Boolean);
    if (roleNames.length === 0) {
      setRoleFieldError("Vai trò là bắt buộc");
      return;
    }
    setRoleFieldError("");

    setSubmitting(true);
    setError("");

    try {
      if (isEditMode && values.id != null) {
        const payload: {
          id: number | string;
          name: string;
          email: string;
          roleNames: string[];
          role: string;
          password?: string;
        } = {
          id: values.id,
          name: values.name,
          email: values.email,
          roleNames,
          role: roleNames.join(","),
        };
        if (values.password?.trim()) {
          payload.password = values.password;
        }
        await apiUpdateUserByAdmin(payload);
      } else {
        await apiCreateUser({
          email: values.email,
          password: values.password,
          name: values.name,
          roleNames,
          role: roleNames.join(","),
        });
      }
      handleCloseForm();
      void fetchUsers();
    } catch (err) {
      const message = (err as { message?: string })?.message || "Không thể lưu người dùng.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAskDelete = (user: UserRecord) => {
    setDeletingUser(user);
    setOpenDelete(true);
  };

  const handleDelete = async () => {
    if (!deletingUser?.id) {
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await apiDeleteUser(deletingUser.id);
      setOpenDelete(false);
      setDeletingUser(null);
      void fetchUsers();
    } catch (err) {
      const message = (err as { message?: string })?.message || "Không thể xóa người dùng.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderTableBody = () => {
    if (loading) {
      return Array.from({ length: 5 }).map((_, i) => (
        <tr key={`sk-${i}`} className="mu-skeleton-row">
          <td style={muTd}>
            <Skeleton variant="text" width="80%" />
          </td>
          <td style={muTd}>
            <Skeleton variant="text" width="60%" />
          </td>
          <td style={muTd}>
            <Skeleton variant="rounded" width={72} height={22} />
          </td>
          <td style={{ ...muTd, textAlign: "right" }}>
            <Skeleton variant="rounded" width={56} height={24} sx={{ ml: "auto" }} />
          </td>
        </tr>
      ));
    }

    if (users.length === 0) {
      return (
        <tr>
          <td colSpan={4} style={{ ...muTd, borderBottom: "none" }}>
            <div style={muEmptyState}>
              <div style={{ fontWeight: 600, color: "#0C447C", marginBottom: 4 }}>
                {searchText || roleFilter ? "Không tìm thấy người dùng" : "Chưa có người dùng"}
              </div>
              <div style={{ marginBottom: 10 }}>
                {searchText || roleFilter
                  ? "Thử đổi từ khóa hoặc bộ lọc vai trò."
                  : "Thêm tài khoản để bắt đầu quản trị hệ thống."}
              </div>
              {!searchText && !roleFilter ? (
                <Button variant="contained" size="small" startIcon={<AddIcon sx={{ fontSize: 15 }} />} sx={muBtnSmPrimary} onClick={handleOpenCreate}>
                  Thêm người dùng
                </Button>
              ) : (
                <Button variant="outlined" size="small" sx={muBtnSmOutlined} onClick={handleClearFilters}>
                  Xóa bộ lọc
                </Button>
              )}
            </div>
          </td>
        </tr>
      );
    }

    return users.map((user) => (
      <tr key={user.id} style={{ background: "#fff" }}>
        <td style={muTd}>
          <div style={{ fontWeight: 600, color: "#333" }}>{user.name || "—"}</div>
        </td>
        <td style={{ ...muTd, color: "#5F5E5A" }}>{user.email}</td>
        <td style={muTd}>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
            {getUserRoleNames(user).length ? (
              getUserRoleNames(user).map((r) => <RoleBadge key={r} role={r} />)
            ) : (
              <RoleBadge role={undefined} />
            )}
          </Box>
        </td>
        <td style={{ ...muTd, textAlign: "right" }}>
          <div className="mu-table-actions">
            <Tooltip title="Chỉnh sửa">
              <IconButton size="small" aria-label="Chỉnh sửa" onClick={() => void handleOpenEdit(user)}>
                <EditOutlinedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Xóa">
              <IconButton
                size="small"
                className="mu-delete"
                aria-label="Xóa"
                onClick={() => handleAskDelete(user)}
              >
                <DeleteOutlineIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </div>
        </td>
      </tr>
    ));
  };

  return (
    <Box sx={muPageShell} className="mu-page">
      <Typography variant="h5" sx={muPageTitle}>
        Quản lý người dùng
      </Typography>

      <AdminCatalogToolbar
        searchPlaceholder="Tên hoặc email"
        searchInput={searchInput}
        onSearchInputChange={setSearchInput}
        onSearch={handleSearch}
        onReset={handleClearFilters}
        addLabel="Thêm user"
        onAdd={handleOpenCreate}
        importType="users"
        onImported={() => void fetchUsers()}
        extraFilters={
          <Box sx={{ minWidth: 140, maxWidth: 200, flex: "0 1 180px" }} className="mu-role-filter">
            <RolePagingAutocomplete
              multiple={false}
              value={roleFilter}
              onChange={(val) => {
                setRoleFilter((val as RoleRecord | null) ?? null);
                setPage(0);
              }}
              helperText=""
            />
          </Box>
        }
      />

      {error ? (
        <Alert
          severity="error"
          onClose={() => setError("")}
          sx={{
            mb: 1,
            py: 0.25,
            borderRadius: "6px",
            fontSize: 12,
            border: "1px solid #E24B4A",
            bgcolor: "#FCEBEB",
            color: "#791F1F",
            "& .MuiAlert-icon": { color: "#E24B4A" },
          }}
        >
          {error}
        </Alert>
      ) : null}

      <div style={{ ...muCard, padding: "8px 10px" }}>
        <div className="mu-role-legend">
          <span>
            <span style={muRoleAdmin}>Quản trị</span> ADMIN_ROLE
          </span>
          <span>
            <span style={muRoleUser}>Người dùng</span> USER_ROLE
          </span>
        </div>

        <div style={muTableWrap}>
          <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
            <thead>
              <tr>
                <th style={{ ...muTh, width: "28%" }}>Họ tên</th>
                <th style={{ ...muTh, width: "36%" }}>Email</th>
                <th style={{ ...muTh, width: "18%" }}>Vai trò</th>
                <th style={{ ...muTh, width: "18%", textAlign: "right" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>{renderTableBody()}</tbody>
          </table>
        </div>

        <TablePaginationField
          className="mu-pagination"
          count={totalElements}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={size}
          onRowsPerPageChange={(e) => {
            setSize(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 20, 50]}
          labelRowsPerPage="Số dòng:"
        />
      </div>

      {/* Form popup — Archetype C stacked */}
      <Dialog
        className="mu-dialog"
        open={openForm}
        onClose={submitting ? undefined : handleCloseForm}
        fullWidth
        maxWidth="sm"
        scroll="body"
        PaperProps={{ sx: muDialogPaper }}
      >
        <DialogTitle
          sx={{
            fontSize: 14,
            fontWeight: 600,
            color: "#0C447C",
            borderBottom: "1px solid #D3D1C7",
            py: 1.25,
            px: 2,
          }}
        >
          {isEditMode ? "Cập nhật người dùng" : "Tạo người dùng mới"}
        </DialogTitle>
        <DialogContent sx={{ p: 2, pb: 1.5, overflow: "visible" }}>
          <div className="mu-dialog-form">
            <div style={muHighlightBox}>
              <div style={muHighlightSubTitle}>
                Thông tin đăng nhập <span style={muRequired}>*</span>
              </div>
              <Grid container spacing={1.5} sx={{ minWidth: 0 }}>
                <Grid size={{ xs: 12, sm: 6 }} sx={{ minWidth: 0 }}>
                  <span style={muFieldLabel}>Email</span>
                  <Controller
                    name="email"
                    control={control}
                    rules={{
                      required: "Email là bắt buộc",
                      pattern: { value: /^\S+@\S+\.\S+$/, message: "Email không hợp lệ" },
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        size="small"
                        placeholder="user@example.com"
                        error={!!errors.email}
                        helperText={errors.email?.message}
                        sx={muTextFieldSx}
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }} sx={{ minWidth: 0 }}>
                  <span style={muFieldLabel}>
                    Vai trò <span style={muRequired}>*</span>
                  </span>
                  <RolePagingAutocomplete
                    value={selectedRoles}
                    onChange={(val) => setSelectedRoles((val as RoleRecord[]) ?? [])}
                    disabled={submitting}
                    error={!!roleFieldError}
                    helperText={roleFieldError || undefined}
                  />
                </Grid>
              </Grid>
            </div>

            <div style={{ ...muCard, marginBottom: 0, padding: "10px 12px" }}>
              <div style={{ ...muCardTitle, marginBottom: 8 }}>Hồ sơ tài khoản</div>
              <Grid container spacing={1.5}>
                <Grid size={12}>
                  <span style={muFieldLabel}>
                    Họ và tên <span style={muRequired}>*</span>
                  </span>
                  <Controller
                    name="name"
                    control={control}
                    rules={{ required: "Tên là bắt buộc" }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        size="small"
                        error={!!errors.name}
                        helperText={errors.name?.message}
                        sx={muTextFieldSx}
                      />
                    )}
                  />
                </Grid>
                <Grid size={12}>
                  <span style={muFieldLabel}>
                    {isEditMode ? "Mật khẩu mới (tùy chọn)" : "Mật khẩu"}
                    {!isEditMode ? <span style={muRequired}> *</span> : null}
                  </span>
                  <Controller
                    name="password"
                    control={control}
                    rules={{
                      validate: (value) => {
                        if (!isEditMode && !value?.trim()) return "Mật khẩu là bắt buộc";
                        if (value && value.length < 6) return "Mật khẩu tối thiểu 6 ký tự";
                        return true;
                      },
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        type="password"
                        fullWidth
                        size="small"
                        error={!!errors.password}
                        helperText={errors.password?.message}
                        sx={muTextFieldSx}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </div>
          </div>
        </DialogContent>
        <DialogActions sx={muDialogFooter}>
          <span className="mu-dialog-footer-hint" title={isEditMode ? String(editingUser?.id ?? "") : undefined}>
            {isEditMode ? `ID: ${editingUser?.id ?? "—"}` : "Tài khoản mới"}
          </span>
          <Box sx={{ display: "flex", gap: 1, flexShrink: 0 }}>
            <Button variant="outlined" disabled={submitting} onClick={handleCloseForm} sx={muFooterBtnOutlined}>
              Đóng
            </Button>
            <Button variant="contained" disabled={submitting} onClick={handleSubmit(onSubmit)} sx={muFooterBtnPrimary}>
              {submitting ? "Đang lưu..." : "Lưu"}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={openDelete}
        onClose={() => {
          if (!submitting) setOpenDelete(false);
        }}
        onConfirm={() => void handleDelete()}
        loading={submitting}
        title="Xóa người dùng"
        content={`Bạn có chắc muốn xóa tài khoản ${deletingUser?.email || deletingUser?.name || "này"}? Hành động này không thể hoàn tác.`}
        cancelText="Hủy"
        confirmText="Xóa"
      />
    </Box>
  );
}

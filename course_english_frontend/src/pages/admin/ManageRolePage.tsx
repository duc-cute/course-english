import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
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
  IconButton,
  MenuItem,
  Skeleton,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { AdminCatalogPageHeader, AdminCatalogToolbar, ConfirmDialog } from "../../admin/components";
import {
  muBtnSmOutlined,
  muDialogFooter,
  muDialogPaper,
  muFooterBtnOutlined,
  muFooterBtnPrimary,
  muTextFieldSx,
} from "./manageUserUiStyles";
import {
  apiCreateRole,
  apiDeleteRole,
  apiGetRoleById,
  apiGetRoles,
  apiUpdateRole,
  type RoleRecord,
  type RolesPaginationResult,
} from "../../shared/api/role";
import type { ApiResponse } from "../../shared/api/types";

type RoleForm = {
  name: string;
  code: string;
};

const defaultRoleForm: RoleForm = {
  name: "",
  code: "",
};

export function ManageRolePage() {
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [openForm, setOpenForm] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleRecord | null>(null);
  const [roleForm, setRoleForm] = useState<RoleForm>(defaultRoleForm);
  const [formError, setFormError] = useState("");
  const [openDelete, setOpenDelete] = useState(false);
  const [deletingRole, setDeletingRole] = useState<RoleRecord | null>(null);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, unknown> = { page, size, sort: "id,desc" };
      const trimmed = searchText.trim();
      if (trimmed) params.keyword = trimmed;

      const response = (await apiGetRoles(params)) as ApiResponse<RolesPaginationResult>;
      const items = response?.data?.result ?? response?.result ?? [];
      const totalItems = response?.meta?.total ?? response?.data?.meta?.total ?? 0;

      setRoles(Array.isArray(items) ? items : []);
      setTotal(Number.isFinite(totalItems) ? Number(totalItems) : 0);
    } catch (err) {
      const message = (err as { message?: string })?.message || "Không thể tải danh sách role.";
      setError(message);
      setRoles([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, size, searchText]);

  useEffect(() => {
    void fetchRoles();
  }, [fetchRoles]);

  const resetFormState = () => {
    setRoleForm(defaultRoleForm);
    setFormError("");
    setEditingRole(null);
  };

  const handleOpenCreate = () => {
    resetFormState();
    setOpenForm(true);
  };

  const handleOpenEdit = async (role: RoleRecord) => {
    setFormError("");
    setEditingRole(role);
    setOpenForm(true);
    try {
      const response = (await apiGetRoleById(role.id)) as ApiResponse<RoleRecord>;
      const detail = response?.result ?? response?.data ?? role;
      setRoleForm({
        name: detail?.name ?? "",
        code: detail?.code ?? "",
      });
    } catch {
      setRoleForm({
        name: role.name ?? "",
        code: role.code ?? "",
      });
    }
  };

  const handleCloseForm = () => {
    if (submitting) return;
    setOpenForm(false);
    resetFormState();
  };

  const handleSubmitForm = async () => {
    const name = roleForm.name.trim();
    const code = roleForm.code.trim();
    if (!name) {
      setFormError("Tên role là bắt buộc.");
      return;
    }

    setSubmitting(true);
    setFormError("");
    try {
      if (editingRole?.id) {
        await apiUpdateRole(editingRole.id, { name, code: code || undefined });
      } else {
        await apiCreateRole({ name, code: code || undefined });
      }
      setOpenForm(false);
      resetFormState();
      await fetchRoles();
    } catch (err) {
      setFormError((err as { message?: string })?.message || "Không thể lưu role.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDelete = (role: RoleRecord) => {
    setDeletingRole(role);
    setOpenDelete(true);
  };

  const handleCloseDelete = () => {
    if (submitting) return;
    setOpenDelete(false);
    setDeletingRole(null);
  };

  const handleDeleteRole = async () => {
    if (!deletingRole?.id) return;
    setSubmitting(true);
    setError("");
    try {
      await apiDeleteRole(deletingRole.id);
      setOpenDelete(false);
      setDeletingRole(null);
      if (roles.length === 1 && page > 0) {
        setPage((p) => p - 1);
      } else {
        await fetchRoles();
      }
    } catch (err) {
      setError((err as { message?: string })?.message || "Không thể xóa role.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box className="admin-catalog-page">
      <AdminCatalogPageHeader
        title="Quản lý role"
        subtitle="Vai trò và phân quyền người dùng"
        icon={<AdminPanelSettingsOutlinedIcon />}
      />

      <Box className="admin-catalog-page__filter-card admin-catalog-page__toolbar-wrap">
        <AdminCatalogToolbar
          searchPlaceholder="Tìm theo tên/mã role"
          searchInput={searchInput}
          onSearchInputChange={setSearchInput}
          onSearch={() => {
            setPage(0);
            setSearchText(searchInput);
          }}
          onReset={() => {
            setSearchInput("");
            setSearchText("");
            setPage(0);
          }}
          addLabel="Thêm role"
          onAdd={handleOpenCreate}
          importType="roles"
          toolbarVariant="soft"
          onImported={() => void fetchRoles()}
        />
      </Box>

      {error ? (
        <Alert severity="error" sx={{ mb: 1, py: 0.25, fontSize: 12 }}>
          {error}
        </Alert>
      ) : null}

      <Box className="admin-catalog-page__table-card">
        <Box
          className="catalog-table-head"
          sx={{
            display: "grid",
            gridTemplateColumns: "72px minmax(220px, 1fr) minmax(180px, 1fr) 120px",
            columnGap: 1.5,
          }}
        >
          <Box>STT</Box>
          <Box>Tên role</Box>
          <Box>Mã role</Box>
          <Box sx={{ textAlign: "center" }}>Thao tác</Box>
        </Box>

        {loading ? (
          <Box sx={{ p: 2 }}>
            <Skeleton height={36} />
            <Skeleton height={36} />
            <Skeleton height={36} />
          </Box>
        ) : roles.length === 0 ? (
          <Box className="admin-catalog-page__empty">Không có dữ liệu role.</Box>
        ) : (
          roles.map((role, index) => (
            <Box
              key={role.id}
              className="catalog-table-row"
              sx={{
                display: "grid",
                gridTemplateColumns: "72px minmax(220px, 1fr) minmax(180px, 1fr) 120px",
                columnGap: 1.5,
              }}
            >
              <Box className="catalog-table-muted">{page * size + index + 1}</Box>
              <Box sx={{ fontWeight: 600, color: "#0C447C" }}>{role.name || "—"}</Box>
              <Box className="catalog-table-muted">{role.code || "—"}</Box>
              <Box className="catalog-table-actions">
                <Tooltip title="Sửa role">
                  <IconButton size="small" color="primary" onClick={() => void handleOpenEdit(role)}>
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Xóa role">
                  <IconButton size="small" color="error" onClick={() => handleOpenDelete(role)}>
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          ))
        )}

        <Box className="admin-catalog-page__table-footer">
          <Typography variant="body2" className="admin-catalog-page__table-footer-total">
            Tổng: {total}
          </Typography>
          <Box className="admin-catalog-page__table-footer-controls">
            <Button variant="outlined" sx={muBtnSmOutlined} size="small" disabled={page <= 0} onClick={() => setPage((p) => p - 1)}>
              Trang trước
            </Button>
            <Button
              variant="outlined"
              sx={muBtnSmOutlined}
              size="small"
              disabled={(page + 1) * size >= total}
              onClick={() => setPage((p) => p + 1)}
            >
              Trang sau
            </Button>
            <TextField
              select
              size="small"
              value={size}
              onChange={(e) => {
                const next = Number(e.target.value);
                setSize(next);
                setPage(0);
              }}
              sx={{ width: 86, ...muTextFieldSx }}
            >
              {[10, 20, 50].map((opt) => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </Box>
      </Box>

      <Dialog open={openForm} onClose={handleCloseForm} fullWidth maxWidth="sm" PaperProps={{ sx: muDialogPaper }}>
        <DialogTitle>{editingRole?.id ? "Cập nhật role" : "Thêm role mới"}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: "grid", rowGap: 1.5 }}>
            {formError ? <Alert severity="error">{formError}</Alert> : null}
            <TextField
              label="Tên role"
              size="small"
              required
              value={roleForm.name}
              onChange={(e) => setRoleForm((prev) => ({ ...prev, name: e.target.value }))}
              sx={muTextFieldSx}
            />
            <TextField
              label="Mã role"
              size="small"
              value={roleForm.code}
              onChange={(e) => setRoleForm((prev) => ({ ...prev, code: e.target.value }))}
              sx={muTextFieldSx}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={muDialogFooter}>
          <Button onClick={handleCloseForm} sx={muFooterBtnOutlined} disabled={submitting}>
            Hủy
          </Button>
          <Button onClick={() => void handleSubmitForm()} variant="contained" sx={muFooterBtnPrimary} disabled={submitting}>
            {editingRole?.id ? "Lưu thay đổi" : "Tạo mới"}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={openDelete}
        title="Xóa role"
        content={`Bạn có chắc chắn muốn xóa role "${deletingRole?.name || ""}"?`}
        cancelText="Hủy"
        confirmText="Xóa"
        onClose={handleCloseDelete}
        onConfirm={() => void handleDeleteRole()}
        loading={submitting}
      />
    </Box>
  );
}

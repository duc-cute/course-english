import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
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
  muFieldLabel,
  muFooterBtnOutlined,
  muFooterBtnPrimary,
  muTextFieldSx,
} from "./manageUserUiStyles";
import {
  apiCheckSystemConfigKey,
  apiCreateSystemConfig,
  apiDeleteSystemConfig,
  apiGetSystemConfigById,
  apiSearchSystemConfigs,
  apiUpdateSystemConfig,
  type SystemConfigRecord,
  type SystemConfigsPaginationResult,
} from "../../shared/api/systemConfig";
import {
  BOOLEAN_CONFIG_OPTIONS,
  SYSTEM_CONFIG_KEY_OPTIONS,
  findSystemConfigMeta,
  formatConfigDisplayValue,
} from "../../shared/constants/systemConfigKeys";
import { invalidateFeatureFlagsCache } from "../../shared/featureFlags/useFeatureFlags";
import type { ApiResponse } from "../../shared/api/types";

type SystemConfigForm = {
  configKey: string;
  configValue: string;
  note: string;
};

const defaultForm: SystemConfigForm = {
  configKey: SYSTEM_CONFIG_KEY_OPTIONS[0]?.key ?? "",
  configValue: SYSTEM_CONFIG_KEY_OPTIONS[0]?.defaultValue ?? "true",
  note: SYSTEM_CONFIG_KEY_OPTIONS[0]?.defaultNote ?? "",
};

export function ManageSystemConfigPage() {
  const [rows, setRows] = useState<SystemConfigRecord[]>([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<SystemConfigRecord | null>(null);
  const [form, setForm] = useState<SystemConfigForm>(defaultForm);
  const [formError, setFormError] = useState("");
  const [openDelete, setOpenDelete] = useState(false);
  const [deleting, setDeleting] = useState<SystemConfigRecord | null>(null);

  const formMeta = findSystemConfigMeta(form.configKey);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, unknown> = { page, size, sort: "configKey,asc" };
      const trimmed = searchText.trim();
      if (trimmed) params.keyword = trimmed;
      const response = (await apiSearchSystemConfigs(params)) as ApiResponse<SystemConfigsPaginationResult>;
      const items = response?.data?.result ?? response?.result ?? [];
      const totalItems = response?.meta?.total ?? response?.data?.meta?.total ?? 0;
      setRows(Array.isArray(items) ? items : []);
      setTotal(Number.isFinite(totalItems) ? Number(totalItems) : 0);
    } catch (err) {
      setError((err as { message?: string })?.message || "Không thể tải cấu hình hệ thống.");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, size, searchText]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const applyKeyMeta = (configKey: string) => {
    const meta = findSystemConfigMeta(configKey);
    setForm((prev) => ({
      ...prev,
      configKey,
      configValue: meta?.defaultValue ?? prev.configValue,
      note: meta?.defaultNote ?? prev.note,
    }));
  };

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setFormError("");
    setOpenForm(true);
  };

  const openEdit = async (item: SystemConfigRecord) => {
    setEditing(item);
    setOpenForm(true);
    setFormError("");
    try {
      const response = (await apiGetSystemConfigById(item.id)) as ApiResponse<SystemConfigRecord>;
      const detail = response?.result ?? response?.data ?? item;
      setForm({
        configKey: detail.configKey ?? "",
        configValue: detail.configValue ?? "",
        note: detail.note ?? "",
      });
    } catch {
      setForm({
        configKey: item.configKey ?? "",
        configValue: item.configValue ?? "",
        note: item.note ?? "",
      });
    }
  };

  const submitForm = async () => {
    const configKey = form.configKey.trim().toUpperCase();
    if (!configKey) {
      setFormError("Mã cấu hình không được để trống.");
      return;
    }
    if (!form.configValue?.trim()) {
      setFormError("Giá trị cấu hình không được để trống.");
      return;
    }

    setSubmitting(true);
    setFormError("");
    try {
      if (!editing?.id) {
        const check = (await apiCheckSystemConfigKey(configKey)) as ApiResponse<{ exists: boolean }>;
        const exists = check?.result?.exists ?? check?.data?.exists ?? false;
        if (exists) {
          setFormError(`Mã cấu hình "${configKey}" đã tồn tại.`);
          return;
        }
      }

      const payload = {
        configKey,
        configValue: form.configValue.trim(),
        note: form.note.trim() || undefined,
      };

      if (editing?.id) await apiUpdateSystemConfig(editing.id, payload);
      else await apiCreateSystemConfig(payload);

      invalidateFeatureFlagsCache();
      setOpenForm(false);
      setEditing(null);
      setForm(defaultForm);
      await fetchData();
    } catch (err) {
      setFormError((err as { message?: string })?.message || "Không thể lưu cấu hình.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting?.id) return;
    setSubmitting(true);
    try {
      await apiDeleteSystemConfig(deleting.id);
      invalidateFeatureFlagsCache();
      setOpenDelete(false);
      setDeleting(null);
      if (rows.length === 1 && page > 0) setPage((p) => p - 1);
      else await fetchData();
    } catch (err) {
      setError((err as { message?: string })?.message || "Không thể xóa cấu hình.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box className="admin-catalog-page">
      <AdminCatalogPageHeader
        title="Cấu hình hệ thống"
        subtitle="Bật/tắt tính năng toàn hệ thống. Thay đổi có hiệu lực ngay, không cần khởi động lại server."
        icon={<SettingsOutlinedIcon />}
      />

      <Box className="admin-catalog-page__filter-card admin-catalog-page__toolbar-wrap">
        <AdminCatalogToolbar
          searchPlaceholder="Tìm theo mã, giá trị, mô tả"
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
          addLabel="Thêm cấu hình"
          onAdd={openCreate}
          toolbarVariant="soft"
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
            gridTemplateColumns: "72px minmax(220px,1fr) 140px minmax(220px,1fr) 120px",
            columnGap: 1.5,
          }}
        >
          <Box>STT</Box>
          <Box>Mã cấu hình</Box>
          <Box>Giá trị</Box>
          <Box>Mô tả</Box>
          <Box sx={{ textAlign: "center" }}>Thao tác</Box>
        </Box>
        {loading ? (
          <Box sx={{ p: 2 }}>
            <Skeleton height={36} />
            <Skeleton height={36} />
            <Skeleton height={36} />
          </Box>
        ) : rows.length === 0 ? (
          <Box className="admin-catalog-page__empty">Chưa có cấu hình nào.</Box>
        ) : (
          rows.map((item, index) => (
            <Box
              key={item.id}
              className="catalog-table-row"
              sx={{
                display: "grid",
                gridTemplateColumns: "72px minmax(220px,1fr) 140px minmax(220px,1fr) 120px",
                columnGap: 1.5,
              }}
            >
              <Box className="catalog-table-muted">{page * size + index + 1}</Box>
              <Box sx={{ fontWeight: 600, color: "#0C447C", fontFamily: "monospace", fontSize: 12 }}>
                {item.configKey || "—"}
              </Box>
              <Box sx={{ color: "#0C447C", fontWeight: 600 }}>
                {formatConfigDisplayValue(item.configKey, item.configValue)}
              </Box>
              <Box className="catalog-table-muted">{item.note || "—"}</Box>
              <Box className="catalog-table-actions">
                <Tooltip title="Sửa">
                  <IconButton size="small" color="primary" onClick={() => void openEdit(item)}>
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Xóa">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => {
                      setDeleting(item);
                      setOpenDelete(true);
                    }}
                  >
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
            <Button
              variant="outlined"
              sx={muBtnSmOutlined}
              size="small"
              disabled={page <= 0}
              onClick={() => setPage((p) => p - 1)}
            >
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
                setSize(Number(e.target.value));
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

      <Dialog
        open={openForm}
        onClose={submitting ? undefined : () => setOpenForm(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: muDialogPaper }}
      >
        <DialogTitle>{editing?.id ? "Cập nhật cấu hình" : "Thêm cấu hình mới"}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: "grid", rowGap: 1.5 }}>
            {formError ? <Alert severity="error">{formError}</Alert> : null}
            {editing?.id ? (
              <TextField
                label="Mã cấu hình"
                size="small"
                required
                disabled
                sx={muTextFieldSx}
                value={form.configKey}
              />
            ) : (
              <Box>
                <Typography component="label" sx={{ ...muFieldLabel, mb: 0.5 }}>
                  Mã cấu hình
                </Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  sx={muTextFieldSx}
                  value={form.configKey}
                  onChange={(e) => applyKeyMeta(e.target.value)}
                >
                  {SYSTEM_CONFIG_KEY_OPTIONS.map((item) => (
                    <MenuItem key={item.key} value={item.key}>
                      {item.key} — {item.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            )}
            {formMeta?.type === "boolean" ? (
              <TextField
                select
                label="Giá trị"
                size="small"
                required
                sx={muTextFieldSx}
                value={form.configValue}
                onChange={(e) => setForm((p) => ({ ...p, configValue: e.target.value }))}
              >
                {BOOLEAN_CONFIG_OPTIONS.map((item) => (
                  <MenuItem key={item.value} value={item.value}>
                    {item.label}
                  </MenuItem>
                ))}
              </TextField>
            ) : formMeta?.type === "select" && formMeta.options ? (
              <TextField
                select
                label="Giá trị"
                size="small"
                required
                sx={muTextFieldSx}
                value={form.configValue}
                onChange={(e) => setForm((p) => ({ ...p, configValue: e.target.value }))}
              >
                {formMeta.options.map((item) => (
                  <MenuItem key={item.value} value={item.value}>
                    {item.label}
                  </MenuItem>
                ))}
              </TextField>
            ) : (
              <TextField
                label="Giá trị"
                size="small"
                required
                sx={muTextFieldSx}
                value={form.configValue}
                onChange={(e) => setForm((p) => ({ ...p, configValue: e.target.value }))}
              />
            )}
            <TextField
              label="Mô tả"
              size="small"
              multiline
              minRows={2}
              sx={muTextFieldSx}
              value={form.note}
              onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={muDialogFooter}>
          <Button onClick={() => setOpenForm(false)} sx={muFooterBtnOutlined} disabled={submitting}>
            Hủy
          </Button>
          <Button
            variant="contained"
            sx={muFooterBtnPrimary}
            onClick={() => void submitForm()}
            disabled={submitting}
          >
            {editing?.id ? "Lưu thay đổi" : "Tạo mới"}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={openDelete}
        title="Xóa cấu hình"
        content={`Bạn có chắc chắn muốn xóa cấu hình "${deleting?.configKey || ""}"? Hệ thống sẽ tạo lại giá trị mặc định khi khởi động.`}
        cancelText="Hủy"
        confirmText="Xóa"
        onClose={() => {
          if (!submitting) {
            setOpenDelete(false);
            setDeleting(null);
          }
        }}
        onConfirm={() => void confirmDelete()}
        loading={submitting}
      />
    </Box>
  );
}

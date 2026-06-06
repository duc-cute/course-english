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
import {
  AdminCatalogToolbar,
  ClassroomPagingAutocomplete,
  ConfirmDialog,
  StudentPagingAutocomplete,
} from "../../admin/components";
import {
  muBtnSmOutlined,
  muCatalogTableShell,
  muDialogFooter,
  muDialogPaper,
  muEmptyState,
  muFieldLabel,
  muFooterBtnOutlined,
  muFooterBtnPrimary,
  muPageShell,
  muPageTitle,
  muRequired,
  muTextFieldSx,
} from "./manageUserUiStyles";
import type { ClassroomRecord } from "../../shared/api/classroom";
import {
  apiCreateEnrollment,
  apiDeleteEnrollment,
  apiGetEnrollmentById,
  apiGetEnrollments,
  apiUpdateEnrollment,
  type EnrollmentRecord,
  type EnrollmentsPaginationResult,
} from "../../shared/api/enrollment";
import type { ApiResponse, UserRecord } from "../../shared/api/types";

type EnrollmentForm = {
  classroom: ClassroomRecord | null;
  student: UserRecord | null;
  status: "ACTIVE" | "INACTIVE";
};

const defaultForm: EnrollmentForm = {
  classroom: null,
  student: null,
  status: "ACTIVE",
};

export function ManageEnrollmentPage() {
  const [rows, setRows] = useState<EnrollmentRecord[]>([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<EnrollmentRecord | null>(null);
  const [form, setForm] = useState<EnrollmentForm>(defaultForm);
  const [formError, setFormError] = useState("");
  const [openDelete, setOpenDelete] = useState(false);
  const [deleting, setDeleting] = useState<EnrollmentRecord | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, unknown> = { page, size, sort: "joinedAt,desc" };
      const trimmed = searchText.trim();
      if (trimmed) params.keyword = trimmed;
      const response = (await apiGetEnrollments(params)) as ApiResponse<EnrollmentsPaginationResult>;
      const items = response?.data?.result ?? response?.result ?? [];
      const totalItems = response?.meta?.total ?? response?.data?.meta?.total ?? 0;
      setRows(Array.isArray(items) ? items : []);
      setTotal(Number.isFinite(totalItems) ? Number(totalItems) : 0);
    } catch (err) {
      setError((err as { message?: string })?.message || "Không thể tải danh sách phân lớp.");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, size, searchText]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setFormError("");
    setOpenForm(true);
  };

  const openEdit = async (item: EnrollmentRecord) => {
    setEditing(item);
    setOpenForm(true);
    setFormError("");
    try {
      const response = (await apiGetEnrollmentById(item.id)) as ApiResponse<EnrollmentRecord>;
      const detail = response?.result ?? response?.data ?? item;
      setForm({
        classroom: detail?.classroomId
          ? ({ id: detail.classroomId, name: detail.classroomName || "Lớp học", code: "" } as ClassroomRecord)
          : null,
        student: detail?.studentId
          ? ({ id: detail.studentId, name: detail.studentName || "", email: detail.studentEmail || "" } as UserRecord)
          : null,
        status: detail?.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
      });
    } catch {
      setForm({
        classroom: item?.classroomId
          ? ({ id: item.classroomId, name: item.classroomName || "Lớp học", code: "" } as ClassroomRecord)
          : null,
        student: item?.studentId
          ? ({ id: item.studentId, name: item.studentName || "", email: item.studentEmail || "" } as UserRecord)
          : null,
        status: item?.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
      });
    }
  };

  const submitForm = async () => {
    const classroomId = form.classroom?.id;
    const studentId = form.student?.id;
    if (!classroomId || !studentId) {
      setFormError("Lớp học và học sinh là bắt buộc.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      const payload = { classroomId: String(classroomId), studentId: String(studentId), status: form.status };
      if (editing?.id) {
        await apiUpdateEnrollment(editing.id, payload);
      } else {
        await apiCreateEnrollment(payload);
      }
      setOpenForm(false);
      setEditing(null);
      setForm(defaultForm);
      await fetchData();
    } catch (err) {
      setFormError((err as { message?: string })?.message || "Không thể lưu phân lớp.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting?.id) return;
    setSubmitting(true);
    try {
      await apiDeleteEnrollment(deleting.id);
      setOpenDelete(false);
      setDeleting(null);
      if (rows.length === 1 && page > 0) setPage((p) => p - 1);
      else await fetchData();
    } catch (err) {
      setError((err as { message?: string })?.message || "Không thể xóa phân lớp.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={muPageShell}>
      <Typography variant="h5" sx={muPageTitle}>
        Quản lý phân lớp
      </Typography>

      <AdminCatalogToolbar
        searchPlaceholder="Tìm theo lớp/học sinh/email"
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
        addLabel="Thêm phân lớp"
        onAdd={openCreate}
        importType="enrollments"
        onImported={() => void fetchData()}
      />

      {error ? <Alert severity="error" sx={{ mb: 1, py: 0.25, fontSize: 12 }}>{error}</Alert> : null}

      <Box sx={muCatalogTableShell}>
        <Box sx={{ px: 1.25, py: 0.75, borderBottom: "1px solid #D3D1C7", display: "grid", gridTemplateColumns: "72px minmax(200px,1fr) minmax(180px,1fr) minmax(220px,1fr) 100px 160px 120px", columnGap: 1.5, fontSize: 12, fontWeight: 700, color: "#0C447C" }}>
          <Box>STT</Box><Box>Lớp học</Box><Box>Học sinh</Box><Box>Email</Box><Box>Trạng thái</Box><Box>Ngày tham gia</Box><Box sx={{ textAlign: "center" }}>Thao tác</Box>
        </Box>
        {loading ? (
          <Box sx={{ p: 2 }}><Skeleton height={36} /><Skeleton height={36} /><Skeleton height={36} /></Box>
        ) : rows.length === 0 ? (
          <Box sx={muEmptyState}>Không có dữ liệu phân lớp.</Box>
        ) : (
          rows.map((item, index) => (
            <Box key={item.id} sx={{ px: 1.25, py: 0.75, borderBottom: "1px solid #ECEAE3", display: "grid", gridTemplateColumns: "72px minmax(200px,1fr) minmax(180px,1fr) minmax(220px,1fr) 100px 160px 120px", columnGap: 1.5, alignItems: "center", fontSize: 13 }}>
              <Box sx={{ color: "#5F5E5A" }}>{page * size + index + 1}</Box>
              <Box sx={{ fontWeight: 600, color: "#0C447C" }}>{item.classroomName || "—"}</Box>
              <Box sx={{ color: "#5F5E5A" }}>{item.studentName || "—"}</Box>
              <Box sx={{ color: "#5F5E5A" }}>{item.studentEmail || "—"}</Box>
              <Box sx={{ color: item.status === "ACTIVE" ? "#2f7d56" : "#8b9099", fontWeight: 600 }}>{item.status || "ACTIVE"}</Box>
              <Box sx={{ color: "#5F5E5A" }}>{item.joinedAt ? new Date(item.joinedAt).toLocaleString("vi-VN") : "—"}</Box>
              <Box sx={{ display: "flex", justifyContent: "center", gap: 0.5 }}>
                <Tooltip title="Sửa">
                  <IconButton size="small" color="primary" onClick={() => void openEdit(item)}>
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Xóa">
                  <IconButton size="small" color="error" onClick={() => { setDeleting(item); setOpenDelete(true); }}>
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          ))
        )}
        <Box sx={{ p: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "#F9F8F5", borderTop: "1px solid #D3D1C7", gap: 1 }}>
          <Typography variant="body2" sx={{ color: "#5F5E5A" }}>Tổng: {total}</Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button variant="outlined" sx={muBtnSmOutlined} size="small" disabled={page <= 0} onClick={() => setPage((p) => p - 1)}>Trang trước</Button>
            <Button variant="outlined" sx={muBtnSmOutlined} size="small" disabled={(page + 1) * size >= total} onClick={() => setPage((p) => p + 1)}>Trang sau</Button>
            <TextField select size="small" value={size} onChange={(e) => { setSize(Number(e.target.value)); setPage(0); }} sx={{ width: 86, ...muTextFieldSx }}>
              {[10, 20, 50].map((opt) => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
            </TextField>
          </Box>
        </Box>
      </Box>

      <Dialog open={openForm} onClose={submitting ? undefined : () => setOpenForm(false)} fullWidth maxWidth="sm" PaperProps={{ sx: muDialogPaper }}>
        <DialogTitle>{editing?.id ? "Cập nhật phân lớp" : "Thêm phân lớp mới"}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: "grid", rowGap: 1.5 }}>
            {formError ? <Alert severity="error">{formError}</Alert> : null}
            <Box>
              <Typography component="label" sx={{ ...muFieldLabel, mb: 0.5 }}>
                Lớp học <Box component="span" sx={muRequired}>*</Box>
              </Typography>
              <ClassroomPagingAutocomplete
                multiple={false}
                value={form.classroom}
                onChange={(val) => setForm((p) => ({ ...p, classroom: (val as ClassroomRecord | null) ?? null }))}
              />
            </Box>
            <Box>
              <Typography component="label" sx={{ ...muFieldLabel, mb: 0.5 }}>
                Học sinh <Box component="span" sx={muRequired}>*</Box>
              </Typography>
              <StudentPagingAutocomplete
                value={form.student}
                onChange={(val) => setForm((p) => ({ ...p, student: val }))}
              />
            </Box>
            <TextField
              select
              label="Trạng thái"
              size="small"
              sx={muTextFieldSx}
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: (e.target.value as "ACTIVE" | "INACTIVE") ?? "ACTIVE" }))}
            >
              <MenuItem value="ACTIVE">ACTIVE</MenuItem>
              <MenuItem value="INACTIVE">INACTIVE</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions sx={muDialogFooter}>
          <Button onClick={() => setOpenForm(false)} sx={muFooterBtnOutlined} disabled={submitting}>Hủy</Button>
          <Button variant="contained" sx={muFooterBtnPrimary} onClick={() => void submitForm()} disabled={submitting}>
            {editing?.id ? "Lưu thay đổi" : "Tạo mới"}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={openDelete}
        title="Xóa phân lớp"
        content={`Bạn có chắc chắn muốn xóa phân lớp của "${deleting?.studentName || ""}"?`}
        cancelText="Hủy"
        confirmText="Xóa"
        onClose={() => { if (!submitting) { setOpenDelete(false); setDeleting(null); } }}
        onConfirm={() => void confirmDelete()}
        loading={submitting}
      />
    </Box>
  );
}

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import {
  Alert,
  Box,
  Button,
  Chip,
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
import { AdminCatalogToolbar, ConfirmDialog } from "../../admin/components";
import { QuestionBankForm } from "../../admin/components/question/QuestionBankForm";
import {
  muBtnSmOutlined,
  muCatalogTableShell,
  muDialogFooter,
  muDialogPaper,
  muEmptyState,
  muFooterBtnOutlined,
  muFooterBtnPrimary,
  muPageShell,
  muPageTitle,
  muTextFieldSx,
} from "./manageUserUiStyles";
import {
  apiCreateQuestion,
  apiDeleteQuestion,
  apiGetQuestionById,
  apiGetQuestionCategories,
  apiSearchQuestions,
  apiUpdateQuestion,
  type QuestionCategoryRecord,
  type QuestionRecord,
  type QuestionStatus,
  type QuestionsPaginationResult,
} from "../../shared/api/question";
import type { ApiResponse } from "../../shared/api/types";
import { createEmptyMcqQuestion } from "../../shared/lesson/exercisePayload";
import { mcqToQuestionForm, questionToMcq } from "../../shared/lesson/questionBankUtils";
import type { MultipleChoiceQuestion } from "../../student/lessonPlayer/exercise/types";

function statusChip(status?: QuestionStatus) {
  if (status === "PUBLISHED") {
    return <Chip size="small" label="Published" color="success" variant="outlined" />;
  }
  if (status === "ARCHIVED") {
    return <Chip size="small" label="Lưu trữ" variant="outlined" />;
  }
  return <Chip size="small" label="Nháp" variant="outlined" />;
}

export function ManageQuestionsPage() {
  const [rows, setRows] = useState<QuestionRecord[]>([]);
  const [categories, setCategories] = useState<QuestionCategoryRecord[]>([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [searchText, setSearchText] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<QuestionRecord | null>(null);
  const [mcq, setMcq] = useState<MultipleChoiceQuestion>(createEmptyMcqQuestion());
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState<QuestionStatus>("DRAFT");
  const [formError, setFormError] = useState("");
  const [openDelete, setOpenDelete] = useState(false);
  const [deleting, setDeleting] = useState<QuestionRecord | null>(null);

  useEffect(() => {
    void apiGetQuestionCategories().then((res) => {
      const list = (res as { result?: QuestionCategoryRecord[] }).result ?? res.data ?? [];
      setCategories(Array.isArray(list) ? list : []);
    });
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, unknown> = {
        page,
        size,
        sort: "createdAt,desc",
        questionType: "MULTIPLE_CHOICE",
      };
      const trimmed = searchText.trim();
      if (trimmed) params.keyword = trimmed;
      if (filterCategoryId) params.categoryId = filterCategoryId;
      if (filterStatus) params.status = filterStatus;

      const response = (await apiSearchQuestions(params)) as ApiResponse<QuestionsPaginationResult>;
      const items = response?.data?.result ?? response?.result ?? [];
      const totalItems = response?.meta?.total ?? response?.data?.meta?.total ?? 0;
      setRows(Array.isArray(items) ? items : []);
      setTotal(Number.isFinite(totalItems) ? Number(totalItems) : 0);
    } catch (err) {
      setError((err as { message?: string })?.message || "Không thể tải thư viện câu hỏi.");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, size, searchText, filterCategoryId, filterStatus]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const resetForm = () => {
    setMcq(createEmptyMcqQuestion());
    setCategoryId("");
    setStatus("DRAFT");
    setFormError("");
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setOpenForm(true);
  };

  const openEdit = async (row: QuestionRecord) => {
    setFormError("");
    setEditing(row);
    setOpenForm(true);
    try {
      const response = (await apiGetQuestionById(row.id)) as ApiResponse<QuestionRecord>;
      const detail = response?.result ?? response?.data ?? row;
      setMcq(questionToMcq(detail));
      setCategoryId(detail.categoryId ?? "");
      setStatus(detail.status ?? "DRAFT");
    } catch {
      setMcq(questionToMcq(row));
      setCategoryId(row.categoryId ?? "");
      setStatus(row.status ?? "DRAFT");
    }
  };

  const submitForm = async () => {
    if (!mcq.prompt.text.trim()) {
      setFormError("Nội dung câu hỏi không được để trống.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      const payload = mcqToQuestionForm(mcq, {
        categoryId: categoryId || undefined,
        status,
      });
      if (editing?.id) {
        await apiUpdateQuestion(editing.id, payload);
      } else {
        await apiCreateQuestion(payload);
      }
      setOpenForm(false);
      resetForm();
      await fetchData();
    } catch (err) {
      setFormError((err as { message?: string })?.message || "Không thể lưu câu hỏi.");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteRow = async () => {
    if (!deleting?.id) return;
    setSubmitting(true);
    try {
      await apiDeleteQuestion(deleting.id);
      setOpenDelete(false);
      setDeleting(null);
      await fetchData();
    } catch (err) {
      setError((err as { message?: string })?.message || "Không thể xóa câu hỏi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={muPageShell}>
      <Typography variant="h5" sx={muPageTitle}>
        Thư viện câu hỏi
      </Typography>

      <AdminCatalogToolbar
        searchPlaceholder="Tìm theo nội dung câu hỏi..."
        searchInput={searchInput}
        onSearchInputChange={setSearchInput}
        onSearch={() => {
          setPage(0);
          setSearchText(searchInput);
        }}
        onReset={() => {
          setSearchInput("");
          setSearchText("");
          setFilterCategoryId("");
          setFilterStatus("");
          setPage(0);
        }}
        addLabel="Thêm câu MCQ"
        onAdd={openCreate}
        extraFilters={
          <>
            <TextField
              select
              size="small"
              value={filterCategoryId}
              onChange={(e) => {
                setFilterCategoryId(e.target.value);
                setPage(0);
              }}
              sx={{ ...muTextFieldSx, minWidth: 140 }}
            >
              <MenuItem value="">Tất cả DM</MenuItem>
              {categories.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(0);
              }}
              sx={{ ...muTextFieldSx, minWidth: 120 }}
            >
              <MenuItem value="">Mọi TT</MenuItem>
              <MenuItem value="DRAFT">Nháp</MenuItem>
              <MenuItem value="PUBLISHED">Published</MenuItem>
              <MenuItem value="ARCHIVED">Lưu trữ</MenuItem>
            </TextField>
          </>
        }
      />

      {error ? (
        <Alert severity="error" sx={{ mb: 1 }} onClose={() => setError("")}>
          {error}
        </Alert>
      ) : null}

      <Box sx={muCatalogTableShell}>
        <Box
          sx={{
            px: 1.25,
            py: 0.75,
            borderBottom: "1px solid #D3D1C7",
            display: "grid",
            gridTemplateColumns: "48px minmax(200px, 2fr) minmax(100px, 1fr) 100px 100px",
            columnGap: 1,
            fontSize: 12,
            fontWeight: 700,
            color: "#0C447C",
          }}
        >
          <Box>#</Box>
          <Box>Câu hỏi</Box>
          <Box>Danh mục</Box>
          <Box>Trạng thái</Box>
          <Box sx={{ textAlign: "center" }}>Thao tác</Box>
        </Box>

        {loading ? (
          <Box sx={{ p: 2 }}>
            <Skeleton height={36} />
            <Skeleton height={36} />
          </Box>
        ) : rows.length === 0 ? (
          <Box sx={muEmptyState}>Chưa có câu hỏi trong ngân hàng.</Box>
        ) : (
          rows.map((row, index) => (
            <Box
              key={row.id}
              sx={{
                px: 1.25,
                py: 0.75,
                borderBottom: "1px solid #ECEAE3",
                display: "grid",
                gridTemplateColumns: "48px minmax(200px, 2fr) minmax(100px, 1fr) 100px 100px",
                columnGap: 1,
                alignItems: "center",
                fontSize: 13,
              }}
            >
              <Box sx={{ color: "#5F5E5A" }}>{page * size + index + 1}</Box>
              <Box sx={{ fontWeight: 500 }}>{row.promptText}</Box>
              <Box sx={{ color: "#5F5E5A", fontSize: 12 }}>{row.categoryName ?? "—"}</Box>
              <Box>{statusChip(row.status)}</Box>
              <Box sx={{ display: "flex", justifyContent: "center", gap: 0.5 }}>
                <Tooltip title="Sửa">
                  <IconButton size="small" color="primary" onClick={() => void openEdit(row)}>
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Xóa">
                  <IconButton size="small" color="error" onClick={() => { setDeleting(row); setOpenDelete(true); }}>
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          ))
        )}

        <Box
          sx={{
            p: 1.5,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            bgcolor: "#F9F8F5",
            borderTop: "1px solid #D3D1C7",
          }}
        >
          <Typography variant="body2" sx={{ color: "#5F5E5A" }}>
            Tổng: {total}
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
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
          </Box>
        </Box>
      </Box>

      <Dialog
        open={openForm}
        onClose={() => !submitting && (setOpenForm(false), resetForm())}
        fullWidth
        maxWidth="md"
        PaperProps={{ sx: muDialogPaper }}
      >
        <DialogTitle>{editing ? "Sửa câu hỏi" : "Thêm câu MCQ"}</DialogTitle>
        <DialogContent>
          {formError ? <Alert severity="error" sx={{ mb: 1 }}>{formError}</Alert> : null}
          <QuestionBankForm
            mcq={mcq}
            categoryId={categoryId}
            status={status}
            onMcqChange={setMcq}
            onCategoryChange={setCategoryId}
            onStatusChange={setStatus}
          />
        </DialogContent>
        <DialogActions sx={muDialogFooter}>
          <Button sx={muFooterBtnOutlined} disabled={submitting} onClick={() => { setOpenForm(false); resetForm(); }}>
            Hủy
          </Button>
          <Button variant="contained" sx={muFooterBtnPrimary} disabled={submitting} onClick={() => void submitForm()}>
            {submitting ? "Đang lưu..." : editing ? "Lưu" : "Tạo câu"}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Xóa câu hỏi"
        content={`Xóa câu "${deleting?.promptText ?? ""}"? Các lesson đang tham chiếu sẽ mất câu này.`}
        cancelText="Hủy"
        confirmText="Xóa"
        onClose={() => !submitting && (setOpenDelete(false), setDeleting(null))}
        onConfirm={() => void deleteRow()}
        loading={submitting}
      />
    </Box>
  );
}

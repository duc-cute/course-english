import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import QuizOutlinedIcon from "@mui/icons-material/QuizOutlined";
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
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AdminCatalogGridTable,
  AdminCatalogPageHeader,
  AdminCatalogToolbar,
  ConfirmDialog,
  type CatalogGridColumn,
} from "../../admin/components";
import { QuestionBankForm } from "../../admin/components/question/QuestionBankForm";
import {
  QuestionBankImportDialog,
  type QuestionBankImportFormat,
} from "../../admin/components/question/QuestionBankImportDialog";
import {
  muBtnSmOutlined,
  muDialogFooter,
  muDialogPaper,
  muFooterBtnOutlined,
  muFooterBtnPrimary,
  muTextFieldSx,
  muSelectAllowEmpty,
  muSelectFilterInputLabelProps,
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
  const [importFormat, setImportFormat] = useState<QuestionBankImportFormat | null>(null);

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

  const questionColumns = useMemo<CatalogGridColumn<QuestionRecord>[]>(
    () => [
      {
        key: "stt",
        header: "#",
        width: "48px",
        mobileRole: "hidden",
        className: "catalog-table-muted",
        render: (_row, index) => page * size + index + 1,
      },
      {
        key: "prompt",
        header: "Câu hỏi",
        width: "minmax(200px, 2fr)",
        mobileRole: "title",
        render: (row) => row.promptText,
      },
      {
        key: "category",
        header: "Danh mục",
        width: "minmax(100px, 1fr)",
        mobileRole: "meta",
        className: "catalog-table-muted",
        render: (row) => row.categoryName ?? "—",
      },
      {
        key: "status",
        header: "Trạng thái",
        width: "100px",
        mobileRole: "inline",
        render: (row) => statusChip(row.status),
      },
      {
        key: "actions",
        header: "Thao tác",
        width: "100px",
        align: "center",
        mobileRole: "actions",
        render: (row) => (
          <>
            <Tooltip title="Sửa">
              <IconButton size="small" color="primary" onClick={() => void openEdit(row)}>
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Xóa">
              <IconButton
                size="small"
                color="error"
                onClick={() => {
                  setDeleting(row);
                  setOpenDelete(true);
                }}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        ),
      },
    ],
    [page, size],
  );

  return (
    <Box className="admin-catalog-page">
      <AdminCatalogPageHeader
        title="Thư viện câu hỏi"
        subtitle="Ngân hàng câu hỏi MCQ"
        icon={<QuizOutlinedIcon />}
      />

      <Box className="admin-catalog-page__filter-card admin-catalog-page__toolbar-wrap">
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
          toolbarVariant="soft"
          extraFilters={
            <>
              <TextField
                select
                size="small"
                label="Danh mục"
                value={filterCategoryId}
                onChange={(e) => {
                  setFilterCategoryId(e.target.value);
                  setPage(0);
                }}
                SelectProps={muSelectAllowEmpty}
                InputLabelProps={muSelectFilterInputLabelProps}
                className="admin-catalog-soft-filter__field"
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
                label="Trạng thái"
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setPage(0);
                }}
                SelectProps={muSelectAllowEmpty}
                InputLabelProps={muSelectFilterInputLabelProps}
                className="admin-catalog-soft-filter__field"
                sx={{ ...muTextFieldSx, minWidth: 148 }}
              >
                <MenuItem value="">Mọi trạng thái</MenuItem>
                <MenuItem value="DRAFT">Nháp</MenuItem>
                <MenuItem value="PUBLISHED">Published</MenuItem>
                <MenuItem value="ARCHIVED">Lưu trữ</MenuItem>
              </TextField>
            </>
          }
        />
      </Box>

      <Box sx={{ display: "flex", gap: 1, mb: 1, flexWrap: "wrap" }}>
        <Button size="small" variant="outlined" sx={muBtnSmOutlined} onClick={() => setImportFormat("excel")}>
          Import Excel
        </Button>
        <Button size="small" variant="outlined" sx={muBtnSmOutlined} onClick={() => setImportFormat("csv")}>
          Import CSV
        </Button>
      </Box>

      {error ? (
        <Alert severity="error" sx={{ mb: 1 }} onClose={() => setError("")}>
          {error}
        </Alert>
      ) : null}

      <Box className="admin-catalog-page__table-card">
        <AdminCatalogGridTable
          columns={questionColumns}
          rows={rows}
          loading={loading}
          emptyText="Chưa có câu hỏi trong ngân hàng."
          getRowKey={(row) => row.id}
        />
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

      {importFormat ? (
        <QuestionBankImportDialog
          open
          format={importFormat}
          onClose={() => setImportFormat(null)}
          onImported={() => void fetchData()}
        />
      ) : null}
    </Box>
  );
}

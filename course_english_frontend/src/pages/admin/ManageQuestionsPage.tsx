import QuizOutlinedIcon from "@mui/icons-material/QuizOutlined";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { AdminCatalogPageHeader, ConfirmDialog } from "../../admin/components";
import { QuestionBankAiGenDialog } from "../../admin/components/question/QuestionBankAiGenDialog";
import { QuestionBankFilters, type QuestionBankFilterState } from "../../admin/components/question/QuestionBankFilters";
import { QuestionBankForm } from "../../admin/components/question/QuestionBankForm";
import { QuestionBankHeaderActions } from "../../admin/components/question/QuestionBankHeaderActions";
import { QuestionBankExplainDialog } from "../../admin/components/question/QuestionBankExplainDialog";
import { QuestionBankAiActionDialog } from "../../admin/components/question/QuestionBankAiActionDialog";
import { QuestionBankPreviewDrawer } from "../../admin/components/question/QuestionBankPreviewDrawer";
import { QuestionBankStatsRow } from "../../admin/components/question/QuestionBankStatsRow";
import { QuestionBankBulkToolbar } from "../../admin/components/question/QuestionBankBulkToolbar";
import { QuestionBankTable } from "../../admin/components/question/QuestionBankTable";
import {
  muDialogFooter,
  muDialogPaper,
  muFooterBtnOutlined,
  muFooterBtnPrimary,
} from "./manageUserUiStyles";
import {
  apiBulkQuestions,
  apiCreateQuestion,
  apiExportQuestions,
  apiDeleteQuestion,
  apiGetQuestionById,
  apiGetQuestionCategories,
  apiGetQuestionStats,
  apiSearchQuestions,
  apiUpdateQuestion,
  type BulkQuestionOperation,
  type QuestionCategoryRecord,
  type QuestionRecord,
  type QuestionStatsRecord,
  type QuestionType,
  type QuestionsPaginationResult,
} from "../../shared/api/question";
import type { ApiResponse } from "../../shared/api/types";
import {
  QUESTION_BANK_EDITABLE_TYPES,
  createEmptyQuestionByType,
  exerciseQuestionToQuestionForm,
  questionRecordToExerciseQuestion,
  recordToFormMeta,
  type QuestionFormMeta,
} from "../../shared/lesson/questionBankUtils";
import type { BankImportBatchResult } from "../../shared/lesson/questionBankImport";
import { downloadQuestionBankJsonExport } from "../../shared/lesson/questionBankExport";
import { apiBulkQuestionBankAi, type QuestionBankAiAction } from "../../shared/api/questionAi";
import type { ExerciseQuestion } from "../../student/lessonPlayer/exercise/types";

const DEFAULT_FILTERS: QuestionBankFilterState = {
  searchInput: "",
  filterCategoryId: "",
  filterStatus: "",
  filterQuestionType: "",
  filterDifficulty: "",
  filterCefrLevel: "",
  filterSkill: "",
  filterTopic: "",
  filterSource: "",
  sortBy: "createdAt,desc",
};

export function ManageQuestionsPage() {
  const [rows, setRows] = useState<QuestionRecord[]>([]);
  const [categories, setCategories] = useState<QuestionCategoryRecord[]>([]);
  const [stats, setStats] = useState<QuestionStatsRecord | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<QuestionBankFilterState>(DEFAULT_FILTERS);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<QuestionRecord | null>(null);
  const [questionType, setQuestionType] = useState<QuestionType>("MULTIPLE_CHOICE");
  const [question, setQuestion] = useState<ExerciseQuestion>(createEmptyQuestionByType("MULTIPLE_CHOICE"));
  const [formMeta, setFormMeta] = useState<QuestionFormMeta>({ status: "DRAFT" });
  const [formError, setFormError] = useState("");
  const [openDelete, setOpenDelete] = useState(false);
  const [deleting, setDeleting] = useState<QuestionRecord | null>(null);
  const [openAiGen, setOpenAiGen] = useState(false);
  const [aiSaveMessage, setAiSaveMessage] = useState("");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewRefresh, setPreviewRefresh] = useState(0);
  const [explainId, setExplainId] = useState<string | null>(null);
  const [aiActionState, setAiActionState] = useState<{
    questionId: string;
    action: QuestionBankAiAction;
  } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [openBulkDelete, setOpenBulkDelete] = useState(false);
  const [bulkMessage, setBulkMessage] = useState("");

  const updateFilter = <K extends keyof QuestionBankFilterState>(key: K, value: QuestionBankFilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setSelectedIds(new Set());
    if (key !== "searchInput") {
      setPage(0);
    }
  };

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const response = (await apiGetQuestionStats()) as ApiResponse<QuestionStatsRecord>;
      const data = response?.result ?? response?.data ?? null;
      setStats(data);
    } catch {
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    void apiGetQuestionCategories().then((res) => {
      const list = (res as { result?: QuestionCategoryRecord[] }).result ?? res.data ?? [];
      setCategories(Array.isArray(list) ? list : []);
    });
    void fetchStats();
  }, [fetchStats]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, unknown> = {
        page,
        size,
        sort: filters.sortBy,
      };
      const trimmed = searchText.trim();
      if (trimmed) params.keyword = trimmed;
      if (filters.filterCategoryId) params.categoryId = filters.filterCategoryId;
      if (filters.filterStatus) params.status = filters.filterStatus;
      if (filters.filterQuestionType) params.questionType = filters.filterQuestionType;
      if (filters.filterDifficulty) params.difficulty = Number(filters.filterDifficulty);
      if (filters.filterCefrLevel) params.cefrLevel = filters.filterCefrLevel;
      if (filters.filterSkill) params.skill = filters.filterSkill;
      if (filters.filterTopic.trim()) params.topic = filters.filterTopic.trim();
      if (filters.filterSource) params.source = filters.filterSource;

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
  }, [page, size, searchText, filters]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const resetForm = () => {
    setQuestionType("MULTIPLE_CHOICE");
    setQuestion(createEmptyQuestionByType("MULTIPLE_CHOICE"));
    setFormMeta({ status: "DRAFT" });
    setFormError("");
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setOpenForm(true);
  };

  const loadRecordIntoForm = (detail: QuestionRecord) => {
    const type = detail.questionType ?? "MULTIPLE_CHOICE";
    if (!QUESTION_BANK_EDITABLE_TYPES.includes(type)) {
      setError(`Loại ${type} chưa hỗ trợ chỉnh sửa trên UI.`);
      return false;
    }
    setQuestionType(type);
    setQuestion(questionRecordToExerciseQuestion(detail));
    setFormMeta(recordToFormMeta(detail));
    return true;
  };

  const openEdit = async (row: QuestionRecord) => {
    setPreviewId(null);
    setFormError("");
    setEditing(row);
    setOpenForm(true);
    try {
      const response = (await apiGetQuestionById(row.id)) as ApiResponse<QuestionRecord>;
      const detail = response?.result ?? response?.data ?? row;
      if (!loadRecordIntoForm(detail)) {
        setOpenForm(false);
        setEditing(null);
      }
    } catch {
      if (!loadRecordIntoForm(row)) {
        setOpenForm(false);
        setEditing(null);
      }
    }
  };

  const handleQuestionTypeChange = (nextType: QuestionType) => {
    setQuestionType(nextType);
    setQuestion(createEmptyQuestionByType(nextType));
  };

  const submitForm = async () => {
    const promptText =
      question.type === "MULTIPLE_CHOICE" || question.type === "TRUE_FALSE" || question.type === "FILL_BLANK"
        ? question.prompt?.text?.trim() ?? ""
        : "";
    if (!promptText) {
      setFormError("Nội dung câu hỏi không được để trống.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      const payload = exerciseQuestionToQuestionForm(question, formMeta);
      if (editing?.id) {
        await apiUpdateQuestion(editing.id, payload);
      } else {
        await apiCreateQuestion(payload);
      }
      setOpenForm(false);
      resetForm();
      await Promise.all([fetchData(), fetchStats()]);
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
      await Promise.all([fetchData(), fetchStats()]);
    } catch (err) {
      setError((err as { message?: string })?.message || "Không thể xóa câu hỏi.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSearch = () => {
    setPage(0);
    setSearchText(filters.searchInput);
    setSelectedIds(new Set());
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSearchText("");
    setPage(0);
    setSelectedIds(new Set());
  };

  const runBulk = async (operation: BulkQuestionOperation) => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    setBulkBusy(true);
    setError("");
    setBulkMessage("");
    try {
      const result = await apiBulkQuestions({ ids, operation });
      const notFound = result.notFoundIds?.length ?? 0;
      const opLabel =
        operation === "PUBLISH"
          ? "xuất bản"
          : operation === "ARCHIVE"
            ? "lưu trữ"
            : operation === "DELETE"
              ? "xóa"
              : operation === "DUPLICATE"
                ? "nhân bản"
                : "cập nhật";
      let msg = `Đã ${opLabel} ${result.affected}/${result.requested} câu.`;
      if (operation === "DUPLICATE" && result.createdIds?.length) {
        msg += ` (${result.createdIds.length} bản mới, trạng thái Nháp).`;
      }
      if (notFound > 0) {
        msg += ` ${notFound} id không tìm thấy.`;
      }
      setBulkMessage(msg);
      setSelectedIds(new Set());
      setOpenBulkDelete(false);
      await Promise.all([fetchData(), fetchStats()]);
    } catch (err) {
      setError((err as { message?: string })?.message || "Thao tác hàng loạt thất bại.");
    } finally {
      setBulkBusy(false);
    }
  };

  const handleBulkSimilar = async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    setBulkBusy(true);
    setError("");
    setBulkMessage("");
    try {
      const result = await apiBulkQuestionBankAi({ ids, action: "SIMILAR", questionCount: 1 });
      const errCount = result.errors?.length ?? 0;
      let msg = `Đã tạo ${result.taskIds.length}/${result.requested} tác vụ AI tương tự.`;
      if (errCount > 0) {
        msg += ` ${errCount} câu lỗi.`;
      }
      msg += " Mỗi tác vụ dùng 1 lượt quota hôm nay — xem kết quả trong dialog AI từng câu hoặc lịch sử tác vụ.";
      setBulkMessage(msg);
      setSelectedIds(new Set());
    } catch (err) {
      setError((err as { message?: string })?.message || "Bulk AI thất bại.");
    } finally {
      setBulkBusy(false);
    }
  };

  const openAiAction = (record: QuestionRecord, action: QuestionBankAiAction) => {
    setAiActionState({ questionId: record.id, action });
  };

  const handleExport = async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    setBulkBusy(true);
    setError("");
    try {
      const result = await apiExportQuestions(ids);
      downloadQuestionBankJsonExport({
        exportedAt: result.exportedAt,
        requested: result.requested,
        exported: result.exported,
        notFoundIds: result.notFoundIds,
        questions: result.questions,
      });
      const notFound = result.notFoundIds?.length ?? 0;
      let msg = `Đã export ${result.exported}/${result.requested} câu ra file JSON.`;
      if (notFound > 0) {
        msg += ` ${notFound} id không tìm thấy.`;
      }
      setBulkMessage(msg);
    } catch (err) {
      setError((err as { message?: string })?.message || "Export thất bại.");
    } finally {
      setBulkBusy(false);
    }
  };

  return (
    <Box className="admin-catalog-page admin-catalog-page--question-bank">
      <AdminCatalogPageHeader
        title="Question Bank"
        subtitle="Ngân hàng câu hỏi tái sử dụng — từ lưu đề thi, sinh AI hoặc tạo thủ công."
        icon={<QuizOutlinedIcon />}
        action={
          <QuestionBankHeaderActions
            onNewQuestion={openCreate}
            onAiGenerate={() => setOpenAiGen(true)}
          />
        }
      />

      <QuestionBankStatsRow stats={stats} loading={statsLoading} />

      <QuestionBankFilters
        categories={categories}
        filters={filters}
        onSearchInputChange={(value) => updateFilter("searchInput", value)}
        onSearch={handleSearch}
        onReset={handleResetFilters}
        onFilterChange={updateFilter}
      />

      {aiSaveMessage ? (
        <Alert severity="success" sx={{ mb: 1 }} onClose={() => setAiSaveMessage("")}>
          {aiSaveMessage}
        </Alert>
      ) : null}

      {bulkMessage ? (
        <Alert severity="success" sx={{ mb: 1 }} onClose={() => setBulkMessage("")}>
          {bulkMessage}
        </Alert>
      ) : null}

      {error ? (
        <Alert severity="error" sx={{ mb: 1 }} onClose={() => setError("")}>
          {error}
        </Alert>
      ) : null}

      <QuestionBankBulkToolbar
        selectedCount={selectedIds.size}
        busy={bulkBusy}
        onPublish={() => void runBulk("PUBLISH")}
        onArchive={() => void runBulk("ARCHIVE")}
        onDuplicate={() => void runBulk("DUPLICATE")}
        onExport={() => void handleExport()}
        onBulkSimilar={() => void handleBulkSimilar()}
        onDelete={() => setOpenBulkDelete(true)}
        onClear={() => setSelectedIds(new Set())}
      />

      <QuestionBankTable
        rows={rows}
        loading={loading}
        page={page}
        size={size}
        total={total}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onPagePrev={() => {
          setPage((p) => p - 1);
          setSelectedIds(new Set());
        }}
        onPageNext={() => {
          setPage((p) => p + 1);
          setSelectedIds(new Set());
        }}
        onPreview={(row) => setPreviewId(row.id)}
        onExplain={(row) => setExplainId(row.id)}
        onAiAction={openAiAction}
        onEdit={(row) => void openEdit(row)}
        onDelete={(row) => {
          setDeleting(row);
          setOpenDelete(true);
        }}
      />

      <QuestionBankPreviewDrawer
        questionId={previewId}
        refreshToken={previewRefresh}
        onClose={() => setPreviewId(null)}
        onEdit={(record) => {
          setPreviewId(null);
          void openEdit(record);
        }}
        onExplain={(record) => setExplainId(record.id)}
        onAiAction={openAiAction}
      />

      <QuestionBankAiActionDialog
        open={Boolean(aiActionState)}
        questionId={aiActionState?.questionId ?? null}
        action={aiActionState?.action ?? null}
        onClose={() => setAiActionState(null)}
        onSaved={() => {
          void fetchData();
          void fetchStats();
          setPreviewRefresh((n) => n + 1);
        }}
      />

      <QuestionBankExplainDialog
        open={Boolean(explainId)}
        questionId={explainId}
        onClose={() => setExplainId(null)}
        onApplied={() => {
          void fetchData();
          setPreviewRefresh((n) => n + 1);
        }}
      />

      <Dialog
        open={openForm}
        onClose={() => !submitting && (setOpenForm(false), resetForm())}
        fullWidth
        maxWidth="md"
        PaperProps={{ sx: muDialogPaper }}
      >
        <DialogTitle>{editing ? "Sửa câu hỏi" : "New Question"}</DialogTitle>
        <DialogContent>
          {formError ? (
            <Alert severity="error" sx={{ mb: 1 }}>
              {formError}
            </Alert>
          ) : null}
          <QuestionBankForm
            questionType={questionType}
            question={question}
            meta={formMeta}
            isEditing={Boolean(editing)}
            onQuestionTypeChange={handleQuestionTypeChange}
            onQuestionChange={setQuestion}
            onMetaChange={(patch) => setFormMeta((prev) => ({ ...prev, ...patch }))}
          />
        </DialogContent>
        <DialogActions sx={muDialogFooter}>
          <Button
            sx={muFooterBtnOutlined}
            disabled={submitting}
            onClick={() => {
              setOpenForm(false);
              resetForm();
            }}
          >
            Hủy
          </Button>
          <Button variant="contained" sx={muFooterBtnPrimary} disabled={submitting} onClick={() => void submitForm()}>
            {submitting ? "Đang lưu..." : editing ? "Lưu" : "Tạo câu"}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={openBulkDelete}
        title="Xóa nhiều câu hỏi?"
        content={`Xóa ${selectedIds.size} câu đã chọn? Lesson đang tham chiếu QUESTION_REF sẽ mất câu tương ứng.`}
        cancelText="Hủy"
        confirmText="Xóa"
        onClose={() => !bulkBusy && setOpenBulkDelete(false)}
        onConfirm={() => void runBulk("DELETE")}
        loading={bulkBusy}
      />

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

      <QuestionBankAiGenDialog
        open={openAiGen}
        onClose={() => setOpenAiGen(false)}
        categories={categories}
        onSaved={(result: BankImportBatchResult) => {
          void fetchStats();
          void fetchData();
          const failPart = result.failed > 0 ? ` (${result.failed} lỗi)` : "";
          setAiSaveMessage(`Đã lưu ${result.imported} câu AI vào Question Bank${failPart}.`);
          if (result.failed > 0 && result.errors[0]) {
            setError(result.errors[0]);
          }
        }}
      />
    </Box>
  );
}

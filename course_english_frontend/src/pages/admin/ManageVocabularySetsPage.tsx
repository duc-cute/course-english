import AddIcon from "@mui/icons-material/Add";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import CloseIcon from "@mui/icons-material/Close";
import CollectionsBookmarkOutlinedIcon from "@mui/icons-material/CollectionsBookmarkOutlined";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  MenuItem,
  Skeleton,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminCatalogPageHeader, AdminCatalogToolbar, ConfirmDialog } from "../../admin/components";
import {
  VocabularySetCard,
  VocabularySetCreateCard,
} from "../../admin/components/vocabulary/VocabularySetCard";
import { VocabGenerateListenDialog } from "../../admin/components/vocabulary/VocabGenerateListenDialog";
import { VocabGenerateListenTypeDialog } from "../../admin/components/vocabulary/VocabGenerateListenTypeDialog";
import { VocabGenerateMcqDialog } from "../../admin/components/vocabulary/VocabGenerateMcqDialog";
import { VocabGenerateSpellingDialog } from "../../admin/components/vocabulary/VocabGenerateSpellingDialog";
import { VocabularyAiGenDialog } from "../../admin/components/vocabulary/VocabularyAiGenDialog";
import { VocabularySetAssignDialog } from "../../admin/components/vocabulary/VocabularySetAssignDialog";
import { QuestionBankAiGenDialog } from "../../admin/components/question/QuestionBankAiGenDialog";
import { VocabularyWordPicker } from "../../admin/components/vocabulary/VocabularyWordPicker";
import {
  VocabularySetForm,
  createDefaultVocabularySetForm,
  type VocabularySetFormState,
} from "../../admin/components/vocabulary/VocabularySetForm";
import {
  muBtnSmOutlined,
  muDialogFooter,
  muFooterBtnOutlined,
  muFooterBtnPrimary,
  muTextFieldSx,
  muSelectAllowEmpty,
  muSelectFilterInputLabelProps,
} from "./manageUserUiStyles";
import {
  apiCreateVocabularySet,
  apiDeleteVocabularySet,
  apiEnrichAllVocabularySet,
  apiGetVocabularySetById,
  apiSearchVocabularySets,
  apiUpdateVocabularySet,
  type VocabularySetRecord,
  type VocabularySetsPaginationResult,
} from "../../shared/api/vocabularySet";
import type { ApiResponse } from "../../shared/api/types";
import { apiGetQuestionCategories, type QuestionCategoryRecord } from "../../shared/api/question";
import type { BankImportBatchResult } from "../../shared/lesson/questionBankImport";
import { paths } from "../../shared/constants/paths";

function toPayload(form: VocabularySetFormState) {
  return {
    title: form.title.trim(),
    description: form.description.trim() || undefined,
    coverImageUrl: form.coverImageUrl?.trim() || undefined,
    status: form.status,
    items: form.items.map((item, index) => ({
      wordEn: item.wordEn.trim(),
      meaningVi: item.meaningVi.trim(),
      phonetic: item.phonetic?.trim() || undefined,
      partOfSpeech: item.partOfSpeech?.trim() || undefined,
      exampleSentence: item.exampleSentence?.trim() || undefined,
      displayOrder: index,
    })),
  };
}

function recordToForm(record: VocabularySetRecord): VocabularySetFormState {
  return {
    title: record.title ?? "",
    description: record.description ?? "",
    coverImageUrl: record.coverImageUrl,
    status: record.status ?? "DRAFT",
    items: record.items?.length
      ? record.items.map((item) => ({
          id: item.id,
          wordEn: item.wordEn,
          meaningVi: item.meaningVi,
          phonetic: item.phonetic,
          audioUkUrl: item.audioUkUrl,
          audioUsUrl: item.audioUsUrl,
          partOfSpeech: item.partOfSpeech,
          exampleSentence: item.exampleSentence,
        }))
      : [{ wordEn: "", meaningVi: "" }],
  };
}

export function ManageVocabularySetsPage() {
  const [rows, setRows] = useState<VocabularySetRecord[]>([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(11);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<VocabularySetRecord | null>(null);
  const [form, setForm] = useState<VocabularySetFormState>(createDefaultVocabularySetForm);
  const [formError, setFormError] = useState("");
  const [openDelete, setOpenDelete] = useState(false);
  const [deleting, setDeleting] = useState<VocabularySetRecord | null>(null);
  const [openAiGen, setOpenAiGen] = useState(false);
  const [openPicker, setOpenPicker] = useState(false);
  const [generateTarget, setGenerateTarget] = useState<VocabularySetRecord | null>(null);
  const [listenGenerateTarget, setListenGenerateTarget] = useState<VocabularySetRecord | null>(null);
  const [spellingGenerateTarget, setSpellingGenerateTarget] = useState<VocabularySetRecord | null>(null);
  const [listenTypeGenerateTarget, setListenTypeGenerateTarget] = useState<VocabularySetRecord | null>(null);
  const [openBankAiGen, setOpenBankAiGen] = useState(false);
  const [bankAiGenVocabSetId, setBankAiGenVocabSetId] = useState<string | undefined>();
  const [bankAiGenOfferSetId, setBankAiGenOfferSetId] = useState<string | null>(null);
  const [categories, setCategories] = useState<QuestionCategoryRecord[]>([]);
  const [bankAiSaveMessage, setBankAiSaveMessage] = useState("");
  const [enrichingAll, setEnrichingAll] = useState(false);
  const [assignTarget, setAssignTarget] = useState<VocabularySetRecord | null>(null);
  const [assignMessage, setAssignMessage] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, unknown> = { page, size, sort: "createdAt,desc" };
      const trimmed = searchText.trim();
      if (trimmed) params.keyword = trimmed;
      if (filterStatus) params.status = filterStatus;

      const response = (await apiSearchVocabularySets(params)) as ApiResponse<VocabularySetsPaginationResult>;
      const items = response?.data?.result ?? response?.result ?? [];
      const totalItems = response?.meta?.total ?? response?.data?.meta?.total ?? 0;
      setRows(Array.isArray(items) ? items : []);
      setTotal(Number.isFinite(totalItems) ? Number(totalItems) : 0);
    } catch (err) {
      setError((err as { message?: string })?.message || "Không thể tải danh sách bộ từ.");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, size, searchText, filterStatus]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  useEffect(() => {
    void (async () => {
      try {
        const response = (await apiGetQuestionCategories()) as ApiResponse<QuestionCategoryRecord[]>;
        const list = response?.result ?? response?.data ?? [];
        setCategories(Array.isArray(list) ? list : []);
      } catch {
        setCategories([]);
      }
    })();
  }, []);

  const resetForm = () => {
    setForm(createDefaultVocabularySetForm());
    setFormError("");
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setOpenForm(true);
  };

  const handleAiGenerated = (payload: {
    title: string;
    description: string;
    coverImageUrl?: string;
    items: VocabularySetFormState["items"];
  }) => {
    setEditing(null);
    setForm({
      title: payload.title,
      description: payload.description,
      coverImageUrl: payload.coverImageUrl,
      status: "DRAFT",
      items: payload.items.length ? payload.items : [{ wordEn: "", meaningVi: "" }],
    });
    setFormError("");
    setOpenForm(true);
  };

  const openEdit = async (row: VocabularySetRecord) => {
    setFormError("");
    setEditing(row);
    setOpenForm(true);
    try {
      const response = (await apiGetVocabularySetById(row.id)) as ApiResponse<VocabularySetRecord>;
      const detail = response?.result ?? response?.data ?? row;
      setForm(recordToForm(detail));
    } catch {
      setForm(recordToForm(row));
    }
  };

  const loadSetDetail = async (row: VocabularySetRecord): Promise<VocabularySetRecord> => {
    try {
      const response = (await apiGetVocabularySetById(row.id)) as ApiResponse<VocabularySetRecord>;
      return response?.result ?? response?.data ?? row;
    } catch {
      return row;
    }
  };

  const openGenerate = async (row: VocabularySetRecord) => {
    setGenerateTarget(await loadSetDetail(row));
  };

  const openGenerateListen = async (row: VocabularySetRecord) => {
    setListenGenerateTarget(await loadSetDetail(row));
  };

  const openGenerateSpelling = async (row: VocabularySetRecord) => {
    setSpellingGenerateTarget(await loadSetDetail(row));
  };

  const openGenerateListenType = async (row: VocabularySetRecord) => {
    setListenTypeGenerateTarget(await loadSetDetail(row));
  };

  const openGenerateBankAi = async (row: VocabularySetRecord) => {
    const detail = await loadSetDetail(row);
    setBankAiGenVocabSetId(detail.id);
    setOpenBankAiGen(true);
  };

  const submitForm = async () => {
    if (!form.title.trim()) {
      setFormError("Tiêu đề bộ từ không được để trống.");
      return;
    }
    if (!form.items.some((item) => item.wordEn.trim() && item.meaningVi.trim())) {
      setFormError("Cần ít nhất một từ hợp lệ.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      const payload = toPayload(form);
      if (editing?.id) {
        await apiUpdateVocabularySet(editing.id, payload);
      } else {
        const response = (await apiCreateVocabularySet(payload)) as ApiResponse<VocabularySetRecord>;
        const created = response?.result ?? response?.data;
        if (created?.id) {
          setBankAiGenOfferSetId(created.id);
        }
      }
      setOpenForm(false);
      resetForm();
      await fetchData();
    } catch (err) {
      setFormError((err as { message?: string })?.message || "Không thể lưu bộ từ.");
    } finally {
      setSubmitting(false);
    }
  };

  const enrichAllInSet = async () => {
    if (!editing?.id) return;
    setEnrichingAll(true);
    setFormError("");
    try {
      await apiEnrichAllVocabularySet(editing.id, false);
      const response = (await apiGetVocabularySetById(editing.id)) as ApiResponse<VocabularySetRecord>;
      const detail = response?.result ?? response?.data;
      if (detail) {
        setForm(recordToForm(detail));
        setEditing(detail);
      }
    } catch (err) {
      setFormError((err as { message?: string })?.message || "Không thể enrich cả bộ.");
    } finally {
      setEnrichingAll(false);
    }
  };

  const existingWordKeys = () =>
    new Set(form.items.map((item) => item.wordEn.trim().toLowerCase()).filter(Boolean));

  const deleteRow = async () => {
    if (!deleting?.id) return;
    setSubmitting(true);
    try {
      await apiDeleteVocabularySet(deleting.id);
      setOpenDelete(false);
      setDeleting(null);
      await fetchData();
    } catch (err) {
      setError((err as { message?: string })?.message || "Không thể xóa bộ từ.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box className="admin-catalog-page admin-catalog-page--vocab-sets">
      <AdminCatalogPageHeader
        title="Thư viện Bộ từ vựng"
        subtitle={
          <>
            Quản lý các danh sách từ vựng. Hệ thống AI sẽ tự động sinh bài tập trắc nghiệm, luyện nghe và gõ từ
            dựa trên bộ từ này. Từ gốc lưu tại{" "}
            <Link to={`/${paths.ADMIN}/${paths.MANAGE_VOCABULARY_WORDS}`}>Thư viện từ vựng</Link>.
          </>
        }
        icon={<CollectionsBookmarkOutlinedIcon />}
        action={
          <Box className="admin-catalog-page__header-actions">
            <Button
              size="small"
              className="header-action-btn header-action-btn--ai"
              startIcon={<AutoAwesomeOutlinedIcon />}
              onClick={() => setOpenAiGen(true)}
            >
              Sinh bằng AI
            </Button>
            <Button
              variant="contained"
              size="small"
              className="header-action-btn header-action-btn--add"
              startIcon={<AddIcon />}
              onClick={openCreate}
            >
              Thêm bộ từ
            </Button>
          </Box>
        }
      />

      <Box className="admin-catalog-page__filter-card admin-catalog-page__toolbar-wrap">
        <AdminCatalogToolbar
          searchPlaceholder="Tìm kiếm bộ từ vựng..."
          searchInput={searchInput}
          onSearchInputChange={setSearchInput}
          onSearch={() => {
            setPage(0);
            setSearchText(searchInput);
          }}
          onReset={() => {
            setSearchInput("");
            setSearchText("");
            setFilterStatus("");
            setPage(0);
          }}
          toolbarVariant="soft"
          extraFilters={
            <TextField
              select
              size="small"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(0);
              }}
              SelectProps={{
                ...muSelectAllowEmpty,
                displayEmpty: true,
                renderValue: (selected) => {
                  if (!selected) {
                    return <span style={{ color: "#64748b", fontWeight: 500 }}>Trạng thái: Tất cả</span>;
                  }
                  return selected === "PUBLISHED" ? "Đã xuất bản" : selected === "ARCHIVED" ? "Lưu trữ" : "Bản nháp";
                }
              }}
              InputLabelProps={muSelectFilterInputLabelProps}
              className="admin-catalog-soft-filter__field"
              sx={{ ...muTextFieldSx, minWidth: 160 }}
            >
              <MenuItem value="">Trạng thái: Tất cả</MenuItem>
              <MenuItem value="PUBLISHED">Đã xuất bản</MenuItem>
              <MenuItem value="DRAFT">Bản nháp</MenuItem>
              <MenuItem value="ARCHIVED">Lưu trữ</MenuItem>
            </TextField>
          }
        />
      </Box>

      {error ? (
        <Alert severity="error" sx={{ mb: 1 }} onClose={() => setError("")}>
          {error}
        </Alert>
      ) : null}

      {bankAiSaveMessage ? (
        <Alert severity="success" sx={{ mb: 1 }} onClose={() => setBankAiSaveMessage("")}>
          {bankAiSaveMessage}
        </Alert>
      ) : null}

      {assignMessage ? (
        <Alert severity="success" sx={{ mb: 1 }} onClose={() => setAssignMessage("")}>
          {assignMessage}
        </Alert>
      ) : null}

      {bankAiGenOfferSetId ? (
        <Alert
          severity="info"
          sx={{ mb: 1 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => {
                setBankAiGenVocabSetId(bankAiGenOfferSetId);
                setOpenBankAiGen(true);
                setBankAiGenOfferSetId(null);
              }}
            >
              Sinh câu AI → Bank
            </Button>
          }
          onClose={() => setBankAiGenOfferSetId(null)}
        >
          Bộ từ đã lưu. Bạn có muốn sinh câu hỏi AI vào Question Bank?
        </Alert>
      ) : null}

      <Box className="admin-catalog-page__table-card">
        <div className={`vocab-sets-grid${loading ? " vocab-sets-grid--loading" : ""}`}>
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} variant="rounded" className="vocab-set-card--skeleton" />
            ))
          ) : rows.length === 0 ? (
            <>
              <div className="vocab-sets-empty">
                Chưa có bộ từ vựng nào. Bấm &quot;Tạo bộ từ mới&quot; hoặc import từ file CSV trong form chỉnh sửa.
              </div>
              <VocabularySetCreateCard onClick={openCreate} />
            </>
          ) : (
            <>
              {rows.map((row) => (
                <VocabularySetCard
                  key={row.id}
                  set={row}
                  onEdit={(r) => void openEdit(r)}
                  onDelete={(r) => {
                    setDeleting(r);
                    setOpenDelete(true);
                  }}
                  onAssignClassroom={(r) => {
                    setAssignMessage("");
                    setAssignTarget(r);
                  }}
                  onGenerateMcq={(r) => void openGenerate(r)}
                  onGenerateListen={(r) => void openGenerateListen(r)}
                  onGenerateSpelling={(r) => void openGenerateSpelling(r)}
                  onGenerateListenType={(r) => void openGenerateListenType(r)}
                  onGenerateBankAi={(r) => void openGenerateBankAi(r)}
                />
              ))}
              <VocabularySetCreateCard onClick={openCreate} />
            </>
          )}
        </div>

        <Box className="admin-catalog-page__table-footer">
          <Typography variant="body2" className="admin-catalog-page__table-footer-total">
            Tổng {total} bộ từ
          </Typography>
          <Box className="admin-catalog-page__table-footer-controls">
            <Button
              size="small"
              disabled={page <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              sx={muBtnSmOutlined}
            >
              Trước
            </Button>
            <Button
              size="small"
              disabled={(page + 1) * size >= total}
              onClick={() => setPage((p) => p + 1)}
              sx={muBtnSmOutlined}
            >
              Sau
            </Button>
          </Box>
        </Box>
      </Box>

      <Dialog
        open={openForm}
        onClose={() => {
          setOpenForm(false);
          resetForm();
        }}
        maxWidth={false}
        fullWidth
        PaperProps={{ className: "vocab-set-editor-dialog" }}
      >
        <div className="vocab-set-editor-dialog__header">
          <h2 className="vocab-set-editor-dialog__title">
            <span className="vocab-set-editor-dialog__title-icon" aria-hidden>
              ✨
            </span>
            {editing ? "Sửa bộ từ vựng" : "Thêm bộ từ vựng"}
          </h2>
          <IconButton
            className="vocab-set-editor-dialog__close"
            aria-label="Đóng"
            onClick={() => {
              setOpenForm(false);
              resetForm();
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>
        <DialogContent className="vocab-set-editor-dialog__body">
          <VocabularySetForm
            form={form}
            error={formError}
            onChange={setForm}
            onAiGenClick={() => setOpenAiGen(true)}
            onPickFromLibrary={() => setOpenPicker(true)}
          />
        </DialogContent>
        <DialogActions className="vocab-set-editor-dialog__footer">
          {editing?.id ? (
            <Button
              startIcon={<AutoAwesomeOutlinedIcon />}
              onClick={() => void enrichAllInSet()}
              disabled={enrichingAll || submitting}
              sx={{ ...muFooterBtnOutlined, mr: "auto" }}
            >
              {enrichingAll ? "Đang enrich…" : "Enrich cả bộ"}
            </Button>
          ) : null}
          <Button
            onClick={() => {
              setOpenForm(false);
              resetForm();
            }}
            sx={muFooterBtnOutlined}
          >
            Hủy
          </Button>
          <Button variant="contained" onClick={() => void submitForm()} disabled={submitting} sx={muFooterBtnPrimary}>
            {submitting ? "Đang lưu…" : "Lưu"}
          </Button>
        </DialogActions>
      </Dialog>

      <VocabularyAiGenDialog
        open={openAiGen}
        onClose={() => setOpenAiGen(false)}
        onGenerated={handleAiGenerated}
      />

      <VocabularyWordPicker
        open={openPicker}
        onClose={() => setOpenPicker(false)}
        excludeWordKeys={existingWordKeys()}
        onSelect={(picked) =>
          setForm((prev) => ({
            ...prev,
            items: [...prev.items.filter((i) => i.wordEn.trim() || i.meaningVi.trim()), ...picked],
          }))
        }
      />

      {generateTarget ? (
        <VocabGenerateMcqDialog
          open={Boolean(generateTarget)}
          setTitle={generateTarget.title}
          items={generateTarget.items ?? []}
          onClose={() => setGenerateTarget(null)}
        />
      ) : null}

      {listenGenerateTarget ? (
        <VocabGenerateListenDialog
          open={Boolean(listenGenerateTarget)}
          setTitle={listenGenerateTarget.title}
          items={listenGenerateTarget.items ?? []}
          onClose={() => setListenGenerateTarget(null)}
        />
      ) : null}

      {spellingGenerateTarget ? (
        <VocabGenerateSpellingDialog
          open={Boolean(spellingGenerateTarget)}
          setTitle={spellingGenerateTarget.title}
          items={spellingGenerateTarget.items ?? []}
          onClose={() => setSpellingGenerateTarget(null)}
        />
      ) : null}

      {listenTypeGenerateTarget ? (
        <VocabGenerateListenTypeDialog
          open={Boolean(listenTypeGenerateTarget)}
          setTitle={listenTypeGenerateTarget.title}
          items={listenTypeGenerateTarget.items ?? []}
          onClose={() => setListenTypeGenerateTarget(null)}
        />
      ) : null}

      <ConfirmDialog
        open={openDelete}
        title="Xóa bộ từ vựng?"
        content={`Xóa "${deleting?.title ?? ""}"? Hành động không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        onConfirm={() => void deleteRow()}
        onClose={() => {
          setOpenDelete(false);
          setDeleting(null);
        }}
        loading={submitting}
      />

      <VocabularySetAssignDialog
        open={Boolean(assignTarget)}
        set={assignTarget}
        onClose={() => setAssignTarget(null)}
        onSuccess={(message) => setAssignMessage(message)}
      />

      <QuestionBankAiGenDialog
        open={openBankAiGen}
        onClose={() => {
          setOpenBankAiGen(false);
          setBankAiGenVocabSetId(undefined);
        }}
        categories={categories}
        initialSourceMode="vocabularySet"
        initialVocabularySetId={bankAiGenVocabSetId}
        onSaved={(result: BankImportBatchResult) => {
          const failPart = result.failed > 0 ? ` (${result.failed} lỗi)` : "";
          setBankAiSaveMessage(`Đã lưu ${result.imported} câu AI vào Question Bank${failPart}.`);
        }}
      />
    </Box>
  );
}

import AutoFixHighOutlinedIcon from "@mui/icons-material/AutoFixHighOutlined";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import HeadphonesOutlinedIcon from "@mui/icons-material/HeadphonesOutlined";
import KeyboardOutlinedIcon from "@mui/icons-material/KeyboardOutlined";
import SpellcheckOutlinedIcon from "@mui/icons-material/SpellcheckOutlined";
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
import { VocabGenerateListenDialog } from "../../admin/components/vocabulary/VocabGenerateListenDialog";
import { VocabGenerateListenTypeDialog } from "../../admin/components/vocabulary/VocabGenerateListenTypeDialog";
import { VocabGenerateMcqDialog } from "../../admin/components/vocabulary/VocabGenerateMcqDialog";
import { VocabGenerateSpellingDialog } from "../../admin/components/vocabulary/VocabGenerateSpellingDialog";
import {
  VocabularyImportDialog,
} from "../../admin/components/vocabulary/VocabularyImportDialog";
import { VocabularyWordPicker } from "../../admin/components/vocabulary/VocabularyWordPicker";
import {
  VocabularySetForm,
  createDefaultVocabularySetForm,
  type VocabularySetFormState,
} from "../../admin/components/vocabulary/VocabularySetForm";
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
  apiCreateVocabularySet,
  apiDeleteVocabularySet,
  apiEnrichAllVocabularySet,
  apiGetVocabularySetById,
  apiSearchVocabularySets,
  apiUpdateVocabularySet,
  type VocabularySetRecord,
  type VocabularySetStatus,
  type VocabularySetsPaginationResult,
} from "../../shared/api/vocabularySet";
import type { ApiResponse } from "../../shared/api/types";

function statusChip(status?: VocabularySetStatus) {
  if (status === "PUBLISHED") {
    return <Chip size="small" label="Published" color="success" variant="outlined" />;
  }
  if (status === "ARCHIVED") {
    return <Chip size="small" label="Lưu trữ" variant="outlined" />;
  }
  return <Chip size="small" label="Nháp" variant="outlined" />;
}

function toPayload(form: VocabularySetFormState) {
  return {
    title: form.title.trim(),
    description: form.description.trim() || undefined,
    status: form.status,
    items: form.items.map((item, index) => ({
      wordEn: item.wordEn.trim(),
      meaningVi: item.meaningVi.trim(),
      phonetic: item.phonetic?.trim() || undefined,
      displayOrder: index,
    })),
  };
}

function recordToForm(record: VocabularySetRecord): VocabularySetFormState {
  return {
    title: record.title ?? "",
    description: record.description ?? "",
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
        }))
      : [{ wordEn: "", meaningVi: "" }],
  };
}

export function ManageVocabularySetsPage() {
  const [rows, setRows] = useState<VocabularySetRecord[]>([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
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
  const [openImport, setOpenImport] = useState(false);
  const [openPicker, setOpenPicker] = useState(false);
  const [generateTarget, setGenerateTarget] = useState<VocabularySetRecord | null>(null);
  const [listenGenerateTarget, setListenGenerateTarget] = useState<VocabularySetRecord | null>(null);
  const [spellingGenerateTarget, setSpellingGenerateTarget] = useState<VocabularySetRecord | null>(null);
  const [listenTypeGenerateTarget, setListenTypeGenerateTarget] = useState<VocabularySetRecord | null>(null);
  const [enrichingAll, setEnrichingAll] = useState(false);

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

  const resetForm = () => {
    setForm(createDefaultVocabularySetForm());
    setFormError("");
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
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
        await apiCreateVocabularySet(payload);
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
    <Box sx={muPageShell}>
      <Typography variant="h5" sx={muPageTitle}>
        Bộ từ vựng
      </Typography>
      <Typography sx={{ fontSize: 13, color: "text.secondary", mb: 2 }}>
        Nhập bộ từ (Word | Meaning) → sinh MCQ → bấm <strong>Gắn vào bài học</strong> (không cần copy JSON).
      </Typography>

      <AdminCatalogToolbar
        searchPlaceholder="Tìm theo tiêu đề bộ từ..."
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
        addLabel="Thêm bộ từ"
        onAdd={openCreate}
        extraFilters={
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
            gridTemplateColumns: "48px minmax(180px, 2fr) 80px 100px 208px",
            columnGap: 1,
            fontSize: 12,
            fontWeight: 700,
            color: "#0C447C",
          }}
        >
          <Box>#</Box>
          <Box>Tiêu đề</Box>
          <Box>Số từ</Box>
          <Box>Trạng thái</Box>
          <Box sx={{ textAlign: "center" }}>Thao tác</Box>
        </Box>

        {loading ? (
          <Box sx={{ p: 2 }}>
            <Skeleton height={36} />
            <Skeleton height={36} />
          </Box>
        ) : rows.length === 0 ? (
          <Box sx={muEmptyState}>Chưa có bộ từ vựng. Bấm &quot;Thêm bộ từ&quot; hoặc import CSV.</Box>
        ) : (
          rows.map((row, index) => (
            <Box
              key={row.id}
              sx={{
                px: 1.25,
                py: 0.75,
                borderBottom: "1px solid #ECEAE3",
                display: "grid",
                gridTemplateColumns: "48px minmax(180px, 2fr) 80px 100px 208px",
                columnGap: 1,
                alignItems: "center",
                fontSize: 13,
              }}
            >
              <Box sx={{ color: "#5F5E5A" }}>{page * size + index + 1}</Box>
              <Box>
                <Box sx={{ fontWeight: 500 }}>{row.title}</Box>
                {row.description ? (
                  <Box sx={{ fontSize: 11, color: "#5F5E5A", mt: 0.25 }}>{row.description}</Box>
                ) : null}
              </Box>
              <Box sx={{ color: "#5F5E5A" }}>{row.itemCount ?? 0}</Box>
              <Box>{statusChip(row.status)}</Box>
              <Box sx={{ display: "flex", justifyContent: "center", gap: 0.5 }}>
                <Tooltip title="Sinh MCQ">
                  <IconButton size="small" color="secondary" onClick={() => void openGenerate(row)}>
                    <AutoFixHighOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Sinh bài nghe">
                  <IconButton size="small" color="secondary" onClick={() => void openGenerateListen(row)}>
                    <HeadphonesOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Sinh gõ chính tả">
                  <IconButton size="small" color="secondary" onClick={() => void openGenerateSpelling(row)}>
                    <SpellcheckOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Sinh nghe-gõ">
                  <IconButton size="small" color="secondary" onClick={() => void openGenerateListenType(row)}>
                    <KeyboardOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
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
            Tổng {total} bộ từ
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
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
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: muDialogPaper }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: 18 }}>
          {editing ? "Sửa bộ từ vựng" : "Thêm bộ từ vựng"}
        </DialogTitle>
        <DialogContent>
          <VocabularySetForm
            form={form}
            error={formError}
            onChange={setForm}
            onImportClick={() => setOpenImport(true)}
            onPickFromLibrary={() => setOpenPicker(true)}
          />
        </DialogContent>
        <DialogActions sx={muDialogFooter}>
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

      <VocabularyImportDialog
        open={openImport}
        onClose={() => setOpenImport(false)}
        onImported={(items) => setForm((prev) => ({ ...prev, items }))}
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
        message={`Xóa "${deleting?.title ?? ""}"? Hành động không thể hoàn tác.`}
        confirmLabel="Xóa"
        onConfirm={() => void deleteRow()}
        onCancel={() => {
          setOpenDelete(false);
          setDeleting(null);
        }}
        loading={submitting}
      />
    </Box>
  );
}

import AutoFixHighOutlinedIcon from "@mui/icons-material/AutoFixHighOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
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
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AdminCatalogGridTable,
  AdminCatalogPageHeader,
  AdminCatalogToolbar,
  type CatalogGridColumn,
} from "../../admin/components";
import { VocabularyAudioPreview } from "../../admin/components/vocabulary/VocabularyAudioPreview";
import {
  muBtnSmOutlined,
  muDialogFooter,
  muDialogPaper,
  muFooterBtnOutlined,
  muFooterBtnPrimary,
  muTextFieldSx,
} from "./manageUserUiStyles";
import {
  apiCreateVocabularyWord,
  apiEnrichVocabularyWord,
  apiGetVocabularyWordById,
  apiSearchVocabularyWords,
  apiUpdateVocabularyWord,
  type VocabularyWordRecord,
  type VocabularyWordsPaginationResult,
} from "../../shared/api/vocabularyWord";
import type { ApiResponse } from "../../shared/api/types";
import { paths } from "../../shared/constants/paths";

function hasAudio(row: VocabularyWordRecord) {
  return Boolean(row.audioUkUrl?.trim() || row.audioUsUrl?.trim());
}

export function ManageVocabularyWordsPage() {
  const [rows, setRows] = useState<VocabularyWordRecord[]>([]);
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<VocabularyWordRecord | null>(null);
  const [wordEn, setWordEn] = useState("");
  const [meaningVi, setMeaningVi] = useState("");
  const [formError, setFormError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, unknown> = { page, size, sort: "wordEn,asc" };
      const trimmed = searchText.trim();
      if (trimmed) params.keyword = trimmed;
      const response = (await apiSearchVocabularyWords(params)) as ApiResponse<VocabularyWordsPaginationResult>;
      const items = response?.data?.result ?? response?.result ?? [];
      const totalItems = response?.meta?.total ?? response?.data?.meta?.total ?? 0;
      setRows(Array.isArray(items) ? items : []);
      setTotal(Number.isFinite(totalItems) ? Number(totalItems) : 0);
    } catch (err) {
      setError((err as { message?: string })?.message || "Không thể tải thư viện từ.");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, size, searchText]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const resetForm = () => {
    setWordEn("");
    setMeaningVi("");
    setFormError("");
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setOpenForm(true);
  };

  const openDetail = async (row: VocabularyWordRecord) => {
    setFormError("");
    setEditing(row);
    setOpenForm(true);
    if (!row.id) {
      setWordEn(row.wordEn);
      setMeaningVi(row.meaningVi ?? "");
      return;
    }
    try {
      const response = (await apiGetVocabularyWordById(row.id)) as ApiResponse<VocabularyWordRecord>;
      const detail = response?.result ?? response?.data ?? row;
      setWordEn(detail.wordEn);
      setMeaningVi(detail.meaningVi ?? "");
      setEditing(detail);
    } catch {
      setWordEn(row.wordEn);
      setMeaningVi(row.meaningVi ?? "");
    }
  };

  const submitCreate = async () => {
    if (!wordEn.trim() || !meaningVi.trim()) {
      setFormError("Cần nhập từ tiếng Anh và nghĩa tiếng Việt.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      await apiCreateVocabularyWord({ wordEn: wordEn.trim(), meaningVi: meaningVi.trim() });
      setOpenForm(false);
      resetForm();
      await fetchData();
    } catch (err) {
      setFormError((err as { message?: string })?.message || "Không thể tạo từ.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitUpdate = async () => {
    if (!editing?.id) return;
    if (!meaningVi.trim()) {
      setFormError("Nghĩa tiếng Việt không được để trống.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      const response = (await apiUpdateVocabularyWord(editing.id, {
        meaningVi: meaningVi.trim(),
      })) as ApiResponse<VocabularyWordRecord>;
      const detail = response?.result ?? response?.data;
      if (detail) {
        setEditing(detail);
        setMeaningVi(detail.meaningVi ?? "");
      }
      await fetchData();
    } catch (err) {
      setFormError((err as { message?: string })?.message || "Không thể cập nhật nghĩa.");
    } finally {
      setSubmitting(false);
    }
  };

  const enrichWord = async (force = false) => {
    if (!editing?.id) return;
    setSubmitting(true);
    setFormError("");
    try {
      const response = (await apiEnrichVocabularyWord(editing.id, force)) as ApiResponse<VocabularyWordRecord>;
      const detail = response?.result ?? response?.data;
      if (detail) setEditing(detail);
      await fetchData();
    } catch (err) {
      setFormError((err as { message?: string })?.message || "Không thể enrich từ.");
    } finally {
      setSubmitting(false);
    }
  };

  const vocabularyColumns = useMemo<CatalogGridColumn<VocabularyWordRecord>[]>(
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
        key: "wordEn",
        header: "Từ (EN)",
        width: "minmax(120px, 1fr)",
        mobileRole: "title",
        render: (row) => row.wordEn,
      },
      {
        key: "meaningVi",
        header: "Nghĩa (VI)",
        width: "minmax(140px, 1.2fr)",
        mobileRole: "meta",
        className: "catalog-table-muted",
        render: (row) => row.meaningVi ?? "—",
      },
      {
        key: "phonetic",
        header: "IPA",
        width: "120px",
        mobileRole: "meta",
        className: "catalog-table-muted",
        render: (row) => row.phonetic ?? "—",
      },
      {
        key: "audio",
        header: "Audio",
        width: "72px",
        mobileRole: "inline",
        render: (row) =>
          hasAudio(row) ? (
            <VocabularyAudioPreview audioUkUrl={row.audioUkUrl} audioUsUrl={row.audioUsUrl} compact />
          ) : (
            <Chip size="small" label="—" variant="outlined" sx={{ height: 20, fontSize: 10 }} />
          ),
      },
      {
        key: "actions",
        header: "Thao tác",
        width: "56px",
        align: "center",
        mobileRole: "actions",
        render: (row) => (
          <Tooltip title="Chi tiết / Enrich">
            <IconButton size="small" color="primary" onClick={() => void openDetail(row)}>
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ),
      },
    ],
    [page, size],
  );

  return (
    <Box className="admin-catalog-page">
      <AdminCatalogPageHeader
        title="Thư viện từ vựng"
        subtitle={
          <>
            Mỗi từ chỉ lưu một lần (IPA + audio UK/US). Dùng trong{" "}
            <Link to={`/${paths.ADMIN}/${paths.MANAGE_VOCABULARY_SETS}`}>Bộ từ vựng</Link> qua &quot;Chọn từ thư viện&quot;.
          </>
        }
        icon={<MenuBookOutlinedIcon />}
      />

      <Box className="admin-catalog-page__filter-card admin-catalog-page__toolbar-wrap">
        <AdminCatalogToolbar
          searchPlaceholder="Tìm word_en, nghĩa..."
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
          addLabel="Thêm từ"
          onAdd={openCreate}
          toolbarVariant="soft"
        />
      </Box>

      {error ? (
        <Alert severity="error" sx={{ mb: 1 }} onClose={() => setError("")}>
          {error}
        </Alert>
      ) : null}

      <Box className="admin-catalog-page__table-card">
        <AdminCatalogGridTable
          columns={vocabularyColumns}
          rows={rows}
          loading={loading}
          emptyText="Chưa có từ trong thư viện. Thêm từ hoặc lưu bộ từ vựng để tự enrich."
          getRowKey={(row) => row.id ?? row.wordEn}
        />
        <Box className="admin-catalog-page__table-footer">
          <Typography variant="body2" className="admin-catalog-page__table-footer-total">
            Tổng {total} từ
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
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: muDialogPaper }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: 18 }}>
          {editing?.id ? `Từ: ${editing.wordEn}` : "Thêm từ vào thư viện"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: "grid", rowGap: 1.5 }}>
            {formError ? (
              <Alert severity="error" sx={{ fontSize: 13 }}>
                {formError}
              </Alert>
            ) : null}

            {editing?.id ? (
              <>
                <Box>
                  <Typography sx={{ fontSize: 12, color: "text.secondary" }}>Phiên âm (IPA)</Typography>
                  <Typography sx={{ fontWeight: 500 }}>{editing.phonetic ?? "—"}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 12, color: "text.secondary", mb: 0.5 }}>
                    Phát âm
                  </Typography>
                  <VocabularyAudioPreview audioUkUrl={editing.audioUkUrl} audioUsUrl={editing.audioUsUrl} />
                </Box>
                {editing.enrichedAt ? (
                  <Typography sx={{ fontSize: 11, color: "text.secondary" }}>
                    Enriched: {new Date(editing.enrichedAt).toLocaleString("vi-VN")}
                    {editing.enrichSource ? ` · ${editing.enrichSource}` : ""}
                  </Typography>
                ) : null}
                <TextField
                  label="Nghĩa tiếng Việt"
                  value={meaningVi}
                  onChange={(e) => setMeaningVi(e.target.value)}
                  fullWidth
                  size="small"
                  required
                  sx={muTextFieldSx}
                />
              </>
            ) : (
              <>
                <TextField
                  label="Từ tiếng Anh"
                  value={wordEn}
                  onChange={(e) => setWordEn(e.target.value)}
                  fullWidth
                  size="small"
                  required
                  sx={muTextFieldSx}
                />
                <TextField
                  label="Nghĩa tiếng Việt"
                  value={meaningVi}
                  onChange={(e) => setMeaningVi(e.target.value)}
                  fullWidth
                  size="small"
                  required
                  sx={muTextFieldSx}
                />
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={muDialogFooter}>
          <Button
            onClick={() => {
              setOpenForm(false);
              resetForm();
            }}
            sx={muFooterBtnOutlined}
          >
            Đóng
          </Button>
          {editing?.id ? (
            <>
              <Button
                variant="outlined"
                startIcon={<AutoFixHighOutlinedIcon />}
                onClick={() => void enrichWord(true)}
                disabled={submitting}
                sx={muFooterBtnOutlined}
              >
                Enrich lại
              </Button>
              <Button
                variant="contained"
                onClick={() => void submitUpdate()}
                disabled={submitting}
                sx={muFooterBtnPrimary}
              >
                {submitting ? "Đang lưu…" : "Lưu nghĩa"}
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              onClick={() => void submitCreate()}
              disabled={submitting}
              sx={muFooterBtnPrimary}
            >
              {submitting ? "Đang lưu…" : "Tạo + enrich"}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}

import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  Skeleton,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import type { VocabularyItemRecord } from "../../../shared/api/vocabularySet";
import {
  apiSearchVocabularyWords,
  type VocabularyWordRecord,
  type VocabularyWordsPaginationResult,
} from "../../../shared/api/vocabularyWord";
import type { ApiResponse } from "../../../shared/api/types";
import {
  muBtnSmOutlined,
  muBtnSmPrimary,
  muDialogFooter,
  muDialogPaper,
  muEmptyState,
  muFooterBtnOutlined,
  muFooterBtnPrimary,
  muToolbarSearchField,
} from "../../../pages/admin/manageUserUiStyles";
import { VocabularyAudioPreview } from "./VocabularyAudioPreview";

type VocabularyWordPickerProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (items: VocabularyItemRecord[]) => void;
  excludeWordKeys?: Set<string>;
};

function toItemRecord(word: VocabularyWordRecord): VocabularyItemRecord {
  return {
    id: word.id,
    wordEn: word.wordEn,
    meaningVi: word.meaningVi ?? "",
    phonetic: word.phonetic,
    audioUkUrl: word.audioUkUrl,
    audioUsUrl: word.audioUsUrl,
    partOfSpeech: word.partOfSpeech,
  };
}

export function VocabularyWordPicker({
  open,
  onClose,
  onSelect,
  excludeWordKeys,
}: VocabularyWordPickerProps) {
  const [rows, setRows] = useState<VocabularyWordRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchText, setSearchText] = useState("");
  const [selected, setSelected] = useState<Record<string, VocabularyWordRecord>>({});

  const fetchData = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page: 0, size: 50, sort: "wordEn,asc" };
      const trimmed = searchText.trim();
      if (trimmed) params.keyword = trimmed;
      const response = (await apiSearchVocabularyWords(params)) as ApiResponse<VocabularyWordsPaginationResult>;
      const items = response?.data?.result ?? response?.result ?? [];
      setRows(Array.isArray(items) ? items : []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [open, searchText]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!open) {
      setSelected({});
      setSearchInput("");
      setSearchText("");
    }
  }, [open]);

  const toggle = (word: VocabularyWordRecord) => {
    const key = (word.wordKey ?? word.wordEn).toLowerCase();
    if (excludeWordKeys?.has(key)) return;
    setSelected((prev) => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = word;
      }
      return next;
    });
  };

  const confirm = () => {
    const items = Object.values(selected).map(toItemRecord);
    if (items.length) onSelect(items);
    onClose();
  };

  const selectedCount = Object.keys(selected).length;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: muDialogPaper }}>
      <DialogTitle sx={{ fontWeight: 700, fontSize: 18 }}>Chọn từ từ thư viện</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", gap: 1, mb: 1.5, flexWrap: "wrap" }}>
          <TextField
            size="small"
            placeholder="Tìm từ tiếng Anh..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setSearchText(searchInput);
            }}
            sx={muToolbarSearchField}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 16 }} />
                </InputAdornment>
              ),
            }}
          />
          <Button variant="contained" size="small" sx={muBtnSmPrimary} onClick={() => setSearchText(searchInput)}>
            Tìm
          </Button>
          <Button
            variant="outlined"
            size="small"
            sx={muBtnSmOutlined}
            onClick={() => {
              setSearchInput("");
              setSearchText("");
            }}
          >
            Làm mới
          </Button>
        </Box>

        <Box sx={{ mt: 1.5, border: "1px solid #ECEAE3", borderRadius: "10px", overflow: "hidden" }}>
          <Box
            sx={{
              px: 1.25,
              py: 0.75,
              display: "grid",
              gridTemplateColumns: "32px minmax(100px,1fr) minmax(120px,1.2fr) 100px 80px",
              gap: 1,
              fontSize: 12,
              fontWeight: 700,
              color: "#0C447C",
              bgcolor: "#F8F7F4",
              borderBottom: "1px solid #ECEAE3",
            }}
          >
            <Box />
            <Box>Từ</Box>
            <Box>Nghĩa</Box>
            <Box>IPA</Box>
            <Box>Audio</Box>
          </Box>

          {loading ? (
            <Box sx={{ p: 2 }}>
              <Skeleton height={32} />
              <Skeleton height={32} />
            </Box>
          ) : rows.length === 0 ? (
            <Box sx={muEmptyState}>Không tìm thấy từ. Thử từ khóa khác hoặc thêm từ mới trong thư viện.</Box>
          ) : (
            rows.map((row) => {
              const key = (row.wordKey ?? row.wordEn).toLowerCase();
              const excluded = excludeWordKeys?.has(key);
              const isSelected = Boolean(selected[key]);
              return (
                <Box
                  key={row.id ?? key}
                  onClick={() => !excluded && toggle(row)}
                  sx={{
                    px: 1.25,
                    py: 0.75,
                    display: "grid",
                    gridTemplateColumns: "32px minmax(100px,1fr) minmax(120px,1.2fr) 100px 80px",
                    gap: 1,
                    alignItems: "center",
                    fontSize: 13,
                    borderBottom: "1px solid #ECEAE3",
                    cursor: excluded ? "not-allowed" : "pointer",
                    opacity: excluded ? 0.45 : 1,
                    bgcolor: isSelected ? "#E8F4FD" : "transparent",
                    "&:hover": excluded ? undefined : { bgcolor: isSelected ? "#E8F4FD" : "#FAFAF8" },
                  }}
                >
                  <Box sx={{ fontSize: 16 }}>{isSelected ? "✓" : excluded ? "·" : "○"}</Box>
                  <Box sx={{ fontWeight: 500 }}>{row.wordEn}</Box>
                  <Box sx={{ color: "#5F5E5A", fontSize: 12 }}>{row.meaningVi ?? "—"}</Box>
                  <Box sx={{ fontSize: 12, color: "#5F5E5A" }}>{row.phonetic ?? "—"}</Box>
                  <VocabularyAudioPreview audioUkUrl={row.audioUkUrl} audioUsUrl={row.audioUsUrl} compact />
                </Box>
              );
            })
          )}
        </Box>

        {selectedCount > 0 ? (
          <Typography sx={{ mt: 1, fontSize: 12, color: "text.secondary" }}>
            Đã chọn {selectedCount} từ
          </Typography>
        ) : null}
      </DialogContent>
      <DialogActions sx={muDialogFooter}>
        <Button onClick={onClose} sx={muFooterBtnOutlined}>
          Hủy
        </Button>
        <Button
          variant="contained"
          onClick={confirm}
          disabled={selectedCount === 0}
          sx={muFooterBtnPrimary}
        >
          Thêm vào bộ ({selectedCount})
        </Button>
      </DialogActions>
    </Dialog>
  );
}

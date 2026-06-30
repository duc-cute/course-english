import {
  Alert,
  Autocomplete,
  Box,
  CircularProgress,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { muTextFieldSx } from "../../../pages/admin/manageUserUiStyles";
import {
  apiGetVocabularySetById,
  apiSearchVocabularySets,
  type VocabularySetRecord,
} from "../../../shared/api/vocabularySet";
import type { ApiResponse } from "../../../shared/api/types";

type QuestionBankAiGenVocabConfigStepProps = {
  selectedSetId: string;
  onSelectedSetIdChange: (id: string) => void;
  onSetLoaded: (set: VocabularySetRecord | null) => void;
};

export function QuestionBankAiGenVocabConfigStep({
  selectedSetId,
  onSelectedSetIdChange,
  onSetLoaded,
}: QuestionBankAiGenVocabConfigStepProps) {
  const [options, setOptions] = useState<VocabularySetRecord[]>([]);
  const [searching, setSearching] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedSet, setSelectedSet] = useState<VocabularySetRecord | null>(null);
  const [inputValue, setInputValue] = useState("");

  const searchSets = useCallback(async (keyword: string) => {
    setSearching(true);
    try {
      const response = (await apiSearchVocabularySets({
        keyword: keyword.trim() || undefined,
        page: 0,
        pageSize: 20,
      })) as ApiResponse<{ result?: VocabularySetRecord[] }>;
      const list = response?.result ?? response?.data?.result ?? [];
      setOptions(list.filter((s) => (s.itemCount ?? 0) > 0));
    } catch {
      setOptions([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    void searchSets("");
  }, [searchSets]);

  useEffect(() => {
    if (!selectedSetId) {
      setSelectedSet(null);
      onSetLoaded(null);
      return;
    }

    let cancelled = false;
    setDetailLoading(true);
    void (async () => {
      try {
        const response = (await apiGetVocabularySetById(selectedSetId)) as ApiResponse<VocabularySetRecord>;
        const detail = response?.result ?? response?.data ?? null;
        if (!cancelled) {
          setSelectedSet(detail);
          onSetLoaded(detail);
          if (detail?.title) {
            setInputValue(detail.title);
          }
        }
      } catch {
        if (!cancelled) {
          setSelectedSet(null);
          onSetLoaded(null);
        }
      } finally {
        if (!cancelled) {
          setDetailLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedSetId, onSetLoaded]);

  const previewWords =
    selectedSet?.items
      ?.map((i) => i.wordEn?.trim())
      .filter(Boolean)
      .slice(0, 10) ??
    selectedSet?.previewWords?.slice(0, 10) ??
    [];

  const wordCount = selectedSet?.itemCount ?? selectedSet?.items?.length ?? 0;

  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
        Chọn bộ từ vựng đã lưu — AI sinh câu hỏi dựa trên danh sách từ (LLM), không dùng rule MCQ lesson.
      </Typography>

      <Autocomplete
        options={options}
        loading={searching}
        value={selectedSet}
        inputValue={inputValue}
        onInputChange={(_e, value, reason) => {
          setInputValue(value);
          if (reason === "input") {
            void searchSets(value);
          }
        }}
        onChange={(_e, value) => {
          setSelectedSet(value);
          onSelectedSetIdChange(value?.id ?? "");
          onSetLoaded(value);
        }}
        getOptionLabel={(o) => o.title}
        isOptionEqualToValue={(a, b) => a.id === b.id}
        noOptionsText="Không tìm thấy bộ từ"
        renderInput={(params) => (
          <TextField
            {...params}
            label={
              <>
                Bộ từ vựng <Box component="span" sx={{ color: "error.main" }}>*</Box>
              </>
            }
            size="small"
            placeholder="Tìm theo tên bộ từ…"
            sx={muTextFieldSx}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {searching || detailLoading ? <CircularProgress color="inherit" size={18} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        renderOption={(props, option) => (
          <li {...props} key={option.id}>
            <Box>
              <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{option.title}</Typography>
              <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                {option.itemCount ?? 0} từ
                {option.description ? ` · ${option.description.slice(0, 60)}` : ""}
              </Typography>
            </Box>
          </li>
        )}
      />

      {selectedSet && wordCount > 0 ? (
        <Box sx={{ display: "grid", gap: 1 }}>
          <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
            {wordCount} từ trong bộ — preview:
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
            {previewWords.map((word) => (
              <Box
                key={word}
                sx={{
                  px: 1,
                  py: 0.25,
                  borderRadius: 1,
                  bgcolor: "action.hover",
                  fontSize: 12,
                }}
              >
                {word}
              </Box>
            ))}
            {wordCount > previewWords.length ? (
              <Box sx={{ fontSize: 12, color: "text.secondary", alignSelf: "center" }}>
                +{wordCount - previewWords.length} từ khác
              </Box>
            ) : null}
          </Box>
        </Box>
      ) : null}

      {selectedSet && wordCount > 0 && wordCount < 4 ? (
        <Alert severity="warning" sx={{ py: 0 }}>
          Bộ từ ít hơn 4 — distractor MCQ có thể kém chất lượng.
        </Alert>
      ) : null}
    </Box>
  );
}

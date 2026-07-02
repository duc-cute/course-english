import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { apiPreviewStoryAi, type StoryAiPreviewResult } from "../../../shared/api/story";
import type { ApiResponse } from "../../../shared/api/types";
import { apiSearchVocabularySets, type VocabularySetRecord } from "../../../shared/api/vocabularySet";

type StoryAiGenDialogProps = {
  open: boolean;
  onClose: () => void;
  onApply: (preview: StoryAiPreviewResult, meta: { prompt: string; vocabularySetId?: string }) => void;
};

type Step = "config" | "preview";

function extractVocabularySets(
  response: Awaited<ReturnType<typeof apiSearchVocabularySets>>,
): VocabularySetRecord[] {
  const payload = response as { result?: VocabularySetRecord[]; data?: { result?: VocabularySetRecord[] } };
  const items = payload?.data?.result ?? payload?.result ?? [];
  return Array.isArray(items) ? items : [];
}

function formatVocabSetLabel(set: VocabularySetRecord): string {
  if (set.status === "PUBLISHED") {
    return set.title;
  }
  return `${set.title} (${set.status})`;
}

export function StoryAiGenDialog({ open, onClose, onApply }: StoryAiGenDialogProps) {
  const [step, setStep] = useState<Step>("config");
  const [prompt, setPrompt] = useState("");
  const [level, setLevel] = useState("A2");
  const [readingTimeMinutes, setReadingTimeMinutes] = useState(5);
  const [vocabularySetId, setVocabularySetId] = useState("");
  const [vocabSets, setVocabSets] = useState<VocabularySetRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<StoryAiPreviewResult | null>(null);

  const reset = useCallback(() => {
    setStep("config");
    setPrompt("");
    setLevel("A2");
    setReadingTimeMinutes(5);
    setVocabularySetId("");
    setLoading(false);
    setError("");
    setPreview(null);
  }, []);

  useEffect(() => {
    if (!open) {
      reset();
      return;
    }
    (async () => {
      try {
        const response = await apiSearchVocabularySets({ page: 0, size: 200, sort: "title,asc" });
        const items = extractVocabularySets(response).filter((set) => set.status !== "ARCHIVED");
        setVocabSets(items);
      } catch {
        setVocabSets([]);
      }
    })();
  }, [open, reset]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Nhập prompt story.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = (await apiPreviewStoryAi({
        prompt: prompt.trim(),
        level,
        readingTimeMinutes,
        vocabularySetId: vocabularySetId || undefined,
      })) as ApiResponse<StoryAiPreviewResult>;
      const result = response?.result ?? response?.data;
      if (!result?.title || !result?.content) {
        setError("AI không trả về kết quả hợp lệ.");
        return;
      }
      setPreview(result);
      setStep("preview");
    } catch {
      setError("Không sinh được story. Kiểm tra cấu hình AI (OpenRouter).");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!preview) return;
    onApply(preview, { prompt: prompt.trim(), vocabularySetId: vocabularySetId || undefined });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <AutoAwesomeOutlinedIcon color="secondary" fontSize="small" />
        {step === "config" ? "AI sinh Story" : "Xem trước story"}
      </DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
        {step === "config" ? (
          <>
            <TextField
              label="Prompt"
              multiline
              minRows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A relaxing bedtime story about friendship."
              helperText="Mô tả chủ đề, bối cảnh — AI sinh plain text, không HTML."
            />
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <TextField
                select
                label="Level"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                sx={{ minWidth: 120 }}
              >
                {["A1", "A2", "B1", "B2", "C1", "C2"].map((lv) => (
                  <MenuItem key={lv} value={lv}>
                    {lv}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Thời gian đọc (phút)"
                type="number"
                value={readingTimeMinutes}
                onChange={(e) => setReadingTimeMinutes(Number(e.target.value) || 5)}
                sx={{ width: 160 }}
              />
            </Box>
            <TextField
              select
              label="Bộ từ vựng (tuỳ chọn)"
              value={vocabularySetId}
              onChange={(e) => setVocabularySetId(e.target.value)}
              helperText={
                vocabSets.length === 0
                  ? "Chưa có bộ từ (DRAFT/PUBLISHED). Tạo tại Thư viện Bộ từ vựng."
                  : "AI sẽ lồng tự nhiên các từ trong bộ vào story."
              }
            >
              <MenuItem value="">— Không gắn —</MenuItem>
              {vocabSets.map((set) => (
                <MenuItem key={set.id} value={set.id}>
                  {formatVocabSetLabel(set)}
                </MenuItem>
              ))}
            </TextField>
          </>
        ) : preview ? (
          <>
            <Typography variant="h6" fontWeight={700}>
              {preview.title}
            </Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {preview.level ? (
                <Typography variant="caption" color="text.secondary">
                  Level: {preview.level}
                </Typography>
              ) : null}
              {preview.readingTimeMinutes ? (
                <Typography variant="caption" color="text.secondary">
                  ~{preview.readingTimeMinutes} phút đọc
                </Typography>
              ) : null}
            </Box>
            <Box
              sx={{
                maxHeight: 320,
                overflow: "auto",
                p: 2,
                borderRadius: 2,
                bgcolor: "#f8fafc",
                border: "1px solid #e2e8f0",
                whiteSpace: "pre-wrap",
                lineHeight: 1.7,
                fontSize: "0.95rem",
              }}
            >
              {preview.content}
            </Box>
          </>
        ) : null}

        {error ? <Alert severity="error">{error}</Alert> : null}
      </DialogContent>
      <DialogActions>
        {step === "preview" ? (
          <Button onClick={() => setStep("config")}>Quay lại</Button>
        ) : (
          <Button onClick={onClose}>Huỷ</Button>
        )}
        {step === "config" ? (
          <Button variant="contained" onClick={handleGenerate} disabled={loading}>
            {loading ? "Đang sinh..." : "Sinh story"}
          </Button>
        ) : (
          <Button variant="contained" onClick={handleApply}>
            Dùng story này
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

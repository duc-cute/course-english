import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  apiListMonologueThemes,
  apiPreviewMonologueStoryAi,
  type MonologueTheme,
  type StoryAiPreviewResult,
} from "../../../shared/api/story";
import type { ApiResponse } from "../../../shared/api/types";

type StoryMonologueGenDialogProps = {
  open: boolean;
  onClose: () => void;
  onApply: (preview: StoryAiPreviewResult) => void;
};

type Step = "config" | "preview";

const RANDOM_THEME = "";
const MINUTE_OPTIONS = [2, 3, 5];

function parseGlossaryWords(translationsJson?: string): string[] {
  if (!translationsJson) return [];
  try {
    const parsed = JSON.parse(translationsJson) as { glossary?: { wordEn?: string }[] };
    return (parsed.glossary ?? []).map((g) => g.wordEn ?? "").filter(Boolean);
  } catch {
    return [];
  }
}

export function StoryMonologueGenDialog({ open, onClose, onApply }: StoryMonologueGenDialogProps) {
  const [step, setStep] = useState<Step>("config");
  const [themes, setThemes] = useState<MonologueTheme[]>([]);
  const [themeGroup, setThemeGroup] = useState(RANDOM_THEME);
  const [level, setLevel] = useState("A2");
  const [readingTimeMinutes, setReadingTimeMinutes] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<StoryAiPreviewResult | null>(null);

  const reset = useCallback(() => {
    setStep("config");
    setThemeGroup(RANDOM_THEME);
    setLevel("A2");
    setReadingTimeMinutes(3);
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
        const response = (await apiListMonologueThemes()) as ApiResponse<MonologueTheme[]>;
        const items = response?.result ?? response?.data ?? [];
        setThemes(Array.isArray(items) ? items : []);
      } catch {
        setThemes([]);
      }
    })();
  }, [open, reset]);

  const themeName = useMemo(
    () => themes.find((t) => t.key === preview?.themeGroup)?.name ?? preview?.themeGroup,
    [themes, preview?.themeGroup],
  );
  const glossaryWords = useMemo(() => parseGlossaryWords(preview?.translationsJson), [preview?.translationsJson]);
  const wordCount = useMemo(
    () => (preview?.content ? preview.content.trim().split(/\s+/).length : 0),
    [preview?.content],
  );

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    try {
      const response = (await apiPreviewMonologueStoryAi({
        themeGroup: themeGroup || undefined,
        level,
        readingTimeMinutes,
      })) as ApiResponse<StoryAiPreviewResult>;
      const result = response?.result ?? response?.data;
      if (!result?.title || !result?.content) {
        setError("AI không trả về kết quả hợp lệ.");
        return;
      }
      setPreview(result);
      setStep("preview");
    } catch {
      setError("Không sinh được truyện. Kiểm tra cấu hình AI (OpenRouter).");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!preview) return;
    onApply(preview);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <AutoAwesomeOutlinedIcon color="secondary" fontSize="small" />
        {step === "config" ? "Truyện truyền cảm hứng" : "Xem trước truyện"}
      </DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
        {step === "config" ? (
          <>
            <Typography variant="body2" color="text.secondary">
              Truyện tự sự ngắn — một giọng kể, lời động viên / bài học. Không cần viết prompt: chọn chủ đề
              (hoặc để ngẫu nhiên) rồi bấm Sinh.
            </Typography>
            <TextField
              select
              label="Chủ đề"
              value={themeGroup}
              onChange={(e) => setThemeGroup(e.target.value)}
              helperText={themes.find((t) => t.key === themeGroup)?.description ?? "AI chọn ngẫu nhiên một chủ đề."}
            >
              <MenuItem value={RANDOM_THEME}>🎲 Ngẫu nhiên</MenuItem>
              {themes.map((t) => (
                <MenuItem key={t.key} value={t.key}>
                  {t.name}
                </MenuItem>
              ))}
            </TextField>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
              <TextField
                select
                label="Level"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                sx={{ minWidth: 120 }}
              >
                {["A1", "A2", "B1", "B2", "C1"].map((lv) => (
                  <MenuItem key={lv} value={lv}>
                    {lv}
                  </MenuItem>
                ))}
              </TextField>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                  Thời lượng đọc
                </Typography>
                <ToggleButtonGroup
                  exclusive
                  size="small"
                  value={readingTimeMinutes}
                  onChange={(_, value: number | null) => value && setReadingTimeMinutes(value)}
                >
                  {MINUTE_OPTIONS.map((m) => (
                    <ToggleButton key={m} value={m}>
                      {m} phút
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Box>
            </Box>
          </>
        ) : preview ? (
          <>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                {preview.title}
              </Typography>
              {preview.titleVi ? (
                <Typography variant="body2" color="text.secondary">
                  {preview.titleVi}
                </Typography>
              ) : null}
            </Box>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {themeName ? <Chip size="small" label={themeName} color="secondary" variant="outlined" /> : null}
              {preview.level ? <Chip size="small" label={`Level ${preview.level}`} /> : null}
              {preview.readingTimeMinutes ? <Chip size="small" label={`~${preview.readingTimeMinutes} phút`} /> : null}
              <Chip size="small" label={`${wordCount} từ`} />
            </Box>
            <Box
              sx={{
                maxHeight: 340,
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
            {glossaryWords.length > 0 ? (
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                  Từ đáng học ({glossaryWords.length})
                </Typography>
                <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                  {glossaryWords.map((w) => (
                    <Chip key={w} size="small" label={w} variant="outlined" />
                  ))}
                </Box>
              </Box>
            ) : null}
          </>
        ) : null}

        {error ? <Alert severity="error">{error}</Alert> : null}
      </DialogContent>
      <DialogActions>
        {step === "preview" ? (
          <>
            <Button onClick={() => setStep("config")} disabled={loading}>
              Quay lại
            </Button>
            <Button startIcon={<RefreshIcon />} onClick={handleGenerate} disabled={loading}>
              {loading ? "Đang sinh..." : "Sinh lại"}
            </Button>
            <Button variant="contained" onClick={handleApply} disabled={loading}>
              Dùng truyện này
            </Button>
          </>
        ) : (
          <>
            <Button onClick={onClose}>Huỷ</Button>
            <Button variant="contained" onClick={handleGenerate} disabled={loading}>
              {loading ? "Đang sinh..." : "Sinh truyện"}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}

import AddIcon from "@mui/icons-material/Add";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import LinkIcon from "@mui/icons-material/Link";
import {
  Box,
  Button,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import type { MatchingQuestion } from "../../../student/lessonPlayer/exercise/types";
import { muTextFieldSx } from "../../../pages/admin/manageUserUiStyles";

type MatchingQuestionCanvasProps = {
  question: MatchingQuestion;
  index: number;
  canDelete: boolean;
  onChange: (next: MatchingQuestion) => void;
  onDelete: () => void;
  onDuplicate: () => void;
};

export function MatchingQuestionCanvas({
  question,
  index,
  canDelete,
  onChange,
  onDelete,
  onDuplicate,
}: MatchingQuestionCanvasProps) {
  const updatePair = (pairIndex: number, field: "left" | "right", value: string) => {
    onChange({
      ...question,
      pairs: question.pairs.map((pair, i) =>
        i === pairIndex ? { ...pair, [field]: value } : pair,
      ),
    });
  };

  const addPair = () => {
    onChange({ ...question, pairs: [...question.pairs, { left: "", right: "" }] });
  };

  const removePair = (pairIndex: number) => {
    if (question.pairs.length <= 2) return;
    onChange({ ...question, pairs: question.pairs.filter((_, i) => i !== pairIndex) });
  };

  return (
    <Box
      sx={{
        border: "1px solid #ECEAE3",
        borderTop: "none",
        borderRight: "none",
        borderRadius: 0,
        bgcolor: "#fff",
        overflow: "hidden",
        minHeight: "100%",
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.25,
          borderBottom: "1px solid #ECEAE3",
          display: "flex",
          alignItems: "center",
          gap: 1,
          bgcolor: "#F8F9FF",
        }}
      >
        <LinkIcon sx={{ fontSize: 20, color: "#0C447C" }} />
        <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#0C447C", flex: 1 }}>
          Câu {index + 1} — Ghép cặp
        </Typography>
        <Tooltip title="Nhân đôi câu">
          <IconButton size="small" onClick={onDuplicate}>
            <ContentCopyIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
        {canDelete ? (
          <Tooltip title="Xóa câu">
            <IconButton size="small" color="error" onClick={onDelete}>
              <DeleteOutlineIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        ) : null}
      </Box>

      <Box sx={{ p: 2, display: "grid", gap: 2 }}>
        <TextField
          label="Hướng dẫn câu (tuỳ chọn)"
          size="small"
          fullWidth
          value={question.prompt?.text ?? ""}
          onChange={(e) =>
            onChange({
              ...question,
              prompt: { text: e.target.value, lang: "vi" },
            })
          }
          sx={muTextFieldSx}
          placeholder="Ghép từ tiếng Anh với nghĩa tiếng Việt"
        />

        <Box>
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#0C447C", mb: 1 }}>
            Các cặp từ (EN → VI)
          </Typography>
          <Box sx={{ display: "grid", gap: 1 }}>
            {question.pairs.map((pair, pairIndex) => (
              <Box
                key={pairIndex}
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr auto" },
                  gap: 1,
                  alignItems: "center",
                }}
              >
                <TextField
                  label={`Từ EN ${pairIndex + 1}`}
                  size="small"
                  value={pair.left}
                  onChange={(e) => updatePair(pairIndex, "left", e.target.value)}
                  sx={muTextFieldSx}
                  placeholder="apple"
                />
                <TextField
                  label={`Nghĩa VI ${pairIndex + 1}`}
                  size="small"
                  value={pair.right}
                  onChange={(e) => updatePair(pairIndex, "right", e.target.value)}
                  sx={muTextFieldSx}
                  placeholder="quả táo"
                />
                <IconButton
                  size="small"
                  color="error"
                  disabled={question.pairs.length <= 2}
                  onClick={() => removePair(pairIndex)}
                  sx={{ justifySelf: { xs: "end", sm: "center" } }}
                >
                  <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Box>
            ))}
          </Box>
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={addPair}
            sx={{ mt: 1, textTransform: "none", fontWeight: 600 }}
          >
            Thêm cặp
          </Button>
        </Box>

        <TextField
          label="Giải thích (tuỳ chọn)"
          size="small"
          fullWidth
          multiline
          minRows={2}
          value={question.explanation ?? ""}
          onChange={(e) => onChange({ ...question, explanation: e.target.value })}
          sx={muTextFieldSx}
        />
      </Box>
    </Box>
  );
}

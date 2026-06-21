import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import CallMergeIcon from "@mui/icons-material/CallMerge";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ReorderIcon from "@mui/icons-material/Reorder";
import {
  Box,
  Button,
  IconButton,
  TextField,
  Tooltip,
  Typography,
  Alert,
} from "@mui/material";
import { muTextFieldSx } from "../../../pages/admin/manageUserUiStyles";
import {
  MAX_REORDER_TOKENS,
  MIN_REORDER_TOKENS,
  mergeTokensAt,
  rebuildTokensFromTexts,
  splitTokenAt,
  suggestTokensFromSentence,
  syncCorrectOrder,
  tokensMatchSourceSentence,
} from "../../../shared/lesson/reorderSentenceUtils";
import type { ReorderSentenceQuestion } from "../../../student/lessonPlayer/exercise/types";

type ReorderSentenceQuestionCanvasProps = {
  question: ReorderSentenceQuestion;
  index: number;
  canDelete: boolean;
  onChange: (next: ReorderSentenceQuestion) => void;
  onDelete: () => void;
  onDuplicate: () => void;
};

export function ReorderSentenceQuestionCanvas({
  question,
  index,
  canDelete,
  onChange,
  onDelete,
  onDuplicate,
}: ReorderSentenceQuestionCanvasProps) {
  const updateTokens = (tokens: ReorderSentenceQuestion["tokens"]) => {
    onChange({
      ...question,
      tokens,
      correctOrder: syncCorrectOrder(tokens),
    });
  };

  const updateTokenText = (tokenIndex: number, text: string) => {
    const next = question.tokens.map((token, i) => (i === tokenIndex ? { ...token, text } : token));
    updateTokens(next);
  };

  const moveToken = (from: number, to: number) => {
    if (to < 0 || to >= question.tokens.length) return;
    const next = [...question.tokens];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    updateTokens(next);
  };

  const removeToken = (tokenIndex: number) => {
    if (question.tokens.length <= MIN_REORDER_TOKENS) return;
    updateTokens(question.tokens.filter((_, i) => i !== tokenIndex));
  };

  const addToken = () => {
    if (question.tokens.length >= MAX_REORDER_TOKENS) return;
    const texts = [...question.tokens.map((t) => t.text), ""];
    updateTokens(rebuildTokensFromTexts(texts));
  };

  const applySuggestFromSentence = () => {
    const sentence = question.sourceSentence?.trim();
    if (!sentence) return;
    updateTokens(suggestTokensFromSentence(sentence));
  };

  const sourceSentence = question.sourceSentence?.trim() ?? "";
  const tokensAligned =
    !sourceSentence || tokensMatchSourceSentence(question.tokens, sourceSentence);

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
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              px: 1,
              py: 0.25,
              borderRadius: "4px",
              bgcolor: "rgba(12, 68, 124, 0.1)",
              color: "#0C447C",
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            Q{index + 1}
          </Box>
          <ReorderIcon sx={{ fontSize: 18, color: "#0C447C" }} />
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#0C447C" }}>
            Sắp xếp câu (REORDER_SENTENCE)
          </Typography>
        </Box>
        <Box>
          <Tooltip title="Nhân đôi">
            <IconButton size="small" onClick={onDuplicate}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {canDelete ? (
            <Tooltip title="Xóa câu">
              <IconButton size="small" color="error" onClick={onDelete}>
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : null}
        </Box>
      </Box>

      <Box sx={{ p: 2, display: "grid", gap: 2 }}>
        <TextField
          label="Hướng dẫn cho học sinh"
          value={question.prompt?.text ?? ""}
          onChange={(e) =>
            onChange({
              ...question,
              prompt: { text: e.target.value, lang: question.prompt?.lang ?? "vi" },
            })
          }
          size="small"
          fullWidth
          sx={muTextFieldSx}
        />

        <TextField
          label="Câu đúng (gốc)"
          value={question.sourceSentence ?? ""}
          onChange={(e) => onChange({ ...question, sourceSentence: e.target.value })}
          size="small"
          fullWidth
          placeholder="Teenagers should respect their parents."
          sx={muTextFieldSx}
          helperText="Câu hoàn chỉnh — bấm &quot;Tách theo câu gốc&quot; để tạo các mảnh"
        />

        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button
            size="small"
            variant="outlined"
            disabled={!sourceSentence}
            onClick={applySuggestFromSentence}
            sx={{ textTransform: "none" }}
          >
            Tách theo câu gốc
          </Button>
        </Box>

        {!tokensAligned ? (
          <Alert severity="warning" sx={{ fontSize: 12 }}>
            Thứ tự mảnh hiện <strong>không khớp</strong> câu gốc — bấm &quot;Tách theo câu gốc&quot;
            để đồng bộ lại.
          </Alert>
        ) : null}

        <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#0C447C" }}>
          Các mảnh — thứ tự danh sách = đáp án đúng
        </Typography>
        <Typography sx={{ fontSize: 11, color: "#5F5E5A", mt: -1 }}>
          Học sinh thấy các mảnh <strong>xáo trộn</strong> khi làm bài (theo cài đặt shuffle). Ở
          đây bạn chỉ sắp thứ tự <strong>đúng</strong>.
        </Typography>

        {question.tokens.map((token, tokenIndex) => (
          <Box
            key={token.id}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              flexWrap: "wrap",
            }}
          >
            <TextField
              label={`Mảnh ${tokenIndex + 1}`}
              value={token.text}
              onChange={(e) => updateTokenText(tokenIndex, e.target.value)}
              size="small"
              sx={{ ...muTextFieldSx, flex: 1, minWidth: 160 }}
            />
            <Tooltip title="Lên">
              <span>
                <IconButton
                  size="small"
                  disabled={tokenIndex === 0}
                  onClick={() => moveToken(tokenIndex, tokenIndex - 1)}
                >
                  <ArrowUpwardIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Xuống">
              <span>
                <IconButton
                  size="small"
                  disabled={tokenIndex >= question.tokens.length - 1}
                  onClick={() => moveToken(tokenIndex, tokenIndex + 1)}
                >
                  <ArrowDownwardIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            {tokenIndex < question.tokens.length - 1 ? (
              <Tooltip title="Gộp với mảnh dưới">
                <IconButton
                  size="small"
                  onClick={() => updateTokens(mergeTokensAt(question.tokens, tokenIndex))}
                >
                  <CallMergeIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : null}
            <Tooltip title="Tách theo khoảng trắng">
              <Button
                size="small"
                variant="text"
                onClick={() => updateTokens(splitTokenAt(question.tokens, tokenIndex))}
                sx={{ textTransform: "none", minWidth: 0, px: 1 }}
              >
                Tách
              </Button>
            </Tooltip>
            <Tooltip title="Xóa mảnh">
              <span>
                <IconButton
                  size="small"
                  color="error"
                  disabled={question.tokens.length <= MIN_REORDER_TOKENS}
                  onClick={() => removeToken(tokenIndex)}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        ))}

        <Button
          size="small"
          variant="outlined"
          disabled={question.tokens.length >= MAX_REORDER_TOKENS}
          onClick={addToken}
          sx={{ justifySelf: "start", textTransform: "none" }}
        >
          Thêm mảnh
        </Button>

        <TextField
          label="Giải thích (tuỳ chọn)"
          value={question.explanation ?? ""}
          onChange={(e) => onChange({ ...question, explanation: e.target.value })}
          size="small"
          fullWidth
          multiline
          minRows={2}
          sx={muTextFieldSx}
        />
      </Box>
    </Box>
  );
}

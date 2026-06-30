import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import CloseIcon from "@mui/icons-material/Close";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { apiGetQuestionById, type QuestionRecord } from "../../../shared/api/question";
import type { ApiResponse } from "../../../shared/api/types";
import {
  difficultyStars,
  questionTypeLabel,
  skillLabel,
  statusLabel,
} from "../../../shared/constants/questionBank";
import { formatRelativeTime } from "../../../shared/ai/aiChatUtils";
import {
  displayQuestionTitle,
  questionRecordToExerciseQuestion,
} from "../../../shared/lesson/questionBankUtils";
import type { ExerciseQuestion } from "../../../student/lessonPlayer/exercise/types";
import { muBtnSmOutlined, muBtnSmPrimary } from "../../../pages/admin/manageUserUiStyles";

type QuestionBankPreviewDrawerProps = {
  questionId: string | null;
  refreshToken?: number;
  onClose: () => void;
  onEdit: (record: QuestionRecord) => void;
  onExplain?: (record: QuestionRecord) => void;
};

function PreviewAnswerSection({ question }: { question: ExerciseQuestion }) {
  if (question.type === "MULTIPLE_CHOICE") {
    const correct = question.choices.find((c) => c.id === question.correctChoiceId);
    return (
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 700 }}>
          Đáp án đúng
        </Typography>
        <Typography variant="body2">{correct ? `${correct.id}. ${correct.text}` : "—"}</Typography>
        <List dense sx={{ mt: 1 }}>
          {question.choices.map((c) => (
            <ListItem key={c.id} disablePadding sx={{ py: 0.25 }}>
              <ListItemText
                primary={`${c.id}. ${c.text}`}
                primaryTypographyProps={{
                  variant: "body2",
                  color: c.id === question.correctChoiceId ? "success.main" : "text.primary",
                  fontWeight: c.id === question.correctChoiceId ? 700 : 400,
                }}
              />
            </ListItem>
          ))}
        </List>
      </Box>
    );
  }

  if (question.type === "TRUE_FALSE") {
    return (
      <Typography variant="body2">
        Đáp án đúng: <strong>{question.correctAnswer ? "Đúng" : "Sai"}</strong>
      </Typography>
    );
  }

  if (question.type === "FILL_BLANK") {
    return (
      <List dense>
        {question.blanks.map((blank, index) => (
          <ListItem key={blank.id} disablePadding sx={{ py: 0.25 }}>
            <ListItemText
              primary={`Blank ${index + 1}: ${blank.acceptedAnswers.join(" / ")}`}
              primaryTypographyProps={{ variant: "body2" }}
            />
          </ListItem>
        ))}
      </List>
    );
  }

  return (
    <Typography variant="body2" color="text.secondary">
      Preview cho loại này sẽ bổ sung sau.
    </Typography>
  );
}

const EXPLAIN_TYPES = new Set(["MULTIPLE_CHOICE", "TRUE_FALSE", "FILL_BLANK"]);

export function QuestionBankPreviewDrawer({
  questionId,
  refreshToken = 0,
  onClose,
  onEdit,
  onExplain,
}: QuestionBankPreviewDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [record, setRecord] = useState<QuestionRecord | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!questionId) {
      setRecord(null);
      setError("");
      return;
    }
    setLoading(true);
    setError("");
    void apiGetQuestionById(questionId)
      .then((res) => {
        const detail = (res as ApiResponse<QuestionRecord>).result ?? (res as ApiResponse<QuestionRecord>).data;
        setRecord(detail ?? null);
      })
      .catch(() => {
        setError("Không thể tải chi tiết câu hỏi.");
        setRecord(null);
      })
      .finally(() => setLoading(false));
  }, [questionId, refreshToken]);

  const exercise = record ? questionRecordToExerciseQuestion(record) : null;

  return (
    <Drawer anchor="right" open={Boolean(questionId)} onClose={onClose} PaperProps={{ sx: { width: { xs: "100%", sm: 480 } } }}>
      <Box sx={{ p: 2, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
            Preview
          </Typography>
          {record ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {displayQuestionTitle(record)}
            </Typography>
          ) : null}
        </Box>
        <IconButton size="small" onClick={onClose} aria-label="Đóng">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Divider />

      <Box sx={{ p: 2, display: "grid", gap: 2, overflow: "auto" }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : null}

        {error ? (
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        ) : null}

        {record && exercise ? (
          <>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
              <Chip size="small" label={questionTypeLabel(record.questionType)} variant="outlined" />
              {record.cefrLevel ? <Chip size="small" label={record.cefrLevel} /> : null}
              {record.skill ? <Chip size="small" label={skillLabel(record.skill)} /> : null}
              {record.topic ? <Chip size="small" label={record.topic} variant="outlined" /> : null}
              <Chip size="small" label={statusLabel(record.status)} />
              {record.isAIGenerated ? (
                <Chip
                  size="small"
                  icon={<AutoAwesomeOutlinedIcon />}
                  label="AI"
                  color="secondary"
                  variant="outlined"
                />
              ) : null}
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 700 }}>
                Câu hỏi
              </Typography>
              <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                {record.promptText}
              </Typography>
            </Box>

            <PreviewAnswerSection question={exercise} />

            {record.explanation ? (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 700 }}>
                  Giải thích
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                  {record.explanation}
                </Typography>
              </Box>
            ) : null}

            <Divider />

            <Box sx={{ display: "grid", gap: 0.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Metadata
              </Typography>
              <Typography variant="body2" className="qb-muted">
                Độ khó: {difficultyStars(record.difficulty)}
              </Typography>
              <Typography variant="body2" className="qb-muted">
                Danh mục: {record.categoryName ?? "—"}
              </Typography>
              <Typography variant="body2" className="qb-muted">
                Nguồn: {record.source ?? "MANUAL"}
              </Typography>
              <Typography variant="body2" className="qb-muted">
                Tạo: {formatRelativeTime(record.createdAt)} · Cập nhật: {formatRelativeTime(record.updatedAt)}
              </Typography>
              {(record.tags ?? []).length > 0 ? (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
                  {record.tags!.map((tag) => (
                    <Chip key={tag} size="small" label={tag} variant="outlined" />
                  ))}
                </Box>
              ) : null}
            </Box>

            <Box sx={{ display: "grid", gap: 0.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Thống kê
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Usage / Correct rate — Phase 4
              </Typography>
            </Box>
          </>
        ) : null}
      </Box>

      {record ? (
        <Box
          sx={{
            p: 2,
            mt: "auto",
            borderTop: "1px solid",
            borderColor: "divider",
            display: "grid",
            gap: 1,
          }}
        >
          {onExplain && EXPLAIN_TYPES.has(record.questionType) ? (
            <Button
              sx={muBtnSmOutlined}
              fullWidth
              startIcon={<AutoAwesomeOutlinedIcon />}
              onClick={() => onExplain(record)}
            >
              AI giải thích (VI)
            </Button>
          ) : null}
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button sx={muBtnSmOutlined} fullWidth onClick={onClose}>
              Đóng
            </Button>
            <Button
              variant="contained"
              sx={muBtnSmPrimary}
              fullWidth
              startIcon={<EditOutlinedIcon />}
              onClick={() => onEdit(record)}
            >
              Sửa
            </Button>
          </Box>
        </Box>
      ) : null}
    </Drawer>
  );
}

import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import CloseIcon from "@mui/icons-material/Close";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import TranslateIcon from "@mui/icons-material/Translate";
import LinkIcon from "@mui/icons-material/Link";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import PsychologyOutlinedIcon from "@mui/icons-material/PsychologyOutlined";
import FingerprintIcon from "@mui/icons-material/Fingerprint";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import CheckIcon from "@mui/icons-material/Check";

import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { apiGetQuestionById, type QuestionRecord } from "../../../shared/api/question";
import type { ApiResponse } from "../../../shared/api/types";
import {
  questionTypeLabel,
  skillLabel,
  statusLabel,
} from "../../../shared/constants/questionBank";
import { formatRelativeTime } from "../../../shared/ai/aiChatUtils";
import {
  questionRecordToExerciseQuestion,
} from "../../../shared/lesson/questionBankUtils";
import type { ExerciseQuestion } from "../../../student/lessonPlayer/exercise/types";
import { QuestionBankAiActionsMenu } from "./QuestionBankAiActionsMenu";
import type { QuestionBankAiAction } from "../../../shared/api/questionAi";

type QuestionBankPreviewDrawerProps = {
  questionId: string | null;
  refreshToken?: number;
  onClose: () => void;
  onEdit: (record: QuestionRecord) => void;
  onExplain?: (record: QuestionRecord) => void;
  onAiAction?: (record: QuestionRecord, action: QuestionBankAiAction) => void;
};

function PreviewAnswerSection({ question }: { question: ExerciseQuestion }) {
  if (question.type === "MULTIPLE_CHOICE") {
    return (
      <Box sx={{ display: "grid", gap: 1, mt: 1.5 }}>
        {question.choices.map((c) => {
          const isCorrect = c.id === question.correctChoiceId;
          return (
            <Box
              key={c.id}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                p: 1.5,
                borderRadius: "8px",
                border: "1px solid",
                borderColor: isCorrect ? "#DCFCE7" : "#E2E8F0",
                backgroundColor: isCorrect ? "#F0FDF4" : "#FFFFFF",
                color: isCorrect ? "#15803D" : "#475569",
                fontWeight: isCorrect ? 600 : 400,
                fontSize: "0.875rem",
              }}
            >
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  backgroundColor: isCorrect ? "#22C55E" : "#F1F5F9",
                  color: isCorrect ? "#FFFFFF" : "#64748B",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  flexShrink: 0,
                }}
              >
                {isCorrect ? <CheckIcon sx={{ fontSize: 14 }} /> : c.id}
              </Box>
              <Box>{c.text}</Box>
            </Box>
          );
        })}
      </Box>
    );
  }

  if (question.type === "TRUE_FALSE") {
    return (
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5, mt: 1.5 }}>
        {["TRUE", "FALSE"].map((val) => {
          const isCorrect = (val === "TRUE" && question.correctAnswer) || (val === "FALSE" && !question.correctAnswer);
          const label = val === "TRUE" ? "Đúng" : "Sai";
          return (
            <Box
              key={val}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
                p: 1.5,
                borderRadius: "8px",
                border: "1px solid",
                borderColor: isCorrect ? "#DCFCE7" : "#E2E8F0",
                backgroundColor: isCorrect ? "#F0FDF4" : "#FFFFFF",
                color: isCorrect ? "#15803D" : "#475569",
                fontWeight: isCorrect ? 600 : 400,
                fontSize: "0.875rem",
              }}
            >
              {isCorrect && <CheckIcon sx={{ fontSize: 16 }} />}
              {label}
            </Box>
          );
        })}
      </Box>
    );
  }

  if (question.type === "FILL_BLANK") {
    return (
      <Box sx={{ display: "grid", gap: 1, mt: 1.5 }}>
        {question.blanks.map((blank, index) => (
          <Box
            key={blank.id}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              fontSize: "0.9rem",
              color: "#475569",
            }}
          >
            <Typography variant="body2" sx={{ color: "#64748B" }}>
              Blank {index + 1}:
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 700,
                color: "#6366F1",
                backgroundColor: "#EEF2FF",
                px: 1.5,
                py: 0.5,
                borderRadius: "6px",
              }}
            >
              {blank.acceptedAnswers.join(" / ")}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <Typography variant="body2" color="text.secondary">
      Preview cho loại này sẽ bổ sung sau.
    </Typography>
  );
}

function MetadataItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
      <Box sx={{ display: "flex", alignItems: "center", mt: 0.25 }}>{icon}</Box>
      <Box>
        <Typography variant="body2" sx={{ color: "#64748B", fontSize: "0.75rem" }}>
          {label}
        </Typography>
        {typeof value === "string" ? (
          <Typography variant="body2" sx={{ color: "#334155", fontWeight: 600, fontSize: "0.875rem" }}>
            {value}
          </Typography>
        ) : (
          value
        )}
      </Box>
    </Box>
  );
}

const EXPLAIN_TYPES = new Set(["MULTIPLE_CHOICE", "TRUE_FALSE", "FILL_BLANK"]);

export function QuestionBankPreviewDrawer({
  questionId,
  refreshToken = 0,
  onClose,
  onEdit,
  onExplain,
  onAiAction,
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
    <Drawer
      anchor="right"
      open={Boolean(questionId)}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 580 },
          display: "flex",
          flexDirection: "column",
          height: "100%",
        },
      }}
    >
      {/* Header */}
      <Box sx={{ p: 3, pb: 2, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#1E293B" }}>
            Preview
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748B", mt: 0.5 }}>
            Xem trước câu hỏi và đáp án chi tiết
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} aria-label="Đóng" sx={{ mt: 0.5 }}>
          <CloseIcon fontSize="medium" sx={{ color: "#64748B" }} />
        </IconButton>
      </Box>

      <Divider />

      {/* Content Container */}
      <Box sx={{ px: 3, py: 3, display: "grid", gap: 3, overflowY: "auto", flex: 1 }}>
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
            {/* Chips Row */}
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              <Chip
                size="small"
                label={questionTypeLabel(record.questionType)}
                sx={{
                  backgroundColor: "#EEF2FF",
                  color: "#4F46E5",
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  border: "none",
                  height: 26,
                  px: 0.5,
                }}
              />
              {record.cefrLevel ? (
                <Chip
                  size="small"
                  label={record.cefrLevel}
                  sx={{
                    backgroundColor: "#F1F5F9",
                    color: "#475569",
                    fontWeight: 500,
                    fontSize: "0.75rem",
                    border: "none",
                    height: 26,
                    px: 0.5,
                  }}
                />
              ) : null}
              {record.skill ? (
                <Chip
                  size="small"
                  label={skillLabel(record.skill)}
                  sx={{
                    backgroundColor: "#F1F5F9",
                    color: "#475569",
                    fontWeight: 500,
                    fontSize: "0.75rem",
                    border: "none",
                    height: 26,
                    px: 0.5,
                  }}
                />
              ) : null}
              {record.topic ? (
                <Chip
                  size="small"
                  label={record.topic}
                  sx={{
                    backgroundColor: "#F1F5F9",
                    color: "#475569",
                    fontWeight: 500,
                    fontSize: "0.75rem",
                    border: "none",
                    height: 26,
                    px: 0.5,
                  }}
                />
              ) : null}
              <Chip
                size="small"
                label={statusLabel(record.status)}
                sx={{
                  backgroundColor: "#F1F5F9",
                  color: "#475569",
                  fontWeight: 500,
                  fontSize: "0.75rem",
                  border: "none",
                  height: 26,
                  px: 0.5,
                }}
              />
              {record.isAIGenerated ? (
                <Chip
                  size="small"
                  icon={<AutoAwesomeOutlinedIcon sx={{ "&&": { color: "#8B5CF6", fontSize: 13 } }} />}
                  label="AI"
                  sx={{
                    backgroundColor: "#FAF5FF",
                    color: "#8B5CF6",
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    border: "1px solid #E9D5FF",
                    height: 26,
                    px: 0.5,
                  }}
                />
              ) : null}
            </Box>

            {/* Question Card */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1E293B", fontSize: "0.95rem", mb: 1 }}>
                Câu hỏi
              </Typography>
              <Box
                sx={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: "12px",
                  p: 2.5,
                  boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    whiteSpace: "pre-wrap",
                    fontWeight: 500,
                    color: "#0F172A",
                    lineHeight: 1.6,
                    fontSize: "0.95rem",
                  }}
                >
                  {record.promptText}
                </Typography>
                <PreviewAnswerSection question={exercise} />
              </Box>
            </Box>

            {/* Explanation Section */}
            {record.explanation ? (
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <VerifiedOutlinedIcon sx={{ color: "#22C55E", fontSize: 18 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1E293B", fontSize: "0.95rem" }}>
                      Giải thích <span style={{ fontWeight: 400, color: "#64748B", fontSize: "0.8rem" }}>(do giáo viên cung cấp)</span>
                    </Typography>
                  </Box>
                  <Button
                    startIcon={<EditOutlinedIcon sx={{ fontSize: 14 }} />}
                    onClick={() => onEdit(record)}
                    sx={{
                      textTransform: "none",
                      color: "#22C55E",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      p: 0,
                      minWidth: 0,
                      "&:hover": {
                        backgroundColor: "transparent",
                        color: "#16A34A",
                      },
                    }}
                  >
                    Chỉnh sửa
                  </Button>
                </Box>
                <Box
                  sx={{
                    backgroundColor: "#F0FDF4",
                    border: "1px solid #DCFCE7",
                    borderRadius: "12px",
                    p: 2.5,
                  }}
                >
                  <Typography variant="body2" sx={{ color: "#374151", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                    {record.explanation}
                  </Typography>
                </Box>
              </Box>
            ) : null}

            {/* Metadata Card */}
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                <InfoOutlinedIcon sx={{ color: "#6366F1", fontSize: 18 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1E293B", fontSize: "0.95rem" }}>
                  Metadata
                </Typography>
              </Box>
              <Box
                sx={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: "12px",
                  p: 2.5,
                  boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                }}
              >
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2.5 }}>
                  {/* Left Column */}
                  <Box sx={{ display: "grid", gap: 2 }}>
                    <MetadataItem
                      icon={<StarIcon sx={{ color: "#F59E0B", fontSize: 16 }} />}
                      label="Độ khó"
                      value={
                        <Box sx={{ display: "flex", color: "#F59E0B", mt: 0.25 }}>
                          {Array.from({ length: 5 }).map((_, i) => {
                            const starValue = i + 1;
                            return starValue <= (record.difficulty ?? 3) ? (
                              <StarIcon key={i} sx={{ fontSize: 15 }} />
                            ) : (
                              <StarBorderIcon key={i} sx={{ fontSize: 15, color: "#CBD5E1" }} />
                            );
                          })}
                        </Box>
                      }
                    />
                    <MetadataItem
                      icon={<FolderOutlinedIcon sx={{ color: "#64748B", fontSize: 16 }} />}
                      label="Danh mục"
                      value={record.categoryName ?? "—"}
                    />
                    <MetadataItem
                      icon={<LinkIcon sx={{ color: "#64748B", fontSize: 16 }} />}
                      label="Nguồn"
                      value={record.source ?? "MANUAL"}
                    />
                    <MetadataItem
                      icon={<AccessTimeIcon sx={{ color: "#64748B", fontSize: 16 }} />}
                      label="Tạo"
                      value={formatRelativeTime(record.createdAt)}
                    />
                  </Box>

                  {/* Right Column */}
                  <Box sx={{ display: "grid", gap: 2 }}>
                    <MetadataItem
                      icon={<TranslateIcon sx={{ color: "#64748B", fontSize: 16 }} />}
                      label="CEFR"
                      value={record.cefrLevel ?? "—"}
                    />
                    <MetadataItem
                      icon={<PsychologyOutlinedIcon sx={{ color: "#64748B", fontSize: 16 }} />}
                      label="Kỹ năng"
                      value={skillLabel(record.skill) ?? "—"}
                    />
                    <MetadataItem
                      icon={<FingerprintIcon sx={{ color: "#64748B", fontSize: 16 }} />}
                      label="ID"
                      value={record.id}
                    />
                    <MetadataItem
                      icon={<AccessTimeIcon sx={{ color: "#64748B", fontSize: 16 }} />}
                      label="Cập nhật"
                      value={formatRelativeTime(record.updatedAt)}
                    />
                  </Box>
                </Box>

                {(record.tags ?? []).length > 0 ? (
                  <Box sx={{ mt: 2, pt: 2, borderTop: "1px dashed #E2E8F0" }}>
                    <MetadataItem
                      icon={<LocalOfferOutlinedIcon sx={{ color: "#64748B", fontSize: 16 }} />}
                      label="Tags"
                      value={
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 0.5 }}>
                          {record.tags!.map((tag) => (
                            <Chip
                              key={tag}
                              size="small"
                              label={tag}
                              variant="outlined"
                              sx={{
                                height: 20,
                                fontSize: "0.725rem",
                                color: "#475569",
                                borderColor: "#E2E8F0",
                                backgroundColor: "#F8FAFC",
                              }}
                            />
                          ))}
                        </Box>
                      }
                    />
                  </Box>
                ) : null}
              </Box>
            </Box>

            {/* AI Assistant Card */}
            {onExplain && EXPLAIN_TYPES.has(record.questionType) ? (
              <Box
                sx={{
                  background: "#FAF5FF",
                  border: "1px solid #F3E8FF",
                  borderRadius: "12px",
                  p: 2.5,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                  <AutoAwesomeOutlinedIcon sx={{ color: "#8B5CF6", fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1E293B" }}>
                    AI hỗ trợ
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: "#64748B", mb: 2 }}>
                  AI có thể giúp bạn hiểu sâu hơn về câu hỏi này.
                </Typography>

                <Button
                  variant="contained"
                  onClick={() => onExplain(record)}
                  fullWidth
                  sx={{
                    background: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)",
                    color: "#FFFFFF",
                    borderRadius: "10px",
                    py: 1.25,
                    px: 2,
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    boxShadow: "none",
                    "&:hover": {
                      background: "linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)",
                      boxShadow: "none",
                    },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <AutoAwesomeOutlinedIcon sx={{ fontSize: 16 }} />
                    <span>AI giải thích chi tiết</span>
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{
                      backgroundColor: "rgba(255, 255, 255, 0.15)",
                      color: "#E9D5FF",
                      px: 1,
                      py: 0.25,
                      borderRadius: "4px",
                      fontSize: "0.75rem",
                      fontWeight: 400,
                    }}
                  >
                    Mất ~5 giây
                  </Typography>
                </Button>

                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.75, mt: 1.5 }}>
                  <LockOutlinedIcon sx={{ color: "#94A3B8", fontSize: 14, mt: 0.25 }} />
                  <Typography variant="caption" sx={{ color: "#94A3B8", lineHeight: 1.4 }}>
                    Nội dung AI được tạo ra có thể chưa chính xác. Vui lòng kiểm tra trước khi sử dụng.
                  </Typography>
                </Box>
              </Box>
            ) : null}
          </>
        ) : null}
      </Box>

      {/* Drawer Footer */}
      {record ? (
        <Box
          sx={{
            p: 3,
            borderTop: "1px solid",
            borderColor: "#E2E8F0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2,
            backgroundColor: "#FFFFFF",
          }}
        >
          <Button
            variant="outlined"
            onClick={onClose}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.875rem",
              color: "#475569",
              borderColor: "#E2E8F0",
              borderRadius: "8px",
              px: 3,
              py: 1,
              "&:hover": {
                borderColor: "#CBD5E1",
                backgroundColor: "#F8FAFC",
              },
            }}
          >
            Đóng
          </Button>

          <Box sx={{ display: "flex", gap: 1.5, flex: 1, justifyContent: "flex-end" }}>
            {onAiAction ? (
              <QuestionBankAiActionsMenu
                record={record}
                onAction={onAiAction}
                variant="button"
              />
            ) : null}
            <Button
              variant="contained"
              startIcon={<EditOutlinedIcon sx={{ fontSize: 16 }} />}
              onClick={() => onEdit(record)}
              sx={{
                background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
                color: "#FFFFFF",
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.875rem",
                borderRadius: "8px",
                px: 4,
                py: 1,
                boxShadow: "none",
                "&:hover": {
                  background: "linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)",
                  boxShadow: "none",
                },
              }}
            >
              Sửa
            </Button>
          </Box>
        </Box>
      ) : null}
    </Drawer>
  );
}

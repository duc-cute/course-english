import { Box, Chip, MenuItem, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import type { QuestionCategoryRecord, QuestionType } from "../../../shared/api/question";
import { apiGetQuestionCategories } from "../../../shared/api/question";
import {
  QUESTION_BANK_EDITABLE_TYPES,
  type QuestionFormMeta,
} from "../../../shared/lesson/questionBankUtils";
import { createEmptyMcqQuestion } from "../../../shared/lesson/exercisePayload";
import type { ExerciseQuestion } from "../../../student/lessonPlayer/exercise/types";
import {
  QUESTION_CEFR_OPTIONS,
  QUESTION_SKILLS,
  QUESTION_TYPE_FILTER_OPTIONS,
} from "../../../shared/constants/questionBank";
import { muFieldLabel, muTextFieldSx } from "../../../pages/admin/manageUserUiStyles";
import { FillBlankQuestionCanvas } from "../exercise/FillBlankQuestionCanvas";
import { McqQuestionCanvas } from "../exercise/McqQuestionCanvas";
import { TrueFalseQuestionCanvas } from "../exercise/TrueFalseQuestionCanvas";

type QuestionBankFormProps = {
  questionType: QuestionType;
  question: ExerciseQuestion;
  meta: QuestionFormMeta;
  isEditing: boolean;
  onQuestionTypeChange: (type: QuestionType) => void;
  onQuestionChange: (next: ExerciseQuestion) => void;
  onMetaChange: (patch: Partial<QuestionFormMeta>) => void;
};

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Nháp" },
  { value: "PUBLISHED", label: "Đã publish" },
  { value: "ARCHIVED", label: "Lưu trữ" },
];

const EDITABLE_TYPE_OPTIONS = QUESTION_TYPE_FILTER_OPTIONS.filter((o) =>
  o.value ? QUESTION_BANK_EDITABLE_TYPES.includes(o.value) : false,
);

export function QuestionBankForm({
  questionType,
  question,
  meta,
  isEditing,
  onQuestionTypeChange,
  onQuestionChange,
  onMetaChange,
}: QuestionBankFormProps) {
  const [categories, setCategories] = useState<QuestionCategoryRecord[]>([]);

  useEffect(() => {
    void apiGetQuestionCategories().then((res) => {
      const list = (res as { result?: QuestionCategoryRecord[] }).result ?? res.data ?? [];
      setCategories(Array.isArray(list) ? list : []);
    });
  }, []);

  return (
    <Box sx={{ display: "grid", gap: 1.5 }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          gap: 1,
        }}
      >
        <Box>
          <Typography sx={muFieldLabel}>Loại câu</Typography>
          <TextField
            select
            size="small"
            fullWidth
            sx={muTextFieldSx}
            value={questionType}
            disabled={isEditing}
            onChange={(e) => onQuestionTypeChange(e.target.value as QuestionType)}
          >
            {EDITABLE_TYPE_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>
        </Box>
        <Box>
          <Typography sx={muFieldLabel}>Tiêu đề (tuỳ chọn)</Typography>
          <TextField
            size="small"
            fullWidth
            sx={muTextFieldSx}
            placeholder="Rút gọn — để trống sẽ lấy từ nội dung câu"
            value={meta.title ?? ""}
            onChange={(e) => onMetaChange({ title: e.target.value })}
          />
        </Box>
        <Box>
          <Typography sx={muFieldLabel}>Danh mục</Typography>
          <TextField
            select
            size="small"
            fullWidth
            sx={muTextFieldSx}
            value={meta.categoryId ?? ""}
            onChange={(e) => onMetaChange({ categoryId: e.target.value })}
          >
            <MenuItem value="">— Chưa phân loại —</MenuItem>
            {categories.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name}
              </MenuItem>
            ))}
          </TextField>
        </Box>
        <Box>
          <Typography sx={muFieldLabel}>Trạng thái</Typography>
          <TextField
            select
            size="small"
            fullWidth
            sx={muTextFieldSx}
            value={meta.status ?? "DRAFT"}
            onChange={(e) => onMetaChange({ status: e.target.value as QuestionFormMeta["status"] })}
          >
            {STATUS_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>
        </Box>
        <Box>
          <Typography sx={muFieldLabel}>CEFR</Typography>
          <TextField
            select
            size="small"
            fullWidth
            sx={muTextFieldSx}
            value={meta.cefrLevel ?? ""}
            onChange={(e) => onMetaChange({ cefrLevel: e.target.value || undefined })}
          >
            {QUESTION_CEFR_OPTIONS.filter((o) => o.value !== "").map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
            <MenuItem value="">— Chưa gán —</MenuItem>
          </TextField>
        </Box>
        <Box>
          <Typography sx={muFieldLabel}>Kỹ năng</Typography>
          <TextField
            select
            size="small"
            fullWidth
            sx={muTextFieldSx}
            value={meta.skill ?? ""}
            onChange={(e) => onMetaChange({ skill: e.target.value || undefined })}
          >
            {QUESTION_SKILLS.filter((o) => o.value !== "").map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
            <MenuItem value="">— Chưa gán —</MenuItem>
          </TextField>
        </Box>
        <Box>
          <Typography sx={muFieldLabel}>Chủ đề</Typography>
          <TextField
            size="small"
            fullWidth
            sx={muTextFieldSx}
            placeholder="Animals, Travel, …"
            value={meta.topic ?? ""}
            onChange={(e) => onMetaChange({ topic: e.target.value })}
          />
        </Box>
        <Box>
          <Typography sx={muFieldLabel}>Độ khó (1–5)</Typography>
          <TextField
            select
            size="small"
            fullWidth
            sx={muTextFieldSx}
            value={meta.difficulty ? String(meta.difficulty) : ""}
            onChange={(e) =>
              onMetaChange({ difficulty: e.target.value ? Number(e.target.value) : undefined })
            }
          >
            <MenuItem value="">— Chưa gán —</MenuItem>
            {[1, 2, 3, 4, 5].map((n) => (
              <MenuItem key={n} value={String(n)}>
                {n}
              </MenuItem>
            ))}
          </TextField>
        </Box>
        <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
          <Typography sx={muFieldLabel}>Tags (phân cách bằng dấu phẩy)</Typography>
          <TextField
            size="small"
            fullWidth
            sx={muTextFieldSx}
            placeholder="grade-6, unit-3"
            value={(meta.tags ?? []).join(", ")}
            onChange={(e) =>
              onMetaChange({
                tags: e.target.value
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean),
              })
            }
          />
        </Box>
      </Box>

      {meta.aiGenerated ? (
        <Chip size="small" color="secondary" label="AI Generated" variant="outlined" sx={{ width: "fit-content" }} />
      ) : null}

      {questionType === "MULTIPLE_CHOICE" && question.type === "MULTIPLE_CHOICE" ? (
        <McqQuestionCanvas
          question={question}
          index={0}
          canDelete={false}
          onChange={onQuestionChange}
          onDelete={() => undefined}
          onDuplicate={() => onQuestionChange({ ...createEmptyMcqQuestion(), prompt: question.prompt })}
        />
      ) : null}

      {questionType === "TRUE_FALSE" && question.type === "TRUE_FALSE" ? (
        <TrueFalseQuestionCanvas
          question={question}
          index={0}
          canDelete={false}
          onChange={onQuestionChange}
          onDelete={() => undefined}
          onDuplicate={() => onQuestionChange({ ...question, id: question.id })}
        />
      ) : null}

      {questionType === "FILL_BLANK" && question.type === "FILL_BLANK" ? (
        <FillBlankQuestionCanvas
          question={question}
          index={0}
          canDelete={false}
          onChange={onQuestionChange}
          onDelete={() => undefined}
          onDuplicate={() => onQuestionChange({ ...question, id: question.id })}
        />
      ) : null}
    </Box>
  );
}

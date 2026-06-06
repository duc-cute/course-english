import { Box, MenuItem, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import type { QuestionCategoryRecord, QuestionStatus } from "../../../shared/api/question";
import { apiGetQuestionCategories } from "../../../shared/api/question";
import { createEmptyMcqQuestion } from "../../../shared/lesson/exercisePayload";
import type { MultipleChoiceQuestion } from "../../../student/lessonPlayer/exercise/types";
import { muFieldLabel, muTextFieldSx } from "../../../pages/admin/manageUserUiStyles";
import { McqQuestionCanvas } from "../exercise/McqQuestionCanvas";

type QuestionBankFormProps = {
  mcq: MultipleChoiceQuestion;
  categoryId?: string;
  status: QuestionStatus;
  onMcqChange: (next: MultipleChoiceQuestion) => void;
  onCategoryChange: (categoryId: string) => void;
  onStatusChange: (status: QuestionStatus) => void;
};

const STATUS_OPTIONS: { value: QuestionStatus; label: string }[] = [
  { value: "DRAFT", label: "Nháp" },
  { value: "PUBLISHED", label: "Đã publish" },
  { value: "ARCHIVED", label: "Lưu trữ" },
];

export function QuestionBankForm({
  mcq,
  categoryId,
  status,
  onMcqChange,
  onCategoryChange,
  onStatusChange,
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
          <Typography sx={muFieldLabel}>Danh mục</Typography>
          <TextField
            select
            size="small"
            fullWidth
            sx={muTextFieldSx}
            value={categoryId ?? ""}
            onChange={(e) => onCategoryChange(e.target.value)}
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
            value={status}
            onChange={(e) => onStatusChange(e.target.value as QuestionStatus)}
          >
            {STATUS_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </Box>
      <McqQuestionCanvas
        question={mcq}
        index={0}
        canDelete={false}
        onChange={onMcqChange}
        onDelete={() => undefined}
        onDuplicate={() => onMcqChange({ ...createEmptyMcqQuestion(), prompt: mcq.prompt })}
      />
    </Box>
  );
}

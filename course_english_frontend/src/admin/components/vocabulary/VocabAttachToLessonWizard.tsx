import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import QuizOutlinedIcon from "@mui/icons-material/QuizOutlined";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import {
  muDialogFooter,
  muDialogPaper,
  muFooterBtnOutlined,
  muFooterBtnPrimary,
  muTextFieldSx,
} from "../../../pages/admin/manageUserUiStyles";
import { apiCreateLessonBlock } from "../../../shared/api/lesson";
import { buildExerciseSetPayloadJson } from "../../../shared/lesson/exercisePayload";
import {
  buildVocabularyPayloadJson,
  createDefaultVocabularyPayload,
} from "../../../shared/lesson/vocabularyPayload";
import { generateMcqFromVocabItems } from "../../../shared/lesson/vocabActivityGenerator";
import type { VocabularyItemRecord } from "../../../shared/api/vocabularySet";

type VocabAttachToLessonWizardProps = {
  open: boolean;
  lessonId: string;
  lessonTitle?: string;
  setId: string;
  setTitle: string;
  items: VocabularyItemRecord[];
  onClose: () => void;
  onAttached: () => void;
};

export function VocabAttachToLessonWizard({
  open,
  lessonId,
  lessonTitle,
  setId,
  setTitle,
  items,
  onClose,
  onAttached,
}: VocabAttachToLessonWizardProps) {
  const [includeVocabulary, setIncludeVocabulary] = useState(true);
  const [includeExercise, setIncludeExercise] = useState(true);
  const [vocabTitle, setVocabTitle] = useState("");
  const [exerciseTitle, setExerciseTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const mcqGeneration = useMemo(() => {
    if (!includeExercise) return { error: null as string | null, questionCount: 0 };
    try {
      const inputs = items.map((item) => ({
        id: item.id,
        wordEn: item.wordEn,
        meaningVi: item.meaningVi,
      }));
      const result = generateMcqFromVocabItems(inputs, {
        title: exerciseTitle.trim() || `${setTitle} — MCQ`,
        instruction: "Chọn nghĩa tiếng Việt đúng",
        shuffleOptions: true,
      });
      return {
        error: null,
        questionCount: result.payload.questions.length,
        payloadJson: buildExerciseSetPayloadJson(result.payload),
        warnings: result.warnings,
      };
    } catch (err) {
      return {
        error: (err as { message?: string })?.message ?? "Không thể sinh MCQ.",
        questionCount: 0,
        payloadJson: "",
        warnings: [] as string[],
      };
    }
  }, [includeExercise, items, setTitle, exerciseTitle]);

  const resolvedVocabTitle = vocabTitle.trim() || setTitle;
  const resolvedExerciseTitle = exerciseTitle.trim() || `${setTitle} — MCQ`;

  const handleAttach = async () => {
    if (!includeVocabulary && !includeExercise) {
      setError("Chọn ít nhất một loại khối.");
      return;
    }
    if (includeExercise && mcqGeneration.error) {
      setError(mcqGeneration.error);
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      if (includeVocabulary) {
        const payload = createDefaultVocabularyPayload(setId, setTitle);
        payload.title = resolvedVocabTitle;
        await apiCreateLessonBlock(lessonId, {
          blockType: "VOCABULARY",
          payloadJson: buildVocabularyPayloadJson(payload),
        });
      }
      if (includeExercise && mcqGeneration.payloadJson) {
        await apiCreateLessonBlock(lessonId, {
          blockType: "EXERCISE_SET",
          payloadJson: mcqGeneration.payloadJson,
        });
      }
      onAttached();
      onClose();
    } catch (err) {
      setError((err as { message?: string })?.message || "Không thể thêm khối vào bài học.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: muDialogPaper }}>
      <DialogTitle sx={{ fontWeight: 700, fontSize: 18 }}>Thêm bộ từ vào bài học</DialogTitle>
      <DialogContent sx={{ display: "grid", gap: 2 }}>
        <Typography sx={{ fontSize: 14 }}>
          Bộ từ: <strong>{setTitle}</strong> ({items.length} mục)
        </Typography>
        {lessonTitle ? (
          <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
            Bài học: <strong>{lessonTitle}</strong>
          </Typography>
        ) : null}

        <FormControlLabel
          control={
            <Checkbox
              checked={includeVocabulary}
              onChange={(e) => setIncludeVocabulary(e.target.checked)}
            />
          }
          label={
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <MenuBookOutlinedIcon sx={{ fontSize: 18, color: "#0C447C" }} />
              Khối từ vựng — tab <strong>Bài học</strong>
            </Box>
          }
        />
        {includeVocabulary ? (
          <TextField
            label="Tiêu đề khối từ vựng"
            size="small"
            fullWidth
            sx={muTextFieldSx}
            value={vocabTitle}
            onChange={(e) => setVocabTitle(e.target.value)}
            placeholder={setTitle}
          />
        ) : null}

        <FormControlLabel
          control={
            <Checkbox
              checked={includeExercise}
              onChange={(e) => setIncludeExercise(e.target.checked)}
            />
          }
          label={
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <QuizOutlinedIcon sx={{ fontSize: 18, color: "#0C447C" }} />
              Bài tập MCQ — tab <strong>Bài tập</strong>
            </Box>
          }
        />
        {includeExercise ? (
          <>
            <TextField
              label="Tiêu đề khối bài tập"
              size="small"
              fullWidth
              sx={muTextFieldSx}
              value={exerciseTitle}
              onChange={(e) => setExerciseTitle(e.target.value)}
              placeholder={`${setTitle} — MCQ`}
            />
            {mcqGeneration.error ? (
              <Alert severity="warning">{mcqGeneration.error}</Alert>
            ) : (
              <Alert severity="info" sx={{ fontSize: 13 }}>
                Sẽ sinh <strong>{mcqGeneration.questionCount}</strong> câu MCQ.
              </Alert>
            )}
            {mcqGeneration.warnings?.map((w) => (
              <Alert key={w} severity="warning" sx={{ fontSize: 12 }}>
                {w}
              </Alert>
            ))}
          </>
        ) : null}

        {error ? <Alert severity="error">{error}</Alert> : null}
      </DialogContent>
      <DialogActions sx={muDialogFooter}>
        <Button onClick={onClose} sx={muFooterBtnOutlined} disabled={submitting}>
          Hủy
        </Button>
        <Button
          variant="contained"
          disabled={submitting || (!includeVocabulary && !includeExercise)}
          onClick={() => void handleAttach()}
          sx={muFooterBtnPrimary}
        >
          {submitting ? <CircularProgress size={22} color="inherit" /> : "Thêm vào bài học"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

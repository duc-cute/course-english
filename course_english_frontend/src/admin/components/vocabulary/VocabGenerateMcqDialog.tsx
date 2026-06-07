import AutoFixHighOutlinedIcon from "@mui/icons-material/AutoFixHighOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
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
import { buildExerciseSetPayloadJson } from "../../../shared/lesson/exercisePayload";
import { generateMcqFromVocabItems } from "../../../shared/lesson/vocabActivityGenerator";
import type { VocabularyItemRecord } from "../../../shared/api/vocabularySet";
import type { MultipleChoiceQuestion } from "../../../student/lessonPlayer/exercise/types";
import { AttachMcqToLessonDialog } from "./AttachMcqToLessonDialog";

type VocabGenerateMcqDialogProps = {
  open: boolean;
  setTitle: string;
  items: VocabularyItemRecord[];
  onClose: () => void;
  /** Gắn thẳng vào lesson đang mở (Lesson Editor) */
  targetLessonId?: string;
  targetLessonTitle?: string;
  onAttached?: () => void;
};

function correctChoiceText(q: MultipleChoiceQuestion): string {
  return q.choices.find((c) => c.id === q.correctChoiceId)?.text ?? "—";
}

export function VocabGenerateMcqDialog({
  open,
  setTitle,
  items,
  onClose,
  targetLessonId,
  targetLessonTitle,
  onAttached,
}: VocabGenerateMcqDialogProps) {
  const [blockTitle, setBlockTitle] = useState("");
  const [openAttach, setOpenAttach] = useState(false);

  const generation = useMemo(() => {
    try {
      const inputs = items.map((item) => ({
        id: item.id,
        wordEn: item.wordEn,
        meaningVi: item.meaningVi,
      }));
      const result = generateMcqFromVocabItems(inputs, {
        title: blockTitle.trim() || `${setTitle} — MCQ`,
        instruction: "Chọn nghĩa tiếng Việt đúng",
        shuffleOptions: true,
      });
      return { ...result, error: null as string | null };
    } catch (err) {
      return {
        error: (err as { message?: string })?.message ?? "Không thể sinh bài tập.",
        payload: null,
        warnings: [] as string[],
      };
    }
  }, [items, setTitle, blockTitle]);

  const jsonText = generation.payload ? buildExerciseSetPayloadJson(generation.payload) : "";
  const mcqQuestions =
    generation.payload?.questions.filter((q): q is MultipleChoiceQuestion => q.type === "MULTIPLE_CHOICE") ?? [];

  const resolvedBlockTitle = blockTitle.trim() || `${setTitle} — MCQ`;

  const handleAttached = () => {
    onAttached?.();
    onClose();
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: muDialogPaper }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 18 }}>Sinh bài tập MCQ từ bộ từ</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2 }}>
          <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
            Bộ <strong>{setTitle}</strong> — {items.length} từ →{" "}
            {mcqQuestions.length ? `${mcqQuestions.length} câu MCQ` : "—"}
          </Typography>

          <TextField
            label="Tiêu đề bài tập"
            value={blockTitle}
            onChange={(e) => setBlockTitle(e.target.value)}
            size="small"
            fullWidth
            placeholder={`${setTitle} — MCQ`}
            sx={muTextFieldSx}
          />

          {generation.error ? <Alert severity="error">{generation.error}</Alert> : null}

          {generation.warnings?.map((w) => (
            <Alert key={w} severity="warning" sx={{ fontSize: 13 }}>
              {w}
            </Alert>
          ))}

          {mcqQuestions.length > 0 ? (
            <>
              <Alert severity="success" sx={{ fontSize: 13 }}>
                Xem trước bài tập bên dưới. Bấm <strong>Gắn vào bài học</strong> — hệ thống tự tạo block, không cần
                copy JSON.
              </Alert>
              <Table size="small" sx={{ border: "1px solid #ECEAE3", borderRadius: "10px" }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: "#F8F7F4" }}>
                    <TableCell width={48}>#</TableCell>
                    <TableCell>Từ (EN)</TableCell>
                    <TableCell>Đáp án đúng (VI)</TableCell>
                    <TableCell>Đáp án nhiễu</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mcqQuestions.map((q, index) => {
                    const distractors = q.choices
                      .filter((c) => c.id !== q.correctChoiceId)
                      .map((c) => c.text)
                      .join(" · ");
                    return (
                      <TableRow key={q.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{q.prompt.text}</TableCell>
                        <TableCell>
                          <Chip size="small" label={correctChoiceText(q)} color="success" variant="outlined" />
                        </TableCell>
                        <TableCell sx={{ fontSize: 12, color: "text.secondary" }}>{distractors}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </>
          ) : null}

          {jsonText ? (
            <Accordion disableGutters elevation={0} sx={{ border: "1px solid #ECEAE3", borderRadius: "10px !important" }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ fontSize: 12, fontWeight: 600 }}>Nâng cao — xem JSON</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box
                  component="pre"
                  sx={{
                    m: 0,
                    p: 1,
                    bgcolor: "#F8F7F4",
                    borderRadius: "8px",
                    fontSize: 10,
                    maxHeight: 200,
                    overflow: "auto",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {jsonText}
                </Box>
              </AccordionDetails>
            </Accordion>
          ) : null}
        </DialogContent>
        <DialogActions sx={muDialogFooter}>
          <Button onClick={onClose} sx={muFooterBtnOutlined}>
            Đóng
          </Button>
          <Button
            variant="contained"
            startIcon={<AutoFixHighOutlinedIcon />}
            disabled={!jsonText}
            onClick={() => setOpenAttach(true)}
            sx={muFooterBtnPrimary}
          >
            {targetLessonId ? "Thêm vào bài học này" : "Gắn vào bài học"}
          </Button>
        </DialogActions>
      </Dialog>

      <AttachMcqToLessonDialog
        open={openAttach}
        payloadJson={jsonText}
        questionCount={mcqQuestions.length}
        blockTitle={resolvedBlockTitle}
        fixedLessonId={targetLessonId}
        fixedLessonTitle={targetLessonTitle}
        onClose={() => setOpenAttach(false)}
        onAttached={handleAttached}
      />
    </>
  );
}

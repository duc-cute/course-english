import SpellcheckOutlinedIcon from "@mui/icons-material/SpellcheckOutlined";
import {
  Alert,
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
import { generateSpellingFromVocabItems } from "../../../shared/lesson/vocabActivityGenerator";
import type { VocabularyItemRecord } from "../../../shared/api/vocabularySet";
import type { SpellingQuestion } from "../../../student/lessonPlayer/exercise/types";
import { AttachMcqToLessonDialog } from "./AttachMcqToLessonDialog";

type VocabGenerateSpellingDialogProps = {
  open: boolean;
  setTitle: string;
  items: VocabularyItemRecord[];
  onClose: () => void;
  targetLessonId?: string;
  targetLessonTitle?: string;
  onAttached?: () => void;
};

export function VocabGenerateSpellingDialog({
  open,
  setTitle,
  items,
  onClose,
  targetLessonId,
  targetLessonTitle,
  onAttached,
}: VocabGenerateSpellingDialogProps) {
  const [blockTitle, setBlockTitle] = useState("");
  const [openAttach, setOpenAttach] = useState(false);

  const generation = useMemo(() => {
    try {
      const inputs = items.map((item) => ({
        id: item.id,
        wordEn: item.wordEn,
        meaningVi: item.meaningVi,
      }));
      const result = generateSpellingFromVocabItems(inputs, {
        title: blockTitle.trim() || `${setTitle} — Gõ chính tả`,
        instruction: "Nhìn nghĩa tiếng Việt và gõ từ tiếng Anh",
        shuffleQuestions: true,
      });
      return { ...result, error: null as string | null };
    } catch (err) {
      return {
        error: (err as { message?: string })?.message ?? "Không thể sinh bài gõ chính tả.",
        payload: null,
        warnings: [] as string[],
      };
    }
  }, [items, setTitle, blockTitle]);

  const jsonText = generation.payload ? buildExerciseSetPayloadJson(generation.payload) : "";
  const spellingQuestions =
    generation.payload?.questions.filter((q): q is SpellingQuestion => q.type === "SPELLING") ?? [];
  const resolvedBlockTitle = blockTitle.trim() || `${setTitle} — Gõ chính tả`;

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: muDialogPaper }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 18 }}>Sinh bài gõ chính tả</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2 }}>
          <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
            Bộ <strong>{setTitle}</strong> — mỗi từ → 1 câu (nghĩa VI → gõ EN).
          </Typography>
          <TextField
            label="Tiêu đề bài tập"
            value={blockTitle}
            onChange={(e) => setBlockTitle(e.target.value)}
            size="small"
            fullWidth
            placeholder={`${setTitle} — Gõ chính tả`}
            sx={muTextFieldSx}
          />
          {generation.error ? <Alert severity="error">{generation.error}</Alert> : null}
          {generation.warnings?.map((w) => (
            <Alert key={w} severity="warning" sx={{ fontSize: 13 }}>
              {w}
            </Alert>
          ))}
          {spellingQuestions.length > 0 ? (
            <>
              <Alert severity="success" sx={{ fontSize: 13 }}>
                Xem trước <strong>{spellingQuestions.length}</strong> câu gõ chính tả.
              </Alert>
              <Table size="small" sx={{ border: "1px solid #ECEAE3", borderRadius: "10px" }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: "#F8F7F4" }}>
                    <TableCell width={48}>#</TableCell>
                    <TableCell>Nghĩa (gợi ý)</TableCell>
                    <TableCell>Đáp án</TableCell>
                    <TableCell>Gợi ý</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {spellingQuestions.map((q, index) => (
                    <TableRow key={q.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{q.prompt.text}</TableCell>
                      <TableCell>
                        <Chip size="small" label={q.correctAnswer} color="success" variant="outlined" />
                      </TableCell>
                      <TableCell>{q.hint ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          ) : null}
        </DialogContent>
        <DialogActions sx={muDialogFooter}>
          <Button onClick={onClose} sx={muFooterBtnOutlined}>
            Đóng
          </Button>
          <Button
            variant="contained"
            startIcon={<SpellcheckOutlinedIcon />}
            disabled={!jsonText}
            onClick={() => setOpenAttach(true)}
            sx={muFooterBtnPrimary}
          >
            Gắn vào bài học
          </Button>
        </DialogActions>
      </Dialog>

      <AttachMcqToLessonDialog
        open={openAttach}
        payloadJson={jsonText}
        questionCount={spellingQuestions.length}
        questionKindLabel="gõ chính tả"
        blockTitle={resolvedBlockTitle}
        fixedLessonId={targetLessonId}
        fixedLessonTitle={targetLessonTitle}
        onClose={() => setOpenAttach(false)}
        onAttached={() => {
          onAttached?.();
          onClose();
        }}
      />
    </>
  );
}

import HeadphonesOutlinedIcon from "@mui/icons-material/HeadphonesOutlined";
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
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import {
  muDialogFooter,
  muDialogPaper,
  muFooterBtnOutlined,
  muFooterBtnPrimary,
  muTextFieldSx,
} from "../../../pages/admin/manageUserUiStyles";
import { buildExerciseSetPayloadJson } from "../../../shared/lesson/exercisePayload";
import { generateListenChooseFromVocabItems } from "../../../shared/lesson/vocabActivityGenerator";
import type { VocabularyItemRecord } from "../../../shared/api/vocabularySet";
import {
  VOCABULARY_AUDIO_ACCENT_OPTIONS,
  vocabularyAudioAccentListenLabel,
  type VocabularyAudioAccent,
} from "../../../shared/constants/systemConfigKeys";
import { useFeatureFlags } from "../../../shared/featureFlags/useFeatureFlags";
import type { ListenChooseQuestion } from "../../../student/lessonPlayer/exercise/types";
import { AttachMcqToLessonDialog } from "./AttachMcqToLessonDialog";

type VocabGenerateListenDialogProps = {
  open: boolean;
  setTitle: string;
  items: VocabularyItemRecord[];
  onClose: () => void;
  targetLessonId?: string;
  targetLessonTitle?: string;
  onAttached?: () => void;
};

function correctChoiceText(q: ListenChooseQuestion): string {
  return q.choices.find((c) => c.id === q.correctChoiceId)?.text ?? "—";
}

export function VocabGenerateListenDialog({
  open,
  setTitle,
  items,
  onClose,
  targetLessonId,
  targetLessonTitle,
  onAttached,
}: VocabGenerateListenDialogProps) {
  const { flags } = useFeatureFlags();
  const configAccent = flags.vocabularyAudioAccent;

  const [blockTitle, setBlockTitle] = useState("");
  const [audioAccent, setAudioAccent] = useState<VocabularyAudioAccent>(configAccent);
  const [openAttach, setOpenAttach] = useState(false);

  useEffect(() => {
    setAudioAccent(configAccent);
  }, [configAccent]);

  const generation = useMemo(() => {
    try {
      const inputs = items.map((item) => ({
        id: item.id,
        wordEn: item.wordEn,
        meaningVi: item.meaningVi,
        audioUkUrl: item.audioUkUrl,
        audioUsUrl: item.audioUsUrl,
      }));
      const result = generateListenChooseFromVocabItems(inputs, {
        title: blockTitle.trim() || `${setTitle} — Nghe chọn`,
        instruction: "Nghe phát âm và chọn nghĩa tiếng Việt đúng",
        shuffleOptions: true,
        audioAccent,
      });
      return { ...result, error: null as string | null };
    } catch (err) {
      return {
        error: (err as { message?: string })?.message ?? "Không thể sinh bài nghe.",
        payload: null,
        warnings: [] as string[],
      };
    }
  }, [items, setTitle, blockTitle, audioAccent]);

  const jsonText = generation.payload ? buildExerciseSetPayloadJson(generation.payload) : "";
  const listenQuestions =
    generation.payload?.questions.filter((q): q is ListenChooseQuestion => q.type === "LISTEN_CHOOSE") ?? [];

  const resolvedBlockTitle = blockTitle.trim() || `${setTitle} — Nghe chọn`;

  const handleAttached = () => {
    onAttached?.();
    onClose();
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: muDialogPaper }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 18 }}>Sinh bài nghe — chọn nghĩa</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2 }}>
          <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
            Bộ <strong>{setTitle}</strong> — cần từ đã enrich audio (≥ 4 từ có audio{" "}
            {vocabularyAudioAccentListenLabel(audioAccent)}).
          </Typography>

          <TextField
            label="Tiêu đề bài tập"
            value={blockTitle}
            onChange={(e) => setBlockTitle(e.target.value)}
            size="small"
            fullWidth
            placeholder={`${setTitle} — Nghe chọn`}
            sx={muTextFieldSx}
          />

          <TextField
            select
            label="Giọng audio snapshot"
            size="small"
            fullWidth
            sx={muTextFieldSx}
            value={audioAccent}
            onChange={(e) => setAudioAccent(e.target.value as VocabularyAudioAccent)}
            helperText={`Mặc định theo cấu hình hệ thống (${vocabularyAudioAccentListenLabel(configAccent)}) — có thể đổi trước khi sinh`}
          >
            {VOCABULARY_AUDIO_ACCENT_OPTIONS.map((item) => (
              <MenuItem key={item.value} value={item.value}>
                {item.label}
              </MenuItem>
            ))}
          </TextField>

          {generation.error ? <Alert severity="error">{generation.error}</Alert> : null}

          {generation.warnings?.map((w) => (
            <Alert key={w} severity="warning" sx={{ fontSize: 13 }}>
              {w}
            </Alert>
          ))}

          {listenQuestions.length > 0 ? (
            <>
              <Alert severity="success" sx={{ fontSize: 13 }}>
                Xem trước <strong>{listenQuestions.length}</strong> câu nghe-chọn. Bấm <strong>Gắn vào bài học</strong>{" "}
                để thêm block EXERCISE_SET.
              </Alert>
              <Table size="small" sx={{ border: "1px solid #ECEAE3", borderRadius: "10px" }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: "#F8F7F4" }}>
                    <TableCell width={48}>#</TableCell>
                    <TableCell>Từ (sau khi làm)</TableCell>
                    <TableCell>Audio</TableCell>
                    <TableCell>Đáp án đúng</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {listenQuestions.map((q, index) => (
                    <TableRow key={q.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{q.wordEn ?? "—"}</TableCell>
                      <TableCell>
                        <Chip size="small" label={q.audioAccent ?? "UK"} variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Chip size="small" label={correctChoiceText(q)} color="success" variant="outlined" />
                      </TableCell>
                    </TableRow>
                  ))}
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
            startIcon={<HeadphonesOutlinedIcon />}
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
        questionCount={listenQuestions.length}
        questionKindLabel="nghe-chọn"
        blockTitle={resolvedBlockTitle}
        fixedLessonId={targetLessonId}
        fixedLessonTitle={targetLessonTitle}
        onClose={() => setOpenAttach(false)}
        onAttached={handleAttached}
      />
    </>
  );
}

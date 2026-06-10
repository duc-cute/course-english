import KeyboardOutlinedIcon from "@mui/icons-material/KeyboardOutlined";
import {
  Alert,
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
import { generateListenTypeFromVocabItems } from "../../../shared/lesson/vocabActivityGenerator";
import type { VocabularyItemRecord } from "../../../shared/api/vocabularySet";
import {
  VOCABULARY_AUDIO_ACCENT_OPTIONS,
  vocabularyAudioAccentListenLabel,
  type VocabularyAudioAccent,
} from "../../../shared/constants/systemConfigKeys";
import { useFeatureFlags } from "../../../shared/featureFlags/useFeatureFlags";
import type { ListenTypeQuestion } from "../../../student/lessonPlayer/exercise/types";
import { AttachMcqToLessonDialog } from "./AttachMcqToLessonDialog";

type VocabGenerateListenTypeDialogProps = {
  open: boolean;
  setTitle: string;
  items: VocabularyItemRecord[];
  onClose: () => void;
  targetLessonId?: string;
  targetLessonTitle?: string;
  onAttached?: () => void;
};

export function VocabGenerateListenTypeDialog({
  open,
  setTitle,
  items,
  onClose,
  targetLessonId,
  targetLessonTitle,
  onAttached,
}: VocabGenerateListenTypeDialogProps) {
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
      const result = generateListenTypeFromVocabItems(inputs, {
        title: blockTitle.trim() || `${setTitle} — Nghe gõ`,
        instruction: "Nghe phát âm và gõ từ tiếng Anh",
        shuffleQuestions: true,
        audioAccent,
      });
      return { ...result, error: null as string | null };
    } catch (err) {
      return {
        error: (err as { message?: string })?.message ?? "Không thể sinh bài nghe gõ.",
        payload: null,
        warnings: [] as string[],
      };
    }
  }, [items, setTitle, blockTitle, audioAccent]);

  const jsonText = generation.payload ? buildExerciseSetPayloadJson(generation.payload) : "";
  const listenQuestions =
    generation.payload?.questions.filter((q): q is ListenTypeQuestion => q.type === "LISTEN_TYPE") ?? [];
  const resolvedBlockTitle = blockTitle.trim() || `${setTitle} — Nghe gõ`;

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: muDialogPaper }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 18 }}>Sinh bài nghe — gõ từ</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2 }}>
          <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
            Bộ <strong>{setTitle}</strong> — cần từ có audio ({vocabularyAudioAccentListenLabel(audioAccent)}).
          </Typography>
          <TextField
            label="Tiêu đề bài tập"
            value={blockTitle}
            onChange={(e) => setBlockTitle(e.target.value)}
            size="small"
            fullWidth
            placeholder={`${setTitle} — Nghe gõ`}
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
            helperText={`Mặc định theo cấu hình (${vocabularyAudioAccentListenLabel(configAccent)})`}
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
                Xem trước <strong>{listenQuestions.length}</strong> câu nghe-gõ.
              </Alert>
              <Table size="small" sx={{ border: "1px solid #ECEAE3", borderRadius: "10px" }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: "#F8F7F4" }}>
                    <TableCell width={48}>#</TableCell>
                    <TableCell>Từ</TableCell>
                    <TableCell>Audio</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {listenQuestions.map((q, index) => (
                    <TableRow key={q.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{q.wordEn ?? q.correctAnswer}</TableCell>
                      <TableCell>
                        <Chip size="small" label={q.audioAccent ?? "UK"} variant="outlined" />
                      </TableCell>
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
            startIcon={<KeyboardOutlinedIcon />}
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
        questionCount={listenQuestions.length}
        questionKindLabel="nghe-gõ"
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

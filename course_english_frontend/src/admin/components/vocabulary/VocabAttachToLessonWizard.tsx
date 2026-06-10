import HeadphonesOutlinedIcon from "@mui/icons-material/HeadphonesOutlined";
import KeyboardOutlinedIcon from "@mui/icons-material/KeyboardOutlined";
import LinkIcon from "@mui/icons-material/Link";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import QuizOutlinedIcon from "@mui/icons-material/QuizOutlined";
import SpellcheckOutlinedIcon from "@mui/icons-material/SpellcheckOutlined";
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
import {
  generateListenChooseFromVocabItems,
  generateListenTypeFromVocabItems,
  generateMatchingFromVocabItems,
  generateMcqFromVocabItems,
  generateSpellingFromVocabItems,
} from "../../../shared/lesson/vocabActivityGenerator";
import type { VocabularyItemRecord } from "../../../shared/api/vocabularySet";
import { vocabularyAudioAccentListenLabel } from "../../../shared/constants/systemConfigKeys";
import { useFeatureFlags } from "../../../shared/featureFlags/useFeatureFlags";

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
  const { flags } = useFeatureFlags();
  const listenAudioAccent = flags.vocabularyAudioAccent;

  const [includeVocabulary, setIncludeVocabulary] = useState(true);
  const [includeMcq, setIncludeMcq] = useState(true);
  const [includeListen, setIncludeListen] = useState(false);
  const [includeSpelling, setIncludeSpelling] = useState(false);
  const [includeListenType, setIncludeListenType] = useState(false);
  const [includeMatching, setIncludeMatching] = useState(false);
  const [vocabTitle, setVocabTitle] = useState("");
  const [exerciseTitle, setExerciseTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const vocabInputs = useMemo(
    () =>
      items.map((item) => ({
        id: item.id,
        wordEn: item.wordEn,
        meaningVi: item.meaningVi,
        audioUkUrl: item.audioUkUrl,
        audioUsUrl: item.audioUsUrl,
      })),
    [items],
  );

  const exerciseBase = exerciseTitle.trim() || setTitle;

  const mcqGeneration = useMemo(() => {
    if (!includeMcq) return { error: null as string | null, questionCount: 0, payloadJson: "", warnings: [] as string[] };
    try {
      const result = generateMcqFromVocabItems(vocabInputs, {
        title: includeMatching ? `${exerciseBase} — MCQ` : exerciseTitle.trim() || `${setTitle} — MCQ`,
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
  }, [includeMcq, includeMatching, vocabInputs, setTitle, exerciseTitle, exerciseBase]);

  const listenGeneration = useMemo(() => {
    if (!includeListen) return { error: null as string | null, questionCount: 0, payloadJson: "", warnings: [] as string[] };
    try {
      const result = generateListenChooseFromVocabItems(vocabInputs, {
        title: `${exerciseBase} — Nghe chọn`,
        instruction: "Nghe phát âm và chọn nghĩa tiếng Việt đúng",
        shuffleOptions: true,
        audioAccent: listenAudioAccent,
      });
      return {
        error: null,
        questionCount: result.payload.questions.length,
        payloadJson: buildExerciseSetPayloadJson(result.payload),
        warnings: result.warnings,
      };
    } catch (err) {
      return {
        error: (err as { message?: string })?.message ?? "Không thể sinh bài nghe.",
        questionCount: 0,
        payloadJson: "",
        warnings: [] as string[],
      };
    }
  }, [includeListen, vocabInputs, exerciseBase, listenAudioAccent]);

  const spellingGeneration = useMemo(() => {
    if (!includeSpelling) return { error: null as string | null, questionCount: 0, payloadJson: "", warnings: [] as string[] };
    try {
      const result = generateSpellingFromVocabItems(vocabInputs, {
        title: `${exerciseBase} — Gõ chính tả`,
        instruction: "Nhìn nghĩa tiếng Việt và gõ từ tiếng Anh",
        shuffleQuestions: true,
      });
      return {
        error: null,
        questionCount: result.payload.questions.length,
        payloadJson: buildExerciseSetPayloadJson(result.payload),
        warnings: result.warnings,
      };
    } catch (err) {
      return {
        error: (err as { message?: string })?.message ?? "Không thể sinh bài gõ chính tả.",
        questionCount: 0,
        payloadJson: "",
        warnings: [] as string[],
      };
    }
  }, [includeSpelling, vocabInputs, exerciseBase]);

  const listenTypeGeneration = useMemo(() => {
    if (!includeListenType) return { error: null as string | null, questionCount: 0, payloadJson: "", warnings: [] as string[] };
    try {
      const result = generateListenTypeFromVocabItems(vocabInputs, {
        title: `${exerciseBase} — Nghe gõ`,
        instruction: "Nghe phát âm và gõ từ tiếng Anh",
        shuffleQuestions: true,
        audioAccent: listenAudioAccent,
      });
      return {
        error: null,
        questionCount: result.payload.questions.length,
        payloadJson: buildExerciseSetPayloadJson(result.payload),
        warnings: result.warnings,
      };
    } catch (err) {
      return {
        error: (err as { message?: string })?.message ?? "Không thể sinh bài nghe gõ.",
        questionCount: 0,
        payloadJson: "",
        warnings: [] as string[],
      };
    }
  }, [includeListenType, vocabInputs, exerciseBase, listenAudioAccent]);

  const matchingGeneration = useMemo(() => {
    if (!includeMatching) return { error: null as string | null, questionCount: 0, payloadJson: "", warnings: [] as string[] };
    try {
      const result = generateMatchingFromVocabItems(vocabInputs, {
        title: includeMcq ? `${exerciseBase} — Ghép cặp` : exerciseTitle.trim() || `${setTitle} — Ghép cặp`,
        instruction: "Ghép từ tiếng Anh với nghĩa tiếng Việt",
      });
      return {
        error: null,
        questionCount: result.payload.questions.length,
        payloadJson: buildExerciseSetPayloadJson(result.payload),
        warnings: result.warnings,
      };
    } catch (err) {
      return {
        error: (err as { message?: string })?.message ?? "Không thể sinh ghép cặp.",
        questionCount: 0,
        payloadJson: "",
        warnings: [] as string[],
      };
    }
  }, [includeMatching, includeMcq, vocabInputs, setTitle, exerciseTitle, exerciseBase]);

  const resolvedVocabTitle = vocabTitle.trim() || setTitle;
  const includeExercise = includeMcq || includeListen || includeSpelling || includeListenType || includeMatching;

  const handleAttach = async () => {
    if (!includeVocabulary && !includeExercise) {
      setError("Chọn ít nhất một loại khối.");
      return;
    }
    if (includeMcq && mcqGeneration.error) {
      setError(mcqGeneration.error);
      return;
    }
    if (includeListen && listenGeneration.error) {
      setError(listenGeneration.error);
      return;
    }
    if (includeSpelling && spellingGeneration.error) {
      setError(spellingGeneration.error);
      return;
    }
    if (includeListenType && listenTypeGeneration.error) {
      setError(listenTypeGeneration.error);
      return;
    }
    if (includeMatching && matchingGeneration.error) {
      setError(matchingGeneration.error);
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
      if (includeMcq && mcqGeneration.payloadJson) {
        await apiCreateLessonBlock(lessonId, {
          blockType: "EXERCISE_SET",
          payloadJson: mcqGeneration.payloadJson,
        });
      }
      if (includeListen && listenGeneration.payloadJson) {
        await apiCreateLessonBlock(lessonId, {
          blockType: "EXERCISE_SET",
          payloadJson: listenGeneration.payloadJson,
        });
      }
      if (includeSpelling && spellingGeneration.payloadJson) {
        await apiCreateLessonBlock(lessonId, {
          blockType: "EXERCISE_SET",
          payloadJson: spellingGeneration.payloadJson,
        });
      }
      if (includeListenType && listenTypeGeneration.payloadJson) {
        await apiCreateLessonBlock(lessonId, {
          blockType: "EXERCISE_SET",
          payloadJson: listenTypeGeneration.payloadJson,
        });
      }
      if (includeMatching && matchingGeneration.payloadJson) {
        await apiCreateLessonBlock(lessonId, {
          blockType: "EXERCISE_SET",
          payloadJson: matchingGeneration.payloadJson,
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

  const allWarnings = [
    ...(mcqGeneration.warnings ?? []),
    ...(listenGeneration.warnings ?? []),
    ...(spellingGeneration.warnings ?? []),
    ...(listenTypeGeneration.warnings ?? []),
    ...(matchingGeneration.warnings ?? []),
  ];

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

        <Typography sx={{ fontSize: 13, fontWeight: 600, color: "text.secondary", mt: 0.5 }}>
          Bài tập — tab <strong>Bài tập</strong>
        </Typography>

        <FormControlLabel
          control={
            <Checkbox checked={includeMcq} onChange={(e) => setIncludeMcq(e.target.checked)} />
          }
          label={
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <QuizOutlinedIcon sx={{ fontSize: 18, color: "#0C447C" }} />
              Trắc nghiệm MCQ (cần ≥ 4 từ)
            </Box>
          }
        />
        {includeMcq ? (
          mcqGeneration.error ? (
            <Alert severity="warning">{mcqGeneration.error}</Alert>
          ) : (
            <Alert severity="info" sx={{ fontSize: 13 }}>
              Sẽ sinh <strong>{mcqGeneration.questionCount}</strong> câu MCQ.
            </Alert>
          )
        ) : null}

        <FormControlLabel
          control={
            <Checkbox checked={includeListen} onChange={(e) => setIncludeListen(e.target.checked)} />
          }
          label={
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <HeadphonesOutlinedIcon sx={{ fontSize: 18, color: "#0C447C" }} />
              Nghe chọn LISTEN (cần ≥ 4 từ có audio {vocabularyAudioAccentListenLabel(listenAudioAccent)})
            </Box>
          }
        />
        {includeListen ? (
          listenGeneration.error ? (
            <Alert severity="warning">{listenGeneration.error}</Alert>
          ) : (
            <Alert severity="info" sx={{ fontSize: 13 }}>
              Sẽ sinh <strong>{listenGeneration.questionCount}</strong> câu nghe-chọn (audio{" "}
              {vocabularyAudioAccentListenLabel(listenAudioAccent)} snapshot).
            </Alert>
          )
        ) : null}

        <FormControlLabel
          control={
            <Checkbox checked={includeSpelling} onChange={(e) => setIncludeSpelling(e.target.checked)} />
          }
          label={
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <SpellcheckOutlinedIcon sx={{ fontSize: 18, color: "#0C447C" }} />
              Gõ chính tả SPELLING (≥ 1 từ)
            </Box>
          }
        />
        {includeSpelling ? (
          spellingGeneration.error ? (
            <Alert severity="warning">{spellingGeneration.error}</Alert>
          ) : (
            <Alert severity="info" sx={{ fontSize: 13 }}>
              Sẽ sinh <strong>{spellingGeneration.questionCount}</strong> câu gõ chính tả.
            </Alert>
          )
        ) : null}

        <FormControlLabel
          control={
            <Checkbox checked={includeListenType} onChange={(e) => setIncludeListenType(e.target.checked)} />
          }
          label={
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <KeyboardOutlinedIcon sx={{ fontSize: 18, color: "#0C447C" }} />
              Nghe gõ LISTEN_TYPE (≥ 1 từ có audio {vocabularyAudioAccentListenLabel(listenAudioAccent)})
            </Box>
          }
        />
        {includeListenType ? (
          listenTypeGeneration.error ? (
            <Alert severity="warning">{listenTypeGeneration.error}</Alert>
          ) : (
            <Alert severity="info" sx={{ fontSize: 13 }}>
              Sẽ sinh <strong>{listenTypeGeneration.questionCount}</strong> câu nghe-gõ.
            </Alert>
          )
        ) : null}

        <FormControlLabel
          control={
            <Checkbox
              checked={includeMatching}
              onChange={(e) => setIncludeMatching(e.target.checked)}
            />
          }
          label={
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <LinkIcon sx={{ fontSize: 18, color: "#0C447C" }} />
              Ghép cặp MATCHING (cần ≥ 2 từ)
            </Box>
          }
        />
        {includeMatching ? (
          matchingGeneration.error ? (
            <Alert severity="warning">{matchingGeneration.error}</Alert>
          ) : (
            <Alert severity="info" sx={{ fontSize: 13 }}>
              Sẽ sinh <strong>{matchingGeneration.questionCount}</strong> câu ghép cặp
              {items.length > 8 ? ` (${items.length} từ, tối đa 8 cặp/câu)` : ""}.
            </Alert>
          )
        ) : null}

        {includeExercise ? (
          <TextField
            label="Tiêu đề khối bài tập"
            size="small"
            fullWidth
            sx={muTextFieldSx}
            value={exerciseTitle}
            onChange={(e) => setExerciseTitle(e.target.value)}
            placeholder={includeMcq && includeMatching ? setTitle : includeMatching ? `${setTitle} — Ghép cặp` : `${setTitle} — MCQ`}
            helperText={
              includeMcq && includeMatching
                ? "Dùng làm tiền tố — hệ thống thêm “— MCQ” / “— Ghép cặp”"
                : undefined
            }
          />
        ) : null}

        {allWarnings.map((w) => (
          <Alert key={w} severity="warning" sx={{ fontSize: 12 }}>
            {w}
          </Alert>
        ))}

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

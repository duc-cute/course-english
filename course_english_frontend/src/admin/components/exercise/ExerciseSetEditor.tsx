import { arrayMove } from "@dnd-kit/sortable";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import {
  muBtnSmPrimary,
  muFooterBtnOutlined,
} from "../../../pages/admin/manageUserUiStyles";
import {
  buildExerciseSetPayloadJson,
  createEmptyFillBlankQuestion,
  createEmptyGapFillMcqQuestion,
  createEmptyMatchingQuestion,
  createEmptyMcqQuestion,
  createEmptyReadingComprehensionQuestion,
  createEmptyReorderQuestion,
  generateQuestionId,
  validateExerciseSetPayload,
} from "../../../shared/lesson/exercisePayload";
import type { VocabularyItemRecord } from "../../../shared/api/vocabularySet";
import { useFeatureFlags } from "../../../shared/featureFlags/useFeatureFlags";
import { generateListenTypeFromVocabItems } from "../../../shared/lesson/vocabActivityGenerator";
import { parseExerciseSetPayload } from "../../../student/lessonPlayer/exercise/parseExerciseSet";
import { VocabularyWordPicker } from "../vocabulary/VocabularyWordPicker";
import { syncBlanksWithPrompt } from "../../../shared/lesson/fillBlankUtils";
import { syncGapFillBlanksWithPrompt } from "../../../shared/lesson/gapFillMcqUtils";
import type {
  ExerciseQuestion,
  ExerciseSetPayload,
  FillBlankQuestion,
  GapFillMcqQuestion,
  ReadingComprehensionQuestion,
  ListenChooseQuestion,
  ListenTypeQuestion,
  MatchingQuestion,
  MultipleChoiceQuestion,
  ReorderSentenceQuestion,
  SpellingQuestion,
} from "../../../student/lessonPlayer/exercise/types";
import { FillBlankQuestionCanvas } from "./FillBlankQuestionCanvas";
import { GapFillMcqQuestionCanvas } from "./GapFillMcqQuestionCanvas";
import { ReadingComprehensionQuestionCanvas } from "./ReadingComprehensionQuestionCanvas";
import { ReorderSentenceQuestionCanvas } from "./ReorderSentenceQuestionCanvas";
import { ExerciseAuthoringFooter } from "./ExerciseAuthoringFooter";
import { ExerciseImportDialog, type ExerciseImportFormat } from "./ExerciseImportDialog";
import { AiExerciseGenDialog } from "./AiExerciseGenDialog";
import { ExerciseSetSettings } from "./ExerciseSetSettings";
import { ListenChooseQuestionCanvas } from "./ListenChooseQuestionCanvas";
import { MatchingQuestionCanvas } from "./MatchingQuestionCanvas";
import { McqQuestionCanvas } from "./McqQuestionCanvas";
import { QuestionListPanel } from "./QuestionListPanel";
import { TypedExerciseQuestionCanvas } from "./TypedExerciseQuestionCanvas";

type ExerciseSetEditorProps = {
  payloadJson: string;
  saving: boolean;
  error?: string;
  onSave: (payloadJson: string) => Promise<void>;
  onCancel: () => void;
};

function normalizeExerciseQuestion(question: ExerciseQuestion): ExerciseQuestion {
  if (question.type === "FILL_BLANK") {
    return {
      ...question,
      blanks: syncBlanksWithPrompt(question.prompt.text, question.blanks),
    } satisfies FillBlankQuestion;
  }
  if (question.type === "GAP_FILL_MCQ") {
    return {
      ...question,
      blanks: syncGapFillBlanksWithPrompt(question.prompt.text, question.blanks),
    } satisfies GapFillMcqQuestion;
  }
  return question;
}

function normalizeQuestions(questions: ExerciseQuestion[]): ExerciseQuestion[] {
  return questions.length
    ? questions.map(normalizeExerciseQuestion)
    : [createEmptyMcqQuestion("q1")];
}

export function ExerciseSetEditor({
  payloadJson,
  saving,
  error,
  onSave,
  onCancel,
}: ExerciseSetEditorProps) {
  const parsed = useMemo(
    () => parseExerciseSetPayload(payloadJson),
    [payloadJson],
  );

  const [settings, setSettings] = useState<
    Omit<ExerciseSetPayload, "questions">
  >(() => ({
    title: parsed.title,
    instruction: parsed.instruction,
    presentation: parsed.presentation,
    shuffleQuestions: parsed.shuffleQuestions,
    shuffleOptions: parsed.shuffleOptions,
    passScorePercent: parsed.passScorePercent,
  }));
  const [questions, setQuestions] = useState<ExerciseQuestion[]>(() =>
    normalizeQuestions(parsed.questions),
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [importOpen, setImportOpen] = useState(false);
  const [importFormat, setImportFormat] = useState<ExerciseImportFormat>("csv");
  const [aiGenOpen, setAiGenOpen] = useState(false);
  const [listenTypePickerOpen, setListenTypePickerOpen] = useState(false);
  const [listenTypeFeedback, setListenTypeFeedback] = useState<{
    severity: "success" | "warning" | "error";
    message: string;
  } | null>(null);
  const { flags } = useFeatureFlags();

  useEffect(() => {
    const next = parseExerciseSetPayload(payloadJson);
    setSettings({
      title: next.title,
      instruction: next.instruction,
      presentation: next.presentation,
      shuffleQuestions: next.shuffleQuestions,
      shuffleOptions: next.shuffleOptions,
      passScorePercent: next.passScorePercent,
    });
    setQuestions(normalizeQuestions(next.questions));
    setActiveIndex(0);
    setValidationErrors([]);
  }, [payloadJson]);

  const buildPayload = (): ExerciseSetPayload => ({
    ...settings,
    questions,
  });

  const updateSettings = (patch: Partial<ExerciseSetPayload>) => {
    setSettings((s) => ({ ...s, ...patch }));
  };

  const updateQuestion = (index: number, next: ExerciseQuestion) => {
    setQuestions((list) => list.map((q, i) => (i === index ? next : q)));
  };

  const addQuestion = (type: "MULTIPLE_CHOICE" | "MATCHING" | "FILL_BLANK" | "GAP_FILL_MCQ" | "READING_COMPREHENSION" | "REORDER_SENTENCE") => {
    setQuestions((list) => {
      const next =
        type === "MATCHING"
          ? [...list, createEmptyMatchingQuestion()]
          : type === "FILL_BLANK"
            ? [...list, createEmptyFillBlankQuestion()]
            : type === "GAP_FILL_MCQ"
              ? [...list, createEmptyGapFillMcqQuestion()]
              : type === "READING_COMPREHENSION"
                ? [...list, createEmptyReadingComprehensionQuestion()]
                : type === "REORDER_SENTENCE"
                  ? [...list, createEmptyReorderQuestion()]
                  : [...list, createEmptyMcqQuestion()];
      setActiveIndex(next.length - 1);
      return next;
    });
  };

  const deleteQuestion = (index: number) => {
    setQuestions((list) => {
      const next = list.filter((_, i) => i !== index);
      setActiveIndex((prev) => Math.min(prev, Math.max(0, next.length - 1)));
      return next.length ? next : [createEmptyMcqQuestion()];
    });
  };

  const duplicateQuestion = (index: number) => {
    setQuestions((list) => {
      const source = list[index];
      let copy: ExerciseQuestion;
      if (source.type === "MATCHING") {
        copy = {
          ...(source as MatchingQuestion),
          id: generateQuestionId(),
          pairs: (source as MatchingQuestion).pairs.map((p) => ({ ...p })),
        };
      } else if (source.type === "LISTEN_CHOOSE") {
        copy = {
          ...(source as ListenChooseQuestion),
          id: generateQuestionId(),
          choices: (source as ListenChooseQuestion).choices.map((c) => ({ ...c })),
        };
      } else if (source.type === "SPELLING" || source.type === "LISTEN_TYPE") {
        copy = { ...source, id: generateQuestionId() };
      } else if (source.type === "FILL_BLANK") {
        copy = {
          ...(source as FillBlankQuestion),
          id: generateQuestionId(),
          blanks: (source as FillBlankQuestion).blanks.map((b) => ({
            ...b,
            acceptedAnswers: [...b.acceptedAnswers],
          })),
        };
      } else if (source.type === "GAP_FILL_MCQ") {
        copy = {
          ...(source as GapFillMcqQuestion),
          id: generateQuestionId(),
          blanks: (source as GapFillMcqQuestion).blanks.map((b) => ({
            ...b,
            choices: b.choices.map((c) => ({ ...c })),
          })),
        };
      } else if (source.type === "READING_COMPREHENSION") {
        copy = {
          ...(source as ReadingComprehensionQuestion),
          id: generateQuestionId(),
          subQuestions: (source as ReadingComprehensionQuestion).subQuestions.map((sub) => ({
            ...sub,
            choices: sub.choices.map((c) => ({ ...c })),
          })),
        };
      } else if (source.type === "REORDER_SENTENCE") {
        copy = {
          ...(source as ReorderSentenceQuestion),
          id: generateQuestionId(),
          tokens: (source as ReorderSentenceQuestion).tokens.map((t) => ({ ...t })),
          correctOrder: [...(source as ReorderSentenceQuestion).correctOrder],
        };
      } else {
        copy = {
          ...(source as MultipleChoiceQuestion),
          id: generateQuestionId(),
          prompt: { ...(source as MultipleChoiceQuestion).prompt },
          choices: (source as MultipleChoiceQuestion).choices.map((c) => ({ ...c })),
        };
      }
      const next = [...list.slice(0, index + 1), copy, ...list.slice(index + 1)];
      setActiveIndex(index + 1);
      return next;
    });
  };

  const reorderQuestions = (fromIndex: number, toIndex: number) => {
    setQuestions((list) => {
      const activeId = list[activeIndex]?.id;
      const next = arrayMove(list, fromIndex, toIndex);
      const newActiveIndex = activeId ? next.findIndex((q) => q.id === activeId) : activeIndex;
      if (newActiveIndex >= 0) setActiveIndex(newActiveIndex);
      return next;
    });
  };

  const appendListenTypeFromVocab = (items: VocabularyItemRecord[]) => {
    setListenTypeFeedback(null);
    try {
      const result = generateListenTypeFromVocabItems(
        items.map((item) => ({
          id: item.id,
          wordEn: item.wordEn,
          meaningVi: item.meaningVi,
          audioUkUrl: item.audioUkUrl,
          audioUsUrl: item.audioUsUrl,
        })),
        {
          shuffleQuestions: false,
          audioAccent: flags.vocabularyAudioAccent,
        },
      );
      const newQuestions = result.payload.questions.map((question) => ({
        ...question,
        id: generateQuestionId(),
      }));
      if (!newQuestions.length) {
        setListenTypeFeedback({
          severity: "error",
          message: "Không sinh được câu nào — kiểm tra từ đã có audio (enrich) chưa.",
        });
        return;
      }
      setQuestions((list) => {
        const next = [...list, ...newQuestions];
        setActiveIndex(list.length);
        return next;
      });
      const warningText = result.warnings.filter(Boolean).join(" ");
      if (warningText) {
        setListenTypeFeedback({
          severity: "warning",
          message: `Đã thêm ${newQuestions.length} câu nghe gõ. ${warningText}`,
        });
      } else {
        setListenTypeFeedback({
          severity: "success",
          message: `Đã thêm ${newQuestions.length} câu nghe gõ từ thư viện.`,
        });
      }
    } catch (err) {
      setListenTypeFeedback({
        severity: "error",
        message: (err as { message?: string })?.message ?? "Không thể sinh câu nghe gõ.",
      });
    }
  };

  const applyImportedPayload = (next: ExerciseSetPayload) => {
    setSettings({
      title: next.title,
      instruction: next.instruction,
      presentation: next.presentation,
      shuffleQuestions: next.shuffleQuestions,
      shuffleOptions: next.shuffleOptions,
      passScorePercent: next.passScorePercent,
    });
    setQuestions(normalizeQuestions(next.questions));
    setActiveIndex(0);
    setValidationErrors([]);
  };

  const appendAiQuestions = (newQuestions: ExerciseQuestion[]) => {
    if (!newQuestions.length) return;
    setQuestions((list) => {
      const next = [...list, ...newQuestions];
      setActiveIndex(list.length);
      return next;
    });
    setValidationErrors([]);
  };

  const handleSave = async () => {
    const payload = buildPayload();
    const validation = validateExerciseSetPayload(payload);
    if (!validation.valid) {
      setValidationErrors(validation.errors);
      return;
    }
    setValidationErrors([]);
    await onSave(buildExerciseSetPayloadJson(payload));
  };

  const activeQuestion = questions[activeIndex];

  return (
    <Box sx={{ display: "grid", gap: 0, pt: 0 }}>
      <Accordion
        disableGutters
        elevation={0}
        defaultExpanded={false}
        sx={{
          border: "1px solid #ECEAE3",
          borderRadius: "10px 10px 0 0 !important",
          "&:before": { display: "none" },
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{ minHeight: 40 }}
        >
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#0C447C" }}>
            Cài đặt bài tập
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0, pb: 1.5 }}>
          <ExerciseSetSettings settings={settings} onChange={updateSettings} />
        </AccordionDetails>
      </Accordion>

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          border: "1px solid #ECEAE3",
          borderTop: "none",
          borderRadius: "0 0 10px 10px",
          overflow: "hidden",
          bgcolor: "#fff",
        }}
      >
        <QuestionListPanel
          questions={questions}
          activeIndex={activeIndex}
          onSelect={setActiveIndex}
          onAddMcq={() => addQuestion("MULTIPLE_CHOICE")}
          onAddMatching={() => addQuestion("MATCHING")}
          onAddFillBlank={() => addQuestion("FILL_BLANK")}
          onAddGapFillMcq={() => addQuestion("GAP_FILL_MCQ")}
          onAddReading={() => addQuestion("READING_COMPREHENSION")}
          onAddReorder={() => addQuestion("REORDER_SENTENCE")}
          onAddListenTypeFromVocab={() => setListenTypePickerOpen(true)}
          onReorder={reorderQuestions}
        />

        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            bgcolor: "#F8F9FF",
            maxHeight: { md: 520 },
            overflowY: "auto",
          }}
        >
          {activeQuestion?.type === "MULTIPLE_CHOICE" ? (
            <McqQuestionCanvas
              question={activeQuestion as MultipleChoiceQuestion}
              index={activeIndex}
              canDelete={questions.length > 1}
              onChange={(next) => updateQuestion(activeIndex, next)}
              onDelete={() => deleteQuestion(activeIndex)}
              onDuplicate={() => duplicateQuestion(activeIndex)}
            />
          ) : activeQuestion?.type === "MATCHING" ? (
            <MatchingQuestionCanvas
              question={activeQuestion as MatchingQuestion}
              index={activeIndex}
              canDelete={questions.length > 1}
              onChange={(next) => updateQuestion(activeIndex, next)}
              onDelete={() => deleteQuestion(activeIndex)}
              onDuplicate={() => duplicateQuestion(activeIndex)}
            />
          ) : activeQuestion?.type === "LISTEN_CHOOSE" ? (
            <ListenChooseQuestionCanvas
              question={activeQuestion as ListenChooseQuestion}
              index={activeIndex}
              canDelete={questions.length > 1}
              onDelete={() => deleteQuestion(activeIndex)}
              onDuplicate={() => duplicateQuestion(activeIndex)}
            />
          ) : activeQuestion?.type === "SPELLING" || activeQuestion?.type === "LISTEN_TYPE" ? (
            <TypedExerciseQuestionCanvas
              question={activeQuestion as SpellingQuestion | ListenTypeQuestion}
              index={activeIndex}
              canDelete={questions.length > 1}
              onDelete={() => deleteQuestion(activeIndex)}
              onDuplicate={() => duplicateQuestion(activeIndex)}
            />
          ) : activeQuestion?.type === "FILL_BLANK" ? (
            <FillBlankQuestionCanvas
              question={activeQuestion as FillBlankQuestion}
              index={activeIndex}
              canDelete={questions.length > 1}
              onChange={(next) => updateQuestion(activeIndex, next)}
              onDelete={() => deleteQuestion(activeIndex)}
              onDuplicate={() => duplicateQuestion(activeIndex)}
            />
          ) : activeQuestion?.type === "GAP_FILL_MCQ" ? (
            <GapFillMcqQuestionCanvas
              question={activeQuestion as GapFillMcqQuestion}
              index={activeIndex}
              canDelete={questions.length > 1}
              onChange={(next) => updateQuestion(activeIndex, next)}
              onDelete={() => deleteQuestion(activeIndex)}
              onDuplicate={() => duplicateQuestion(activeIndex)}
            />
          ) : activeQuestion?.type === "READING_COMPREHENSION" ? (
            <ReadingComprehensionQuestionCanvas
              question={activeQuestion as ReadingComprehensionQuestion}
              index={activeIndex}
              canDelete={questions.length > 1}
              onChange={(next) => updateQuestion(activeIndex, next)}
              onDelete={() => deleteQuestion(activeIndex)}
              onDuplicate={() => duplicateQuestion(activeIndex)}
            />
          ) : activeQuestion?.type === "REORDER_SENTENCE" ? (
            <ReorderSentenceQuestionCanvas
              question={activeQuestion as ReorderSentenceQuestion}
              index={activeIndex}
              canDelete={questions.length > 1}
              onChange={(next) => updateQuestion(activeIndex, next)}
              onDelete={() => deleteQuestion(activeIndex)}
              onDuplicate={() => duplicateQuestion(activeIndex)}
            />
          ) : (
            <Typography
              sx={{ fontSize: 13, color: "#888780", fontStyle: "italic", p: 2 }}
            >
              Chọn hoặc thêm câu hỏi bên trái.
            </Typography>
          )}
        </Box>
      </Box>

      <ExerciseAuthoringFooter
        questionCount={questions.length}
        onImportExcel={() => {
          setImportFormat("excel");
          setImportOpen(true);
        }}
        onImportCsv={() => {
          setImportFormat("csv");
          setImportOpen(true);
        }}
        onAiGen={() => setAiGenOpen(true)}
      />

      <AiExerciseGenDialog
        open={aiGenOpen}
        onClose={() => setAiGenOpen(false)}
        onApplied={appendAiQuestions}
      />

      <ExerciseImportDialog
        open={importOpen}
        format={importFormat}
        currentPayload={buildPayload()}
        onClose={() => setImportOpen(false)}
        onApplied={applyImportedPayload}
      />

      <VocabularyWordPicker
        open={listenTypePickerOpen}
        onClose={() => setListenTypePickerOpen(false)}
        onSelect={appendListenTypeFromVocab}
      />

      {listenTypeFeedback ? (
        <Alert
          severity={listenTypeFeedback.severity}
          sx={{ fontSize: 12, mt: 1 }}
          onClose={() => setListenTypeFeedback(null)}
        >
          {listenTypeFeedback.message}
        </Alert>
      ) : null}

      {validationErrors.length > 0 ? (
        <Alert severity="error" sx={{ fontSize: 12, mt: 1 }}>
          {validationErrors.map((msg) => (
            <Box key={msg}>{msg}</Box>
          ))}
        </Alert>
      ) : null}

      {error ? (
        <Typography color="error" fontSize={12} sx={{ mt: 0.5 }}>
          {error}
        </Typography>
      ) : null}

      <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end", mt: 1, px: 1.25, pb: 1.25 }}>
        <Button size="small" sx={muFooterBtnOutlined} onClick={onCancel}>
          Hủy
        </Button>
        <Button
          size="small"
          variant="contained"
          sx={muBtnSmPrimary}
          disabled={saving}
          onClick={() => void handleSave()}
        >
          {saving ? "Đang lưu..." : "Lưu bài tập"}
        </Button>
      </Box>
    </Box>
  );
}

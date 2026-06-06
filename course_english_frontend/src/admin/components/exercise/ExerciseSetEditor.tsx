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
  createEmptyMcqQuestion,
  generateQuestionId,
  validateExerciseSetPayload,
} from "../../../shared/lesson/exercisePayload";
import { parseExerciseSetPayload } from "../../../student/lessonPlayer/exercise/parseExerciseSet";
import type {
  ExerciseQuestion,
  ExerciseSetPayload,
  MultipleChoiceQuestion,
} from "../../../student/lessonPlayer/exercise/types";
import { ExerciseAuthoringFooter } from "./ExerciseAuthoringFooter";
import { ExerciseImportDialog, type ExerciseImportFormat } from "./ExerciseImportDialog";
import { ExerciseSetSettings } from "./ExerciseSetSettings";
import { McqQuestionCanvas } from "./McqQuestionCanvas";
import { QuestionListPanel } from "./QuestionListPanel";

type ExerciseSetEditorProps = {
  payloadJson: string;
  saving: boolean;
  error?: string;
  onSave: (payloadJson: string) => Promise<void>;
  onCancel: () => void;
};

function splitQuestions(questions: ExerciseQuestion[]) {
  const mcq: MultipleChoiceQuestion[] = [];
  const other: ExerciseQuestion[] = [];
  for (const q of questions) {
    if (q.type === "MULTIPLE_CHOICE") mcq.push(q);
    else other.push(q);
  }
  return { mcq, other };
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
  const initial = useMemo(
    () => splitQuestions(parsed.questions),
    [parsed.questions],
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
  const [mcqQuestions, setMcqQuestions] = useState<MultipleChoiceQuestion[]>(
    () => (initial.mcq.length ? initial.mcq : [createEmptyMcqQuestion("q1")]),
  );
  const [preservedOther, setPreservedOther] = useState<ExerciseQuestion[]>(
    () => initial.other,
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [importOpen, setImportOpen] = useState(false);
  const [importFormat, setImportFormat] = useState<ExerciseImportFormat>("csv");

  useEffect(() => {
    const next = parseExerciseSetPayload(payloadJson);
    const split = splitQuestions(next.questions);
    setSettings({
      title: next.title,
      instruction: next.instruction,
      presentation: next.presentation,
      shuffleQuestions: next.shuffleQuestions,
      shuffleOptions: next.shuffleOptions,
      passScorePercent: next.passScorePercent,
    });
    setMcqQuestions(
      split.mcq.length ? split.mcq : [createEmptyMcqQuestion("q1")],
    );
    setPreservedOther(split.other);
    setActiveIndex(0);
    setValidationErrors([]);
  }, [payloadJson]);

  const buildPayload = (): ExerciseSetPayload => ({
    ...settings,
    questions: [...mcqQuestions, ...preservedOther],
  });

  const updateSettings = (patch: Partial<ExerciseSetPayload>) => {
    setSettings((s) => ({ ...s, ...patch }));
  };

  const updateQuestion = (index: number, next: MultipleChoiceQuestion) => {
    setMcqQuestions((list) => list.map((q, i) => (i === index ? next : q)));
  };

  const addQuestion = () => {
    setMcqQuestions((list) => {
      const next = [...list, createEmptyMcqQuestion()];
      setActiveIndex(next.length - 1);
      return next;
    });
  };

  const deleteQuestion = (index: number) => {
    setMcqQuestions((list) => {
      const next = list.filter((_, i) => i !== index);
      setActiveIndex((prev) => Math.min(prev, Math.max(0, next.length - 1)));
      return next.length ? next : [createEmptyMcqQuestion()];
    });
  };

  const duplicateQuestion = (index: number) => {
    setMcqQuestions((list) => {
      const source = list[index];
      const copy: MultipleChoiceQuestion = {
        ...source,
        id: generateQuestionId(),
        prompt: { ...source.prompt },
        choices: source.choices.map((c) => ({ ...c })),
      };
      const next = [
        ...list.slice(0, index + 1),
        copy,
        ...list.slice(index + 1),
      ];
      setActiveIndex(index + 1);
      return next;
    });
  };

  const reorderQuestions = (fromIndex: number, toIndex: number) => {
    setMcqQuestions((list) => {
      const activeId = list[activeIndex]?.id;
      const next = arrayMove(list, fromIndex, toIndex);
      const newActiveIndex = activeId ? next.findIndex((q) => q.id === activeId) : activeIndex;
      if (newActiveIndex >= 0) setActiveIndex(newActiveIndex);
      return next;
    });
  };

  const applyImportedPayload = (next: ExerciseSetPayload) => {
    const split = splitQuestions(next.questions);
    setSettings({
      title: next.title,
      instruction: next.instruction,
      presentation: next.presentation,
      shuffleQuestions: next.shuffleQuestions,
      shuffleOptions: next.shuffleOptions,
      passScorePercent: next.passScorePercent,
    });
    setMcqQuestions(split.mcq.length ? split.mcq : [createEmptyMcqQuestion("q1")]);
    setPreservedOther(split.other);
    setActiveIndex(0);
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

  const activeQuestion = mcqQuestions[activeIndex];

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

      {preservedOther.length > 0 ? (
        <Alert severity="info" sx={{ fontSize: 12, py: 0.25, borderRadius: 0 }}>
          Giữ nguyên {preservedOther.length} câu loại khác (Matching, …) khi
          lưu.
        </Alert>
      ) : null}

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          border: "1px solid #ECEAE3",
          borderTop: preservedOther.length ? undefined : "none",
          borderRadius: preservedOther.length ? 0 : "0 0 10px 10px",
          overflow: "hidden",
          bgcolor: "#fff",
        }}
      >
        <QuestionListPanel
          questions={mcqQuestions}
          activeIndex={activeIndex}
          onSelect={setActiveIndex}
          onAdd={addQuestion}
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
          {activeQuestion ? (
            <McqQuestionCanvas
              question={activeQuestion}
              index={activeIndex}
              canDelete={mcqQuestions.length > 1}
              onChange={(next) => updateQuestion(activeIndex, next)}
              onDelete={() => deleteQuestion(activeIndex)}
              onDuplicate={() => duplicateQuestion(activeIndex)}
            />
          ) : (
            <Typography
              sx={{ fontSize: 13, color: "#888780", fontStyle: "italic" }}
            >
              Chọn hoặc thêm câu hỏi bên trái.
            </Typography>
          )}
        </Box>
      </Box>

      <ExerciseAuthoringFooter
        questionCount={mcqQuestions.length}
        onImportExcel={() => {
          setImportFormat("excel");
          setImportOpen(true);
        }}
        onImportCsv={() => {
          setImportFormat("csv");
          setImportOpen(true);
        }}
      />

      <ExerciseImportDialog
        open={importOpen}
        format={importFormat}
        currentPayload={buildPayload()}
        onClose={() => setImportOpen(false)}
        onApplied={applyImportedPayload}
      />

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

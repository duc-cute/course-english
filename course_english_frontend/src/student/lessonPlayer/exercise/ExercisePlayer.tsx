import QuizOutlinedIcon from "@mui/icons-material/QuizOutlined";
import { Alert, Button } from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { LessonBlockRecord } from "../../../shared/api/lesson";
import { getExerciseSession, saveExerciseSession } from "../exerciseSessionStorage";
import { flattenExerciseBlocks } from "./flattenExerciseBlocks";
import { MultipleChoiceQuestion } from "./MultipleChoiceQuestion";
import { QuestionFeedback } from "./QuestionFeedback";
import { QuestionProgressBar } from "./QuestionProgressBar";
import type { MultipleChoiceQuestion as McqType } from "./types";

type ExercisePlayerProps = {
  lessonId: string;
  lessonTitle: string;
  practiceBlocks: LessonBlockRecord[];
};

type AnswerRecord = {
  correct: boolean;
};

export function ExercisePlayer({ lessonId, lessonTitle, practiceBlocks }: ExercisePlayerProps) {
  const items = useMemo(() => flattenExerciseBlocks(practiceBlocks), [practiceBlocks]);
  const total = items.length;

  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [phase, setPhase] = useState<"answer" | "feedback" | "done">("answer");
  const [answers, setAnswers] = useState<Record<string, AnswerRecord>>({});

  const blockIdsKey = useMemo(() => practiceBlocks.map((b) => b.id).join(","), [practiceBlocks]);

  useEffect(() => {
    const saved = getExerciseSession(lessonId);
    if (saved && saved.blockIds.join(",") === blockIdsKey && saved.questionIndex < total) {
      setQuestionIndex(saved.completed ? total - 1 : saved.questionIndex);
      if (saved.completed) setPhase("done");
    } else {
      setQuestionIndex(0);
      setPhase("answer");
    }
    setSelectedChoiceId(null);
    setAnswers({});
  }, [lessonId, blockIdsKey, total]);

  const current = items[questionIndex];
  const currentMcq = current?.question.type === "MULTIPLE_CHOICE" ? (current.question as McqType) : null;

  const correctCount = Object.values(answers).filter((a) => a.correct).length;
  const answeredCount = Object.keys(answers).length;

  const persistSession = useCallback(
    (index: number, completed: boolean) => {
      saveExerciseSession({
        lessonId,
        blockIds: practiceBlocks.map((b) => b.id),
        questionIndex: index,
        completed,
        updatedAt: Date.now(),
      });
    },
    [lessonId, practiceBlocks],
  );

  const handleCheck = () => {
    if (!currentMcq || !selectedChoiceId) return;
    const correct = selectedChoiceId === currentMcq.correctChoiceId;
    setAnswers((prev) => ({ ...prev, [currentMcq.id]: { correct } }));
    setPhase("feedback");
  };

  const handleNext = () => {
    if (questionIndex >= total - 1) {
      setPhase("done");
      persistSession(questionIndex, true);
      return;
    }
    const next = questionIndex + 1;
    setQuestionIndex(next);
    setSelectedChoiceId(null);
    setPhase("answer");
    persistSession(next, false);
  };

  if (total === 0) {
    return (
      <Alert severity="info" sx={{ borderRadius: "14px" }}>
        Bài học chưa có bài tập. Giáo viên cần thêm block <strong>EXERCISE_SET</strong>.
      </Alert>
    );
  }

  if (phase === "done") {
    const scorePct = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    return (
      <div className="exercise-player exercise-player--done">
        <div className="exercise-done-card">
          <QuizOutlinedIcon sx={{ fontSize: 40, color: "var(--eng-teal, #0d9488)", mb: 1 }} />
          <h2 className="exercise-done-title">Hoàn thành bài tập</h2>
          <p className="exercise-done-score">
            {correctCount} / {total} câu đúng ({scorePct}%)
          </p>
          <Button
            className="student-btn-teal"
            variant="contained"
            sx={{ textTransform: "none", borderRadius: "999px", mt: 2 }}
            onClick={() => {
              setQuestionIndex(0);
              setSelectedChoiceId(null);
              setPhase("answer");
              setAnswers({});
              persistSession(0, false);
            }}
          >
            Làm lại
          </Button>
        </div>
      </div>
    );
  }

  if (!current || !currentMcq) {
    return (
      <Alert severity="warning" sx={{ borderRadius: "14px" }}>
        Dạng câu <strong>{current?.question.type ?? "unknown"}</strong> sẽ hỗ trợ ở bản tiếp theo.
      </Alert>
    );
  }

  const showFeedback = phase === "feedback";
  const lastAnswer = answers[currentMcq.id];

  return (
    <div className="exercise-player">
      <QuestionProgressBar current={questionIndex + 1} total={total} />

      <header className="exercise-player-head">
        <div className="exercise-player-eyebrow">
          <QuizOutlinedIcon sx={{ fontSize: 18 }} />
          {current.blockTitle || lessonTitle}
        </div>
        {current.instruction ? <p className="exercise-player-instruction">{current.instruction}</p> : null}
      </header>

      <MultipleChoiceQuestion
        question={currentMcq}
        selectedId={selectedChoiceId}
        disabled={showFeedback}
        showResult={showFeedback}
        onSelect={setSelectedChoiceId}
      />

      {showFeedback && lastAnswer ? (
        <QuestionFeedback correct={lastAnswer.correct} explanation={currentMcq.explanation} />
      ) : null}

      <div className="exercise-player-actions">
        {!showFeedback ? (
          <Button
            className="student-btn-teal"
            variant="contained"
            fullWidth
            disabled={!selectedChoiceId}
            onClick={handleCheck}
            sx={{ textTransform: "none", borderRadius: "999px", py: 1.25, fontWeight: 600 }}
          >
            KIỂM TRA
          </Button>
        ) : (
          <Button
            className="student-btn-teal"
            variant="contained"
            fullWidth
            onClick={handleNext}
            sx={{ textTransform: "none", borderRadius: "999px", py: 1.25, fontWeight: 600 }}
          >
            {questionIndex >= total - 1 ? "Xem kết quả" : "Câu tiếp theo"}
          </Button>
        )}
      </div>

      {answeredCount > 0 && phase === "answer" ? (
        <p className="exercise-player-hint">Đã trả lời {answeredCount} câu trong phiên này.</p>
      ) : null}
    </div>
  );
}

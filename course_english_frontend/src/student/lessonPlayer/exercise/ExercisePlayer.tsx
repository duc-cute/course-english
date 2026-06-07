import { Alert, Button } from "@mui/material";
import QuizOutlinedIcon from "@mui/icons-material/QuizOutlined";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LessonBlockRecord } from "../../../shared/api/lesson";
import {
  clearExerciseSession,
  getExerciseSession,
  saveExerciseSession,
  type ExerciseAnswerSnapshot,
} from "../exerciseSessionStorage";
import { ExerciseResultScreen } from "./ExerciseResultScreen";
import { ExerciseReviewScreen } from "./ExerciseReviewScreen";
import { isMatchingComplete, scoreMatchingAnswer } from "./matchingUtils";
import { MatchingQuestion } from "./MatchingQuestion";
import { MultipleChoiceQuestion } from "./MultipleChoiceQuestion";
import { prepareExercisePlan } from "./prepareExerciseItems";
import { QuestionExplanationPanel } from "./QuestionExplanationPanel";
import { QuestionProgressBar } from "./QuestionProgressBar";
import type { MatchingQuestion as MatchingType, MultipleChoiceQuestion as McqType } from "./types";

type ExercisePlayerProps = {
  lessonId: string;
  lessonTitle: string;
  subjectName?: string;
  practiceBlocks: LessonBlockRecord[];
  nextLessonTitle?: string;
  onViewChange?: (view: "exercise" | "result" | "review") => void;
  onContinueStudy?: () => void;
  onBackToLessons?: () => void;
};

type AnswerRecord = ExerciseAnswerSnapshot;
type PlayerPhase = "answer" | "feedback" | "done" | "review";

export function ExercisePlayer({
  lessonId,
  lessonTitle,
  subjectName,
  practiceBlocks,
  nextLessonTitle,
  onViewChange,
  onContinueStudy,
  onBackToLessons,
}: ExercisePlayerProps) {
  const blockIdsKey = useMemo(() => practiceBlocks.map((b) => b.id).join(","), [practiceBlocks]);
  const blockIds = useMemo(() => practiceBlocks.map((b) => b.id), [practiceBlocks]);

  const [sessionSeed, setSessionSeed] = useState(0);
  const initializedRef = useRef(false);
  const startedAtRef = useRef<number | null>(null);

  const plan = useMemo(() => {
    const saved = getExerciseSession(lessonId);
    const canRestore =
      saved &&
      saved.blockIds.join(",") === blockIdsKey &&
      sessionSeed === 0;

    return prepareExercisePlan(
      practiceBlocks,
      canRestore ? saved.questionIdsOrder : undefined,
      canRestore ? saved.choiceOrders : undefined,
    );
  }, [practiceBlocks, lessonId, blockIdsKey, sessionSeed]);

  const items = plan.items;
  const total = items.length;
  const passScorePercent = plan.passScorePercent;

  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [matchingSelections, setMatchingSelections] = useState<Record<string, string>>({});
  const [activeMatchingLeft, setActiveMatchingLeft] = useState<string | null>(null);
  const [phase, setPhase] = useState<PlayerPhase>("answer");
  const [answers, setAnswers] = useState<Record<string, AnswerRecord>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    initializedRef.current = false;
    startedAtRef.current = null;
  }, [lessonId, blockIdsKey]);

  useEffect(() => {
    if (initializedRef.current || total === 0) return;

    const saved = getExerciseSession(lessonId);
    if (saved && saved.blockIds.join(",") === blockIdsKey) {
      const restoredAnswers = saved.answers ?? {};
      setAnswers(restoredAnswers);

      if (saved.startedAt) {
        startedAtRef.current = saved.startedAt;
      }

      if (saved.completed) {
        setQuestionIndex(Math.max(0, total - 1));
        setPhase("done");
        setElapsedMs(saved.elapsedMs ?? 0);
      } else {
        const idx = Math.min(saved.questionIndex, total - 1);
        setQuestionIndex(idx);
        setPhase("answer");
        setElapsedMs(0);
      }
    } else {
      setQuestionIndex(0);
      setPhase("answer");
      setAnswers({});
      setElapsedMs(0);
    }

    setSelectedChoiceId(null);
    setMatchingSelections({});
    setActiveMatchingLeft(null);
    setShowExplanation(false);
    initializedRef.current = true;
  }, [lessonId, blockIdsKey, total, sessionSeed]);

  const current = items[questionIndex];
  const currentMcq =
    current?.displayQuestion.type === "MULTIPLE_CHOICE"
      ? (current.displayQuestion as McqType)
      : null;
  const currentMatching =
    current?.displayQuestion.type === "MATCHING"
      ? (current.displayQuestion as MatchingType)
      : null;

  useEffect(() => {
    if (!current) return;
    const saved = answers[current.displayQuestion.id];
    if (currentMcq) {
      setSelectedChoiceId(saved?.selectedChoiceId ?? null);
      setMatchingSelections({});
      setActiveMatchingLeft(null);
      return;
    }
    if (currentMatching) {
      setMatchingSelections(saved?.matchingSelections ?? {});
      setActiveMatchingLeft(null);
      setSelectedChoiceId(null);
    }
  }, [questionIndex, current?.displayQuestion.id, currentMcq, currentMatching, answers]);

  useEffect(() => {
    if (phase === "done" || phase === "review") {
      onViewChange?.(phase === "review" ? "review" : "result");
    } else {
      onViewChange?.("exercise");
    }
  }, [phase, onViewChange]);

  const correctCount = Object.values(answers).filter((a) => a.correct).length;
  const answeredCount = Object.keys(answers).length;
  const scorePct = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const passed = scorePct >= passScorePercent;

  const ensureStartedAt = useCallback(() => {
    if (startedAtRef.current) return startedAtRef.current;
    const saved = getExerciseSession(lessonId);
    const startedAt = saved?.startedAt ?? Date.now();
    startedAtRef.current = startedAt;
    return startedAt;
  }, [lessonId]);

  const persistSession = useCallback(
    (
      index: number,
      completed: boolean,
      nextAnswers: Record<string, AnswerRecord>,
      extra?: { elapsedMs?: number },
    ) => {
      const startedAt = ensureStartedAt();
      saveExerciseSession({
        lessonId,
        blockIds,
        questionIndex: index,
        completed,
        questionIdsOrder: plan.questionIdsOrder,
        choiceOrders: plan.choiceOrders,
        answers: nextAnswers,
        startedAt,
        elapsedMs: extra?.elapsedMs,
      });
    },
    [lessonId, blockIds, plan.questionIdsOrder, plan.choiceOrders, ensureStartedAt],
  );

  const handleCheck = () => {
    if (!current) return;
    ensureStartedAt();

    if (currentMcq && selectedChoiceId) {
      const correct = selectedChoiceId === currentMcq.correctChoiceId;
      const nextAnswers = {
        ...answers,
        [currentMcq.id]: { correct, selectedChoiceId },
      };
      setAnswers(nextAnswers);
      setShowExplanation(false);
      setPhase("feedback");
      persistSession(questionIndex, false, nextAnswers);
      return;
    }

    if (currentMatching && isMatchingComplete(currentMatching.pairs, matchingSelections)) {
      const correct = scoreMatchingAnswer(currentMatching.pairs, matchingSelections);
      const nextAnswers = {
        ...answers,
        [currentMatching.id]: {
          correct,
          matchingSelections: { ...matchingSelections },
        },
      };
      setAnswers(nextAnswers);
      setShowExplanation(false);
      setActiveMatchingLeft(null);
      setPhase("feedback");
      persistSession(questionIndex, false, nextAnswers);
    }
  };

  const handleSelectMatchingLeft = (left: string) => {
    if (phase !== "answer") return;
    setActiveMatchingLeft((prev) => (prev === left ? null : left));
  };

  const handleSelectMatchingRight = (right: string) => {
    if (phase !== "answer" || !activeMatchingLeft) return;
    setMatchingSelections((prev) => {
      const next = { ...prev };
      for (const [left, value] of Object.entries(next)) {
        if (value === right) delete next[left];
      }
      next[activeMatchingLeft] = right;
      return next;
    });
    setActiveMatchingLeft(null);
  };

  const handleNext = () => {
    if (questionIndex >= total - 1) {
      const startedAt = ensureStartedAt();
      const elapsed = Date.now() - startedAt;
      setElapsedMs(elapsed);
      setPhase("done");
      persistSession(questionIndex, true, answers, { elapsedMs: elapsed });
      return;
    }
    const next = questionIndex + 1;
    setQuestionIndex(next);
    setSelectedChoiceId(null);
    setMatchingSelections({});
    setActiveMatchingLeft(null);
    setShowExplanation(false);
    setPhase("answer");
    persistSession(next, false, answers);
  };

  const handleRetry = () => {
    clearExerciseSession(lessonId);
    initializedRef.current = false;
    startedAtRef.current = null;
    setQuestionIndex(0);
    setSelectedChoiceId(null);
    setMatchingSelections({});
    setActiveMatchingLeft(null);
    setPhase("answer");
    setAnswers({});
    setShowExplanation(false);
    setElapsedMs(0);
    setSessionSeed((s) => s + 1);
  };

  const canCheck = currentMcq
    ? Boolean(selectedChoiceId)
    : currentMatching
      ? isMatchingComplete(currentMatching.pairs, matchingSelections)
      : false;

  const currentExplanation = currentMcq?.explanation ?? currentMatching?.explanation;

  if (total === 0) {
    const hasPracticeBlocks = practiceBlocks.length > 0;
    return (
      <Alert severity="info" sx={{ borderRadius: "14px" }}>
        {hasPracticeBlocks
          ? "Bài tập chưa có câu hỏi hợp lệ."
          : "Bài học chưa có bài tập. Giáo viên cần thêm block EXERCISE_SET hoặc QUESTION_REF."}
      </Alert>
    );
  }

  if (phase === "review") {
    return (
      <ExerciseReviewScreen
        lessonTitle={lessonTitle}
        items={items}
        answers={answers}
        onBack={() => setPhase("done")}
      />
    );
  }

  if (phase === "done") {
    return (
      <ExerciseResultScreen
        lessonTitle={lessonTitle}
        subjectName={subjectName}
        practiceBlocks={practiceBlocks}
        correctCount={correctCount}
        total={total}
        passScorePercent={passScorePercent}
        elapsedMs={elapsedMs}
        passed={passed}
        nextLessonTitle={nextLessonTitle}
        onReview={() => setPhase("review")}
        onRetry={handleRetry}
        onContinueStudy={onContinueStudy}
        onBackToLessons={onBackToLessons}
      />
    );
  }

  if (!current || (!currentMcq && !currentMatching)) {
    return (
      <Alert severity="warning" sx={{ borderRadius: "14px" }}>
        Dạng câu <strong>{current?.displayQuestion.type ?? "unknown"}</strong> sẽ hỗ trợ ở bản tiếp theo.
      </Alert>
    );
  }

  const showFeedback = phase === "feedback";

  return (
    <div className="exercise-player">
      <QuestionProgressBar current={questionIndex + 1} total={total} />

      <header className="exercise-player-head">
        <div className="exercise-player-eyebrow">
          <QuizOutlinedIcon sx={{ fontSize: 18 }} />
          {current.blockTitle || lessonTitle}
        </div>
        {current.instruction ? <p className="exercise-player-instruction">{current.instruction}</p> : null}
        <p className="exercise-player-meta">
          Cần đạt {passScorePercent}% để hoàn thành
          {answeredCount > 0 ? ` · Đúng ${correctCount}/${answeredCount} câu đã làm` : null}
        </p>
      </header>

      {currentMcq ? (
        <MultipleChoiceQuestion
          question={currentMcq}
          selectedId={selectedChoiceId}
          disabled={showFeedback}
          showResult={showFeedback}
          onSelect={setSelectedChoiceId}
        />
      ) : null}

      {currentMatching ? (
        <MatchingQuestion
          question={currentMatching}
          selections={matchingSelections}
          activeLeft={activeMatchingLeft}
          disabled={showFeedback}
          showResult={showFeedback}
          onSelectLeft={handleSelectMatchingLeft}
          onSelectRight={handleSelectMatchingRight}
        />
      ) : null}

      {showFeedback && showExplanation && currentExplanation?.trim() ? (
        <QuestionExplanationPanel explanation={currentExplanation} />
      ) : null}

      <div className={`exercise-player-actions${showFeedback ? " exercise-player-actions--row" : ""}`}>
        {!showFeedback ? (
          <Button
            className="exercise-btn-check"
            variant="contained"
            fullWidth
            disabled={!canCheck}
            onClick={handleCheck}
          >
            KIỂM TRA
          </Button>
        ) : (
          <>
            <Button
              className="exercise-btn-explain"
              variant="outlined"
              disabled={!currentExplanation?.trim()}
              onClick={() => setShowExplanation((v) => !v)}
              sx={{ textTransform: "none", borderRadius: "999px", py: 1.25, fontWeight: 600, flexShrink: 0 }}
            >
              GIẢI THÍCH
            </Button>
            <Button
              className="exercise-btn-continue student-btn-teal"
              variant="contained"
              fullWidth
              onClick={handleNext}
            >
              {questionIndex >= total - 1 ? "XEM KẾT QUẢ" : "LÀM TIẾP"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

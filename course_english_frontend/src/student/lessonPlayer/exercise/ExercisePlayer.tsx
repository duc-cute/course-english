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
import {
  apiCreateLessonPracticeAttempt,
  apiGetLatestLessonPracticeAttempt,
  type LessonPracticeAttemptRecord,
} from "../../../shared/api/lessonPracticeAttempt";
import { buildStructuredSnapshot, parseAttemptSnapshot } from "../../../shared/lesson/attemptSnapshot";
import { ExerciseResultScreen } from "./ExerciseResultScreen";
import { ExerciseReviewScreen } from "./ExerciseReviewScreen";
import { PracticeAttemptBanner } from "./PracticeAttemptBanner";
import { isMatchingComplete, scoreMatchingAnswer } from "./matchingUtils";
import { ListenChooseQuestion } from "./ListenChooseQuestion";
import { ListenTypeQuestion } from "./ListenTypeQuestion";
import { MatchingQuestion } from "./MatchingQuestion";
import { MultipleChoiceQuestion } from "./MultipleChoiceQuestion";
import { FillBlankQuestion } from "./FillBlankQuestion";
import { SpellingQuestion } from "./SpellingQuestion";
import { prepareExercisePlan, type PreparedExerciseItem } from "./prepareExerciseItems";
import { QuestionExplanationPanel } from "./QuestionExplanationPanel";
import { QuestionProgressBar } from "./QuestionProgressBar";
import { compareTypedAnswers } from "../../../shared/lesson/answerNormalize";
import { compareFillBlankAnswers, isFillBlankComplete } from "../../../shared/lesson/fillBlankUtils";
import type {
  ListenChooseQuestion as ListenChooseType,
  FillBlankQuestion as FillBlankType,
  ListenTypeQuestion as ListenTypeQuestionModel,
  MatchingQuestion as MatchingType,
  MultipleChoiceQuestion as McqType,
  SpellingQuestion as SpellingType,
} from "./types";

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
  const attemptSubmitLockRef = useRef(false);

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
  const [typedAnswer, setTypedAnswer] = useState("");
  const [fillBlankAnswers, setFillBlankAnswers] = useState<Record<string, string>>({});
  const [matchingSelections, setMatchingSelections] = useState<Record<string, string>>({});
  const [activeMatchingLeft, setActiveMatchingLeft] = useState<string | null>(null);
  const [phase, setPhase] = useState<PlayerPhase>("answer");
  const [answers, setAnswers] = useState<Record<string, AnswerRecord>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [serverLatestAttempt, setServerLatestAttempt] = useState<LessonPracticeAttemptRecord | null>(
    null,
  );
  const [reviewItems, setReviewItems] = useState<PreparedExerciseItem[] | null>(null);
  const [reviewAnswers, setReviewAnswers] = useState<Record<string, AnswerRecord> | null>(null);

  useEffect(() => {
    let cancelled = false;
    void apiGetLatestLessonPracticeAttempt(lessonId).then((attempt) => {
      if (!cancelled) setServerLatestAttempt(attempt);
    });
    return () => {
      cancelled = true;
    };
  }, [lessonId, sessionSeed]);

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
        if (saved.serverAttemptSynced) {
          attemptSubmitLockRef.current = true;
        }
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
    setTypedAnswer("");
    setFillBlankAnswers({});
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
  const currentListen =
    current?.displayQuestion.type === "LISTEN_CHOOSE"
      ? (current.displayQuestion as ListenChooseType)
      : null;
  const currentSpelling =
    current?.displayQuestion.type === "SPELLING"
      ? (current.displayQuestion as SpellingType)
      : null;
  const currentListenType =
    current?.displayQuestion.type === "LISTEN_TYPE"
      ? (current.displayQuestion as ListenTypeQuestionModel)
      : null;
  const currentFillBlank =
    current?.displayQuestion.type === "FILL_BLANK"
      ? (current.displayQuestion as FillBlankType)
      : null;
  const currentMatching =
    current?.displayQuestion.type === "MATCHING"
      ? (current.displayQuestion as MatchingType)
      : null;

  useEffect(() => {
    if (!current) return;
    const saved = answers[current.displayQuestion.id];
    if (currentMcq || currentListen) {
      setSelectedChoiceId(saved?.selectedChoiceId ?? null);
      setTypedAnswer("");
      setMatchingSelections({});
      setActiveMatchingLeft(null);
      return;
    }
    if (currentSpelling || currentListenType) {
      setTypedAnswer(saved?.typedAnswer ?? "");
      setFillBlankAnswers({});
      setSelectedChoiceId(null);
      setMatchingSelections({});
      setActiveMatchingLeft(null);
      return;
    }
    if (currentFillBlank) {
      setFillBlankAnswers(saved?.fillBlankAnswers ?? {});
      setTypedAnswer("");
      setSelectedChoiceId(null);
      setMatchingSelections({});
      setActiveMatchingLeft(null);
      return;
    }
    if (currentMatching) {
      setMatchingSelections(saved?.matchingSelections ?? {});
      setActiveMatchingLeft(null);
      setSelectedChoiceId(null);
    }
  }, [questionIndex, current?.displayQuestion.id, currentMcq, currentListen, currentSpelling, currentListenType, currentFillBlank, currentMatching, answers]);

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
      extra?: { elapsedMs?: number; serverAttemptSynced?: boolean },
    ) => {
      const startedAt = ensureStartedAt();
      const prev = getExerciseSession(lessonId);
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
        serverAttemptSynced: extra?.serverAttemptSynced ?? prev?.serverAttemptSynced,
      });
    },
    [lessonId, blockIds, plan.questionIdsOrder, plan.choiceOrders, ensureStartedAt],
  );

  const submitPracticeAttempt = useCallback(
    async (
      finalAnswers: Record<string, AnswerRecord>,
      elapsed: number,
      index: number,
    ) => {
      if (attemptSubmitLockRef.current || total === 0) return;

      const correct = Object.values(finalAnswers).filter((a) => a.correct).length;
      const pct = Math.round((correct / total) * 100);
      const didPass = pct >= passScorePercent;

      attemptSubmitLockRef.current = true;
      try {
        const attempt = await apiCreateLessonPracticeAttempt({
          lessonId,
          correctCount: correct,
          totalCount: total,
          scorePercent: pct,
          passed: didPass,
          passScorePercent,
          elapsedMs: elapsed,
          blockIds,
          answersSnapshot: buildStructuredSnapshot(
            finalAnswers,
            plan.questionIdsOrder,
            plan.choiceOrders,
          ),
        });
        setServerLatestAttempt(attempt);
        persistSession(index, true, finalAnswers, {
          elapsedMs: elapsed,
          serverAttemptSynced: true,
        });
      } catch {
        attemptSubmitLockRef.current = false;
      }
    },
    [
      lessonId,
      blockIds,
      total,
      passScorePercent,
      persistSession,
      plan.questionIdsOrder,
      plan.choiceOrders,
    ],
  );

  const handleReview = useCallback(() => {
    if (Object.keys(answers).length > 0) {
      setReviewItems(null);
      setReviewAnswers(null);
      setPhase("review");
      return;
    }
    if (!serverLatestAttempt?.answersSnapshot) return;

    const parsed = parseAttemptSnapshot(
      serverLatestAttempt.answersSnapshot as Record<string, unknown>,
    );
    if (Object.keys(parsed.answers).length === 0) return;

    const reviewPlan = prepareExercisePlan(
      practiceBlocks,
      parsed.questionIdsOrder,
      parsed.choiceOrders,
    );
    setReviewItems(reviewPlan.items);
    setReviewAnswers(parsed.answers);
    setPhase("review");
  }, [answers, serverLatestAttempt, practiceBlocks]);

  const handleCheck = () => {
    if (!current) return;
    ensureStartedAt();

    const choiceQuestion = currentMcq ?? currentListen;
    if (choiceQuestion && selectedChoiceId) {
      const correct = selectedChoiceId === choiceQuestion.correctChoiceId;
      const nextAnswers = {
        ...answers,
        [choiceQuestion.id]: { correct, selectedChoiceId },
      };
      setAnswers(nextAnswers);
      setShowExplanation(false);
      setPhase("feedback");
      persistSession(questionIndex, false, nextAnswers);
      return;
    }

    const typedQuestion = currentSpelling ?? currentListenType;
    if (typedQuestion && typedAnswer.trim()) {
      const correct = compareTypedAnswers(typedAnswer, typedQuestion.correctAnswer, {
        caseSensitive: typedQuestion.caseSensitive,
      });
      const nextAnswers = {
        ...answers,
        [typedQuestion.id]: { correct, typedAnswer: typedAnswer.trim() },
      };
      setAnswers(nextAnswers);
      setShowExplanation(false);
      setPhase("feedback");
      persistSession(questionIndex, false, nextAnswers);
      return;
    }

    if (
      currentFillBlank &&
      isFillBlankComplete(fillBlankAnswers, currentFillBlank.blanks)
    ) {
      const correct = compareFillBlankAnswers(
        fillBlankAnswers,
        currentFillBlank.blanks,
        currentFillBlank.caseSensitive,
      );
      const nextAnswers = {
        ...answers,
        [currentFillBlank.id]: { correct, fillBlankAnswers: { ...fillBlankAnswers } },
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
      void submitPracticeAttempt(answers, elapsed, questionIndex);
      return;
    }
    const next = questionIndex + 1;
    setQuestionIndex(next);
    setSelectedChoiceId(null);
    setTypedAnswer("");
    setFillBlankAnswers({});
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
    attemptSubmitLockRef.current = false;
    setQuestionIndex(0);
    setSelectedChoiceId(null);
    setTypedAnswer("");
    setFillBlankAnswers({});
    setMatchingSelections({});
    setActiveMatchingLeft(null);
    setPhase("answer");
    setAnswers({});
    setShowExplanation(false);
    setElapsedMs(0);
    setReviewItems(null);
    setReviewAnswers(null);
    setSessionSeed((s) => s + 1);
  };

  const canCheck = currentMcq || currentListen
    ? Boolean(selectedChoiceId)
    : currentSpelling || currentListenType
      ? Boolean(typedAnswer.trim())
      : currentFillBlank
        ? isFillBlankComplete(fillBlankAnswers, currentFillBlank.blanks)
        : currentMatching
          ? isMatchingComplete(currentMatching.pairs, matchingSelections)
          : false;

  const currentExplanation =
    currentMcq?.explanation ??
    currentListen?.explanation ??
    currentSpelling?.explanation ??
    currentListenType?.explanation ??
    currentFillBlank?.explanation ??
    currentMatching?.explanation;

  const typedShowResult = phase === "feedback";
  const typedIsCorrect =
    typedShowResult && (currentSpelling ?? currentListenType)
      ? answers[(currentSpelling ?? currentListenType)!.id]?.correct === true
      : false;

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
    const displayItems = reviewItems ?? items;
    const displayAnswers = reviewAnswers ?? answers;
    const backPhase = Object.keys(answers).length > 0 ? "done" : "answer";
    return (
      <ExerciseReviewScreen
        lessonTitle={lessonTitle}
        items={displayItems}
        answers={displayAnswers}
        onBack={() => {
          setReviewItems(null);
          setReviewAnswers(null);
          setPhase(backPhase);
        }}
      />
    );
  }

  if (phase === "done") {
    return (
      <ExerciseResultScreen
        lessonTitle={lessonTitle}
        subjectName={subjectName}
        correctCount={correctCount}
        total={total}
        passScorePercent={passScorePercent}
        elapsedMs={elapsedMs}
        passed={passed}
        nextLessonTitle={nextLessonTitle}
        onReview={handleReview}
        onRetry={handleRetry}
        onContinueStudy={onContinueStudy}
        onBackToLessons={onBackToLessons}
      />
    );
  }

  const fillBlankIsCorrect =
    typedShowResult && currentFillBlank
      ? answers[currentFillBlank.id]?.correct === true
      : false;

  if (!current || (!currentMcq && !currentListen && !currentSpelling && !currentListenType && !currentFillBlank && !currentMatching)) {
    return (
      <Alert severity="warning" sx={{ borderRadius: "14px" }}>
        Dạng câu <strong>{current?.displayQuestion.type ?? "unknown"}</strong> sẽ hỗ trợ ở bản tiếp theo.
      </Alert>
    );
  }

  const showFeedback = phase === "feedback";

  const showServerBanner =
    phase === "answer" || phase === "feedback";

  return (
    <div className="exercise-player">
      {showServerBanner ? (
        <PracticeAttemptBanner latest={serverLatestAttempt} onReview={handleReview} />
      ) : null}
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

      {currentListen ? (
        <ListenChooseQuestion
          question={currentListen}
          selectedId={selectedChoiceId}
          disabled={showFeedback}
          showResult={showFeedback}
          onSelect={setSelectedChoiceId}
        />
      ) : null}

      {currentSpelling ? (
        <SpellingQuestion
          question={currentSpelling}
          value={typedAnswer}
          disabled={showFeedback}
          showResult={showFeedback}
          isCorrect={typedIsCorrect}
          onChange={setTypedAnswer}
        />
      ) : null}

      {currentListenType ? (
        <ListenTypeQuestion
          question={currentListenType}
          value={typedAnswer}
          disabled={showFeedback}
          showResult={showFeedback}
          isCorrect={typedIsCorrect}
          onChange={setTypedAnswer}
        />
      ) : null}

      {currentFillBlank ? (
        <FillBlankQuestion
          question={currentFillBlank}
          answers={fillBlankAnswers}
          disabled={showFeedback}
          showResult={showFeedback}
          isCorrect={fillBlankIsCorrect}
          onChange={(blankId, value) =>
            setFillBlankAnswers((prev) => ({ ...prev, [blankId]: value }))
          }
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

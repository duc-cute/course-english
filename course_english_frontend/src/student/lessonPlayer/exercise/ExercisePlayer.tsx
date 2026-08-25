import { Alert, Button } from "@mui/material";
import QuizOutlinedIcon from "@mui/icons-material/QuizOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useOptionalStudentDashboard } from "../../shell/StudentDashboardContext";
import { getStudentDisplayName } from "../../shared/auth/getStudentDisplayName";
import { NotificationBell } from "../../notifications/NotificationBell";
import { StudentUserMenu } from "../../shell/StudentUserMenu";
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
import {
  apiCreateVocabularyPracticeAttempt,
  apiGetLatestVocabularyPracticeAttempt,
  type VocabularyPracticeAttemptRecord,
} from "../../../shared/api/vocabularyPracticeAttempt";
import { buildStructuredSnapshot, parseAttemptSnapshot } from "../../../shared/lesson/attemptSnapshot";
import { resolveStorageAssetUrl } from "../../../shared/api/file";
import { ExerciseResultScreen } from "./ExerciseResultScreen";
import { ExerciseReviewScreen } from "./ExerciseReviewScreen";
import { PracticeAttemptBanner } from "./PracticeAttemptBanner";
import { isMatchingComplete, scoreMatchingAnswer } from "./matchingUtils";
import { collectSessionReviewWords } from "./sessionReviewWords";
import { ListenChooseQuestion } from "./ListenChooseQuestion";
import { ListenTypeQuestion } from "./ListenTypeQuestion";
import { MatchingQuestion } from "./MatchingQuestion";
import { MultipleChoiceQuestion } from "./MultipleChoiceQuestion";
import { FillBlankQuestion } from "./FillBlankQuestion";
import { GapFillMcqQuestion } from "./GapFillMcqQuestion";
import { ReadingComprehensionQuestion } from "./ReadingComprehensionQuestion";
import { ReorderSentenceQuestion } from "./ReorderSentenceQuestion";
import { SpellingQuestion } from "./SpellingQuestion";
import { TrueFalseQuestion, trueFalseCorrectChoiceId } from "./TrueFalseQuestion";
import { prepareExercisePlan, filterWrongExerciseItems, type PreparedExerciseItem } from "./prepareExerciseItems";
import { QuestionExplanationPanel } from "./QuestionExplanationPanel";
import { QuestionProgressBar } from "./QuestionProgressBar";
import { compareTypedAnswers } from "../../../shared/lesson/answerNormalize";
import { compareFillBlankAnswers, isFillBlankComplete } from "../../../shared/lesson/fillBlankUtils";
import { isGapFillMcqComplete, scoreGapFillMcq } from "../../../shared/lesson/gapFillMcqUtils";
import {
  isReadingComprehensionComplete,
  scoreReadingComprehension,
} from "../../../shared/lesson/readingComprehensionUtils";
import { compareReorderOrder, isReorderComplete } from "../../../shared/lesson/reorderSentenceUtils";
import { computeSessionScore } from "./exerciseScoring";
import { ExamTakeShell, type ExamNavCellStatus } from "../../exam/ExamTakeShell";
import {
  buildExamNavUnits,
  countAnsweredExamUnits,
  examUnitDomId,
  examUnitFlagId,
  findAdjacentPartUnitIndex,
  findUnitIndexForItem,
  isExamUnitAnswered,
} from "../../exam/examTakeNav";
import type {
  ListenChooseQuestion as ListenChooseType,
  FillBlankQuestion as FillBlankType,
  GapFillMcqQuestion as GapFillMcqType,
  ReadingComprehensionQuestion as ReadingType,
  ListenTypeQuestion as ListenTypeQuestionModel,
  MatchingQuestion as MatchingType,
  MultipleChoiceQuestion as McqType,
  ReorderSentenceQuestion as ReorderType,
  SpellingQuestion as SpellingType,
  TrueFalseQuestion as TrueFalseType,
} from "./types";

type PracticeAttemptBannerLatest =
  | LessonPracticeAttemptRecord
  | VocabularyPracticeAttemptRecord
  | null;

export type PracticeAttemptBannerContext = {
  latest: PracticeAttemptBannerLatest;
  onReview: () => void;
};

type ExercisePlayerProps = {
  lessonId: string;
  lessonTitle: string;
  subjectName?: string;
  practiceBlocks: LessonBlockRecord[];
  nextLessonTitle?: string;
  /** When false, skip practice-attempt API. Default true. */
  persistAttempts?: boolean;
  /** practice = feedback từng câu; exam = không hiện đúng/sai giữa bài. */
  mode?: "practice" | "exam";
  /** Exam: gọi khi hết câu / nộp — trả attempt từ server (điểm chấm BE). */
  onExamComplete?: (payload: {
    answers: Record<string, ExerciseAnswerSnapshot>;
    elapsedMs: number;
  }) => Promise<{
    scorePercent?: number | null;
    passed?: boolean | null;
    correctCount?: number | null;
    totalCount?: number | null;
  } | void>;
  /** When set, persist to vocabulary practice attempts instead of lesson attempts. */
  vocabularySetId?: string;
  /** Cover of the vocabulary set — shown in overview card when present. */
  coverImageUrl?: string;
  assignmentId?: string | null;
  attemptBannerPlacement?: "inline" | "hero";
  onAttemptBanner?: (ctx: PracticeAttemptBannerContext | null) => void;
  onViewChange?: (view: "exercise" | "result" | "review") => void;
  onProgressChange?: (current: number, total: number) => void;
  onContinueStudy?: () => void;
  onBackToLessons?: () => void;
  /** Exam shell: countdown label (e.g. 01:23:45) */
  examRemainingLabel?: string | null;
  /** Exam shell: Thoát */
  onExamExit?: () => void;
  /** Exam: Làm lại bằng API start attempt mới (nếu còn lượt) */
  onExamRetry?: () => void;
  /** Tăng giá trị → buộc nộp bài (hết giờ), cùng luồng nút Nộp bài */
  examForceSubmitToken?: number;
};

type AnswerRecord = ExerciseAnswerSnapshot;
type PlayerPhase = "answer" | "feedback" | "done" | "review";

export function ExercisePlayer({
  lessonId,
  lessonTitle,
  subjectName,
  practiceBlocks,
  nextLessonTitle,
  persistAttempts = true,
  mode = "practice",
  onExamComplete,
  vocabularySetId,
  coverImageUrl,
  assignmentId = null,
  attemptBannerPlacement = "inline",
  onAttemptBanner,
  onViewChange,
  onProgressChange,
  onContinueStudy,
  onBackToLessons,
  examRemainingLabel = null,
  onExamExit,
  onExamRetry,
  examForceSubmitToken = 0,
}: ExercisePlayerProps) {
  const examMode = mode === "exam";
  const blockIdsKey = useMemo(() => practiceBlocks.map((b) => b.id).join(","), [practiceBlocks]);
  const blockIds = useMemo(() => practiceBlocks.map((b) => b.id), [practiceBlocks]);

  const dashboard = useOptionalStudentDashboard();
  const isVocab = Boolean(vocabularySetId);
  const displayName = getStudentDisplayName();
  const callName = displayName ? (displayName.trim().split(" ").pop() || "bạn") : "bạn";
  const streak = dashboard?.weeklyStreakCount ?? 8;
  const xp = dashboard?.stats?.xp ?? 250;

  const [timerText, setTimerText] = useState("10:00");
  const [sessionSeed, setSessionSeed] = useState(0);

  useEffect(() => {
    if (!isVocab) return;
    let sec = 600;
    const interval = setInterval(() => {
      sec = Math.max(0, sec - 1);
      const m = Math.floor(sec / 60).toString().padStart(2, "0");
      const s = (sec % 60).toString().padStart(2, "0");
      setTimerText(`${m}:${s}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [isVocab, sessionSeed]);

  const playWordAudio = () => {
    const wordObj = currentMcq || currentListen;
    const audioUrl = (wordObj as any)?.audioUkUrl || (wordObj as any)?.audioUsUrl || (wordObj as any)?.audioUrl;
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch(() => {});
    } else {
      const text = wordObj?.wordEn || (current?.displayQuestion as any)?.prompt?.text;
      if (text) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "en-US";
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  const [questionIdsOverride, setQuestionIdsOverride] = useState<string[] | null>(null);
  const [isWrongOnlyRetry, setIsWrongOnlyRetry] = useState(false);
  const initializedRef = useRef(false);
  const startedAtRef = useRef<number | null>(null);
  const attemptSubmitLockRef = useRef(false);

  const plan = useMemo(() => {
    const saved = getExerciseSession(lessonId);
    const canRestore =
      saved &&
      saved.blockIds.join(",") === blockIdsKey &&
      sessionSeed === 0 &&
      !questionIdsOverride;

    const savedOrder = questionIdsOverride ?? (canRestore ? saved.questionIdsOrder : undefined);
    const savedChoices = canRestore ? saved.choiceOrders : undefined;

    return prepareExercisePlan(practiceBlocks, savedOrder, savedChoices);
  }, [practiceBlocks, lessonId, blockIdsKey, sessionSeed, questionIdsOverride]);

  const items = plan.items;
  const total = items.length;
  const passScorePercent = plan.passScorePercent;
  const examUnits = useMemo(
    () => (examMode ? buildExamNavUnits(items) : []),
    [examMode, items],
  );
  const examUnitTotal = examUnits.length;

  const [questionIndex, setQuestionIndex] = useState(0);
  /** Lựa chọn đang chọn theo từng câu — tránh dùng chung id a/b/c/d giữa các câu */
  const [choiceDrafts, setChoiceDrafts] = useState<Record<string, string>>({});
  const [typedAnswer, setTypedAnswer] = useState("");
  const [fillBlankAnswers, setFillBlankAnswers] = useState<Record<string, string>>({});
  const [gapFillMcqAnswers, setGapFillMcqAnswers] = useState<Record<string, string>>({});
  const [readingSubAnswers, setReadingSubAnswers] = useState<Record<string, string>>({});
  const [reorderTokenOrder, setReorderTokenOrder] = useState<string[]>([]);
  const [matchingSelections, setMatchingSelections] = useState<Record<string, string>>({});
  const [activeMatchingLeft, setActiveMatchingLeft] = useState<string | null>(null);
  const [phase, setPhase] = useState<PlayerPhase>("answer");
  const [examServerResult, setExamServerResult] = useState<{
    scorePercent: number;
    passed: boolean;
    correctCount: number;
    totalCount: number;
  } | null>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerRecord>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [serverLatestAttempt, setServerLatestAttempt] = useState<PracticeAttemptBannerLatest>(null);
  const [reviewItems, setReviewItems] = useState<PreparedExerciseItem[] | null>(null);
  const [reviewAnswers, setReviewAnswers] = useState<Record<string, AnswerRecord> | null>(null);
  const [flaggedQuestionIds, setFlaggedQuestionIds] = useState<string[]>([]);
  const [examUnitIndex, setExamUnitIndex] = useState(0);
  const flaggedQuestionIdsRef = useRef<string[]>([]);
  flaggedQuestionIdsRef.current = flaggedQuestionIds;
  const examUnitIndexRef = useRef(0);
  examUnitIndexRef.current = examUnitIndex;

  useEffect(() => {
    if (!persistAttempts) {
      setServerLatestAttempt(null);
      return;
    }
    let cancelled = false;
    const load = vocabularySetId
      ? apiGetLatestVocabularyPracticeAttempt(vocabularySetId)
      : apiGetLatestLessonPracticeAttempt(lessonId);
    void load.then((attempt) => {
      if (!cancelled) setServerLatestAttempt(attempt);
    });
    return () => {
      cancelled = true;
    };
  }, [lessonId, vocabularySetId, sessionSeed, persistAttempts]);

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
      setFlaggedQuestionIds(saved.flaggedQuestionIds ?? []);
      if (typeof saved.examUnitIndex === "number") {
        setExamUnitIndex(saved.examUnitIndex);
      }
    } else {
      setQuestionIndex(0);
      setPhase("answer");
      setAnswers({});
      setElapsedMs(0);
      setFlaggedQuestionIds([]);
      setExamUnitIndex(0);
    }

    setChoiceDrafts({});
    setTypedAnswer("");
    setFillBlankAnswers({});
    setReorderTokenOrder([]);
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
  const currentGapFillMcq =
    current?.displayQuestion.type === "GAP_FILL_MCQ"
      ? (current.displayQuestion as GapFillMcqType)
      : null;
  const currentReading =
    current?.displayQuestion.type === "READING_COMPREHENSION"
      ? (current.displayQuestion as ReadingType)
      : null;
  const currentMatching =
    current?.displayQuestion.type === "MATCHING"
      ? (current.displayQuestion as MatchingType)
      : null;
  const currentReorder =
    current?.displayQuestion.type === "REORDER_SENTENCE"
      ? (current.displayQuestion as ReorderType)
      : null;
  const currentTrueFalse =
    current?.displayQuestion.type === "TRUE_FALSE"
      ? (current.displayQuestion as TrueFalseType)
      : null;

  const currentQuestionId = current?.displayQuestion.id;
  const selectedChoiceId =
    phase === "feedback" && currentQuestionId
      ? answers[currentQuestionId]?.selectedChoiceId ?? null
      : currentQuestionId
        ? choiceDrafts[currentQuestionId] ?? answers[currentQuestionId]?.selectedChoiceId ?? null
        : null;

  const handleSelectChoice = useCallback(
    (choiceId: string) => {
      if (phase !== "answer" || !currentQuestionId) return;
      setChoiceDrafts((prev) => ({ ...prev, [currentQuestionId]: choiceId }));
      if (!examMode || !current) return;

      const q = current.displayQuestion;
      let correct = false;
      if (q.type === "MULTIPLE_CHOICE" || q.type === "LISTEN_CHOOSE") {
        correct = choiceId === q.correctChoiceId;
      } else if (q.type === "TRUE_FALSE") {
        correct = choiceId === trueFalseCorrectChoiceId(q);
      } else {
        return;
      }
      setAnswers((prev) => {
        const nextAnswers = {
          ...prev,
          [currentQuestionId]: { correct, selectedChoiceId: choiceId },
        };
        const startedAt = startedAtRef.current ?? Date.now();
        if (!startedAtRef.current) startedAtRef.current = startedAt;
        const sess = getExerciseSession(lessonId);
        saveExerciseSession({
          lessonId,
          blockIds,
          questionIndex,
          completed: false,
          questionIdsOrder: plan.questionIdsOrder,
          choiceOrders: plan.choiceOrders,
          answers: nextAnswers,
          startedAt,
          flaggedQuestionIds: flaggedQuestionIdsRef.current,
          serverAttemptSynced: sess?.serverAttemptSynced,
        });
        return nextAnswers;
      });
    },
    [
      phase,
      currentQuestionId,
      examMode,
      current,
      lessonId,
      blockIds,
      questionIndex,
      plan.questionIdsOrder,
      plan.choiceOrders,
    ],
  );

  useEffect(() => {
    if (!onProgressChange || total <= 0) return;
    onProgressChange(questionIndex + 1, total);
  }, [onProgressChange, questionIndex, total]);

  useEffect(() => {
    if (!examMode || examUnitTotal === 0) return;
    setExamUnitIndex((prev) => {
      if (prev >= 0 && prev < examUnitTotal) {
        const u = examUnits[prev];
        if (u && u.itemIndex === questionIndex) return prev;
      }
      return findUnitIndexForItem(examUnits, questionIndex);
    });
  }, [examMode, examUnitTotal, examUnits, questionIndex]);

  useEffect(() => {
    if (!examMode || examUnitTotal === 0) return;
    const unit = examUnits[examUnitIndex];
    if (!unit?.partKey) return;
    const id = examUnitDomId(unit);
    const t = window.setTimeout(() => {
      const el = document.getElementById(id);
      if (!el) return;
      document
        .querySelectorAll(".exam-unit-focus")
        .forEach((node) => node.classList.remove("exam-unit-focus"));
      el.classList.add("exam-unit-focus");
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 50);
    return () => window.clearTimeout(t);
  }, [examMode, examUnitIndex, examUnitTotal, examUnits, questionIndex]);

  useEffect(() => {
    if (!current) return;
    const saved = answers[current.displayQuestion.id];
    if (currentMcq || currentListen || currentTrueFalse) {
      setTypedAnswer("");
      setFillBlankAnswers({});
      setGapFillMcqAnswers({});
      setReadingSubAnswers({});
      setReorderTokenOrder([]);
      setMatchingSelections({});
      setActiveMatchingLeft(null);
      return;
    }
    if (currentSpelling || currentListenType) {
      setTypedAnswer(saved?.typedAnswer ?? "");
      setFillBlankAnswers({});
      setGapFillMcqAnswers({});
      setReadingSubAnswers({});
      setReorderTokenOrder([]);
      setMatchingSelections({});
      setActiveMatchingLeft(null);
      return;
    }
    if (currentFillBlank) {
      setFillBlankAnswers(saved?.fillBlankAnswers ?? {});
      setGapFillMcqAnswers({});
      setReadingSubAnswers({});
      setReorderTokenOrder([]);
      setTypedAnswer("");
      setMatchingSelections({});
      setActiveMatchingLeft(null);
      return;
    }
    if (currentGapFillMcq) {
      setGapFillMcqAnswers(saved?.gapFillMcqAnswers ?? {});
      setFillBlankAnswers({});
      setReadingSubAnswers({});
      setReorderTokenOrder([]);
      setTypedAnswer("");
      setMatchingSelections({});
      setActiveMatchingLeft(null);
      return;
    }
    if (currentReading) {
      setReadingSubAnswers(saved?.readingSubAnswers ?? {});
      setFillBlankAnswers({});
      setGapFillMcqAnswers({});
      setReorderTokenOrder([]);
      setTypedAnswer("");
      setMatchingSelections({});
      setActiveMatchingLeft(null);
      return;
    }
    if (currentReorder) {
      setReorderTokenOrder(saved?.reorderTokenOrder ?? []);
      setFillBlankAnswers({});
      setGapFillMcqAnswers({});
      setReadingSubAnswers({});
      setTypedAnswer("");
      setMatchingSelections({});
      setActiveMatchingLeft(null);
      return;
    }
    if (currentMatching) {
      setMatchingSelections(saved?.matchingSelections ?? {});
      setFillBlankAnswers({});
      setGapFillMcqAnswers({});
      setReadingSubAnswers({});
      setReorderTokenOrder([]);
      setActiveMatchingLeft(null);
    }
  }, [questionIndex, current?.displayQuestion.id, currentMcq, currentListen, currentTrueFalse, currentSpelling, currentListenType, currentFillBlank, currentGapFillMcq, currentReading, currentReorder, currentMatching, answers]);

  useEffect(() => {
    if (phase === "done" || phase === "review") {
      onViewChange?.(phase === "review" ? "review" : "result");
    } else {
      onViewChange?.("exercise");
    }
  }, [phase, onViewChange]);

  const sessionScore = useMemo(() => computeSessionScore(items, answers), [items, answers]);
  const scoringCorrectUnits = examServerResult?.correctCount ?? sessionScore.correctUnits;
  const scoringTotalUnits = examServerResult?.totalCount ?? sessionScore.totalUnits;
  const scorePct = examServerResult?.scorePercent ?? sessionScore.scorePct;
  const passed = examServerResult ? examServerResult.passed : scorePct >= passScorePercent;

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
        flaggedQuestionIds: examMode ? flaggedQuestionIdsRef.current : prev?.flaggedQuestionIds,
        examUnitIndex: examMode ? examUnitIndexRef.current : prev?.examUnitIndex,
      });
    },
    [lessonId, blockIds, plan.questionIdsOrder, plan.choiceOrders, ensureStartedAt, examMode],
  );

  const submitPracticeAttempt = useCallback(
    async (
      finalAnswers: Record<string, AnswerRecord>,
      elapsed: number,
      index: number,
    ) => {
      if (attemptSubmitLockRef.current || total === 0) return;

      const { correctUnits, totalUnits, scorePct: pct } = computeSessionScore(items, finalAnswers);
      const didPass = pct >= passScorePercent;

      attemptSubmitLockRef.current = true;

      if (!persistAttempts) {
        persistSession(index, true, finalAnswers, {
          elapsedMs: elapsed,
          serverAttemptSynced: false,
        });
        return;
      }

      try {
        const answersSnapshot = buildStructuredSnapshot(
          finalAnswers,
          plan.questionIdsOrder,
          plan.choiceOrders,
        );
        const attempt = vocabularySetId
          ? await apiCreateVocabularyPracticeAttempt({
              vocabularySetId,
              assignmentId: assignmentId || null,
              correctCount: correctUnits,
              totalCount: totalUnits,
              scorePercent: pct,
              passed: didPass,
              passScorePercent,
              elapsedMs: elapsed,
              blockIds,
              answersSnapshot,
            })
          : await apiCreateLessonPracticeAttempt({
              lessonId,
              correctCount: correctUnits,
              totalCount: totalUnits,
              scorePercent: pct,
              passed: didPass,
              passScorePercent,
              elapsedMs: elapsed,
              blockIds,
              answersSnapshot,
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
      vocabularySetId,
      assignmentId,
      blockIds,
      items,
      passScorePercent,
      persistAttempts,
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

  const showInlineAttemptBanner =
    attemptBannerPlacement === "inline" && (phase === "answer" || phase === "feedback");

  useEffect(() => {
    if (attemptBannerPlacement !== "hero" || !onAttemptBanner) return;

    const visible = phase === "answer" || phase === "feedback";
    if (visible && serverLatestAttempt) {
      onAttemptBanner({ latest: serverLatestAttempt, onReview: handleReview });
    } else {
      onAttemptBanner(null);
    }

    return () => {
      onAttemptBanner(null);
    };
  }, [attemptBannerPlacement, onAttemptBanner, serverLatestAttempt, handleReview, phase]);

  const resetQuestionDrafts = () => {
    setChoiceDrafts({});
    setTypedAnswer("");
    setFillBlankAnswers({});
    setGapFillMcqAnswers({});
    setReadingSubAnswers({});
    setReorderTokenOrder([]);
    setMatchingSelections({});
    setActiveMatchingLeft(null);
    setShowExplanation(false);
  };

  const finishExamSession = async (finalAnswers: Record<string, AnswerRecord>) => {
    const startedAt = ensureStartedAt();
    const elapsed = Date.now() - startedAt;
    setElapsedMs(elapsed);
    persistSession(questionIndex, true, finalAnswers, { elapsedMs: elapsed });
    if (onExamComplete) {
      try {
        const result = await onExamComplete({ answers: finalAnswers, elapsedMs: elapsed });
        if (result && result.scorePercent != null && result.totalCount != null) {
          setExamServerResult({
            scorePercent: result.scorePercent,
            passed: Boolean(result.passed),
            correctCount: result.correctCount ?? 0,
            totalCount: result.totalCount,
          });
        }
      } catch {
        // parent shows error
      }
    }
    setPhase("done");
  };

  /** Exam: lưu đáp án hiện tại, không tự chuyển câu. */
  const saveExamAnswers = (nextAnswers: Record<string, AnswerRecord>) => {
    setAnswers(nextAnswers);
    setShowExplanation(false);
    persistSession(questionIndex, false, nextAnswers);
  };

  /** Gộp draft đang nhập vào answers (kể cả chưa đủ blank). */
  const mergeCurrentDraftIntoAnswers = useCallback(
    (base: Record<string, AnswerRecord>): Record<string, AnswerRecord> => {
      if (!current) return base;
      ensureStartedAt();

      const choiceQuestion = currentMcq ?? currentListen;
      const choiceId =
        (currentQuestionId ? choiceDrafts[currentQuestionId] : null) ??
        (currentQuestionId ? base[currentQuestionId]?.selectedChoiceId : null) ??
        null;

      if (choiceQuestion && choiceId) {
        return {
          ...base,
          [choiceQuestion.id]: {
            correct: choiceId === choiceQuestion.correctChoiceId,
            selectedChoiceId: choiceId,
          },
        };
      }

      if (currentTrueFalse && choiceId) {
        const correctId = trueFalseCorrectChoiceId(currentTrueFalse);
        return {
          ...base,
          [currentTrueFalse.id]: {
            correct: choiceId === correctId,
            selectedChoiceId: choiceId,
          },
        };
      }

      const typedQuestion = currentSpelling ?? currentListenType;
      if (typedQuestion && typedAnswer.trim()) {
        return {
          ...base,
          [typedQuestion.id]: {
            correct: compareTypedAnswers(typedAnswer, typedQuestion.correctAnswer, {
              caseSensitive: typedQuestion.caseSensitive,
            }),
            typedAnswer: typedAnswer.trim(),
          },
        };
      }

      if (currentFillBlank && Object.keys(fillBlankAnswers).length > 0) {
        const complete = isFillBlankComplete(fillBlankAnswers, currentFillBlank.blanks);
        return {
          ...base,
          [currentFillBlank.id]: {
            correct: complete
              ? compareFillBlankAnswers(
                  fillBlankAnswers,
                  currentFillBlank.blanks,
                  currentFillBlank.caseSensitive,
                )
              : false,
            fillBlankAnswers: { ...fillBlankAnswers },
          },
        };
      }

      if (currentGapFillMcq && Object.keys(gapFillMcqAnswers).length > 0) {
        const scored = scoreGapFillMcq(currentGapFillMcq.blanks, gapFillMcqAnswers);
        return {
          ...base,
          [currentGapFillMcq.id]: {
            correct: scored.allCorrect,
            gapFillMcqAnswers: { ...gapFillMcqAnswers },
            correctBlankCount: scored.correctBlankCount,
            totalBlanks: scored.totalBlanks,
          },
        };
      }

      if (currentReading && Object.keys(readingSubAnswers).length > 0) {
        const scored = scoreReadingComprehension(currentReading.subQuestions, readingSubAnswers);
        return {
          ...base,
          [currentReading.id]: {
            correct: scored.allCorrect,
            readingSubAnswers: { ...readingSubAnswers },
            correctSubCount: scored.correctSubCount,
            totalSubQuestions: scored.totalSubQuestions,
          },
        };
      }

      if (currentReorder && reorderTokenOrder.length > 0) {
        const complete = isReorderComplete(reorderTokenOrder, currentReorder.tokens.length);
        return {
          ...base,
          [currentReorder.id]: {
            correct: complete
              ? compareReorderOrder(reorderTokenOrder, currentReorder.correctOrder)
              : false,
            reorderTokenOrder: [...reorderTokenOrder],
          },
        };
      }

      if (currentMatching && Object.keys(matchingSelections).length > 0) {
        const complete = isMatchingComplete(currentMatching.pairs, matchingSelections);
        return {
          ...base,
          [currentMatching.id]: {
            correct: complete
              ? scoreMatchingAnswer(currentMatching.pairs, matchingSelections)
              : false,
            matchingSelections: { ...matchingSelections },
          },
        };
      }

      return base;
    },
    [
      current,
      currentMcq,
      currentListen,
      currentTrueFalse,
      currentSpelling,
      currentListenType,
      currentFillBlank,
      currentGapFillMcq,
      currentReading,
      currentReorder,
      currentMatching,
      currentQuestionId,
      choiceDrafts,
      typedAnswer,
      fillBlankAnswers,
      gapFillMcqAnswers,
      readingSubAnswers,
      reorderTokenOrder,
      matchingSelections,
      ensureStartedAt,
    ],
  );

  const navigateExamToUnit = useCallback(
    (nextUnitIndex: number) => {
      if (nextUnitIndex < 0 || nextUnitIndex >= examUnitTotal) return;
      const unit = examUnits[nextUnitIndex];
      if (!unit) return;

      if (unit.itemIndex !== questionIndex) {
        const nextAnswers = mergeCurrentDraftIntoAnswers(answers);
        setAnswers(nextAnswers);
        setQuestionIndex(unit.itemIndex);
        setShowExplanation(false);
        setPhase("answer");
        examUnitIndexRef.current = nextUnitIndex;
        setExamUnitIndex(nextUnitIndex);
        persistSession(unit.itemIndex, false, nextAnswers);
        return;
      }

      examUnitIndexRef.current = nextUnitIndex;
      setExamUnitIndex(nextUnitIndex);
      persistSession(questionIndex, false, answers);
    },
    [
      examUnitTotal,
      examUnits,
      questionIndex,
      mergeCurrentDraftIntoAnswers,
      answers,
      persistSession,
    ],
  );

  const handleExamToggleFlag = useCallback(() => {
    const unit = examUnits[examUnitIndex];
    if (!unit) return;
    const flagId = examUnitFlagId(unit);
    setFlaggedQuestionIds((prev) => {
      const next = prev.includes(flagId) ? prev.filter((id) => id !== flagId) : [...prev, flagId];
      flaggedQuestionIdsRef.current = next;
      persistSession(questionIndex, false, answers);
      return next;
    });
  }, [examUnits, examUnitIndex, questionIndex, answers, persistSession]);

  const handleExamSubmit = (options?: { skipConfirm?: boolean }) => {
    const nextAnswers = mergeCurrentDraftIntoAnswers(answers);
    const answered = countAnsweredExamUnits(examUnits, nextAnswers);
    if (!options?.skipConfirm && answered < examUnitTotal) {
      const ok = window.confirm(`Bạn đã làm ${answered}/${examUnitTotal} câu. Nộp bài ngay?`);
      if (!ok) return;
    }
    void finishExamSession(nextAnswers);
  };

  const handleExamSubmitRef = useRef(handleExamSubmit);
  handleExamSubmitRef.current = handleExamSubmit;

  const examForceSubmitSeenRef = useRef(0);
  useEffect(() => {
    if (!examMode || !examForceSubmitToken) return;
    if (examForceSubmitToken === examForceSubmitSeenRef.current) return;
    if (phase === "done" || phase === "review") return;
    examForceSubmitSeenRef.current = examForceSubmitToken;
    handleExamSubmitRef.current({ skipConfirm: true });
  }, [examMode, examForceSubmitToken, phase]);

  const commitExamAnswer = (nextAnswers: Record<string, AnswerRecord>) => {
    saveExamAnswers(nextAnswers);
  };

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
      if (examMode) {
        commitExamAnswer(nextAnswers);
        return;
      }
      setAnswers(nextAnswers);
      setShowExplanation(false);
      setPhase("feedback");
      persistSession(questionIndex, false, nextAnswers);
      return;
    }

    if (currentTrueFalse && selectedChoiceId) {
      const correctId = trueFalseCorrectChoiceId(currentTrueFalse);
      const correct = selectedChoiceId === correctId;
      const nextAnswers = {
        ...answers,
        [currentTrueFalse.id]: { correct, selectedChoiceId },
      };
      if (examMode) {
        commitExamAnswer(nextAnswers);
        return;
      }
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
      if (examMode) {
        commitExamAnswer(nextAnswers);
        return;
      }
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
      if (examMode) {
        commitExamAnswer(nextAnswers);
        return;
      }
      setAnswers(nextAnswers);
      setShowExplanation(false);
      setPhase("feedback");
      persistSession(questionIndex, false, nextAnswers);
      return;
    }

    if (
      currentGapFillMcq &&
      isGapFillMcqComplete(gapFillMcqAnswers, currentGapFillMcq.blanks)
    ) {
      const scored = scoreGapFillMcq(currentGapFillMcq.blanks, gapFillMcqAnswers);
      const nextAnswers = {
        ...answers,
        [currentGapFillMcq.id]: {
          correct: scored.allCorrect,
          gapFillMcqAnswers: { ...gapFillMcqAnswers },
          correctBlankCount: scored.correctBlankCount,
          totalBlanks: scored.totalBlanks,
        },
      };
      if (examMode) {
        commitExamAnswer(nextAnswers);
        return;
      }
      setAnswers(nextAnswers);
      setShowExplanation(false);
      setPhase("feedback");
      persistSession(questionIndex, false, nextAnswers);
      return;
    }

    if (
      currentReading &&
      isReadingComprehensionComplete(readingSubAnswers, currentReading.subQuestions)
    ) {
      const scored = scoreReadingComprehension(
        currentReading.subQuestions,
        readingSubAnswers,
      );
      const nextAnswers = {
        ...answers,
        [currentReading.id]: {
          correct: scored.allCorrect,
          readingSubAnswers: { ...readingSubAnswers },
          correctSubCount: scored.correctSubCount,
          totalSubQuestions: scored.totalSubQuestions,
        },
      };
      if (examMode) {
        commitExamAnswer(nextAnswers);
        return;
      }
      setAnswers(nextAnswers);
      setShowExplanation(false);
      setPhase("feedback");
      persistSession(questionIndex, false, nextAnswers);
      return;
    }

    if (
      currentReorder &&
      isReorderComplete(reorderTokenOrder, currentReorder.tokens.length)
    ) {
      const correct = compareReorderOrder(reorderTokenOrder, currentReorder.correctOrder);
      const nextAnswers = {
        ...answers,
        [currentReorder.id]: {
          correct,
          reorderTokenOrder: [...reorderTokenOrder],
        },
      };
      if (examMode) {
        commitExamAnswer(nextAnswers);
        return;
      }
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
      if (examMode) {
        commitExamAnswer(nextAnswers);
        return;
      }
      setAnswers(nextAnswers);
      setShowExplanation(false);
      setActiveMatchingLeft(null);
      setPhase("feedback");
      persistSession(questionIndex, false, nextAnswers);
    }
  };

  const handleTapReorderPool = (tokenId: string) => {
    if (phase !== "answer" || !currentReorder) return;
    if (reorderTokenOrder.includes(tokenId)) return;
    setReorderTokenOrder((prev) => [...prev, tokenId]);
  };

  const handleTapReorderSentence = (tokenId: string) => {
    if (phase !== "answer") return;
    setReorderTokenOrder((prev) => {
      const index = prev.indexOf(tokenId);
      if (index < 0) return prev;
      return [...prev.slice(0, index), ...prev.slice(index + 1)];
    });
  };

  const handleClearReorder = () => {
    if (phase !== "answer") return;
    setReorderTokenOrder([]);
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

  const handleResetMatching = () => {
    if (phase !== "answer") return;
    setMatchingSelections({});
    setActiveMatchingLeft(null);
  };

  const handleNext = () => {
    if (examMode) {
      if (examUnitIndex >= examUnitTotal - 1) return;
      navigateExamToUnit(examUnitIndex + 1);
      return;
    }
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
    resetQuestionDrafts();
    setPhase("answer");
    persistSession(next, false, answers);
  };

  const handleRetry = () => {
    clearExerciseSession(lessonId);
    initializedRef.current = false;
    startedAtRef.current = null;
    attemptSubmitLockRef.current = false;
    setQuestionIdsOverride(null);
    setIsWrongOnlyRetry(false);
    setQuestionIndex(0);
    setChoiceDrafts({});
    setTypedAnswer("");
    setFillBlankAnswers({});
    setGapFillMcqAnswers({});
    setReadingSubAnswers({});
    setReorderTokenOrder([]);
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

  const wrongCount = scoringTotalUnits - scoringCorrectUnits;

  const handleRetryWrong = useCallback(() => {
    const sourceItems = reviewItems ?? items;
    const sourceAnswers = reviewAnswers ?? answers;
    const wrongItems = filterWrongExerciseItems(sourceItems, sourceAnswers);
    const wrongIds = wrongItems.map((item) => item.displayQuestion.id);

    if (wrongIds.length === 0) return;

    clearExerciseSession(lessonId);
    initializedRef.current = false;
    startedAtRef.current = null;
    attemptSubmitLockRef.current = false;
    setQuestionIdsOverride(wrongIds);
    setIsWrongOnlyRetry(true);
    setQuestionIndex(0);
    setChoiceDrafts({});
    setTypedAnswer("");
    setFillBlankAnswers({});
    setGapFillMcqAnswers({});
    setReadingSubAnswers({});
    setReorderTokenOrder([]);
    setMatchingSelections({});
    setActiveMatchingLeft(null);
    setPhase("answer");
    setAnswers({});
    setShowExplanation(false);
    setElapsedMs(0);
    setReviewItems(null);
    setReviewAnswers(null);
    setSessionSeed((s) => s + 1);
  }, [answers, items, lessonId, reviewAnswers, reviewItems]);

  const canCheck = currentMcq || currentListen || currentTrueFalse
    ? Boolean(selectedChoiceId)
    : currentSpelling || currentListenType
      ? Boolean(typedAnswer.trim())
      : currentFillBlank
        ? isFillBlankComplete(fillBlankAnswers, currentFillBlank.blanks)
        : currentGapFillMcq
          ? isGapFillMcqComplete(gapFillMcqAnswers, currentGapFillMcq.blanks)
          : currentReading
            ? isReadingComprehensionComplete(readingSubAnswers, currentReading.subQuestions)
            : currentReorder
          ? isReorderComplete(reorderTokenOrder, currentReorder.tokens.length)
          : currentMatching
            ? isMatchingComplete(currentMatching.pairs, matchingSelections)
            : false;

  const currentExplanation =
    currentMcq?.explanation ??
    currentListen?.explanation ??
    currentTrueFalse?.explanation ??
    currentSpelling?.explanation ??
    currentListenType?.explanation ??
    currentFillBlank?.explanation ??
    currentGapFillMcq?.explanation ??
    currentReading?.explanation ??
    currentReorder?.explanation ??
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
        wrongCount={Object.values(displayAnswers).filter((a) => !a.correct).length}
        onRetryWrong={handleRetryWrong}
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
        correctCount={scoringCorrectUnits}
        total={scoringTotalUnits}
        wrongCount={wrongCount}
        passScorePercent={passScorePercent}
        elapsedMs={elapsedMs}
        passed={passed}
        isWrongOnlyRetry={isWrongOnlyRetry}
        nextLessonTitle={nextLessonTitle}
        onReview={handleReview}
        onRetry={examMode ? onExamRetry : handleRetry}
        onContinueStudy={onContinueStudy}
        onBackToLessons={onBackToLessons}
      />
    );
  }

  const fillBlankIsCorrect =
    typedShowResult && currentFillBlank
      ? answers[currentFillBlank.id]?.correct === true
      : false;

  const reorderIsCorrect =
    typedShowResult && currentReorder
      ? answers[currentReorder.id]?.correct === true
      : false;

  const gapFillMcqIsCorrect =
    typedShowResult && currentGapFillMcq
      ? answers[currentGapFillMcq.id]?.correct === true
      : false;

  const readingIsCorrect =
    typedShowResult && currentReading
      ? answers[currentReading.id]?.correct === true
      : false;

  if (!current || (!currentMcq && !currentListen && !currentSpelling && !currentListenType && !currentFillBlank && !currentGapFillMcq && !currentReading && !currentReorder && !currentMatching && !currentTrueFalse)) {
    return (
      <Alert severity="warning" sx={{ borderRadius: "14px" }}>
        Dạng câu <strong>{current?.displayQuestion.type ?? "unknown"}</strong> sẽ hỗ trợ ở bản tiếp theo.
      </Alert>
    );
  }

  const showFeedback = phase === "feedback" && !examMode;

  const currentExamUnit = examMode ? examUnits[examUnitIndex] : undefined;
  const examAnsweredCount = examMode ? countAnsweredExamUnits(examUnits, answers) : 0;
  const examFlagged = currentExamUnit
    ? flaggedQuestionIds.includes(examUnitFlagId(currentExamUnit))
    : false;
  const examCellStatus = (unitIndex: number): ExamNavCellStatus => {
    if (unitIndex === examUnitIndex) return "current";
    const unit = examUnits[unitIndex];
    if (!unit) return "todo";
    if (flaggedQuestionIds.includes(examUnitFlagId(unit))) return "flagged";
    if (isExamUnitAnswered(unit, answers)) return "done";
    return "todo";
  };

  if (isVocab) {
    const wordEn = (
      currentMcq?.wordEn ||
      currentMcq?.prompt?.text ||
      ""
    ).trim();
    const pos = currentMcq?.partOfSpeech || "";
    const phonetic = currentMcq?.phonetic || "";
    const showWordCard = Boolean(currentMcq && wordEn);

    const progressPercent = total > 0 ? Math.round(((questionIndex) / total) * 100) : 0;
    const setCoverUrl = coverImageUrl?.trim()
      ? resolveStorageAssetUrl(coverImageUrl.trim())
      : null;

    const reviewWords = collectSessionReviewWords(items, answers);

    const weekdays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
    const letters = ["A", "B", "C", "D"];

    return (
      <div className="vq-vocab-practice-dashboard-layout">
        {/* Set overview card — cover when available; timer + progress here */}
        <div className="vq-vocab-practice-topbar">
          <div className="vq-vocab-practice-topbar__main">
            <div className="vq-vocab-practice-topbar__heading">
              <button type="button" className="vq-vocab-practice-topbar__back-btn" onClick={onBackToLessons}>
                <ArrowBackIcon sx={{ fontSize: 20 }} />
              </button>
              {setCoverUrl ? (
                <div className="vq-vocab-practice-topbar__cover" aria-hidden>
                  <img src={setCoverUrl} alt="" />
                </div>
              ) : null}
              <div className="vq-vocab-practice-topbar__title-block">
                <h2 className="vq-vocab-practice-topbar__title">{lessonTitle}</h2>
                <p className="vq-vocab-practice-topbar__subtitle">
                  Câu {questionIndex + 1} / {total} · Ôn từ vựng
                </p>
              </div>
            </div>

            <div className="vq-vocab-practice-topbar__progress-row">
              <div className="vq-vocab-practice-topbar__progress-track" aria-hidden>
                <div
                  className="vq-vocab-practice-topbar__progress-fill"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="vq-vocab-practice-topbar__progress-pct">{progressPercent}%</span>
              <div className="vq-vocab-practice-timer-badge">
                <span className="vq-vocab-practice-timer-icon">⏱️</span>
                <span className="vq-vocab-practice-timer-text">{timerText}</span>
              </div>
            </div>

            <div className="vq-vocab-practice-topbar__chips">
              <span className="vq-vocab-practice-topbar__badge">
                Bộ từ {questionIndex + 1} / {total}
              </span>
              <span className="vq-vocab-practice-topbar__goal">
                Mục tiêu: {total} câu
              </span>
            </div>
          </div>

          <div className="vq-vocab-practice-topbar__right">
            <div className="vq-vocab-practice-stat">
              <span className="vq-vocab-practice-stat__icon">🔥</span>
              <span className="vq-vocab-practice-stat__val">{streak} Streak</span>
            </div>
            <div className="vq-vocab-practice-stat">
              <span className="vq-vocab-practice-stat__icon">⭐</span>
              <span className="vq-vocab-practice-stat__val">{xp} XP</span>
            </div>
            <div className="vq-vocab-practice-stat">
              <span className="vq-vocab-practice-stat__icon">❤️</span>
              <span className="vq-vocab-practice-stat__val">3 Lives</span>
            </div>
            <div className="vq-vocab-practice-topbar__divider" />
            <NotificationBell />
            <StudentUserMenu />
          </div>
        </div>

        <div className="vq-vocab-practice-cols">
          {/* Left Main Column */}
          <div className="vq-vocab-practice-main-col">
            {/* Target Word Card — only for meaning MCQ that has a target word */}
            {showWordCard ? (
              <div className="vq-vocab-practice-word-card">
                <h2 className="vq-vocab-practice-word-card__en">{wordEn}</h2>
                <div className="vq-vocab-practice-word-card__phonetic-row">
                  <button type="button" className="vq-vocab-practice-word-card__audio-btn" onClick={playWordAudio}>
                    🔊
                  </button>
                  {phonetic ? (
                    <span className="vq-vocab-practice-word-card__phonetic">{phonetic}</span>
                  ) : null}
                </div>
                {pos ? <span className="vq-vocab-practice-word-card__pos">{pos}</span> : null}
              </div>
            ) : null}

            {/* Question instruction */}
            <h3 className="vq-vocab-practice-instruction">
              {currentMcq
                ? "Chọn nghĩa đúng của từ vựng trên"
                : current.instruction?.trim() || "Trả lời câu hỏi bên dưới"}
            </h3>

            {/* MCQ Options Grid */}
            {currentMcq ? (
              <div className="vq-vocab-practice-mcq-grid">
                {currentMcq.choices.map((choice, i) => {
                  const isSelected = selectedChoiceId === choice.id;
                  const isCorrect = choice.id === currentMcq.correctChoiceId;
                  const showResult = phase === "feedback";

                  let cardClass = "vq-vocab-practice-mcq-card";
                  if (isSelected) cardClass += " is-selected";
                  if (showResult) {
                    if (isCorrect) cardClass += " is-correct";
                    else if (isSelected) cardClass += " is-wrong";
                  }

                  return (
                    <button
                      key={choice.id}
                      type="button"
                      disabled={showResult}
                      className={cardClass}
                      onClick={() => handleSelectChoice(choice.id)}
                    >
                      <div className="vq-vocab-practice-mcq-card__letter">{letters[i]}</div>
                      <span className="vq-vocab-practice-mcq-card__text">{choice.text}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Fallback to standard question elements for other exercises if any */
              <div className="vq-vocab-practice-fallback-question">
                {currentTrueFalse ? (
                  <TrueFalseQuestion
                    question={currentTrueFalse}
                    selectedId={selectedChoiceId}
                    disabled={showFeedback}
                    showResult={showFeedback}
                    onSelect={handleSelectChoice}
                  />
                ) : currentSpelling ? (
                  <SpellingQuestion
                    question={currentSpelling}
                    value={typedAnswer}
                    disabled={showFeedback}
                    showResult={showFeedback}
                    isCorrect={typedIsCorrect}
                    onChange={setTypedAnswer}
                  />
                ) : currentListen ? (
                  <ListenChooseQuestion
                    question={currentListen}
                    selectedId={selectedChoiceId}
                    disabled={showFeedback}
                    showResult={showFeedback}
                    onSelect={handleSelectChoice}
                  />
                ) : currentListenType ? (
                  <ListenTypeQuestion
                    question={currentListenType}
                    value={typedAnswer}
                    disabled={showFeedback}
                    showResult={showFeedback}
                    isCorrect={typedIsCorrect}
                    onChange={setTypedAnswer}
                  />
                ) : currentFillBlank ? (
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
                ) : currentGapFillMcq ? (
                  <GapFillMcqQuestion
                    question={currentGapFillMcq}
                    answers={gapFillMcqAnswers}
                    disabled={showFeedback}
                    showResult={showFeedback}
                    isCorrect={gapFillMcqIsCorrect}
                    onChange={(blankId, choiceId) =>
                      setGapFillMcqAnswers((prev) => ({ ...prev, [blankId]: choiceId }))
                    }
                  />
                ) : currentReorder ? (
                  <ReorderSentenceQuestion
                    question={currentReorder}
                    selectedOrder={reorderTokenOrder}
                    disabled={showFeedback}
                    showResult={showFeedback}
                    isCorrect={reorderIsCorrect}
                    onTapPool={handleTapReorderPool}
                    onTapSentence={handleTapReorderSentence}
                    onClear={handleClearReorder}
                  />
                ) : currentMatching ? (
                  <MatchingQuestion
                    question={currentMatching}
                    selections={matchingSelections}
                    activeLeft={activeMatchingLeft}
                    disabled={showFeedback}
                    showResult={showFeedback}
                    onSelectLeft={handleSelectMatchingLeft}
                    onSelectRight={handleSelectMatchingRight}
                    onReset={handleResetMatching}
                  />
                ) : null}
              </div>
            )}

            {/* Explanation panel if checked and has explanation */}
            {showFeedback && showExplanation && currentExplanation?.trim() ? (
              <QuestionExplanationPanel explanation={currentExplanation} />
            ) : null}

            {/* Footer buttons */}
            <div className="vq-vocab-practice-actions">
              {!showFeedback ? (
                <>
                  <button type="button" className="vq-vocab-practice-skip-btn" onClick={handleNext}>
                    Bỏ qua ≫
                  </button>
                  <button
                    type="button"
                    className="vq-vocab-practice-check-btn"
                    disabled={!canCheck}
                    onClick={handleCheck}
                  >
                    {examMode
                      ? questionIndex >= total - 1
                        ? "Nộp bài →"
                        : "Câu tiếp →"
                      : "Kiểm tra →"}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="vq-vocab-practice-explain-btn"
                    disabled={!currentExplanation?.trim()}
                    onClick={() => setShowExplanation((v) => !v)}
                  >
                    Giải thích
                  </button>
                  <button type="button" className="vq-vocab-practice-continue-btn" onClick={handleNext}>
                    {questionIndex >= total - 1 ? "Xem kết quả →" : "Làm tiếp →"}
                  </button>
                </>
              )}
            </div>

            {/* Audio hint footer */}
            <div className="vq-vocab-practice-hint-footer">
              💡 Mẹo: Nghe phát âm và nói theo để ghi nhớ tốt hơn nhé!
              <button type="button" className="vq-vocab-practice-hint-audio-btn" onClick={playWordAudio}>
                🔊
              </button>
            </div>
          </div>

          {/* Right Sidebar Column */}
          <div className="vq-vocab-practice-right-col">
            {/* Widget 1: Emma */}
            <div className="vq-vocab-practice-widget is-emma">
              <h4 className="vq-vocab-practice-widget__title">AI Buddy - Emma</h4>
              <div className="vq-vocab-practice-emma-content">
                <div className="vq-vocab-practice-emma-avatar">
                  🤖
                </div>
                <div className="vq-vocab-practice-emma-speech">
                  <p>Hi, {callName}! 👋 Cùng học thật vui và ghi nhớ thật lâu nhé!</p>
                </div>
              </div>
            </div>

            {/* Widget 2: Progress — desktop sidebar only */}
            <div className="vq-vocab-practice-widget is-set-progress">
              <h4 className="vq-vocab-practice-widget__title">Tiến trình bộ từ</h4>
              <div className="vq-vocab-practice-progress-content">
                <div className="vq-vocab-practice-progress-circle">
                  <svg width="60" height="60" viewBox="0 0 36 36" className="vq-circular-chart">
                    <path
                      className="vq-circle-bg"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="vq-circle"
                      strokeDasharray={`${progressPercent}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <text x="18" y="20.35" className="vq-percentage">{progressPercent}%</text>
                  </svg>
                </div>
                <div className="vq-vocab-practice-progress-stats">
                  <p className="vq-stat-line">Đã học: <strong>{questionIndex} / {total}</strong> từ</p>
                  <p className="vq-stat-line">Đã đúng: <strong>{scoringCorrectUnits}</strong> câu</p>
                </div>
              </div>
            </div>

            {/* Widget 3: Review list — wrong words in this session */}
            <div className="vq-vocab-practice-widget">
              <h4 className="vq-vocab-practice-widget__title">Từ cần ôn tập</h4>
              {reviewWords.length === 0 ? (
                <p className="vq-vocab-practice-review-empty">
                  Chưa có từ sai. Trả lời sai sẽ hiện ở đây để ôn lại.
                </p>
              ) : (
                <ul className="vq-vocab-practice-review-list">
                  {reviewWords.map((w) => (
                    <li key={w.word.toLowerCase()} className="vq-vocab-practice-review-item">
                      <span className="vq-vocab-practice-review-item__word">{w.word}</span>
                      <span className={`vq-vocab-practice-review-item__dot is-${w.level}`} />
                      <span className="vq-vocab-practice-review-item__count">{w.count} lần</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Widget 4: Streak week */}
            <div className="vq-vocab-practice-widget is-streak">
              <div className="vq-vocab-practice-streak-header">
                <h4 className="vq-vocab-practice-widget__title">Giữ vững chuỗi ngày!</h4>
                <span className="vq-vocab-practice-streak-fire">🔥</span>
              </div>
              <p className="vq-vocab-practice-streak-desc">Bạn đang có chuỗi <strong>{streak} ngày</strong>. Cố lên! 🔥</p>
              <div className="vq-vocab-practice-streak-week">
                {weekdays.map((day, i) => (
                  <div key={i} className="vq-vocab-practice-streak-day">
                    <span className="vq-vocab-practice-streak-day__label">{day}</span>
                    <div className={`vq-vocab-practice-streak-day__circle${i < (streak % 7) ? " is-checked" : ""}`}>
                      {i < (streak % 7) ? "✓" : ""}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const player = (
    <div className={`exercise-player${examMode ? " exercise-player--exam" : ""}`}>
      {showInlineAttemptBanner ? (
        <PracticeAttemptBanner latest={serverLatestAttempt} onReview={handleReview} />
      ) : null}
      {!examMode ? <QuestionProgressBar current={questionIndex + 1} total={total} /> : null}

      {!examMode ? (
        <header className={`exercise-player-head${currentMatching || currentReorder || currentReading ? " exercise-player-head--compact" : ""}`}>
          <div className="exercise-player-eyebrow">
            <QuizOutlinedIcon sx={{ fontSize: 18 }} />
            {current.blockTitle || lessonTitle}
          </div>
          {current.instruction && !currentMatching && !currentReorder && !currentReading ? (
            <p className="exercise-player-instruction">{current.instruction}</p>
          ) : null}
          {isWrongOnlyRetry ? (
            <p className="vq-exercise-mode-note">Luyện lại {total} câu đã trả lời sai</p>
          ) : null}
        </header>
      ) : null}

      {currentTrueFalse ? (
        <TrueFalseQuestion
          question={currentTrueFalse}
          selectedId={selectedChoiceId}
          disabled={showFeedback}
          showResult={showFeedback}
          onSelect={handleSelectChoice}
        />
      ) : null}

      {currentMcq ? (
        <MultipleChoiceQuestion
          question={currentMcq}
          selectedId={selectedChoiceId}
          disabled={showFeedback}
          showResult={showFeedback}
          onSelect={handleSelectChoice}
        />
      ) : null}

      {currentListen ? (
        <ListenChooseQuestion
          question={currentListen}
          selectedId={selectedChoiceId}
          disabled={showFeedback}
          showResult={showFeedback}
          onSelect={handleSelectChoice}
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

      {currentGapFillMcq ? (
        <GapFillMcqQuestion
          question={currentGapFillMcq}
          answers={gapFillMcqAnswers}
          disabled={showFeedback}
          showResult={showFeedback}
          isCorrect={gapFillMcqIsCorrect}
          onChange={(blankId, choiceId) =>
            setGapFillMcqAnswers((prev) => {
              const nextGaps = { ...prev, [blankId]: choiceId };
              if (examMode && currentGapFillMcq) {
                const scored = scoreGapFillMcq(currentGapFillMcq.blanks, nextGaps);
                setAnswers((ansPrev) => {
                  const nextAnswers = {
                    ...ansPrev,
                    [currentGapFillMcq.id]: {
                      correct: scored.allCorrect,
                      gapFillMcqAnswers: nextGaps,
                      correctBlankCount: scored.correctBlankCount,
                      totalBlanks: scored.totalBlanks,
                    },
                  };
                  persistSession(questionIndex, false, nextAnswers);
                  return nextAnswers;
                });
              }
              return nextGaps;
            })
          }
        />
      ) : null}

      {currentReading ? (
        <ReadingComprehensionQuestion
          question={currentReading}
          subAnswers={readingSubAnswers}
          disabled={showFeedback}
          showResult={showFeedback}
          isCorrect={readingIsCorrect}
          focusSubId={examMode ? currentExamUnit?.partKey ?? null : null}
          onSelectSub={(subId, choiceId) =>
            setReadingSubAnswers((prev) => {
              const nextSubs = { ...prev, [subId]: choiceId };
              if (examMode && currentReading) {
                const scored = scoreReadingComprehension(currentReading.subQuestions, nextSubs);
                setAnswers((ansPrev) => {
                  const nextAnswers = {
                    ...ansPrev,
                    [currentReading.id]: {
                      correct: scored.allCorrect,
                      readingSubAnswers: nextSubs,
                      correctSubCount: scored.correctSubCount,
                      totalSubQuestions: scored.totalSubQuestions,
                    },
                  };
                  persistSession(questionIndex, false, nextAnswers);
                  return nextAnswers;
                });
              }
              return nextSubs;
            })
          }
        />
      ) : null}

      {currentReorder ? (
        <ReorderSentenceQuestion
          question={currentReorder}
          selectedOrder={reorderTokenOrder}
          disabled={showFeedback}
          showResult={showFeedback}
          isCorrect={reorderIsCorrect}
          onTapPool={handleTapReorderPool}
          onTapSentence={handleTapReorderSentence}
          onClear={handleClearReorder}
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
          onReset={handleResetMatching}
        />
      ) : null}

      {showFeedback && showExplanation && currentExplanation?.trim() ? (
        <QuestionExplanationPanel explanation={currentExplanation} />
      ) : null}

      {!examMode ? (
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
      ) : null}
    </div>
  );

  if (examMode) {
    const prevPartUnit = findAdjacentPartUnitIndex(examUnits, items, examUnitIndex, -1);
    const nextPartUnit = findAdjacentPartUnitIndex(examUnits, items, examUnitIndex, 1);
    return (
      <ExamTakeShell
        examTitle={lessonTitle}
        remainingLabel={examRemainingLabel}
        answeredCount={examAnsweredCount}
        totalCount={examUnitTotal}
        cellStatus={examCellStatus}
        onJump={navigateExamToUnit}
        onPrev={() => {
          if (prevPartUnit != null) navigateExamToUnit(prevPartUnit);
        }}
        onNext={() => {
          if (nextPartUnit != null) navigateExamToUnit(nextPartUnit);
        }}
        onToggleFlag={handleExamToggleFlag}
        flagged={examFlagged}
        canPrev={prevPartUnit != null}
        canNext={nextPartUnit != null}
        onSubmit={handleExamSubmit}
        onExit={() => (onExamExit ? onExamExit() : onBackToLessons?.())}
        sectionTitle={current.blockTitle || undefined}
        instruction={current.instruction || undefined}
      >
        {player}
      </ExamTakeShell>
    );
  }

  return player;
}

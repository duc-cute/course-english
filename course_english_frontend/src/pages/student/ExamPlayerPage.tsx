import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Alert, Box, Button, CircularProgress, Typography } from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  apiGetStudentExam,
  apiStartExamAttempt,
  apiSubmitExamAttempt,
  type ExamAttemptRecord,
  type StudentExamAssignmentRecord,
} from "../../shared/api/studentExam";
import { studentRoutePaths } from "../../shared/constants/paths";
import { buildStructuredSnapshot } from "../../shared/lesson/attemptSnapshot";
import {
  examSectionsToPracticeBlocks,
  formatExamCountdown,
} from "../../student/exam/examPlayerUtils";
import { ExercisePlayer } from "../../student/lessonPlayer/exercise/ExercisePlayer";
import { ExerciseResultScreen } from "../../student/lessonPlayer/exercise/ExerciseResultScreen";
import {
  clearExerciseSession,
  getExerciseSession,
} from "../../student/lessonPlayer/exerciseSessionStorage";
import "../../styles/lesson-player.css";

export function ExamPlayerPage() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [detail, setDetail] = useState<StudentExamAssignmentRecord | null>(null);
  const [attempt, setAttempt] = useState<ExamAttemptRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState<ExamAttemptRecord | null>(null);
  const [examForceSubmitToken, setExamForceSubmitToken] = useState(0);
  const autoSubmitLock = useRef(false);
  const timeoutForceLock = useRef(false);
  const autostartLock = useRef(false);

  const viewResults = searchParams.get("view") === "results";

  const load = useCallback(async () => {
    if (!assignmentId) return;
    setLoading(true);
    setError("");
    try {
      const data = await apiGetStudentExam(assignmentId, true);
      setDetail(data);
      if (data.inProgressAttempt) {
        setAttempt(data.inProgressAttempt);
        setSubmitted(null);
      } else if (data.latestSubmittedAttempt && (viewResults || !data.canStart)) {
        setSubmitted(data.latestSubmittedAttempt);
        setAttempt(null);
      } else {
        setAttempt(null);
        setSubmitted(null);
      }
    } catch (err) {
      setError((err as { message?: string })?.message || "Không tải được đề thi.");
    } finally {
      setLoading(false);
    }
  }, [assignmentId, viewResults]);

  useEffect(() => {
    void load();
  }, [load]);

  const durationMs = (detail?.durationMinutes ?? 0) * 60_000;

  useEffect(() => {
    if (!attempt?.startedAt || !durationMs || submitted) {
      setRemainingMs(null);
      return undefined;
    }
    const started = new Date(attempt.startedAt).getTime();
    const tick = () => {
      const left = started + durationMs - Date.now();
      setRemainingMs(left);
    };
    tick();
    const id = window.setInterval(tick, 500);
    return () => window.clearInterval(id);
  }, [attempt?.startedAt, durationMs, submitted]);

  const practiceBlocks = useMemo(() => {
    if (!detail?.sections?.length) return [];
    return examSectionsToPracticeBlocks(detail.sections, detail.passScorePercent ?? 80);
  }, [detail]);

  const handleStart = useCallback(async () => {
    if (!assignmentId) return;
    setStarting(true);
    setError("");
    try {
      clearExerciseSession(`exam:${assignmentId}`);
      const started = await apiStartExamAttempt(assignmentId);
      setAttempt(started);
      setSubmitted(null);
      autoSubmitLock.current = false;
      timeoutForceLock.current = false;
      setExamForceSubmitToken(0);
      setSearchParams({}, { replace: true });
    } catch (err) {
      setError((err as { message?: string })?.message || "Không bắt đầu được bài làm.");
    } finally {
      setStarting(false);
    }
  }, [assignmentId, setSearchParams]);

  /** Từ danh sách đề (?autostart=1): bỏ màn chờ, bắt đầu luôn. */
  useEffect(() => {
    if (searchParams.get("autostart") !== "1") return;
    if (autostartLock.current || loading || starting || attempt || submitted) return;
    if (!detail?.canStart) {
      setSearchParams({}, { replace: true });
      return;
    }
    autostartLock.current = true;
    void (async () => {
      await handleStart();
      setSearchParams({}, { replace: true });
    })();
  }, [searchParams, loading, starting, attempt, submitted, detail?.canStart, handleStart, setSearchParams]);

  const handleExamComplete = useCallback(
    async (payload: { answers: Record<string, unknown>; elapsedMs: number }) => {
      if (!attempt?.id || autoSubmitLock.current) return;
      autoSubmitLock.current = true;
      try {
        const session = getExerciseSession(`exam:${assignmentId}`);
        const answersPayload = buildStructuredSnapshot(
          payload.answers as Parameters<typeof buildStructuredSnapshot>[0],
          session?.questionIdsOrder ?? Object.keys(payload.answers),
          session?.choiceOrders ?? {},
        );
        const result = await apiSubmitExamAttempt({
          attemptId: attempt.id,
          elapsedMs: payload.elapsedMs,
          answers: answersPayload as unknown as Record<string, unknown>,
        });
        setSubmitted(result);
        try {
          const refreshed = await apiGetStudentExam(assignmentId!, true);
          setDetail(refreshed);
        } catch {
          /* giữ detail cũ */
        }
        // Unmount player → cùng màn kết quả; canStart đã refresh để hiện "Làm lại" nếu còn lượt
        setAttempt(null);
        return result;
      } catch (err) {
        autoSubmitLock.current = false;
        setError((err as { message?: string })?.message || "Nộp bài thất bại.");
        throw err;
      }
    },
    [attempt?.id, assignmentId],
  );

  /** Hết giờ → cùng luồng nút Nộp bài trong ExercisePlayer */
  useEffect(() => {
    if (remainingMs == null || remainingMs > 0 || !attempt?.id || submitted) return;
    if (timeoutForceLock.current || autoSubmitLock.current) return;
    timeoutForceLock.current = true;
    setExamForceSubmitToken((token) => token + 1);
  }, [remainingMs, attempt?.id, submitted]);

  if (loading) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", minHeight: "50vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !detail) {
    return (
      <Box sx={{ p: 3, maxWidth: 640, mx: "auto" }}>
        <Alert severity="error">{error}</Alert>
        <Button sx={{ mt: 2 }} onClick={() => navigate(studentRoutePaths.exams)}>
          Quay lại danh sách đề
        </Button>
      </Box>
    );
  }

  /** Mở lại đề đã nộp — cùng màn kết quả như sau khi nộp bài */
  if (submitted && !attempt) {
    const correct = submitted.correctCount ?? 0;
    const total = submitted.totalCount ?? 0;
    const passScore = submitted.passScorePercent ?? detail?.passScorePercent ?? 80;
    return (
      <ExerciseResultScreen
        lessonTitle={detail?.examPaperTitle ?? "Đề thi"}
        subjectName={detail?.classroomName}
        correctCount={correct}
        total={total}
        wrongCount={Math.max(0, total - correct)}
        passScorePercent={passScore}
        elapsedMs={submitted.elapsedMs ?? 0}
        passed={Boolean(submitted.passed)}
        onRetry={detail?.canStart ? () => void handleStart() : undefined}
        onContinueStudy={() => navigate(studentRoutePaths.exams)}
        onBackToLessons={() => navigate(studentRoutePaths.exams)}
      />
    );
  }

  if (!attempt) {
    if (starting || searchParams.get("autostart") === "1") {
      return (
        <Box sx={{ display: "grid", placeItems: "center", minHeight: "50vh" }}>
          <CircularProgress />
          <Typography color="text.secondary" sx={{ mt: 2 }}>
            Đang mở đề…
          </Typography>
        </Box>
      );
    }
    return (
      <Box sx={{ p: 3, maxWidth: 640, mx: "auto" }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(studentRoutePaths.exams)}
          sx={{ mb: 2, textTransform: "none" }}
        >
          Danh sách đề
        </Button>
        <Typography variant="h5" fontWeight={700}>
          {detail?.examPaperTitle ?? "Đề thi"}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          {detail?.classroomName} · {detail?.questionCount ?? 0} câu
          {detail?.durationMinutes ? ` · ${detail.durationMinutes} phút` : ""}
        </Typography>
        {error ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        ) : null}
        {!detail?.windowOpen ? (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Ngoài cửa sổ làm bài (open/close).
          </Alert>
        ) : null}
        <Button
          variant="contained"
          sx={{ mt: 3, textTransform: "none", fontWeight: 700 }}
          disabled={starting || !detail?.canStart}
          onClick={() => void handleStart()}
        >
          {starting ? "Đang mở…" : "Bắt đầu làm bài"}
        </Button>
      </Box>
    );
  }

  if (!practiceBlocks.length) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Đề chưa có nội dung câu hỏi.</Alert>
        <Button component={Link} to={studentRoutePaths.exams} sx={{ mt: 2 }}>
          Quay lại
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ height: "100%", minHeight: 0, display: "flex", flexDirection: "column" }}>
      {error ? (
        <Alert severity="error" sx={{ m: 2, position: "relative", zIndex: 40, flexShrink: 0 }}>
          {error}
        </Alert>
      ) : null}

      <Box sx={{ flex: 1, minHeight: 0 }}>
        <ExercisePlayer
          mode="exam"
          lessonId={`exam:${assignmentId}`}
          lessonTitle={detail?.examPaperTitle ?? "Đề thi"}
          subjectName={detail?.classroomName}
          practiceBlocks={practiceBlocks}
          persistAttempts={false}
          onExamComplete={handleExamComplete}
          onBackToLessons={() => navigate(studentRoutePaths.exams)}
          onExamExit={() => navigate(studentRoutePaths.exams)}
          examRemainingLabel={
            submitted ? null : remainingMs != null ? formatExamCountdown(remainingMs) : null
          }
          examForceSubmitToken={examForceSubmitToken}
        />
      </Box>
    </Box>
  );
}

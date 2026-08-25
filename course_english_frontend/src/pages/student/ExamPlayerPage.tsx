import AccessTimeIcon from "@mui/icons-material/AccessTime";
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
import { getExerciseSession } from "../../student/lessonPlayer/exerciseSessionStorage";
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
  const autoSubmitLock = useRef(false);
  const autostartLock = useRef(false);

  const load = useCallback(async () => {
    if (!assignmentId) return;
    setLoading(true);
    setError("");
    try {
      const data = await apiGetStudentExam(assignmentId, true);
      setDetail(data);
      if (data.inProgressAttempt) {
        setAttempt(data.inProgressAttempt);
      } else if (data.latestSubmittedAttempt && !data.canStart) {
        setSubmitted(data.latestSubmittedAttempt);
      }
    } catch (err) {
      setError((err as { message?: string })?.message || "Không tải được đề thi.");
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

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
      const started = await apiStartExamAttempt(assignmentId);
      setAttempt(started);
      setSubmitted(null);
    } catch (err) {
      setError((err as { message?: string })?.message || "Không bắt đầu được bài làm.");
    } finally {
      setStarting(false);
    }
  }, [assignmentId]);

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

  useEffect(() => {
    if (remainingMs == null || remainingMs > 0 || !attempt?.id || submitted) return;
    if (autoSubmitLock.current) return;
    void (async () => {
      autoSubmitLock.current = true;
      try {
        const session = getExerciseSession(`exam:${assignmentId}`);
        const answersPayload = buildStructuredSnapshot(
          session?.answers ?? {},
          session?.questionIdsOrder ?? [],
          session?.choiceOrders ?? {},
        );
        const result = await apiSubmitExamAttempt({
          attemptId: attempt.id,
          elapsedMs: durationMs || 0,
          answers: answersPayload as unknown as Record<string, unknown>,
        });
        setSubmitted(result);
        setAttempt(null);
      } catch {
        autoSubmitLock.current = false;
      }
    })();
  }, [remainingMs, attempt?.id, submitted, durationMs, assignmentId]);

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

  if (submitted && !attempt) {
    return (
      <Box sx={{ p: 3, maxWidth: 560, mx: "auto", textAlign: "center" }}>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
          {submitted.status === "TIMED_OUT" ? "Hết giờ — đã nộp bài" : "Đã nộp bài"}
        </Typography>
        <Typography variant="h3" fontWeight={800} color={submitted.passed ? "success.main" : "text.primary"}>
          {submitted.scorePercent ?? 0}%
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          {submitted.correctCount ?? 0}/{submitted.totalCount ?? 0} đơn vị đúng
          {submitted.passed ? " · Đạt" : " · Chưa đạt"}
        </Typography>
        <Box sx={{ display: "flex", gap: 1, justifyContent: "center", mt: 3, flexWrap: "wrap" }}>
          <Button variant="outlined" onClick={() => navigate(studentRoutePaths.exams)}>
            Danh sách đề
          </Button>
          {detail?.canStart ? (
            <Button variant="contained" onClick={() => void handleStart()}>
              Làm lại
            </Button>
          ) : null}
        </Box>
      </Box>
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
    <Box sx={{ minHeight: "100vh", bgcolor: "#F8FAFC" }}>
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: 2,
          py: 1.25,
          bgcolor: "#0F172A",
          color: "#fff",
        }}
      >
        <Button
          size="small"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(studentRoutePaths.exams)}
          sx={{ color: "#fff", textTransform: "none" }}
        >
          Thoát
        </Button>
        <Typography fontWeight={700} sx={{ flex: 1 }} noWrap>
          {detail?.examPaperTitle}
        </Typography>
        {remainingMs != null ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              px: 1.25,
              py: 0.5,
              borderRadius: "8px",
              bgcolor: remainingMs < 60_000 ? "#DC2626" : "#1E293B",
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            <AccessTimeIcon sx={{ fontSize: 18 }} />
            {formatExamCountdown(remainingMs)}
          </Box>
        ) : null}
      </Box>

      {error ? (
        <Alert severity="error" sx={{ m: 2 }}>
          {error}
        </Alert>
      ) : null}

      <ExercisePlayer
        mode="exam"
        lessonId={`exam:${assignmentId}`}
        lessonTitle={detail?.examPaperTitle ?? "Đề thi"}
        subjectName={detail?.classroomName}
        practiceBlocks={practiceBlocks}
        persistAttempts={false}
        onExamComplete={handleExamComplete}
        onBackToLessons={() => navigate(studentRoutePaths.exams)}
      />
    </Box>
  );
}

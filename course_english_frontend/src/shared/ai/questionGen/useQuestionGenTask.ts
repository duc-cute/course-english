import { useCallback, useEffect, useRef, useState } from "react";
import {
  AI_TASK_POLL_INTERVAL_MS,
  AI_TASK_POLL_MAX_MS,
} from "./aiTaskPolling";
import type { AiDraftQuestion, AiQuestionGenEnvelope } from "./types";
import {
  apiCreateQuestionGenTask,
  apiGetAiTask,
  apiReportAiTaskPollTimeout,
  type CreateQuestionGenTaskPayload,
} from "../../api/aiTask";
import { aiGenLog, type AiGenLogScope } from "./aiGenLogger";

export type QuestionGenTaskStatus = "idle" | "creating" | "polling" | "done" | "failed";

function normalizeDrafts(questions: AiDraftQuestion[]): AiDraftQuestion[] {
  return questions.map((q) => ({
    ...q,
    selected: q.selected !== false,
    validationErrors: q.validationErrors ?? [],
  }));
}

export type UseQuestionGenTaskOptions = {
  scope: AiGenLogScope;
  pollMaxMs?: number;
};

export function useQuestionGenTask({ scope, pollMaxMs = AI_TASK_POLL_MAX_MS }: UseQuestionGenTaskOptions) {
  const pollStartedRef = useRef(0);
  const cancelledRef = useRef(false);

  const [status, setStatus] = useState<QuestionGenTaskStatus>("idle");
  const [taskId, setTaskId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<AiDraftQuestion[]>([]);
  const [summaryMessage, setSummaryMessage] = useState("");
  const [error, setError] = useState("");
  const [progressMessage, setProgressMessage] = useState("");
  const [progressPercent, setProgressPercent] = useState<number | null>(null);
  const [pollElapsedSec, setPollElapsedSec] = useState(0);

  const reset = useCallback(() => {
    cancelledRef.current = true;
    setStatus("idle");
    setTaskId(null);
    setDrafts([]);
    setSummaryMessage("");
    setError("");
    setProgressMessage("");
    setProgressPercent(null);
    setPollElapsedSec(0);
    pollStartedRef.current = 0;
  }, []);

  const applyTaskProgress = useCallback(
    (task: { progressMessage?: string | null; progressPercent?: number | null }) => {
      if (task.progressMessage) setProgressMessage(task.progressMessage);
      if (task.progressPercent != null && !Number.isNaN(task.progressPercent)) {
        setProgressPercent((prev) =>
          prev === null ? task.progressPercent! : Math.max(prev, task.progressPercent!),
        );
      }
    },
    [],
  );

  const runTask = useCallback(
    async (payload: CreateQuestionGenTaskPayload) => {
      cancelledRef.current = false;
      setError("");
      setDrafts([]);
      setSummaryMessage("");
      setProgressMessage("Đang khởi tạo tác vụ AI…");
      setProgressPercent(null);
      setStatus("creating");
      pollStartedRef.current = Date.now();

      aiGenLog("info", {
        scope,
        event: "task_create_start",
        topic: payload.topic,
        typeQuotas: payload.typeQuotas,
        languageLevel: payload.languageLevel,
        difficulty: payload.difficulty,
      });

      try {
        const created = await apiCreateQuestionGenTask(payload);
        const id = created.taskId;
        if (!id) throw new Error("Không nhận được taskId");
        setTaskId(id);
        setStatus("polling");

        aiGenLog("info", { scope, event: "task_created", taskId: id });

        while (!cancelledRef.current && Date.now() - pollStartedRef.current < pollMaxMs) {
          const task = await apiGetAiTask(id);
          applyTaskProgress(task);

          if (task.status === "DONE") {
            const envelope = task.outputJson as AiQuestionGenEnvelope | undefined;
            const questions = normalizeDrafts(envelope?.questions ?? []);
            const elapsedMs = Date.now() - pollStartedRef.current;
            setDrafts(questions);
            setSummaryMessage(envelope?.meta?.summaryMessage ?? "");
            setStatus("done");

            aiGenLog("info", {
              scope,
              event: "task_done",
              taskId: id,
              elapsedMs,
              questionCount: questions.length,
              validCount: envelope?.meta?.validCount,
              invalidCount: envelope?.meta?.invalidCount,
              model: envelope?.meta?.model,
            });
            return { taskId: id, questions, meta: envelope?.meta };
          }

          if (task.status === "FAILED") {
            throw new Error(task.errorMessage ?? "Sinh câu hỏi thất bại.");
          }

          await new Promise((r) => window.setTimeout(r, AI_TASK_POLL_INTERVAL_MS));
        }

        if (cancelledRef.current) {
          aiGenLog("debug", { scope, event: "task_cancelled", taskId: id });
          return null;
        }

        void apiReportAiTaskPollTimeout(id).catch(() => undefined);
        throw new Error("Xử lý quá lâu. Thử giảm số câu hoặc thử lại sau.");
      } catch (err) {
        const message = (err as { message?: string })?.message ?? "Sinh câu hỏi thất bại.";
        setError(message);
        setStatus("failed");
        aiGenLog("error", {
          scope,
          event: "task_failed",
          taskId: taskId ?? undefined,
          elapsedMs: pollStartedRef.current ? Date.now() - pollStartedRef.current : undefined,
          message,
        });
        return null;
      }
    },
    [applyTaskProgress, pollMaxMs, scope],
  );

  const pollTask = useCallback(
    async (id: string) => {
      cancelledRef.current = false;
      setError("");
      setDrafts([]);
      setSummaryMessage("");
      setProgressMessage("Đang xử lý tác vụ AI…");
      setProgressPercent(null);
      setTaskId(id);
      setStatus("polling");
      pollStartedRef.current = Date.now();

      try {
        while (!cancelledRef.current && Date.now() - pollStartedRef.current < pollMaxMs) {
          const task = await apiGetAiTask(id);
          applyTaskProgress(task);

          if (task.status === "DONE") {
            const envelope = task.outputJson as AiQuestionGenEnvelope | undefined;
            const questions = normalizeDrafts(envelope?.questions ?? []);
            setDrafts(questions);
            setSummaryMessage(envelope?.meta?.summaryMessage ?? "");
            setStatus("done");
            return { taskId: id, questions, meta: envelope?.meta };
          }

          if (task.status === "FAILED") {
            throw new Error(task.errorMessage ?? "Sinh câu hỏi thất bại.");
          }

          await new Promise((r) => window.setTimeout(r, AI_TASK_POLL_INTERVAL_MS));
        }

        if (cancelledRef.current) return null;

        void apiReportAiTaskPollTimeout(id).catch(() => undefined);
        throw new Error("Xử lý quá lâu. Thử lại sau.");
      } catch (err) {
        const message = (err as { message?: string })?.message ?? "Sinh câu hỏi thất bại.";
        setError(message);
        setStatus("failed");
        return null;
      }
    },
    [applyTaskProgress, pollMaxMs],
  );

  useEffect(() => {
    if (status !== "polling") return undefined;
    const startedAt = pollStartedRef.current || Date.now();
    const timer = window.setInterval(() => {
      setPollElapsedSec(Math.floor((Date.now() - startedAt) / 1000));
    }, 500);
    return () => window.clearInterval(timer);
  }, [status]);

  const isBusy = status === "creating" || status === "polling";

  return {
    status,
    isBusy,
    taskId,
    drafts,
    setDrafts,
    summaryMessage,
    error,
    setError,
    progressMessage,
    progressPercent,
    pollElapsedSec,
    reset,
    runTask,
    pollTask,
  };
}

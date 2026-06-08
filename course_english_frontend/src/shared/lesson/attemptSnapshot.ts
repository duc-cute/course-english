import type { ExerciseAnswerSnapshot } from "../../student/lessonPlayer/exerciseSessionStorage";

/** Snapshot đầy đủ — lưu server khi nộp bài. */
export type StructuredAttemptSnapshot = {
  answers: Record<string, ExerciseAnswerSnapshot>;
  questionIdsOrder?: string[];
  choiceOrders?: Record<string, string[]>;
};

function isAnswerEntry(value: unknown): value is ExerciseAnswerSnapshot {
  return typeof value === "object" && value !== null && "correct" in value;
}

/** Parse snapshot mới (có `answers`) hoặc legacy (flat questionId → answer). */
export function parseAttemptSnapshot(
  raw?: Record<string, unknown> | null,
): StructuredAttemptSnapshot {
  if (!raw || typeof raw !== "object") {
    return { answers: {} };
  }

  const nested = raw.answers;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    const answers: Record<string, ExerciseAnswerSnapshot> = {};
    for (const [key, value] of Object.entries(nested)) {
      if (isAnswerEntry(value)) {
        answers[key] = value;
      }
    }
    return {
      answers,
      questionIdsOrder: Array.isArray(raw.questionIdsOrder)
        ? (raw.questionIdsOrder as string[])
        : undefined,
      choiceOrders:
        raw.choiceOrders && typeof raw.choiceOrders === "object"
          ? (raw.choiceOrders as Record<string, string[]>)
          : undefined,
    };
  }

  const answers: Record<string, ExerciseAnswerSnapshot> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (isAnswerEntry(value)) {
      answers[key] = value;
    }
  }
  return { answers };
}

export function buildStructuredSnapshot(
  answers: Record<string, ExerciseAnswerSnapshot>,
  questionIdsOrder: string[],
  choiceOrders: Record<string, string[]>,
): StructuredAttemptSnapshot {
  return {
    answers,
    questionIdsOrder,
    choiceOrders,
  };
}

export function hasShuffleMetadata(snapshot: StructuredAttemptSnapshot): boolean {
  return Boolean(
    snapshot.questionIdsOrder?.length || Object.keys(snapshot.choiceOrders ?? {}).length,
  );
}

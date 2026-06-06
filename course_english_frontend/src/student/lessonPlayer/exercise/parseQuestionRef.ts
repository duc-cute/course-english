import { parseBlockPayload } from "../../../shared/api/lesson";
import type { ExerciseQuestion } from "./types";
import { parseExerciseSetPayload } from "./parseExerciseSet";

export type QuestionRefBlockPayload = {
  title?: string;
  instruction?: string;
  presentation?: "stepped" | "inline";
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  passScorePercent?: number;
  refs?: string[];
};

export function parseQuestionRefPayload(payloadJson?: string): QuestionRefBlockPayload {
  const raw = parseBlockPayload<Record<string, unknown>>(payloadJson);
  const refs = Array.isArray(raw.refs)
    ? raw.refs.filter((r): r is string => typeof r === "string" && r.trim().length > 0)
    : [];
  return {
    title: typeof raw.title === "string" ? raw.title : undefined,
    instruction: typeof raw.instruction === "string" ? raw.instruction : undefined,
    presentation: raw.presentation === "inline" ? "inline" : "stepped",
    shuffleQuestions: raw.shuffleQuestions === true,
    shuffleOptions: raw.shuffleOptions === true,
    passScorePercent: typeof raw.passScorePercent === "number" ? raw.passScorePercent : undefined,
    refs,
  };
}

export function parseResolvedQuestions(resolvedQuestionsJson?: string): ExerciseQuestion[] {
  if (!resolvedQuestionsJson?.trim()) {
    return [];
  }
  try {
    const wrapped = parseExerciseSetPayload(
      JSON.stringify({ questions: JSON.parse(resolvedQuestionsJson) as unknown[] }),
    );
    return wrapped.questions;
  } catch {
    return [];
  }
}

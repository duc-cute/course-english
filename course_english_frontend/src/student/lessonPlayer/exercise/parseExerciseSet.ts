import { parseBlockPayload } from "../../../shared/api/lesson";
import type { ExerciseQuestion, ExerciseSetPayload } from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseQuestion(raw: unknown): ExerciseQuestion | null {
  if (!isRecord(raw) || typeof raw.id !== "string" || typeof raw.type !== "string") {
    return null;
  }

  if (raw.type === "MULTIPLE_CHOICE") {
    const choices = Array.isArray(raw.choices) ? raw.choices : [];
    const parsedChoices = choices
      .filter(isRecord)
      .map((c) => ({
        id: String(c.id ?? ""),
        text: String(c.text ?? ""),
      }))
      .filter((c) => c.id && c.text);

    const prompt = isRecord(raw.prompt)
      ? { text: String(raw.prompt.text ?? ""), lang: raw.prompt.lang ? String(raw.prompt.lang) : undefined }
      : { text: "" };

    if (!prompt.text || !parsedChoices.length || typeof raw.correctChoiceId !== "string") {
      return null;
    }

    return {
      id: raw.id,
      type: "MULTIPLE_CHOICE",
      prompt,
      choices: parsedChoices,
      correctChoiceId: raw.correctChoiceId,
      explanation: typeof raw.explanation === "string" ? raw.explanation : undefined,
    };
  }

  if (raw.type === "LISTEN_CHOOSE") {
    const audioUrl = typeof raw.audioUrl === "string" ? raw.audioUrl.trim() : "";
    if (!audioUrl) return null;

    const choices = Array.isArray(raw.choices) ? raw.choices : [];
    const parsedChoices = choices
      .filter(isRecord)
      .map((c) => ({
        id: String(c.id ?? ""),
        text: String(c.text ?? ""),
      }))
      .filter((c) => c.id && c.text);

    if (!parsedChoices.length || typeof raw.correctChoiceId !== "string") {
      return null;
    }

    const prompt = isRecord(raw.prompt)
      ? { text: String(raw.prompt.text ?? ""), lang: raw.prompt.lang ? String(raw.prompt.lang) : undefined }
      : { text: "Nghe và chọn nghĩa tiếng Việt đúng", lang: "vi" };

    const audioAccent = raw.audioAccent === "US" ? "US" : raw.audioAccent === "UK" ? "UK" : undefined;

    return {
      id: raw.id,
      type: "LISTEN_CHOOSE",
      audioUrl,
      audioAccent,
      wordEn: typeof raw.wordEn === "string" ? raw.wordEn : undefined,
      prompt,
      choices: parsedChoices,
      correctChoiceId: raw.correctChoiceId,
      explanation: typeof raw.explanation === "string" ? raw.explanation : undefined,
    };
  }

  if (raw.type === "MATCHING") {
    const pairs = Array.isArray(raw.pairs) ? raw.pairs : [];
    const parsedPairs = pairs
      .filter(isRecord)
      .map((p) => ({ left: String(p.left ?? ""), right: String(p.right ?? "") }))
      .filter((p) => p.left && p.right);

    if (!parsedPairs.length) return null;

    return {
      id: raw.id,
      type: "MATCHING",
      pairs: parsedPairs,
      explanation: typeof raw.explanation === "string" ? raw.explanation : undefined,
    };
  }

  return null;
}

export function parseExerciseSetPayload(payloadJson?: string): ExerciseSetPayload {
  const raw = parseBlockPayload<Record<string, unknown>>(payloadJson);
  const questionsRaw = Array.isArray(raw.questions) ? raw.questions : [];
  const questions = questionsRaw.map(parseQuestion).filter((q): q is ExerciseQuestion => q !== null);

  return {
    title: typeof raw.title === "string" ? raw.title : undefined,
    instruction: typeof raw.instruction === "string" ? raw.instruction : undefined,
    presentation: raw.presentation === "inline" ? "inline" : "stepped",
    shuffleQuestions: raw.shuffleQuestions === true,
    shuffleOptions: raw.shuffleOptions === true,
    passScorePercent: typeof raw.passScorePercent === "number" ? raw.passScorePercent : undefined,
    questions,
  };
}

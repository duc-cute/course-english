import { generateQuestionId } from "../../lesson/exercisePayload";
import { normalizeFillBlankPrompt, syncBlanksWithPrompt } from "../../lesson/fillBlankUtils";
import { syncGapFillBlanksWithPrompt } from "../../lesson/gapFillMcqUtils";
import {
  MCQ_LAYOUT_SENTENCE_ARRANGEMENT,
  normalizeMcqArrangementFields,
} from "../../lesson/mcqArrangementUtils";
import { READING_PRESENTATION_SPLIT } from "../../lesson/readingComprehensionUtils";
import type {
  ExerciseQuestion,
  ReadingSubQuestion,
} from "../../../student/lessonPlayer/exercise/types";
import type { AiDraftQuestion } from "./types";
function parseContentJsonObject(
  contentJson: AiDraftQuestion["contentJson"],
): Record<string, unknown> | null {
  if (!contentJson) return null;
  if (typeof contentJson === "object") return contentJson;
  try {
    const parsed = JSON.parse(contentJson) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function draftToExerciseQuestion(draft: AiDraftQuestion): ExerciseQuestion | null {
  const prompt = { text: draft.promptText, lang: draft.promptLang ?? "en" };
  const explanation = draft.explanation ?? "";

  if (draft.questionType === "MULTIPLE_CHOICE") {
    const choices = (draft.choices ?? []).map((c) => ({
      id: c.choiceKey,
      text: c.choiceText,
    }));
    const correct = draft.choices?.find((c) => c.correct);
    if (choices.length < 2) return null;
    const payload = parseContentJsonObject(draft.contentJson);
    const rawItems = Array.isArray(payload?.items) ? payload.items : [];
    const items = rawItems
      .map((row) => {
        const item = row as { key?: string; text?: string };
        return {
          key: String(item.key ?? "").trim().toLowerCase(),
          text: String(item.text ?? "").trim(),
        };
      })
      .filter((item) => item.key && item.text);
    const layout =
      payload?.layout === MCQ_LAYOUT_SENTENCE_ARRANGEMENT || items.length >= 3
        ? MCQ_LAYOUT_SENTENCE_ARRANGEMENT
        : undefined;
    return normalizeMcqArrangementFields({
      id: generateQuestionId(),
      type: "MULTIPLE_CHOICE",
      prompt,
      choices,
      correctChoiceId: correct?.choiceKey ?? choices[0].id,
      explanation,
      layout,
      items: items.length >= 3 ? items : undefined,
    });
  }

  if (draft.questionType === "TRUE_FALSE") {
    const payload = parseContentJsonObject(draft.contentJson);
    if (typeof payload?.correctAnswer !== "boolean") return null;
    return {
      id: generateQuestionId(),
      type: "TRUE_FALSE",
      prompt,
      correctAnswer: payload.correctAnswer,
      explanation,
    };
  }

  if (draft.questionType === "FILL_BLANK") {
    const promptText = normalizeFillBlankPrompt(draft.promptText);
    const payload = parseContentJsonObject(draft.contentJson);
    const rawBlanks = Array.isArray(payload?.blanks) ? payload.blanks : [];
    const blanks = rawBlanks
      .map((b, index) => {
        const row = b as { id?: string; acceptedAnswers?: string[]; placeholder?: string };
        const accepted = Array.isArray(row.acceptedAnswers)
          ? row.acceptedAnswers.filter((a) => typeof a === "string")
          : [];
        return {
          id: row.id ?? `b${index + 1}`,
          acceptedAnswers: accepted.length ? accepted : [""],
          placeholder: row.placeholder,
        };
      })
      .filter((b) => b.acceptedAnswers.some((a) => a.trim()));
    if (!blanks.length) return null;
    const synced = syncBlanksWithPrompt(promptText, blanks);
    return {
      id: generateQuestionId(),
      type: "FILL_BLANK",
      prompt: { text: promptText, lang: draft.promptLang ?? "en" },
      blanks: synced,
      caseSensitive: payload?.caseSensitive === true,
      explanation,
    };
  }

  if (draft.questionType === "GAP_FILL_MCQ") {
    const promptText = normalizeFillBlankPrompt(draft.promptText);
    const payload = parseContentJsonObject(draft.contentJson);
    const rawBlanks = Array.isArray(payload?.blanks) ? payload.blanks : [];
    const blanks = rawBlanks
      .map((b, index) => {
        const row = b as {
          id?: string;
          choices?: { choiceKey?: string; choiceText?: string; correct?: boolean }[];
        };
        const choices = (row.choices ?? [])
          .map((c, ci) => ({
            id: (c.choiceKey ?? `a${ci}`).trim().toLowerCase(),
            text: typeof c.choiceText === "string" ? c.choiceText.trim() : "",
          }))
          .filter((c) => c.id && c.text);
        const correct = row.choices?.find((c) => c.correct);
        const correctChoiceId =
          correct?.choiceKey?.trim().toLowerCase() ?? choices[0]?.id ?? "a";
        if (choices.length < 2) return null;
        return {
          id: row.id?.trim() || `b${index + 1}`,
          choices,
          correctChoiceId,
        };
      })
      .filter((b): b is NonNullable<typeof b> => b !== null);
    if (blanks.length < 2) return null;
    const synced = syncGapFillBlanksWithPrompt(promptText, blanks);
    return {
      id: generateQuestionId(),
      type: "GAP_FILL_MCQ",
      prompt: { text: promptText, lang: draft.promptLang ?? "en" },
      blanks: synced,
      explanation,
    };
  }

  if (draft.questionType === "READING_COMPREHENSION") {
    const payload = parseContentJsonObject(draft.contentJson);
    if (!payload) return null;
    const passageRaw = payload.passage as { title?: string; text?: string; lang?: string } | undefined;
    const passageText = passageRaw?.text?.trim() ?? "";
    if (!passageText) return null;

    const rawSubs = Array.isArray(payload.subQuestions) ? payload.subQuestions : [];
    const subQuestions = rawSubs
      .map((sub, index) => {
        const row = sub as {
          id?: string;
          promptText?: string;
          promptLang?: string;
          choices?: { choiceKey?: string; choiceText?: string; correct?: boolean }[];
          explanation?: string;
        };
        const subPrompt = row.promptText?.trim() ?? "";
        if (!subPrompt) return null;
        const choices = (row.choices ?? [])
          .map((c, ci) => ({
            id: (c.choiceKey ?? `a${ci}`).trim().toLowerCase(),
            text: typeof c.choiceText === "string" ? c.choiceText.trim() : "",
          }))
          .filter((c) => c.id && c.text);
        const correct = row.choices?.find((c) => c.correct);
        const correctChoiceId = correct?.choiceKey?.trim().toLowerCase() ?? choices[0]?.id ?? "";
        if (choices.length < 2 || !correctChoiceId) return null;
        const item: ReadingSubQuestion = {
          id: row.id?.trim() || `sq${index + 1}`,
          prompt: { text: subPrompt, lang: row.promptLang ?? draft.promptLang ?? "en" },
          choices,
          correctChoiceId,
          explanation: row.explanation?.trim() || undefined,
        };
        return item;
      })
      .filter((s): s is ReadingSubQuestion => s !== null);

    if (subQuestions.length < 2) return null;

    const presentation =
      payload.presentation === "stepped" || payload.presentation === "split"
        ? payload.presentation
        : READING_PRESENTATION_SPLIT;

    return {
      id: generateQuestionId(),
      type: "READING_COMPREHENSION",
      passage: {
        title: passageRaw?.title?.trim() || draft.promptText?.trim() || undefined,
        text: passageText,
        lang: passageRaw?.lang ?? draft.promptLang ?? "en",
      },
      subQuestions,
      presentation,
      explanation,
    };
  }

  return null;
}

export function draftsToExerciseQuestions(drafts: AiDraftQuestion[]): ExerciseQuestion[] {
  return drafts
    .filter((d) => d.selected && !(d.validationErrors?.length))
    .map(draftToExerciseQuestion)
    .filter((q): q is ExerciseQuestion => q !== null);
}

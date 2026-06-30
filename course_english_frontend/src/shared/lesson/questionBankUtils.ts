import type {
  QuestionFormPayload,
  QuestionRecord,
  QuestionSource,
  QuestionStatus,
  QuestionType,
} from "../api/question";
import { createEmptyFillBlankQuestion, createEmptyMcqQuestion } from "./exercisePayload";
import type {
  ExerciseQuestion,
  FillBlankQuestion,
  MultipleChoiceQuestion,
  TrueFalseQuestion,
} from "../../student/lessonPlayer/exercise/types";
import { syncBlanksWithPrompt } from "./fillBlankUtils";

export type QuestionFormMeta = {
  title?: string;
  categoryId?: string;
  status?: QuestionStatus;
  difficulty?: number;
  cefrLevel?: string;
  skill?: string;
  topic?: string;
  tags?: string[];
  source?: QuestionSource;
  aiGenerated?: boolean;
};

export const QUESTION_BANK_EDITABLE_TYPES: QuestionType[] = [
  "MULTIPLE_CHOICE",
  "TRUE_FALSE",
  "FILL_BLANK",
];

function parseContentJson<T>(raw?: string): T | null {
  if (!raw?.trim()) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function createEmptyTrueFalseQuestion(id?: string): TrueFalseQuestion {
  return {
    id: id ?? `q${Date.now()}`,
    type: "TRUE_FALSE",
    prompt: { text: "", lang: "en" },
    correctAnswer: true,
    explanation: "",
  };
}

export function createEmptyQuestionByType(type: QuestionType, id?: string): ExerciseQuestion {
  if (type === "TRUE_FALSE") return createEmptyTrueFalseQuestion(id);
  if (type === "FILL_BLANK") return createEmptyFillBlankQuestion(id);
  return createEmptyMcqQuestion(id);
}

/** @deprecated use questionRecordToExerciseQuestion */
export function questionToMcq(question: QuestionRecord): MultipleChoiceQuestion {
  const q = questionRecordToExerciseQuestion(question);
  if (q.type === "MULTIPLE_CHOICE") return q;
  return createEmptyMcqQuestion(question.id);
}

export function questionRecordToExerciseQuestion(record: QuestionRecord): ExerciseQuestion {
  const prompt = { text: record.promptText, lang: record.promptLang ?? "en" };

  if (record.questionType === "TRUE_FALSE") {
    const content = parseContentJson<{ correctAnswer?: boolean }>(record.contentJson);
    return {
      id: record.id,
      type: "TRUE_FALSE",
      prompt,
      correctAnswer: content?.correctAnswer ?? true,
      explanation: record.explanation,
    };
  }

  if (record.questionType === "FILL_BLANK") {
    const content = parseContentJson<{
      blanks?: FillBlankQuestion["blanks"];
      caseSensitive?: boolean;
    }>(record.contentJson);
    const blanks =
      content?.blanks && content.blanks.length > 0
        ? content.blanks
        : syncBlanksWithPrompt(record.promptText, []);
    return {
      id: record.id,
      type: "FILL_BLANK",
      prompt,
      blanks,
      caseSensitive: content?.caseSensitive,
      explanation: record.explanation,
    };
  }

  const choices = (record.choices ?? []).map((c) => ({
    id: c.choiceKey,
    text: c.choiceText,
  }));
  const correct = record.choices?.find((c) => c.correct);
  if (choices.length < 2) {
    const empty = createEmptyMcqQuestion(record.id);
    empty.prompt = prompt;
    empty.explanation = record.explanation ?? "";
    return empty;
  }
  return {
    id: record.id,
    type: "MULTIPLE_CHOICE",
    prompt,
    choices,
    correctChoiceId: correct?.choiceKey ?? choices[0].id,
    explanation: record.explanation,
  };
}

export function recordToFormMeta(record: QuestionRecord): QuestionFormMeta {
  return {
    title: record.title,
    categoryId: record.categoryId,
    status: record.status ?? "DRAFT",
    difficulty: record.difficulty,
    cefrLevel: record.cefrLevel,
    skill: record.skill,
    topic: record.topic,
    tags: record.tags ?? [],
    source: record.source ?? "MANUAL",
    aiGenerated: record.isAIGenerated,
  };
}

/** @deprecated use exerciseQuestionToQuestionForm */
export function mcqToQuestionForm(mcq: MultipleChoiceQuestion, meta: QuestionFormMeta): QuestionFormPayload {
  return exerciseQuestionToQuestionForm(mcq, meta);
}

export function exerciseQuestionToQuestionForm(
  question: ExerciseQuestion,
  meta: QuestionFormMeta,
): QuestionFormPayload {
  const base: QuestionFormPayload = {
    title: meta.title,
    categoryId: meta.categoryId,
    questionType: question.type,
    status: meta.status ?? "DRAFT",
    promptText: question.prompt?.text ?? "",
    promptLang: question.prompt?.lang ?? "en",
    explanation: question.explanation ?? "",
    difficulty: meta.difficulty,
    cefrLevel: meta.cefrLevel,
    skill: meta.skill,
    topic: meta.topic,
    tags: meta.tags,
    source: meta.source ?? "MANUAL",
    aiGenerated: meta.aiGenerated,
  };

  if (question.type === "MULTIPLE_CHOICE") {
    return {
      ...base,
      choices: question.choices.map((c, index) => ({
        choiceKey: c.id,
        choiceText: c.text,
        correct: c.id === question.correctChoiceId,
        displayOrder: index,
      })),
    };
  }

  if (question.type === "TRUE_FALSE") {
    return {
      ...base,
      contentJson: JSON.stringify({ correctAnswer: question.correctAnswer }),
    };
  }

  if (question.type === "FILL_BLANK") {
    return {
      ...base,
      contentJson: JSON.stringify({
        blanks: question.blanks,
        caseSensitive: question.caseSensitive ?? false,
      }),
    };
  }

  return base;
}

export function displayQuestionTitle(record: QuestionRecord): string {
  if (record.title?.trim()) return record.title.trim();
  return record.promptText.trim();
}

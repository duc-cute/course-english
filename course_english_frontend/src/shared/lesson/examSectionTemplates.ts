import type { QuestionType } from "../api/question";
import {
  buildExerciseSetPayloadJson,
  createDefaultExerciseSetPayload,
  createEmptyFillBlankQuestion,
  createEmptyGapFillMcqQuestion,
  createEmptyMcqQuestion,
  createEmptyReadingComprehensionQuestion,
  generateQuestionId,
} from "./exercisePayload";
import type { ExerciseQuestion, ExerciseSetPayload } from "../../student/lessonPlayer/exercise/types";

export type ExamSectionTemplateKey =
  | "MCQ_STANDARD"
  | "SYNONYMS"
  | "ANTONYMS"
  | "TRUE_FALSE"
  | "FILL_BLANK"
  | "GAP_FILL_MCQ"
  | "READING_COMPREHENSION";

export type ExamSectionTemplate = {
  key: ExamSectionTemplateKey;
  label: string;
  title: string;
  instruction: string;
  suggestedType: QuestionType;
};

export const EXAM_SECTION_TEMPLATES: ExamSectionTemplate[] = [
  {
    key: "MCQ_STANDARD",
    label: "Multiple Choice",
    title: "I. MULTIPLE CHOICE",
    instruction:
      "Mark the letter A, B, C, or D on your answer sheet to indicate the correct answer to each of the following questions.",
    suggestedType: "MULTIPLE_CHOICE",
  },
  {
    key: "SYNONYMS",
    label: "Synonyms",
    title: "II. SYNONYMS",
    instruction:
      "Choose the word or phrase that is CLOSEST in meaning to the underlined part in each of the following questions.",
    suggestedType: "MULTIPLE_CHOICE",
  },
  {
    key: "ANTONYMS",
    label: "Antonyms",
    title: "III. ANTONYMS",
    instruction:
      "Choose the word or phrase that is OPPOSITE in meaning to the underlined part in each of the following questions.",
    suggestedType: "MULTIPLE_CHOICE",
  },
  {
    key: "TRUE_FALSE",
    label: "True / False",
    title: "IV. TRUE / FALSE",
    instruction:
      "Mark the letter T (True) or F (False) on your answer sheet to indicate whether each of the following statements is true or false.",
    suggestedType: "TRUE_FALSE",
  },
  {
    key: "FILL_BLANK",
    label: "Fill in the blank (typing)",
    title: "V. FILL IN THE BLANK",
    instruction:
      "Fill in each blank with ONE suitable word to complete the following sentences.",
    suggestedType: "FILL_BLANK",
  },
  {
    key: "GAP_FILL_MCQ",
    label: "Cloze — choose A/B/C/D",
    title: "VI. CLOZE TEST",
    instruction:
      "Read the following passage and mark the letter A, B, C, or D on your answer sheet to indicate the correct word for each blank.",
    suggestedType: "GAP_FILL_MCQ",
  },
  {
    key: "READING_COMPREHENSION",
    label: "Reading comprehension",
    title: "VI. READING COMPREHENSION",
    instruction:
      "Read the following passage and choose the best answer (A, B, C, or D) for each question.",
    suggestedType: "READING_COMPREHENSION",
  },
];

function defaultQuestionForType(type: QuestionType): ExerciseQuestion {
  if (type === "TRUE_FALSE") {
    return {
      id: generateQuestionId(),
      type: "TRUE_FALSE",
      prompt: { text: "", lang: "en" },
      correctAnswer: true,
    };
  }
  if (type === "FILL_BLANK") return createEmptyFillBlankQuestion();
  if (type === "GAP_FILL_MCQ") return createEmptyGapFillMcqQuestion();
  if (type === "READING_COMPREHENSION") return createEmptyReadingComprehensionQuestion();
  return createEmptyMcqQuestion();
}

/** Tạo payload JSON mặc định cho section mới từ template hoặc trống. */
export function createSectionPayloadJson(template?: ExamSectionTemplate): string {
  const base: ExerciseSetPayload = template
    ? {
        ...createDefaultExerciseSetPayload(),
        title: template.title,
        instruction: template.instruction,
        questions: [defaultQuestionForType(template.suggestedType)],
      }
    : createDefaultExerciseSetPayload();

  return buildExerciseSetPayloadJson(base);
}

export function createEmptySectionState(template?: ExamSectionTemplate) {
  return {
    title: template?.title ?? "Phần mới",
    instruction: template?.instruction ?? "",
    questionType: template?.suggestedType,
    payloadJson: createSectionPayloadJson(template),
  };
}

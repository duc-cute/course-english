import type { QuestionFormPayload, QuestionRecord, QuestionStatus } from "../api/question";
import { createEmptyMcqQuestion } from "./exercisePayload";
import type { MultipleChoiceQuestion } from "../../student/lessonPlayer/exercise/types";

export function questionToMcq(question: QuestionRecord): MultipleChoiceQuestion {
  const choices = (question.choices ?? []).map((c) => ({
    id: c.choiceKey,
    text: c.choiceText,
  }));
  const correct = question.choices?.find((c) => c.correct);
  if (choices.length < 2) {
    const empty = createEmptyMcqQuestion(question.id);
    empty.prompt = { text: question.promptText, lang: question.promptLang ?? "en" };
    empty.explanation = question.explanation ?? "";
    return empty;
  }
  return {
    id: question.id,
    type: "MULTIPLE_CHOICE",
    prompt: { text: question.promptText, lang: question.promptLang ?? "en" },
    choices,
    correctChoiceId: correct?.choiceKey ?? choices[0].id,
    explanation: question.explanation,
  };
}

export function mcqToQuestionForm(
  mcq: MultipleChoiceQuestion,
  meta: {
    categoryId?: string;
    status?: QuestionStatus;
  },
): QuestionFormPayload {
  return {
    categoryId: meta.categoryId,
    questionType: "MULTIPLE_CHOICE",
    status: meta.status ?? "DRAFT",
    promptText: mcq.prompt.text,
    promptLang: mcq.prompt.lang ?? "en",
    explanation: mcq.explanation ?? "",
    choices: mcq.choices.map((c, index) => ({
      choiceKey: c.id,
      choiceText: c.text,
      correct: c.id === mcq.correctChoiceId,
      displayOrder: index,
    })),
  };
}

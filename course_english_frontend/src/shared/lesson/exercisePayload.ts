import { stringifyBlockPayload } from "../api/lesson";
import type {
  ExerciseSetPayload,
  MultipleChoiceQuestion,
} from "../../student/lessonPlayer/exercise/types";

let questionIdSeq = 0;

export function generateQuestionId(): string {
  questionIdSeq += 1;
  return `q${Date.now()}_${questionIdSeq}`;
}

export function createEmptyMcqQuestion(id?: string): MultipleChoiceQuestion {
  return {
    id: id ?? generateQuestionId(),
    type: "MULTIPLE_CHOICE",
    prompt: { text: "", lang: "en" },
    choices: [
      { id: "a", text: "" },
      { id: "b", text: "" },
      { id: "c", text: "" },
      { id: "d", text: "" },
    ],
    correctChoiceId: "a",
    explanation: "",
  };
}

export function createDefaultExerciseSetPayload(): ExerciseSetPayload {
  return {
    title: "Bài tập mới",
    instruction: "Chọn đáp án đúng",
    presentation: "stepped",
    shuffleQuestions: false,
    shuffleOptions: true,
    passScorePercent: 80,
    questions: [
      {
        id: "q1",
        type: "MULTIPLE_CHOICE",
        prompt: { text: "hello", lang: "en" },
        choices: [
          { id: "a", text: "xin chào" },
          { id: "b", text: "tạm biệt" },
          { id: "c", text: "cảm ơn" },
          { id: "d", text: "xin lỗi" },
        ],
        correctChoiceId: "a",
        explanation: "Hello = xin chào.",
      },
    ],
  };
}

export type ExerciseSetValidation = {
  valid: boolean;
  errors: string[];
};

export function getMcqQuestionSummary(question: MultipleChoiceQuestion): string {
  const text = question.prompt.text.trim();
  return text || "(Chưa có nội dung)";
}

export function validateMcqQuestion(question: MultipleChoiceQuestion): ExerciseSetValidation {
  const errors: string[] = [];
  if (!question.prompt.text.trim()) {
    errors.push("Chưa nhập câu hỏi.");
  }
  if (question.choices.some((c) => !c.text.trim())) {
    errors.push("Thiếu nội dung đáp án.");
  }
  if (!question.choices.some((c) => c.id === question.correctChoiceId)) {
    errors.push("Chưa chọn đáp án đúng.");
  }
  return { valid: errors.length === 0, errors };
}

export function validateExerciseSetPayload(payload: ExerciseSetPayload): ExerciseSetValidation {
  const errors: string[] = [];

  if (!payload.title?.trim()) {
    errors.push("Tiêu đề bài tập không được để trống.");
  }

  const mcqQuestions = payload.questions.filter((q) => q.type === "MULTIPLE_CHOICE");
  if (!mcqQuestions.length) {
    errors.push("Cần ít nhất 1 câu trắc nghiệm (MCQ).");
  }

  mcqQuestions.forEach((q, index) => {
    const n = index + 1;
    if (!q.prompt.text.trim()) {
      errors.push(`Câu ${n}: nội dung câu hỏi không được để trống.`);
    }
    const hasEmptyChoice = q.choices.some((c) => !c.text.trim());
    if (hasEmptyChoice) {
      errors.push(`Câu ${n}: tất cả đáp án phải có nội dung.`);
    }
    if (!q.choices.some((c) => c.id === q.correctChoiceId)) {
      errors.push(`Câu ${n}: chưa chọn đáp án đúng.`);
    }
  });

  if (payload.passScorePercent !== undefined) {
    if (payload.passScorePercent < 0 || payload.passScorePercent > 100) {
      errors.push("Điểm đạt phải từ 0 đến 100.");
    }
  }

  return { valid: errors.length === 0, errors };
}

function cleanMcqQuestion(q: MultipleChoiceQuestion): MultipleChoiceQuestion {
  return {
    ...q,
    prompt: { ...q.prompt, text: q.prompt.text.trim() },
    choices: q.choices.map((c) => ({ ...c, text: c.text.trim() })),
    explanation: q.explanation?.trim() || undefined,
  };
}

export function buildExerciseSetPayload(payload: ExerciseSetPayload): ExerciseSetPayload {
  return {
    ...payload,
    title: payload.title?.trim(),
    instruction: payload.instruction?.trim() || undefined,
    questions: payload.questions.map((q) =>
      q.type === "MULTIPLE_CHOICE" ? cleanMcqQuestion(q) : q,
    ),
  };
}

export function buildExerciseSetPayloadJson(payload: ExerciseSetPayload): string {
  return stringifyBlockPayload(buildExerciseSetPayload(payload));
}

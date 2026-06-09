import { stringifyBlockPayload } from "../api/lesson";
import type {
  ExerciseQuestion,
  ExerciseSetPayload,
  ListenChooseQuestion,
  MatchingQuestion,
  MultipleChoiceQuestion,
} from "../../student/lessonPlayer/exercise/types";

let questionIdSeq = 0;

export function generateQuestionId(): string {
  questionIdSeq += 1;
  return `q${Date.now()}_${questionIdSeq}`;
}

export function createEmptyMatchingQuestion(id?: string): MatchingQuestion {
  return {
    id: id ?? generateQuestionId(),
    type: "MATCHING",
    prompt: { text: "Ghép từ tiếng Anh với nghĩa tiếng Việt", lang: "vi" },
    pairs: [
      { left: "", right: "" },
      { left: "", right: "" },
      { left: "", right: "" },
    ],
    explanation: "",
  };
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

export function getMatchingQuestionSummary(question: MatchingQuestion): string {
  const prompt = question.prompt?.text?.trim();
  if (prompt) return prompt;
  const first = question.pairs.find((p) => p.left.trim())?.left.trim();
  if (first) return `Ghép cặp: ${first}…`;
  return "(Ghép cặp — chưa có từ)";
}

export function getListenChooseQuestionSummary(question: ListenChooseQuestion): string {
  if (question.wordEn?.trim()) return `Nghe: ${question.wordEn.trim()}`;
  return "Nghe và chọn nghĩa";
}

export function getQuestionSummary(question: ExerciseQuestion): string {
  if (question.type === "MULTIPLE_CHOICE") return getMcqQuestionSummary(question);
  if (question.type === "LISTEN_CHOOSE") return getListenChooseQuestionSummary(question);
  if (question.type === "MATCHING") return getMatchingQuestionSummary(question);
  return `(${question.type})`;
}

export function getQuestionTypeLabel(question: ExerciseQuestion): string {
  if (question.type === "MULTIPLE_CHOICE") return "Trắc nghiệm";
  if (question.type === "LISTEN_CHOOSE") return "Nghe chọn";
  if (question.type === "MATCHING") return "Ghép cặp";
  return question.type;
}

export function validateMatchingQuestion(question: MatchingQuestion): ExerciseSetValidation {
  const errors: string[] = [];
  if (question.pairs.length < 2) {
    errors.push("Cần ít nhất 2 cặp từ.");
  }
  const hasEmpty = question.pairs.some((p) => !p.left.trim() || !p.right.trim());
  if (hasEmpty) {
    errors.push("Mỗi cặp cần đủ từ tiếng Anh và nghĩa tiếng Việt.");
  }
  const lefts = question.pairs.map((p) => p.left.trim().toLowerCase()).filter(Boolean);
  if (new Set(lefts).size !== lefts.length) {
    errors.push("Từ tiếng Anh bên trái không được trùng.");
  }
  return { valid: errors.length === 0, errors };
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

export function validateListenChooseQuestion(question: ListenChooseQuestion): ExerciseSetValidation {
  const errors: string[] = [];
  if (!question.audioUrl?.trim()) {
    errors.push("Thiếu URL audio.");
  }
  if (question.choices.some((c) => !c.text.trim())) {
    errors.push("Thiếu nội dung đáp án.");
  }
  if (!question.choices.some((c) => c.id === question.correctChoiceId)) {
    errors.push("Chưa chọn đáp án đúng.");
  }
  return { valid: errors.length === 0, errors };
}

export function validateQuestion(question: ExerciseQuestion): ExerciseSetValidation {
  if (question.type === "MULTIPLE_CHOICE") return validateMcqQuestion(question);
  if (question.type === "LISTEN_CHOOSE") return validateListenChooseQuestion(question);
  if (question.type === "MATCHING") return validateMatchingQuestion(question);
  return { valid: false, errors: ["Loại câu chưa hỗ trợ trong editor."] };
}

export function validateExerciseSetPayload(payload: ExerciseSetPayload): ExerciseSetValidation {
  const errors: string[] = [];

  if (!payload.title?.trim()) {
    errors.push("Tiêu đề bài tập không được để trống.");
  }

  const editableQuestions = payload.questions.filter(
    (q) => q.type === "MULTIPLE_CHOICE" || q.type === "MATCHING" || q.type === "LISTEN_CHOOSE",
  );
  if (!editableQuestions.length) {
    errors.push("Cần ít nhất 1 câu (trắc nghiệm, nghe chọn hoặc ghép cặp).");
  }

  editableQuestions.forEach((q, index) => {
    const n = index + 1;
    const result = validateQuestion(q);
    result.errors.forEach((msg) => errors.push(`Câu ${n}: ${msg}`));
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

function cleanMatchingQuestion(q: MatchingQuestion): MatchingQuestion {
  return {
    ...q,
    prompt: q.prompt?.text?.trim()
      ? { ...q.prompt, text: q.prompt.text.trim() }
      : undefined,
    pairs: q.pairs
      .map((p) => ({ left: p.left.trim(), right: p.right.trim() }))
      .filter((p) => p.left && p.right),
    explanation: q.explanation?.trim() || undefined,
  };
}

export function buildExerciseSetPayload(payload: ExerciseSetPayload): ExerciseSetPayload {
  return {
    ...payload,
    title: payload.title?.trim(),
    instruction: payload.instruction?.trim() || undefined,
    questions: payload.questions.map((q) => {
      if (q.type === "MULTIPLE_CHOICE") return cleanMcqQuestion(q);
      if (q.type === "LISTEN_CHOOSE") {
        return {
          ...q,
          audioUrl: q.audioUrl.trim(),
          wordEn: q.wordEn?.trim() || undefined,
          choices: q.choices.map((c) => ({ ...c, text: c.text.trim() })),
          explanation: q.explanation?.trim() || undefined,
        };
      }
      if (q.type === "MATCHING") return cleanMatchingQuestion(q);
      return q;
    }),
  };
}

export function buildExerciseSetPayloadJson(payload: ExerciseSetPayload): string {
  return stringifyBlockPayload(buildExerciseSetPayload(payload));
}

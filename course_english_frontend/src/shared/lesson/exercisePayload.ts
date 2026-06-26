import { stringifyBlockPayload } from "../api/lesson";
import { countBlankPlaceholders, MAX_FILL_BLANK_SLOTS, syncBlanksWithPrompt } from "./fillBlankUtils";
import { syncGapFillBlanksWithPrompt } from "./gapFillMcqUtils";
import {
  READING_PRESENTATION_SPLIT,
} from "./readingComprehensionUtils";
import {
  MAX_REORDER_TOKENS,
  MIN_REORDER_TOKENS,
  syncCorrectOrder,
} from "./reorderSentenceUtils";
import type {
  ExerciseQuestion,
  ExerciseSetPayload,
  FillBlankQuestion,
  GapFillMcqQuestion,
  ReadingComprehensionQuestion,
  ReadingSubQuestion,
  ListenChooseQuestion,
  ListenTypeQuestion,
  MatchingQuestion,
  MultipleChoiceQuestion,
  ReorderSentenceQuestion,
  SpellingQuestion,
  TrueFalseQuestion,
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

export function createEmptyReorderQuestion(id?: string): ReorderSentenceQuestion {
  const tokens = [
    { id: "t1", text: "I" },
    { id: "t2", text: "go" },
    { id: "t3", text: "to school" },
  ];
  return {
    id: id ?? generateQuestionId(),
    type: "REORDER_SENTENCE",
    prompt: { text: "Sắp xếp các mảnh thành câu đúng", lang: "vi" },
    tokens,
    correctOrder: syncCorrectOrder(tokens),
    sourceSentence: "I go to school",
    explanation: "",
  };
}

export function createEmptyFillBlankQuestion(id?: string): FillBlankQuestion {
  const promptText = "I ___ to school every day.";
  return {
    id: id ?? generateQuestionId(),
    type: "FILL_BLANK",
    prompt: { text: promptText, lang: "en" },
    blanks: syncBlanksWithPrompt(promptText, [{ id: "b1", acceptedAnswers: [""] }]),
    explanation: "",
  };
}

let subQuestionIdSeq = 0;

export function generateSubQuestionId(): string {
  subQuestionIdSeq += 1;
  return `sq${Date.now()}_${subQuestionIdSeq}`;
}

export function createEmptyReadingSubQuestion(id?: string): ReadingSubQuestion {
  return {
    id: id ?? generateSubQuestionId(),
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

export function createEmptyReadingComprehensionQuestion(id?: string): ReadingComprehensionQuestion {
  return {
    id: id ?? generateQuestionId(),
    type: "READING_COMPREHENSION",
    passage: {
      title: "",
      text:
        "Every morning, Tom wakes up at six o'clock. He brushes his teeth and eats breakfast with his family. Then he walks to school with his best friend, Anna.",
      lang: "en",
    },
    presentation: READING_PRESENTATION_SPLIT,
    subQuestions: [
      {
        ...createEmptyReadingSubQuestion("sq1"),
        prompt: { text: "What time does Tom wake up?", lang: "en" },
        choices: [
          { id: "a", text: "6 o'clock" },
          { id: "b", text: "7 o'clock" },
          { id: "c", text: "8 o'clock" },
          { id: "d", text: "9 o'clock" },
        ],
        correctChoiceId: "a",
      },
    ],
    explanation: "",
  };
}

export function createEmptyGapFillMcqQuestion(id?: string): GapFillMcqQuestion {
  const promptText = "Every morning I ___ up. Then I ___ breakfast.";
  return {
    id: id ?? generateQuestionId(),
    type: "GAP_FILL_MCQ",
    prompt: { text: promptText, lang: "en" },
    blanks: syncGapFillBlanksWithPrompt(promptText, []),
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

export function getSpellingQuestionSummary(question: SpellingQuestion): string {
  const meaning = question.prompt.text.trim();
  if (meaning) return `Gõ chính tả: ${meaning}`;
  if (question.wordEn?.trim()) return `Gõ: ${question.wordEn.trim()}`;
  return "Gõ chính tả";
}

export function getListenTypeQuestionSummary(question: ListenTypeQuestion): string {
  if (question.wordEn?.trim()) return `Nghe gõ: ${question.wordEn.trim()}`;
  return "Nghe và gõ từ";
}

export function getFillBlankQuestionSummary(question: FillBlankQuestion): string {
  const text = question.prompt.text.trim();
  if (text) return text.length > 48 ? `${text.slice(0, 48)}…` : text;
  return "Điền khuyết";
}

export function getGapFillMcqQuestionSummary(question: GapFillMcqQuestion): string {
  const text = question.prompt.text.trim();
  if (text) return text.length > 48 ? `${text.slice(0, 48)}…` : text;
  return "Chọn từ điền khuyết";
}

export function getReadingComprehensionSummary(question: ReadingComprehensionQuestion): string {
  const title = question.passage.title?.trim();
  if (title) return title.length > 48 ? `${title.slice(0, 48)}…` : title;
  const text = question.passage.text.trim();
  if (text) return text.length > 48 ? `${text.slice(0, 48)}…` : text;
  return "Đọc hiểu";
}

export function getReorderQuestionSummary(question: ReorderSentenceQuestion): string {
  const prompt = question.prompt?.text?.trim();
  if (prompt) return prompt.length > 48 ? `${prompt.slice(0, 48)}…` : prompt;
  const sentence = question.sourceSentence?.trim();
  if (sentence) return sentence.length > 48 ? `${sentence.slice(0, 48)}…` : sentence;
  const preview = question.tokens
    .map((t) => t.text.trim())
    .filter(Boolean)
    .join(" ");
  if (preview) return preview.length > 48 ? `${preview.slice(0, 48)}…` : preview;
  return "Sắp xếp câu";
}

export function getQuestionSummary(question: ExerciseQuestion): string {
  if (question.type === "MULTIPLE_CHOICE") return getMcqQuestionSummary(question);
  if (question.type === "LISTEN_CHOOSE") return getListenChooseQuestionSummary(question);
  if (question.type === "SPELLING") return getSpellingQuestionSummary(question);
  if (question.type === "LISTEN_TYPE") return getListenTypeQuestionSummary(question);
  if (question.type === "FILL_BLANK") return getFillBlankQuestionSummary(question);
  if (question.type === "GAP_FILL_MCQ") return getGapFillMcqQuestionSummary(question);
  if (question.type === "READING_COMPREHENSION") return getReadingComprehensionSummary(question);
  if (question.type === "REORDER_SENTENCE") return getReorderQuestionSummary(question);
  if (question.type === "MATCHING") return getMatchingQuestionSummary(question);
  if (question.type === "TRUE_FALSE") {
    const text = question.prompt.text.trim();
    return text.length > 48 ? `${text.slice(0, 48)}…` : text || "Đúng/Sai";
  }
  return `(${question.type})`;
}

export function getQuestionTypeLabel(question: ExerciseQuestion): string {
  if (question.type === "MULTIPLE_CHOICE") return "Trắc nghiệm";
  if (question.type === "LISTEN_CHOOSE") return "Nghe chọn";
  if (question.type === "SPELLING") return "Gõ chính tả";
  if (question.type === "LISTEN_TYPE") return "Nghe gõ";
  if (question.type === "FILL_BLANK") return "Điền khuyết";
  if (question.type === "GAP_FILL_MCQ") return "Chọn điền khuyết";
  if (question.type === "READING_COMPREHENSION") return "Đọc hiểu";
  if (question.type === "REORDER_SENTENCE") return "Sắp xếp câu";
  if (question.type === "MATCHING") return "Ghép cặp";
  if (question.type === "TRUE_FALSE") return "Đúng/Sai";
  return question.type;
}

/** Short labels for exercise-set block preview (lesson editor list). */
export function getExerciseSetQuestionCountParts(questions: ExerciseQuestion[]): string[] {
  let mcq = 0;
  let listen = 0;
  let spelling = 0;
  let listenType = 0;
  let fillBlank = 0;
  let gapFillMcq = 0;
  let reading = 0;
  let readingSub = 0;
  let reorder = 0;
  let matching = 0;
  let trueFalse = 0;

  for (const q of questions) {
    switch (q.type) {
      case "MULTIPLE_CHOICE":
        mcq += 1;
        break;
      case "LISTEN_CHOOSE":
        listen += 1;
        break;
      case "SPELLING":
        spelling += 1;
        break;
      case "LISTEN_TYPE":
        listenType += 1;
        break;
      case "FILL_BLANK":
        fillBlank += 1;
        break;
      case "GAP_FILL_MCQ":
        gapFillMcq += 1;
        break;
      case "READING_COMPREHENSION":
        reading += 1;
        readingSub += q.subQuestions.length;
        break;
      case "REORDER_SENTENCE":
        reorder += 1;
        break;
      case "MATCHING":
        matching += 1;
        break;
      case "TRUE_FALSE":
        trueFalse += 1;
        break;
      default:
        break;
    }
  }

  return [
    mcq ? `${mcq} MCQ` : "",
    listen ? `${listen} nghe chọn` : "",
    spelling ? `${spelling} gõ chính tả` : "",
    listenType ? `${listenType} nghe gõ` : "",
    fillBlank ? `${fillBlank} điền khuyết` : "",
    gapFillMcq ? `${gapFillMcq} chọn điền` : "",
    reading
      ? `${reading} đọc hiểu${readingSub > 0 ? ` (${readingSub} câu con)` : ""}`
      : "",
    reorder ? `${reorder} sắp xếp` : "",
    matching ? `${matching} ghép cặp` : "",
    trueFalse ? `${trueFalse} đúng/sai` : "",
  ].filter(Boolean);
}

export function formatExerciseSetQuestionCountLabel(questions: ExerciseQuestion[]): string {
  const parts = getExerciseSetQuestionCountParts(questions);
  if (parts.length > 0) return parts.join(" · ");
  return questions.length > 0 ? `${questions.length} câu` : "0 câu";
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

export function validateTrueFalseQuestion(question: TrueFalseQuestion): ExerciseSetValidation {
  const errors: string[] = [];
  if (!question.prompt.text.trim()) {
    errors.push("Chưa nhập câu hỏi.");
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

export function validateSpellingQuestion(question: SpellingQuestion): ExerciseSetValidation {
  const errors: string[] = [];
  if (!question.prompt.text.trim() && !question.correctAnswer.trim()) {
    errors.push("Thiếu gợi ý hoặc đáp án.");
  }
  if (!question.correctAnswer.trim()) {
    errors.push("Thiếu đáp án đúng.");
  }
  return { valid: errors.length === 0, errors };
}

export function validateReorderQuestion(question: ReorderSentenceQuestion): ExerciseSetValidation {
  const errors: string[] = [];
  if (question.tokens.length < MIN_REORDER_TOKENS) {
    errors.push(`Cần ít nhất ${MIN_REORDER_TOKENS} mảnh.`);
  }
  if (question.tokens.length > MAX_REORDER_TOKENS) {
    errors.push(`Tối đa ${MAX_REORDER_TOKENS} mảnh.`);
  }
  const emptyToken = question.tokens.some((token) => !token.text.trim());
  if (emptyToken) {
    errors.push("Mỗi mảnh cần có nội dung.");
  }
  const tokenIds = question.tokens.map((t) => t.id);
  if (new Set(tokenIds).size !== tokenIds.length) {
    errors.push("Mã mảnh (id) bị trùng.");
  }
  const tokenIdSet = new Set(tokenIds);
  const orderValid =
    question.correctOrder.length === tokenIds.length &&
    question.correctOrder.every((id) => tokenIdSet.has(id)) &&
    new Set(question.correctOrder).size === question.correctOrder.length;
  if (!orderValid && question.tokens.length > 0) {
    errors.push("Thứ tự đúng phải khớp đủ id mảnh, không trùng.");
  }
  return { valid: errors.length === 0, errors };
}

export function validateFillBlankQuestion(question: FillBlankQuestion): ExerciseSetValidation {
  const errors: string[] = [];
  const promptText = question.prompt.text.trim();
  if (!promptText) {
    errors.push("Chưa nhập câu có chỗ trống.");
  }
  const placeholderCount = countBlankPlaceholders(promptText);
  if (placeholderCount < 1) {
    errors.push('Câu cần ít nhất một chỗ trống "___".');
  }
  if (placeholderCount > MAX_FILL_BLANK_SLOTS) {
    errors.push(`Tối đa ${MAX_FILL_BLANK_SLOTS} chỗ trống trong một câu.`);
  }
  if (question.blanks.length < 1) {
    errors.push("Thiếu danh sách ô trống.");
  }
  const effectiveCount = Math.min(placeholderCount, MAX_FILL_BLANK_SLOTS);
  if (effectiveCount > 0 && question.blanks.length !== effectiveCount) {
    errors.push("Số ô trống không khớp số dấu ___ trong câu.");
  }
  const hasEmptyAnswer = question.blanks.some((b) => !b.acceptedAnswers.some((a) => a.trim()));
  if (hasEmptyAnswer) {
    errors.push("Mỗi ô trống cần ít nhất một đáp án.");
  }
  return { valid: errors.length === 0, errors };
}

export function validateGapFillMcqQuestion(question: GapFillMcqQuestion): ExerciseSetValidation {
  const errors: string[] = [];
  const promptText = question.prompt.text.trim();
  if (!promptText) {
    errors.push("Chưa nhập đoạn văn có chỗ trống.");
  }
  const placeholderCount = countBlankPlaceholders(promptText);
  if (placeholderCount < 1) {
    errors.push('Đoạn văn cần ít nhất một chỗ trống "___".');
  }
  if (question.blanks.length < 1) {
    errors.push("Thiếu danh sách ô trống.");
  }
  if (placeholderCount > 0 && question.blanks.length !== placeholderCount) {
    errors.push("Số ô trống không khớp số dấu ___ trong đoạn.");
  }
  for (const [index, blank] of question.blanks.entries()) {
    if (blank.choices.length !== 4) {
      errors.push(`Ô ${index + 1}: cần đúng 4 lựa chọn.`);
    }
    if (blank.choices.some((c) => !c.text.trim())) {
      errors.push(`Ô ${index + 1}: thiếu nội dung lựa chọn.`);
    }
    if (!blank.choices.some((c) => c.id === blank.correctChoiceId)) {
      errors.push(`Ô ${index + 1}: chưa chọn đáp án đúng.`);
    }
  }
  return { valid: errors.length === 0, errors };
}

export function validateReadingSubQuestion(sub: ReadingSubQuestion, index: number): string[] {
  const errors: string[] = [];
  const n = index + 1;
  if (!sub.prompt.text.trim()) {
    errors.push(`Câu ${n}: chưa nhập câu hỏi.`);
  }
  if (sub.choices.length !== 4) {
    errors.push(`Câu ${n}: cần đúng 4 đáp án.`);
  }
  if (sub.choices.some((c) => !c.text.trim())) {
    errors.push(`Câu ${n}: thiếu nội dung đáp án.`);
  }
  if (!sub.choices.some((c) => c.id === sub.correctChoiceId)) {
    errors.push(`Câu ${n}: chưa chọn đáp án đúng.`);
  }
  return errors;
}

export function validateReadingComprehensionQuestion(
  question: ReadingComprehensionQuestion,
): ExerciseSetValidation {
  const errors: string[] = [];
  if (!question.passage.text.trim()) {
    errors.push("Chưa nhập đoạn đọc.");
  }
  if (!question.subQuestions.length) {
    errors.push("Cần ít nhất một câu hỏi.");
  }
  question.subQuestions.forEach((sub, index) => {
    validateReadingSubQuestion(sub, index).forEach((msg) => errors.push(msg));
  });
  return { valid: errors.length === 0, errors };
}

export function validateListenTypeQuestion(question: ListenTypeQuestion): ExerciseSetValidation {
  const errors: string[] = [];
  if (!question.audioUrl?.trim()) {
    errors.push("Thiếu URL audio.");
  }
  if (!question.correctAnswer.trim()) {
    errors.push("Thiếu đáp án đúng.");
  }
  return { valid: errors.length === 0, errors };
}

export function validateQuestion(question: ExerciseQuestion): ExerciseSetValidation {
  if (question.type === "MULTIPLE_CHOICE") return validateMcqQuestion(question);
  if (question.type === "LISTEN_CHOOSE") return validateListenChooseQuestion(question);
  if (question.type === "SPELLING") return validateSpellingQuestion(question);
  if (question.type === "LISTEN_TYPE") return validateListenTypeQuestion(question);
  if (question.type === "FILL_BLANK") return validateFillBlankQuestion(question);
  if (question.type === "GAP_FILL_MCQ") return validateGapFillMcqQuestion(question);
  if (question.type === "READING_COMPREHENSION") return validateReadingComprehensionQuestion(question);
  if (question.type === "REORDER_SENTENCE") return validateReorderQuestion(question);
  if (question.type === "MATCHING") return validateMatchingQuestion(question);
  if (question.type === "TRUE_FALSE") return validateTrueFalseQuestion(question);
  return { valid: false, errors: ["Loại câu chưa hỗ trợ trong editor."] };
}

export function validateExerciseSetPayload(payload: ExerciseSetPayload): ExerciseSetValidation {
  const errors: string[] = [];

  if (!payload.title?.trim()) {
    errors.push("Tiêu đề bài tập không được để trống.");
  }

  const editableQuestions = payload.questions.filter(
    (q) =>
      q.type === "MULTIPLE_CHOICE" ||
      q.type === "MATCHING" ||
      q.type === "LISTEN_CHOOSE" ||
      q.type === "SPELLING" ||
      q.type === "LISTEN_TYPE" ||
      q.type === "FILL_BLANK" ||
      q.type === "GAP_FILL_MCQ" ||
      q.type === "READING_COMPREHENSION" ||
      q.type === "REORDER_SENTENCE" ||
      q.type === "TRUE_FALSE",
  );
  if (!editableQuestions.length) {
    errors.push("Cần ít nhất 1 câu hợp lệ.");
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
      if (q.type === "SPELLING") {
        return {
          ...q,
          prompt: { ...q.prompt, text: q.prompt.text.trim() },
          correctAnswer: q.correctAnswer.trim(),
          wordEn: q.wordEn?.trim() || undefined,
          hint: q.hint?.trim() || undefined,
          explanation: q.explanation?.trim() || undefined,
        };
      }
      if (q.type === "LISTEN_TYPE") {
        return {
          ...q,
          audioUrl: q.audioUrl.trim(),
          correctAnswer: q.correctAnswer.trim(),
          wordEn: q.wordEn?.trim() || undefined,
          prompt: q.prompt?.text?.trim()
            ? { ...q.prompt, text: q.prompt.text.trim() }
            : q.prompt,
          explanation: q.explanation?.trim() || undefined,
        };
      }
      if (q.type === "FILL_BLANK") {
        const syncedBlanks = syncBlanksWithPrompt(q.prompt.text, q.blanks);
        return {
          ...q,
          prompt: { ...q.prompt, text: q.prompt.text.trim() },
          blanks: syncedBlanks.map((b) => ({
            ...b,
            id: b.id.trim(),
            acceptedAnswers: b.acceptedAnswers.map((a) => a.trim()).filter(Boolean),
            placeholder: b.placeholder?.trim() || undefined,
          })),
          wordEn: q.wordEn?.trim() || undefined,
          explanation: q.explanation?.trim() || undefined,
        };
      }
      if (q.type === "GAP_FILL_MCQ") {
        return {
          ...q,
          prompt: { ...q.prompt, text: q.prompt.text.trim() },
          blanks: q.blanks.map((b) => ({
            ...b,
            id: b.id.trim(),
            choices: b.choices.map((c) => ({ ...c, text: c.text.trim() })),
            correctChoiceId: b.correctChoiceId,
          })),
          explanation: q.explanation?.trim() || undefined,
        };
      }
      if (q.type === "READING_COMPREHENSION") {
        return {
          ...q,
          passage: {
            ...q.passage,
            title: q.passage.title?.trim() || undefined,
            text: q.passage.text.trim(),
          },
          presentation: q.presentation ?? READING_PRESENTATION_SPLIT,
          subQuestions: q.subQuestions.map((sub) => ({
            ...sub,
            id: sub.id.trim(),
            prompt: { ...sub.prompt, text: sub.prompt.text.trim() },
            choices: sub.choices.map((c) => ({ ...c, text: c.text.trim() })),
            correctChoiceId: sub.correctChoiceId,
            explanation: sub.explanation?.trim() || undefined,
          })),
          explanation: q.explanation?.trim() || undefined,
        };
      }
      if (q.type === "REORDER_SENTENCE") {
        const tokens = q.tokens
          .map((t) => ({ id: t.id.trim(), text: t.text.trim() }))
          .filter((t) => t.id && t.text);
        return {
          ...q,
          prompt: q.prompt?.text?.trim()
            ? { ...q.prompt, text: q.prompt.text.trim() }
            : undefined,
          tokens,
          correctOrder: syncCorrectOrder(tokens),
          sourceSentence: q.sourceSentence?.trim() || undefined,
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

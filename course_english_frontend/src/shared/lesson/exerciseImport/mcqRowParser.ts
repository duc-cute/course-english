import type { ExerciseSetPayload, MultipleChoiceQuestion } from "../../../student/lessonPlayer/exercise/types";

export const MCQ_IMPORT_COLUMNS = [
  "lesson_title",
  "block_title",
  "instruction",
  "question_id",
  "prompt_en",
  "choice_a",
  "choice_b",
  "choice_c",
  "choice_d",
  "correct_choice_id",
  "explanation",
] as const;

export const EXAM_SECTION_MCQ_COLUMNS = [
  "section_title",
  "section_instruction",
  "question_id",
  "prompt_en",
  "choice_a",
  "choice_b",
  "choice_c",
  "choice_d",
  "correct_choice_id",
  "explanation",
] as const;

export const MCQ_REQUIRED_COLUMNS = [
  "question_id",
  "prompt_en",
  "choice_a",
  "choice_b",
  "choice_c",
  "choice_d",
  "correct_choice_id",
] as const;

const VALID_CHOICE_IDS = new Set(["a", "b", "c", "d"]);

export type McqImportPreviewRow = {
  rowNumber: number;
  questionId: string;
  prompt: string;
  choiceA: string;
  choiceB: string;
  choiceC: string;
  choiceD: string;
  correctChoiceId: string;
  explanation: string;
  errors: string[];
};

export function mcqRowToQuestion(
  row: Record<string, string>,
  rowNumber: number,
): {
  question: MultipleChoiceQuestion | null;
  preview: McqImportPreviewRow;
} {
  const errors: string[] = [];
  const questionId = (row.question_id ?? "").trim();
  const prompt = (row.prompt_en ?? "").trim();
  const choiceA = (row.choice_a ?? "").trim();
  const choiceB = (row.choice_b ?? "").trim();
  const choiceC = (row.choice_c ?? "").trim();
  const choiceD = (row.choice_d ?? "").trim();
  const correctChoiceId = (row.correct_choice_id ?? "").trim().toLowerCase();
  const explanation = (row.explanation ?? "").trim();

  if (!questionId) errors.push("Thiếu question_id.");
  if (!prompt) errors.push("Thiếu prompt_en.");
  if (!choiceA || !choiceB || !choiceC || !choiceD) errors.push("Thiếu đáp án.");
  if (!VALID_CHOICE_IDS.has(correctChoiceId)) {
    errors.push("correct_choice_id phải là a, b, c hoặc d.");
  }

  const preview: McqImportPreviewRow = {
    rowNumber,
    questionId,
    prompt,
    choiceA,
    choiceB,
    choiceC,
    choiceD,
    correctChoiceId,
    explanation,
    errors,
  };

  if (errors.length) return { question: null, preview };

  return {
    question: {
      id: questionId,
      type: "MULTIPLE_CHOICE",
      prompt: { text: prompt, lang: "en" },
      choices: [
        { id: "a", text: choiceA },
        { id: "b", text: choiceB },
        { id: "c", text: choiceC },
        { id: "d", text: choiceD },
      ],
      correctChoiceId,
      explanation: explanation || undefined,
    },
    preview,
  };
}

export type McqRecordsParseOptions = {
  sourceLabel: string;
  /** Lấy title từ block_title hoặc section_title */
  titleFromRow?: (row: Record<string, string>) => string;
  instructionFromRow?: (row: Record<string, string>) => string;
  onLessonTitle?: (title: string) => string | void;
};

export type McqRecordsParseResult = {
  ok: boolean;
  payload: ExerciseSetPayload | null;
  previewRows: McqImportPreviewRow[];
  errors: string[];
  warnings: string[];
  rowCount: number;
  sectionTitle?: string;
  sectionInstruction?: string;
};

export function parseMcqRecords(
  records: Record<string, string>[],
  options: McqRecordsParseOptions,
): McqRecordsParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!records.length) {
    return {
      ok: false,
      payload: null,
      previewRows: [],
      errors: [`File ${options.sourceLabel} không có dòng dữ liệu.`],
      warnings,
      rowCount: 0,
    };
  }

  const previewRows: McqImportPreviewRow[] = [];
  const questions: MultipleChoiceQuestion[] = [];

  records.forEach((record, index) => {
    const { question, preview } = mcqRowToQuestion(record, index + 2);
    previewRows.push(preview);
    if (question) questions.push(question);
  });

  const rowErrors = previewRows.filter((r) => r.errors.length);
  if (rowErrors.length) {
    errors.push(`${rowErrors.length} dòng có lỗi — sửa file trước khi import.`);
  }

  const first = records[0] ?? {};
  const resolveTitle = options.titleFromRow ?? ((row) => (row.block_title ?? "").trim());
  const resolveInstruction = options.instructionFromRow ?? ((row) => (row.instruction ?? "").trim());

  const sectionTitle = resolveTitle(first) || undefined;
  const sectionInstruction = resolveInstruction(first) || undefined;
  const blockTitle = sectionTitle || "Bài tập";
  const instruction = sectionInstruction || "Chọn đáp án đúng";

  const lessonTitle = (first.lesson_title ?? "").trim();
  if (lessonTitle && options.onLessonTitle) {
    const warning = options.onLessonTitle(lessonTitle);
    if (warning) warnings.push(warning);
  }

  const payload: ExerciseSetPayload = {
    title: blockTitle,
    instruction,
    presentation: "stepped",
    shuffleQuestions: false,
    shuffleOptions: true,
    passScorePercent: 80,
    questions,
  };

  return {
    ok: errors.length === 0 && questions.length > 0,
    payload: errors.length === 0 ? payload : null,
    previewRows,
    errors,
    warnings,
    rowCount: questions.length,
    sectionTitle,
    sectionInstruction,
  };
}

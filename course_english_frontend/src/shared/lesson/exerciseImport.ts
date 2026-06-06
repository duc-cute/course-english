import * as XLSX from "xlsx";
import type { ExerciseSetPayload, MultipleChoiceQuestion } from "../../student/lessonPlayer/exercise/types";

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

const REQUIRED_COLUMNS = [
  "question_id",
  "prompt_en",
  "choice_a",
  "choice_b",
  "choice_c",
  "choice_d",
  "correct_choice_id",
] as const;

const VALID_CHOICE_IDS = new Set(["a", "b", "c", "d"]);

/** Dữ liệu mẫu — khớp vocab_daily_words_questions.csv */
const SAMPLE_ROWS: string[][] = [
  [
    "Từ vựng demo — Daily words",
    "Từ vựng demo",
    "Chọn đáp án đúng",
    "q1",
    "apple",
    "quả cam",
    "quả táo",
    "quả chuối",
    "quả nho",
    "b",
    "Apple = quả táo.",
  ],
  [
    "Từ vựng demo — Daily words",
    "Từ vựng demo",
    "Chọn đáp án đúng",
    "q2",
    "book",
    "cái bàn",
    "cuốn sách",
    "cái ghế",
    "cửa sổ",
    "b",
    "Book = cuốn sách.",
  ],
  [
    "Từ vựng demo — Daily words",
    "Từ vựng demo",
    "Chọn đáp án đúng",
    "q3",
    "happy",
    "buồn",
    "mệt",
    "vui",
    "đói",
    "c",
    "Happy = vui.",
  ],
  [
    "Từ vựng demo — Daily words",
    "Từ vựng demo",
    "Chọn đáp án đúng",
    "q4",
    "school",
    "bệnh viện",
    "trường học",
    "siêu thị",
    "công viên",
    "b",
    "School = trường học.",
  ],
  [
    "Từ vựng demo — Daily words",
    "Từ vựng demo",
    "Chọn đáp án đúng",
    "q5",
    "water",
    "nước",
    "sữa",
    "trà",
    "nước ngọt",
    "a",
    "Water = nước.",
  ],
];

export type ExerciseImportPreviewRow = {
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

export type ExerciseImportMode = "replace" | "merge";

export type ExerciseImportResult = {
  ok: boolean;
  payload: ExerciseSetPayload | null;
  previewRows: ExerciseImportPreviewRow[];
  errors: string[];
  warnings: string[];
  rowCount: number;
};

/** @deprecated use ExerciseImportPreviewRow */
export type CsvImportPreviewRow = ExerciseImportPreviewRow;
/** @deprecated use ExerciseImportMode */
export type CsvImportMode = ExerciseImportMode;
/** @deprecated use ExerciseImportResult */
export type CsvImportResult = ExerciseImportResult;

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, "_");
}

function cellToString(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

function rowToQuestion(
  row: Record<string, string>,
  rowNumber: number,
): {
  question: MultipleChoiceQuestion | null;
  preview: ExerciseImportPreviewRow;
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

  const preview: ExerciseImportPreviewRow = {
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

function parseMcqRecords(
  records: Record<string, string>[],
  sourceLabel: string,
): ExerciseImportResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!records.length) {
    return {
      ok: false,
      payload: null,
      previewRows: [],
      errors: [`File ${sourceLabel} không có dòng dữ liệu.`],
      warnings,
      rowCount: 0,
    };
  }

  const previewRows: ExerciseImportPreviewRow[] = [];
  const questions: MultipleChoiceQuestion[] = [];

  records.forEach((record, index) => {
    const { question, preview } = rowToQuestion(record, index + 2);
    previewRows.push(preview);
    if (question) questions.push(question);
  });

  const rowErrors = previewRows.filter((r) => r.errors.length);
  if (rowErrors.length) {
    errors.push(`${rowErrors.length} dòng có lỗi — sửa file trước khi import.`);
  }

  const first = records[0] ?? {};
  const blockTitle = (first.block_title ?? "").trim() || "Bài tập";
  const instruction = (first.instruction ?? "").trim() || "Chọn đáp án đúng";
  const lessonTitle = (first.lesson_title ?? "").trim();

  if (lessonTitle) {
    warnings.push(
      `lesson_title trong file: "${lessonTitle}" (bỏ qua — import vào bài đang soạn).`,
    );
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
  };
}

function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function recordsFromRawRows(rawRows: unknown[][]): {
  records: Record<string, string>[];
  errors: string[];
} {
  const errors: string[] = [];
  const nonEmpty = rawRows.filter((row) =>
    row.some((cell) => cellToString(cell) !== ""),
  );
  if (!nonEmpty.length) {
    return { records: [], errors: ["File trống."] };
  }

  const headerRow = nonEmpty[0].map((h) => normalizeHeader(cellToString(h)));
  const missing = REQUIRED_COLUMNS.filter((col) => !headerRow.includes(col));
  if (missing.length) {
    return { records: [], errors: [`Thiếu cột bắt buộc: ${missing.join(", ")}`] };
  }

  const records: Record<string, string>[] = [];
  for (let i = 1; i < nonEmpty.length; i++) {
    const row = nonEmpty[i];
    const record: Record<string, string> = {};
    headerRow.forEach((header, idx) => {
      record[header] = cellToString(row[idx]);
    });
    records.push(record);
  }

  return { records, errors };
}

export function parseMcqCsvText(text: string): ExerciseImportResult {
  const cleaned = stripBom(text).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = cleaned.split("\n").map((l) => l.trim()).filter(Boolean);

  if (!lines.length) {
    return {
      ok: false,
      payload: null,
      previewRows: [],
      errors: ["File CSV trống."],
      warnings: [],
      rowCount: 0,
    };
  }

  const rawRows = lines.map(parseCsvLine);
  const { records, errors: headerErrors } = recordsFromRawRows(rawRows);
  if (headerErrors.length) {
    return {
      ok: false,
      payload: null,
      previewRows: [],
      errors: headerErrors,
      warnings: [],
      rowCount: 0,
    };
  }

  return parseMcqRecords(records, "CSV");
}

export async function parseMcqCsvFile(file: File): Promise<ExerciseImportResult> {
  try {
    const text = await file.text();
    return parseMcqCsvText(text);
  } catch {
    return {
      ok: false,
      payload: null,
      previewRows: [],
      errors: ["Không đọc được file CSV."],
      warnings: [],
      rowCount: 0,
    };
  }
}

export async function parseMcqExcelFile(file: File): Promise<ExerciseImportResult> {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return {
        ok: false,
        payload: null,
        previewRows: [],
        errors: ["File Excel không có sheet."],
        warnings: [],
        rowCount: 0,
      };
    }

    const sheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      defval: "",
      raw: false,
    }) as unknown[][];

    const { records, errors: headerErrors } = recordsFromRawRows(rawRows);
    if (headerErrors.length) {
      return {
        ok: false,
        payload: null,
        previewRows: [],
        errors: headerErrors,
        warnings: [],
        rowCount: 0,
      };
    }

    return parseMcqRecords(records, "Excel");
  } catch {
    return {
      ok: false,
      payload: null,
      previewRows: [],
      errors: ["Không đọc được file Excel (.xlsx)."],
      warnings: [],
      rowCount: 0,
    };
  }
}

export function downloadMcqExcelTemplate(): void {
  const data = [[...MCQ_IMPORT_COLUMNS], ...SAMPLE_ROWS];
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws["!cols"] = MCQ_IMPORT_COLUMNS.map((col) => ({
    wch: Math.max(col.length, 14),
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Bai_tap_MCQ");
  XLSX.writeFile(wb, "mau_import_bai_tap_mcq.xlsx");
}

export function applyImportToEditor(
  current: ExerciseSetPayload,
  imported: ExerciseSetPayload,
  mode: ExerciseImportMode,
): ExerciseSetPayload {
  const importedMcq = imported.questions.filter(
    (q): q is MultipleChoiceQuestion => q.type === "MULTIPLE_CHOICE",
  );
  const other = current.questions.filter((q) => q.type !== "MULTIPLE_CHOICE");

  if (mode === "replace") {
    return {
      ...current,
      title: imported.title ?? current.title,
      instruction: imported.instruction ?? current.instruction,
      questions: [...importedMcq, ...other],
    };
  }

  return {
    ...current,
    questions: [
      ...current.questions.filter((q) => q.type === "MULTIPLE_CHOICE"),
      ...importedMcq,
      ...other,
    ],
  };
}

/** @deprecated */
export const applyCsvImportToEditor = applyImportToEditor;

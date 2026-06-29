import * as XLSX from "xlsx";
import type { ExerciseSetPayload, MultipleChoiceQuestion } from "../../student/lessonPlayer/exercise/types";
import {
  parseCsvLine,
  recordsFromRawRows,
  stripBom,
} from "./exerciseImport/importSpreadsheetUtils";
import {
  MCQ_IMPORT_COLUMNS,
  MCQ_REQUIRED_COLUMNS,
  parseMcqRecords,
  type McqImportPreviewRow,
} from "./exerciseImport/mcqRowParser";

export type ExerciseImportPreviewRow = McqImportPreviewRow;

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

export { MCQ_IMPORT_COLUMNS };

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

export function parseMcqCsvText(text: string): ExerciseImportResult {
  const cleaned = stripBom(text).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = cleaned
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

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
  const { records, errors: headerErrors } = recordsFromRawRows(rawRows, MCQ_REQUIRED_COLUMNS);
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

  return parseMcqRecords(records, {
    sourceLabel: "CSV",
    onLessonTitle: (title) =>
      `lesson_title trong file: "${title}" (bỏ qua — import vào bài đang soạn).`,
  });
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

    const { records, errors: headerErrors } = recordsFromRawRows(rawRows, MCQ_REQUIRED_COLUMNS);
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

    return parseMcqRecords(records, {
      sourceLabel: "Excel",
      onLessonTitle: (title) =>
        `lesson_title trong file: "${title}" (bỏ qua — import vào bài đang soạn).`,
    });
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

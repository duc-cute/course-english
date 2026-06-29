import * as XLSX from "xlsx";
import type { QuestionType } from "../../api/question";
import type { ExerciseSetPayload } from "../../../student/lessonPlayer/exercise/types";
import { parseExerciseSetPayload } from "../../../student/lessonPlayer/exercise/parseExerciseSet";
import { buildExerciseSetPayloadJson } from "../exercisePayload";
import {
  parseCsvLine,
  recordsFromRawRows,
  stripBom,
} from "./importSpreadsheetUtils";
import {
  EXAM_SECTION_MCQ_COLUMNS,
  MCQ_REQUIRED_COLUMNS,
  parseMcqRecords,
  type McqImportPreviewRow,
} from "./mcqRowParser";

export type ExamSectionImportMode = "replace" | "merge";

export type ExamSectionMcqImportResult = {
  ok: boolean;
  payloadJson: string | null;
  previewRows: McqImportPreviewRow[];
  errors: string[];
  warnings: string[];
  rowCount: number;
  sectionTitle?: string;
  sectionInstruction?: string;
};

function emptyResult(errors: string[]): ExamSectionMcqImportResult {
  return {
    ok: false,
    payloadJson: null,
    previewRows: [],
    errors,
    warnings: [],
    rowCount: 0,
  };
}

function parseRecordsForExamSection(
  records: Record<string, string>[],
  sourceLabel: string,
  expectedQuestionType?: QuestionType,
): ExamSectionMcqImportResult {
  if (expectedQuestionType && expectedQuestionType !== "MULTIPLE_CHOICE") {
    return emptyResult([
      `Phần này là loại ${expectedQuestionType} — import Excel/CSV hiện chỉ hỗ trợ MULTIPLE_CHOICE.`,
    ]);
  }

  const parsed = parseMcqRecords(records, {
    sourceLabel,
    titleFromRow: (row) => (row.section_title ?? row.block_title ?? "").trim(),
    instructionFromRow: (row) => (row.section_instruction ?? row.instruction ?? "").trim(),
  });

  return {
    ok: parsed.ok,
    payloadJson: parsed.payload ? buildExerciseSetPayloadJson(parsed.payload) : null,
    previewRows: parsed.previewRows,
    errors: parsed.errors,
    warnings: parsed.warnings,
    rowCount: parsed.rowCount,
    sectionTitle: parsed.sectionTitle,
    sectionInstruction: parsed.sectionInstruction,
  };
}

export function parseExamSectionMcqCsvText(text: string): ExamSectionMcqImportResult {
  const cleaned = stripBom(text).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = cleaned
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (!lines.length) {
    return emptyResult(["File CSV trống."]);
  }

  const rawRows = lines.map(parseCsvLine);
  const { records, errors: headerErrors } = recordsFromRawRows(rawRows, MCQ_REQUIRED_COLUMNS);
  if (headerErrors.length) {
    return emptyResult(headerErrors);
  }

  return parseRecordsForExamSection(records, "CSV");
}

export async function parseExamSectionMcqCsvFile(file: File): Promise<ExamSectionMcqImportResult> {
  try {
    const text = await file.text();
    return parseExamSectionMcqCsvText(text);
  } catch {
    return emptyResult(["Không đọc được file CSV."]);
  }
}

export async function parseExamSectionMcqExcelFile(file: File): Promise<ExamSectionMcqImportResult> {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return emptyResult(["File Excel không có sheet."]);
    }

    const sheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      defval: "",
      raw: false,
    }) as unknown[][];

    const { records, errors: headerErrors } = recordsFromRawRows(rawRows, MCQ_REQUIRED_COLUMNS);
    if (headerErrors.length) {
      return emptyResult(headerErrors);
    }

    return parseRecordsForExamSection(records, "Excel");
  } catch {
    return emptyResult(["Không đọc được file Excel (.xlsx)."]);
  }
}

export function applyExamSectionMcqImport(
  currentPayloadJson: string,
  importedPayloadJson: string,
  mode: ExamSectionImportMode,
): string {
  const current = parseExerciseSetPayload(currentPayloadJson);
  const imported = parseExerciseSetPayload(importedPayloadJson);

  const importedMcq = imported.questions.filter((q) => q.type === "MULTIPLE_CHOICE");
  const nextQuestions =
    mode === "replace"
      ? importedMcq
      : [...current.questions.filter((q) => q.type === "MULTIPLE_CHOICE"), ...importedMcq];

  return buildExerciseSetPayloadJson({
    ...current,
    questions: nextQuestions.length ? nextQuestions : importedMcq,
  });
}

export function downloadExamSectionMcqTemplate(): void {
  const sampleRows: string[][] = [
    [
      "I. MULTIPLE CHOICE",
      "Mark the letter A, B, C, or D on your answer sheet…",
      "q1",
      "She ___ to school every day.",
      "go",
      "goes",
      "going",
      "gone",
      "b",
      "Third person singular.",
    ],
    [
      "",
      "",
      "q2",
      "They ___ football on Sundays.",
      "play",
      "plays",
      "playing",
      "played",
      "a",
      "",
    ],
  ];

  const data = [[...EXAM_SECTION_MCQ_COLUMNS], ...sampleRows];
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws["!cols"] = EXAM_SECTION_MCQ_COLUMNS.map((col) => ({
    wch: Math.max(col.length, 14),
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Section_MCQ");
  XLSX.writeFile(wb, "mau_import_section_mcq.xlsx");
}

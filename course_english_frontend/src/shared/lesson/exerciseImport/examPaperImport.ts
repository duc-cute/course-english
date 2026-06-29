import * as XLSX from "xlsx";
import type { QuestionType } from "../../api/question";
import type { MultipleChoiceQuestion } from "../../../student/lessonPlayer/exercise/types";
import { buildExerciseSetPayloadJson } from "../exercisePayload";
import { parseExerciseSetPayload } from "../../../student/lessonPlayer/exercise/parseExerciseSet";
import {
  fillDownRecords,
  parseCsvLine,
  recordsFromRawRows,
  stripBom,
} from "./importSpreadsheetUtils";
import {
  MCQ_REQUIRED_COLUMNS,
  mcqRowToQuestion,
} from "./mcqRowParser";
import { deriveSectionImportKey } from "./sectionImportKey";
import { applyExamSectionMcqImport } from "./examSectionMcqImport";

export const EXAM_PAPER_IMPORT_COLUMNS = [
  "exam_title",
  "paper_instruction",
  "section_key",
  "section_title",
  "section_instruction",
  "question_type",
  "question_id",
  "prompt_en",
  "choice_a",
  "choice_b",
  "choice_c",
  "choice_d",
  "correct_choice_id",
  "explanation",
] as const;

const FILL_DOWN_FIELDS = [
  "exam_title",
  "paper_instruction",
  "section_key",
  "section_title",
  "section_instruction",
  "question_type",
] as const;

const SUPPORTED_TYPES = new Set<QuestionType>(["MULTIPLE_CHOICE"]);

export type ExamPaperImportMode = "replace_all" | "merge";

export type ImportedExamSection = {
  importKey: string;
  title?: string;
  instruction?: string;
  questionType: QuestionType;
  payloadJson: string;
  questionCount: number;
  rowErrors: number;
};

export type ExamPaperImportResult = {
  ok: boolean;
  examTitle?: string;
  paperInstruction?: string;
  sections: ImportedExamSection[];
  errors: string[];
  warnings: string[];
  totalQuestions: number;
  totalRowErrors: number;
};

type SectionGroup = {
  signature: string;
  importKey: string;
  title?: string;
  instruction?: string;
  questionType: QuestionType;
  rows: { record: Record<string, string>; rowNumber: number }[];
};

function emptyPaperResult(errors: string[]): ExamPaperImportResult {
  return {
    ok: false,
    sections: [],
    errors,
    warnings: [],
    totalQuestions: 0,
    totalRowErrors: 0,
  };
}

function normalizeQuestionType(raw: string): QuestionType | null {
  const value = raw.trim().toUpperCase();
  if (!value) return "MULTIPLE_CHOICE";
  if (value === "MULTIPLE_CHOICE" || value === "MCQ") return "MULTIPLE_CHOICE";
  if (SUPPORTED_TYPES.has(value as QuestionType)) return value as QuestionType;
  return null;
}

function groupSignature(record: Record<string, string>): string {
  const sectionKey = (record.section_key ?? "").trim();
  const title = (record.section_title ?? record.block_title ?? "").trim();
  const instruction = (record.section_instruction ?? record.instruction ?? "").trim();
  const questionType = normalizeQuestionType(record.question_type ?? "") ?? "MULTIPLE_CHOICE";
  return [sectionKey, title, instruction, questionType].join("\x1f");
}

function buildGroups(filledRecords: Record<string, string>[]): SectionGroup[] {
  const groups: SectionGroup[] = [];
  let current: SectionGroup | null = null;
  let order = 0;

  filledRecords.forEach((record, index) => {
    const signature = groupSignature(record);
    if (!current || current.signature !== signature) {
      order += 1;
      const title = (record.section_title ?? record.block_title ?? "").trim() || undefined;
      const instruction =
        (record.section_instruction ?? record.instruction ?? "").trim() || undefined;
      const questionType = normalizeQuestionType(record.question_type ?? "") ?? "MULTIPLE_CHOICE";
      const importKey = deriveSectionImportKey({
        sectionKey: record.section_key,
        sectionTitle: title,
        sectionInstruction: instruction,
        questionType,
        fallbackOrder: order,
      });
      current = {
        signature,
        importKey,
        title,
        instruction,
        questionType,
        rows: [],
      };
      groups.push(current);
    }
    current.rows.push({ record, rowNumber: index + 2 });
  });

  return groups;
}

function groupToSection(group: SectionGroup, errors: string[], warnings: string[]): ImportedExamSection | null {
  if (!SUPPORTED_TYPES.has(group.questionType)) {
    errors.push(
      `Phần "${group.title ?? group.instruction ?? group.importKey}": loại ${group.questionType} chưa hỗ trợ import (hiện chỉ MULTIPLE_CHOICE).`,
    );
    return null;
  }

  const questions: MultipleChoiceQuestion[] = [];
  let rowErrors = 0;

  for (const { record, rowNumber } of group.rows) {
    const rowType = normalizeQuestionType(record.question_type ?? "");
    if (rowType && rowType !== group.questionType) {
      rowErrors += 1;
      errors.push(`Dòng ${rowNumber}: question_type ${rowType} không khớp phần (${group.questionType}).`);
      continue;
    }
    const { question, preview } = mcqRowToQuestion(record, rowNumber);
    if (preview.errors.length) {
      rowErrors += 1;
      continue;
    }
    if (question) questions.push(question);
  }

  if (rowErrors > 0) {
    errors.push(
      `Phần "${group.title ?? group.instruction ?? group.importKey}": ${rowErrors} dòng lỗi.`,
    );
  }

  if (!questions.length) {
    warnings.push(`Phần "${group.title ?? group.instruction ?? group.importKey}" không có câu hợp lệ — bỏ qua.`);
    return null;
  }

  const payloadJson = buildExerciseSetPayloadJson({
    title: group.title ?? "Phần mới",
    instruction: group.instruction ?? "Chọn đáp án đúng",
    presentation: "stepped",
    shuffleQuestions: false,
    shuffleOptions: true,
    passScorePercent: 80,
    questions,
  });

  return {
    importKey: group.importKey,
    title: group.title,
    instruction: group.instruction,
    questionType: group.questionType,
    payloadJson,
    questionCount: questions.length,
    rowErrors,
  };
}

function parseFilledRecords(
  records: Record<string, string>[],
  sourceLabel: string,
): ExamPaperImportResult {
  if (!records.length) {
    return emptyPaperResult([`File ${sourceLabel} không có dòng dữ liệu.`]);
  }

  const filled = fillDownRecords(records, FILL_DOWN_FIELDS);
  const first = filled[0] ?? {};
  const examTitle = (first.exam_title ?? "").trim() || undefined;
  const paperInstruction = (first.paper_instruction ?? "").trim() || undefined;

  const errors: string[] = [];
  const warnings: string[] = [];
  const groups = buildGroups(filled);

  if (!groups.length) {
    return emptyPaperResult(["Không tách được phần nào từ file."]);
  }

  const sections: ImportedExamSection[] = [];
  let totalRowErrors = 0;

  for (const group of groups) {
    const section = groupToSection(group, errors, warnings);
    if (section) {
      sections.push(section);
      totalRowErrors += section.rowErrors;
    }
  }

  const totalQuestions = sections.reduce((sum, s) => sum + s.questionCount, 0);
  const ok = sections.length > 0 && errors.length === 0;

  if (!sections.length && !errors.length) {
    errors.push("Không có phần hợp lệ sau khi parse.");
  }

  return {
    ok,
    examTitle,
    paperInstruction,
    sections,
    errors,
    warnings,
    totalQuestions,
    totalRowErrors,
  };
}

async function readExcelRecords(file: File): Promise<{
  records: Record<string, string>[];
  errors: string[];
}> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { records: [], errors: ["File Excel không có sheet."] };
  }
  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  }) as unknown[][];
  return recordsFromRawRows(rawRows, MCQ_REQUIRED_COLUMNS);
}

export function parseExamPaperImportCsvText(text: string): ExamPaperImportResult {
  const cleaned = stripBom(text).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = cleaned
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) {
    return emptyPaperResult(["File CSV trống."]);
  }
  const rawRows = lines.map(parseCsvLine);
  const { records, errors: headerErrors } = recordsFromRawRows(rawRows, MCQ_REQUIRED_COLUMNS);
  if (headerErrors.length) {
    return emptyPaperResult(headerErrors);
  }
  return parseFilledRecords(records, "CSV");
}

export async function parseExamPaperImportCsvFile(file: File): Promise<ExamPaperImportResult> {
  try {
    const text = await file.text();
    return parseExamPaperImportCsvText(text);
  } catch {
    return emptyPaperResult(["Không đọc được file CSV."]);
  }
}

export async function parseExamPaperImportExcelFile(file: File): Promise<ExamPaperImportResult> {
  try {
    const { records, errors: headerErrors } = await readExcelRecords(file);
    if (headerErrors.length) {
      return emptyPaperResult(headerErrors);
    }
    return parseFilledRecords(records, "Excel");
  } catch {
    return emptyPaperResult(["Không đọc được file Excel (.xlsx)."]);
  }
}

export type ExamSectionDraftLike = {
  clientKey: string;
  id?: string;
  title?: string;
  instruction?: string;
  questionType?: QuestionType;
  payloadJson: string;
  importKey?: string;
};

export function resolveSectionImportKey(section: ExamSectionDraftLike): string {
  return deriveSectionImportKey({
    sectionKey: section.importKey,
    sectionTitle: section.title,
    sectionInstruction: section.instruction,
    questionType: section.questionType ?? inferTypeFromPayload(section.payloadJson),
  });
}

function inferTypeFromPayload(payloadJson: string): QuestionType | undefined {
  try {
    const parsed = parseExerciseSetPayload(payloadJson);
    return parsed.questions[0]?.type as QuestionType | undefined;
  } catch {
    return undefined;
  }
}

export function applyExamPaperImport(
  currentSections: ExamSectionDraftLike[],
  imported: ImportedExamSection[],
  mode: ExamPaperImportMode,
  newClientKey: () => string,
): ExamSectionDraftLike[] {
  if (mode === "replace_all") {
    return imported.map((section) => ({
      clientKey: newClientKey(),
      title: section.title,
      instruction: section.instruction,
      questionType: section.questionType,
      payloadJson: section.payloadJson,
      importKey: section.importKey,
    }));
  }

  const next = currentSections.map((s) => ({ ...s }));
  const indexByKey = new Map<string, number>();
  next.forEach((section, index) => {
    indexByKey.set(resolveSectionImportKey(section), index);
  });

  for (const importedSection of imported) {
    const existingIndex = indexByKey.get(importedSection.importKey);
    if (existingIndex !== undefined) {
      const existing = next[existingIndex];
      next[existingIndex] = {
        ...existing,
        title: importedSection.title ?? existing.title,
        instruction: importedSection.instruction ?? existing.instruction,
        questionType: importedSection.questionType,
        payloadJson: applyExamSectionMcqImport(
          existing.payloadJson,
          importedSection.payloadJson,
          "replace",
        ),
        importKey: importedSection.importKey,
      };
    } else {
      const draft: ExamSectionDraftLike = {
        clientKey: newClientKey(),
        title: importedSection.title,
        instruction: importedSection.instruction,
        questionType: importedSection.questionType,
        payloadJson: importedSection.payloadJson,
        importKey: importedSection.importKey,
      };
      indexByKey.set(importedSection.importKey, next.length);
      next.push(draft);
    }
  }

  return next;
}

export function downloadExamPaperImportTemplate(): void {
  const sampleRows: string[][] = [
    [
      "Mock Test 1",
      "Mark your answers on the answer sheet.",
      "mcq",
      "I. MULTIPLE CHOICE",
      "Mark the letter A, B, C, or D on your answer sheet…",
      "MULTIPLE_CHOICE",
      "q1",
      "She ___ to school every day.",
      "go",
      "goes",
      "going",
      "gone",
      "b",
      "",
    ],
    [
      "",
      "",
      "",
      "",
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
    [
      "",
      "",
      "synonyms",
      "",
      "Choose the word CLOSEST in meaning…",
      "MULTIPLE_CHOICE",
      "q3",
      "The word 'happy' is underlined: She feels very happy today.",
      "sad",
      "glad",
      "tired",
      "angry",
      "b",
      "",
    ],
  ];

  const data = [[...EXAM_PAPER_IMPORT_COLUMNS], ...sampleRows];
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws["!cols"] = EXAM_PAPER_IMPORT_COLUMNS.map((col) => ({
    wch: Math.max(col.length, 12),
  }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "De_thi");
  XLSX.writeFile(wb, "mau_import_de_thi.xlsx");
}

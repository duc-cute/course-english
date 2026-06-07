import type { VocabularyItemRecord } from "../api/vocabularySet";

export const VOCAB_IMPORT_COLUMNS = ["word_en", "meaning_vi", "phonetic"] as const;

export type VocabImportRow = {
  wordEn: string;
  meaningVi: string;
  phonetic?: string;
};

export type VocabImportResult = {
  valid: boolean;
  rows: VocabImportRow[];
  errors: string[];
};

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  result.push(current.trim());
  return result;
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

export function parseVocabCsvText(text: string): VocabImportResult {
  const errors: string[] = [];
  const cleaned = text.replace(/^\uFEFF/, "").trim();
  if (!cleaned) {
    return { valid: false, rows: [], errors: ["File CSV trống."] };
  }

  const lines = cleaned.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) {
    return { valid: false, rows: [], errors: ["CSV cần dòng tiêu đề và ít nhất một dòng dữ liệu."] };
  }

  const headers = parseCsvLine(lines[0]).map(normalizeHeader);
  const wordIdx = headers.indexOf("word_en");
  const meaningIdx = headers.indexOf("meaning_vi");
  const phoneticIdx = headers.indexOf("phonetic");

  if (wordIdx < 0 || meaningIdx < 0) {
    return {
      valid: false,
      rows: [],
      errors: ["Thiếu cột bắt buộc: word_en, meaning_vi"],
    };
  }

  const rows: VocabImportRow[] = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cols = parseCsvLine(lines[i]);
    const wordEn = (cols[wordIdx] ?? "").trim();
    const meaningVi = (cols[meaningIdx] ?? "").trim();
    const phonetic = phoneticIdx >= 0 ? (cols[phoneticIdx] ?? "").trim() : "";

    if (!wordEn && !meaningVi) continue;
    if (!wordEn || !meaningVi) {
      errors.push(`Dòng ${i + 1}: thiếu word_en hoặc meaning_vi`);
      continue;
    }
    rows.push({ wordEn, meaningVi, phonetic: phonetic || undefined });
  }

  if (!rows.length && !errors.length) {
    errors.push("Không có dòng dữ liệu hợp lệ.");
  }

  return { valid: errors.length === 0 && rows.length > 0, rows, errors };
}

export async function parseVocabCsvFile(file: File): Promise<VocabImportResult> {
  const text = await file.text();
  return parseVocabCsvText(text);
}

export function vocabImportRowsToItems(rows: VocabImportRow[]): VocabularyItemRecord[] {
  return rows.map((row, index) => ({
    wordEn: row.wordEn,
    meaningVi: row.meaningVi,
    phonetic: row.phonetic,
    displayOrder: index,
  }));
}

export function itemsToVocabImportCsv(items: VocabularyItemRecord[]): string {
  const header = VOCAB_IMPORT_COLUMNS.join(",");
  const body = items
    .map((item) =>
      [item.wordEn, item.meaningVi, item.phonetic ?? ""]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\n");
  return `${header}\n${body}`;
}

export const VOCAB_CSV_SAMPLE = `word_en,meaning_vi,phonetic
apple,quả táo,/ˈæp.əl/
book,cuốn sách,/bʊk/
happy,vui,/ˈhæp.i/
school,trường học,/skuːl/
water,nước,/ˈwɔː.tər/
`;

export function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, "_");
}

export function cellToString(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

export function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

export function parseCsvLine(line: string): string[] {
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

export function recordsFromRawRows(
  rawRows: unknown[][],
  requiredColumns: readonly string[],
): {
  records: Record<string, string>[];
  errors: string[];
} {
  const nonEmpty = rawRows.filter((row) => row.some((cell) => cellToString(cell) !== ""));
  if (!nonEmpty.length) {
    return { records: [], errors: ["File trống."] };
  }

  const headerRow = nonEmpty[0].map((h) => normalizeHeader(cellToString(h)));
  const missing = requiredColumns.filter((col) => !headerRow.includes(col));
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

  return { records, errors: [] };
}

/** Kéo giá trị cột xuống các dòng trống (giống merged cells Excel). */
export function fillDownRecords(
  records: Record<string, string>[],
  fields: readonly string[],
): Record<string, string>[] {
  const last: Record<string, string> = {};
  return records.map((record) => {
    const next = { ...record };
    for (const field of fields) {
      const value = (next[field] ?? "").trim();
      if (value) {
        last[field] = value;
      } else if (last[field]) {
        next[field] = last[field];
      }
    }
    return next;
  });
}

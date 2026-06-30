import type { QuestionRecord } from "../api/question";

export type QuestionBankExportPayload = {
  exportedAt?: string;
  requested: number;
  exported: number;
  notFoundIds?: string[];
  questions: QuestionRecord[];
};

export function downloadQuestionBankJsonExport(payload: QuestionBankExportPayload, filename?: string) {
  const stamp = new Date().toISOString().slice(0, 10);
  const name = filename ?? `question-bank-export-${stamp}.json`;
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

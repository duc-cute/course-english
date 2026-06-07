import type { LessonBlockRecord } from "../../../shared/api/lesson";
import { parseQuestionRefPayload } from "./parseQuestionRef";

export function formatElapsedTime(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function buildPracticeSubtitle(blocks: LessonBlockRecord[], questionCount: number): string {
  const parts: string[] = [];
  if (questionCount > 0) {
    parts.push(`${questionCount} câu`);
  }

  const refBlocks = blocks.filter((b) => b.blockType === "QUESTION_REF");
  if (refBlocks.length) {
    const refs = refBlocks.flatMap((b) => parseQuestionRefPayload(b.payloadJson).refs ?? []);
    if (refs.length) {
      parts.push(`refs: ${refs.slice(0, 5).join(", ")}${refs.length > 5 ? "…" : ""}`);
    }
  }

  return parts.length ? `(${parts.join(", ")})` : "";
}

export function buildQuestionRefNote(blocks: LessonBlockRecord[]): string | null {
  const refBlocks = blocks.filter((b) => b.blockType === "QUESTION_REF");
  if (!refBlocks.length) return null;

  const refs = refBlocks.flatMap((b) => parseQuestionRefPayload(b.payloadJson).refs ?? []);
  if (!refs.length) return null;

  return `QUESTION_REF: ${refs.join(", ")}`;
}

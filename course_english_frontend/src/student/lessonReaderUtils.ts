import type { LessonBlockRecord, LessonBlockType } from "../shared/api/lesson";
import { parseBlockPayload } from "../shared/api/lesson";
import {
  parseResolvedVocabularyItems,
  parseVocabularyBlockPayload,
} from "../shared/lesson/vocabularyPayload";

const BLOCK_LABELS: Record<LessonBlockType, string> = {
  TEXT: "Nội dung",
  IMAGE: "Hình ảnh",
  VIDEO: "Video",
  AUDIO: "Nghe",
  CALLOUT: "Ghi chú",
  SUMMARY: "Tóm tắt",
  VOCABULARY: "Từ vựng",
  QUESTION_REF: "Câu hỏi",
  EXERCISE_SET: "Bài tập",
};

export function getBlockTypeLabel(type: LessonBlockType): string {
  return BLOCK_LABELS[type] ?? type;
}

export function getBlockCssModifier(type: LessonBlockType): string {
  if (type === "TEXT") return "lesson-reader-block--text";
  if (type === "IMAGE") return "lesson-reader-block--media";
  if (type === "AUDIO" || type === "VIDEO") return "lesson-reader-block--media";
  if (type === "VOCABULARY") return "lesson-reader-block--vocabulary";
  return "";
}

function stripHtml(text: string): string {
  return text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function getBlockTocTitle(block: LessonBlockRecord, index: number): string {
  if (block.blockType === "VOCABULARY") {
    const payload = parseVocabularyBlockPayload(block.payloadJson);
    if (payload.title?.trim()) return payload.title.trim();
    if (payload.vocabularySetTitle?.trim()) return payload.vocabularySetTitle.trim();
  }
  if (block.blockType === "TEXT") {
    const payload = parseBlockPayload<{ html?: string }>(block.payloadJson);
    const html = payload.html ?? "";
    const h2 = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
    if (h2?.[1]) return stripHtml(h2[1]).slice(0, 56);
    const h3 = html.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i);
    if (h3?.[1]) return stripHtml(h3[1]).slice(0, 56);
    const plain = stripHtml(html);
    if (plain) return plain.length > 52 ? `${plain.slice(0, 52)}…` : plain;
  }
  return `${index + 1}. ${getBlockTypeLabel(block.blockType)}`;
}

export function getLessonBlockDomId(blockId: string): string {
  return `lesson-block-${blockId}`;
}

export function getLessonReaderProTip(blocks: LessonBlockRecord[]): string {
  if (blocks.some((b) => b.blockType === "AUDIO")) {
    return "Nghe audio và đọc transcript (nếu có) — lặp lại đoạn khó cho đến khi hiểu.";
  }
  if (blocks.some((b) => b.blockType === "IMAGE")) {
    return "Ảnh minh họa có chú thích — hãy đọc nhãn trên hình rồi quay lại mục lục để chuyển phần tiếp theo.";
  }
  return "Dùng mục lục để nhảy nhanh giữa các phần. Thanh tiến độ phản ánh mức bạn đã cuộn trong bài.";
}

export function estimateReadingMinutes(blocks: LessonBlockRecord[]): number {
  let words = 0;
  let vocabItems = 0;
  for (const block of blocks) {
    if (block.blockType === "VOCABULARY") {
      vocabItems += parseResolvedVocabularyItems(block.resolvedVocabularyJson).length;
      continue;
    }
    if (block.blockType !== "TEXT") continue;
    const payload = parseBlockPayload<{ html?: string }>(block.payloadJson);
    const text = (payload.html ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    words += text ? text.split(" ").length : 0;
  }
  if (words === 0 && vocabItems === 0) return 1;
  const fromText = words > 0 ? Math.ceil(words / 180) : 0;
  const fromVocab = vocabItems > 0 ? Math.max(1, Math.ceil(vocabItems * 0.5)) : 0;
  return Math.max(1, fromText + fromVocab);
}

import { stringifyBlockPayload } from "../api/lesson";

export type VocabularyPresentation = "list" | "flashcard";

export type VocabularyBlockPayload = {
  title?: string;
  instruction?: string;
  vocabularySetId: string;
  vocabularySetTitle?: string;
  presentation?: VocabularyPresentation;
  showPhonetic?: boolean;
};

export type ResolvedVocabularyItem = {
  id?: string;
  wordEn: string;
  meaningVi: string;
  phonetic?: string;
  audioUkUrl?: string;
  audioUsUrl?: string;
  partOfSpeech?: string;
  displayOrder?: number;
};

export function createDefaultVocabularyPayload(
  setId: string,
  setTitle: string,
): VocabularyBlockPayload {
  return {
    title: setTitle,
    instruction: "Đọc và ghi nhớ từng từ",
    vocabularySetId: setId,
    vocabularySetTitle: setTitle,
    presentation: "list",
    showPhonetic: true,
  };
}

export function buildVocabularyPayloadJson(payload: VocabularyBlockPayload): string {
  return stringifyBlockPayload({
    ...payload,
    title: payload.title?.trim(),
    instruction: payload.instruction?.trim() || undefined,
    vocabularySetTitle: payload.vocabularySetTitle?.trim() || undefined,
    presentation: payload.presentation ?? "list",
    showPhonetic: payload.showPhonetic !== false,
  });
}

export function parseVocabularyBlockPayload(payloadJson?: string): VocabularyBlockPayload {
  try {
    const raw = payloadJson ? (JSON.parse(payloadJson) as Record<string, unknown>) : {};
    return {
      title: typeof raw.title === "string" ? raw.title : undefined,
      instruction: typeof raw.instruction === "string" ? raw.instruction : undefined,
      vocabularySetId: typeof raw.vocabularySetId === "string" ? raw.vocabularySetId : "",
      vocabularySetTitle:
        typeof raw.vocabularySetTitle === "string" ? raw.vocabularySetTitle : undefined,
      presentation: raw.presentation === "flashcard" ? "flashcard" : "list",
      showPhonetic: raw.showPhonetic !== false,
    };
  } catch {
    return {
      vocabularySetId: "",
      presentation: "list",
      showPhonetic: true,
    };
  }
}

export function parseResolvedVocabularyItems(json?: string): ResolvedVocabularyItem[] {
  if (!json?.trim()) return [];
  try {
    const parsed = JSON.parse(json) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((row): row is Record<string, unknown> => typeof row === "object" && row !== null)
      .map((row) => ({
        id: typeof row.id === "string" ? row.id : undefined,
        wordEn: String(row.wordEn ?? "").trim(),
        meaningVi: String(row.meaningVi ?? "").trim(),
        phonetic: typeof row.phonetic === "string" ? row.phonetic : undefined,
        audioUkUrl: typeof row.audioUkUrl === "string" ? row.audioUkUrl : undefined,
        audioUsUrl: typeof row.audioUsUrl === "string" ? row.audioUsUrl : undefined,
        partOfSpeech: typeof row.partOfSpeech === "string" ? row.partOfSpeech : undefined,
        displayOrder: typeof row.displayOrder === "number" ? row.displayOrder : undefined,
      }))
      .filter((item) => item.wordEn && item.meaningVi);
  } catch {
    return [];
  }
}

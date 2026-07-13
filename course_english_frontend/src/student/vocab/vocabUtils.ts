import type { VocabularyItemRecord } from "../../shared/api/vocabularySet";
import type { ResolvedVocabularyItem } from "../../shared/lesson/vocabularyPayload";

export function toResolvedVocabularyItems(items: VocabularyItemRecord[]): ResolvedVocabularyItem[] {
  return items
    .map((item) => ({
      id: item.id,
      wordEn: item.wordEn?.trim() ?? "",
      meaningVi: item.meaningVi?.trim() ?? "",
      phonetic: item.phonetic,
      audioUkUrl: item.audioUkUrl,
      audioUsUrl: item.audioUsUrl,
      partOfSpeech: item.partOfSpeech,
      exampleSentence: item.exampleSentence,
      displayOrder: item.displayOrder,
    }))
    .filter((item) => item.wordEn && item.meaningVi)
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
}

export function formatVocabCount(count?: number): string {
  const n = count ?? 0;
  return `${n} từ`;
}

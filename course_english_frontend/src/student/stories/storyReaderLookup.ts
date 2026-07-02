import type { StoryGlossaryEntry, StoryReaderPayload, StoryToken, StoryWordLookup } from "../shared/api/story";

function toWordKey(word: string): string {
  return word.toLowerCase().replace(/[^a-z0-9']/g, "").replace(/'s$/, "");
}

export function buildGlossaryMap(glossary?: StoryGlossaryEntry[]): Map<string, StoryGlossaryEntry> {
  const map = new Map<string, StoryGlossaryEntry>();
  for (const entry of glossary ?? []) {
    if (entry.wordKey) {
      map.set(entry.wordKey, entry);
    }
  }
  return map;
}

export function resolveWordLookupFromPayload(
  payload: StoryReaderPayload,
  glossaryMap: Map<string, StoryGlossaryEntry>,
  token: StoryToken,
): StoryWordLookup | null {
  if (!token.text) return null;
  const wordKey = toWordKey(token.text);
  const glossaryEntry = glossaryMap.get(wordKey);

  if (glossaryEntry) {
    return {
      wordEn: glossaryEntry.wordEn ?? token.text,
      wordKey,
      vocabularyId: glossaryEntry.vocabularyId ?? token.vocabularyId,
      meaningVi: glossaryEntry.meaningVi,
      phonetic: glossaryEntry.phonetic,
      audioUkUrl: glossaryEntry.audioUkUrl,
      audioUsUrl: glossaryEntry.audioUsUrl,
      partOfSpeech: glossaryEntry.partOfSpeech,
      imageUrl: glossaryEntry.imageUrl,
      inDatabase: glossaryEntry.meaningSource === "db",
      meaningSource:
        glossaryEntry.meaningSource === "db"
          ? "db"
          : glossaryEntry.meaningSource === "story"
            ? "story"
            : glossaryEntry.meaningVi
              ? "story"
              : "none",
    };
  }

  return null;
}

export function findSentenceBySelection(
  payload: StoryReaderPayload,
  selectedText: string,
): { text: string; textVi?: string; sentenceIndex: number } | null {
  const normalized = selectedText.trim().replace(/\s+/g, " ");
  if (!normalized || !payload.sentences?.length) return null;

  for (const sentence of payload.sentences) {
    if (!sentence.text) continue;
    const sentenceNorm = sentence.text.trim().replace(/\s+/g, " ");
    if (
      sentenceNorm.includes(normalized) ||
      normalized.includes(sentenceNorm) ||
      sentenceNorm === normalized
    ) {
      return {
        text: sentence.text,
        textVi: sentence.textVi,
        sentenceIndex: sentence.sentenceIndex,
      };
    }
  }
  return null;
}

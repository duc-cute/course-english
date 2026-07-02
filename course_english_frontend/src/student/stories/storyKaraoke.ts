import type {
  StorySentenceTimelineItem,
  StoryWordTimelineItem,
} from "../../shared/api/story";

export function findActiveWordIndex(
  currentTime: number,
  timeline: StoryWordTimelineItem[] | undefined,
): number | null {
  if (!timeline?.length) return null;

  for (const item of timeline) {
    if (currentTime >= item.start && currentTime < item.end) {
      return item.wordIndex;
    }
  }

  let last: number | null = null;
  for (const item of timeline) {
    if (currentTime >= item.start) {
      last = item.wordIndex;
    }
  }
  return last;
}

export function findActiveSentenceIndex(
  currentTime: number,
  timeline: StorySentenceTimelineItem[] | undefined,
): number | null {
  if (!timeline?.length) return null;

  for (const item of timeline) {
    if (currentTime >= item.start && currentTime < item.end) {
      return item.sentenceIndex;
    }
  }

  let last: number | null = null;
  for (const item of timeline) {
    if (currentTime >= item.start) {
      last = item.sentenceIndex;
    }
  }
  return last;
}

export function isWordInSentence(
  wordIndex: number | undefined,
  sentenceIndex: number | null,
  sentences: { sentenceIndex: number; startWordIndex: number; endWordIndex: number }[] | undefined,
): boolean {
  if (wordIndex == null || sentenceIndex == null || !sentences?.length) return false;
  const sentence = sentences.find((s) => s.sentenceIndex === sentenceIndex);
  if (!sentence) return false;
  return wordIndex >= sentence.startWordIndex && wordIndex <= sentence.endWordIndex;
}

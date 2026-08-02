import type { ExerciseAnswerSnapshot } from "../exerciseSessionStorage";
import type { PreparedExerciseItem } from "./prepareExerciseItems";
import type { ExerciseQuestion } from "./types";

export type SessionReviewWord = {
  word: string;
  count: number;
  level: "orange" | "red";
};

function normalizeWordKey(word: string): string {
  return word.trim().replace(/\s+/g, " ").toLowerCase();
}

function displayWord(word: string): string {
  return word.trim().replace(/\s+/g, " ");
}

function extractWordLabels(question: ExerciseQuestion, answer: ExerciseAnswerSnapshot): string[] {
  switch (question.type) {
    case "MULTIPLE_CHOICE":
    case "LISTEN_CHOOSE":
    case "SPELLING":
    case "LISTEN_TYPE":
    case "FILL_BLANK":
    case "TRUE_FALSE": {
      const wordEn = "wordEn" in question ? question.wordEn?.trim() : undefined;
      if (wordEn) return [wordEn];
      if (question.type === "SPELLING" || question.type === "LISTEN_TYPE") {
        const fallback = question.correctAnswer?.trim();
        return fallback ? [fallback] : [];
      }
      return [];
    }
    case "MATCHING": {
      const selections = answer.matchingSelections ?? {};
      const wrongLefts: string[] = [];
      for (const pair of question.pairs) {
        if (selections[pair.left] !== pair.right) {
          wrongLefts.push(pair.left);
        }
      }
      return wrongLefts;
    }
    default:
      return [];
  }
}

/**
 * Derive "Từ cần ôn tập" from wrong answers in the current session.
 * Aggregates by word (case-insensitive); orange = 1 miss, red = 2+.
 */
export function collectSessionReviewWords(
  items: PreparedExerciseItem[],
  answers: Record<string, ExerciseAnswerSnapshot>,
): SessionReviewWord[] {
  const counts = new Map<string, { word: string; count: number }>();

  for (const item of items) {
    const answer = answers[item.displayQuestion.id];
    if (!answer || answer.correct !== false) continue;

    const labels = extractWordLabels(item.displayQuestion, answer);
    for (const label of labels) {
      const key = normalizeWordKey(label);
      if (!key) continue;
      const existing = counts.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(key, { word: displayWord(label), count: 1 });
      }
    }
  }

  return Array.from(counts.values())
    .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word))
    .map((entry) => ({
      word: entry.word,
      count: entry.count,
      level: entry.count >= 2 ? "red" : "orange",
    }));
}

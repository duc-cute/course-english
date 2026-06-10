export type AnswerNormalizeOptions = {
  caseSensitive?: boolean;
  trim?: boolean;
  collapseSpaces?: boolean;
  stripPunctuation?: boolean;
};

const DEFAULT_OPTIONS: Required<AnswerNormalizeOptions> = {
  caseSensitive: false,
  trim: true,
  collapseSpaces: true,
  stripPunctuation: true,
};

export function normalizeAnswer(input: string, options: AnswerNormalizeOptions = {}): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let value = input ?? "";

  if (opts.trim) {
    value = value.trim();
  }
  if (opts.collapseSpaces) {
    value = value.replace(/\s+/g, " ");
  }
  if (opts.stripPunctuation) {
    value = value.replace(/^[\s.,!?;:'"()]+|[\s.,!?;:'"()]+$/g, "");
  }
  if (!opts.caseSensitive) {
    value = value.toLowerCase();
  }
  return value;
}

export function compareTypedAnswers(
  userInput: string,
  correctAnswer: string,
  options: AnswerNormalizeOptions = {},
): boolean {
  const normalized = normalizeAnswer(userInput, options);
  const expected = normalizeAnswer(correctAnswer, options);
  if (!normalized || !expected) return false;
  return normalized === expected;
}

export function buildSpellingHint(wordEn: string): string | undefined {
  const word = wordEn.trim();
  if (word.length < 3) return undefined;
  const first = word[0];
  const last = word[word.length - 1];
  const middle = "_".repeat(Math.max(1, word.length - 2));
  return `${first}${middle}${last}`;
}

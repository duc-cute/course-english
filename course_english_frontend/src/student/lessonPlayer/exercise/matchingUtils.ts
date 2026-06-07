import type { MatchingPair } from "./types";

export function scoreMatchingAnswer(
  pairs: MatchingPair[],
  selections: Record<string, string>,
): boolean {
  if (!pairs.length) return false;
  return pairs.every((pair) => selections[pair.left] === pair.right);
}

export function isMatchingComplete(
  pairs: MatchingPair[],
  selections: Record<string, string>,
): boolean {
  return pairs.every((pair) => Boolean(selections[pair.left]?.trim()));
}

export function sameStringSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort().join("\0");
  const sortedB = [...b].sort().join("\0");
  return sortedA === sortedB;
}

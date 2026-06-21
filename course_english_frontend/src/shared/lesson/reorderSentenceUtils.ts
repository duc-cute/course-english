import type { ReorderToken } from "../../student/lessonPlayer/exercise/types";

export const MIN_REORDER_TOKENS = 3;
export const MAX_REORDER_TOKENS = 15;

export function compareReorderOrder(userOrder: string[], correctOrder: string[]): boolean {
  if (userOrder.length !== correctOrder.length) return false;
  return userOrder.every((id, index) => id === correctOrder[index]);
}

export function isReorderComplete(userOrder: string[], tokenCount: number): boolean {
  return tokenCount > 0 && userOrder.length === tokenCount;
}

export function syncCorrectOrder(tokens: ReorderToken[]): string[] {
  return tokens.map((token) => token.id);
}

export function rebuildTokensFromTexts(texts: string[]): ReorderToken[] {
  return texts
    .map((text) => text.trim())
    .filter(Boolean)
    .map((text, index) => ({ id: `t${index + 1}`, text }));
}

export function suggestTokensFromSentence(sentence: string): ReorderToken[] {
  const parts = sentence.trim().split(/\s+/).filter(Boolean);
  return rebuildTokensFromTexts(parts);
}

export function mergeTokensAt(tokens: ReorderToken[], index: number): ReorderToken[] {
  if (index < 0 || index >= tokens.length - 1) return tokens;
  const merged = `${tokens[index].text} ${tokens[index + 1].text}`.replace(/\s+/g, " ").trim();
  const next = [...tokens.slice(0, index), { id: tokens[index].id, text: merged }, ...tokens.slice(index + 2)];
  return rebuildTokensFromTexts(next.map((t) => t.text));
}

export function splitTokenAt(tokens: ReorderToken[], index: number): ReorderToken[] {
  const token = tokens[index];
  if (!token) return tokens;
  const parts = token.text.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return tokens;
  return rebuildTokensFromTexts([
    ...tokens.slice(0, index).map((t) => t.text),
    ...parts,
    ...tokens.slice(index + 1).map((t) => t.text),
  ]);
}

export function tokensMatchSourceSentence(tokens: ReorderToken[], sentence: string): boolean {
  const sentenceText = sentence.trim().replace(/\s+/g, " ");
  if (!sentenceText) return true;
  const joined = tokens
    .map((token) => token.text.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ");
  return joined === sentenceText;
}

export function getTokenById(tokens: ReorderToken[], id: string): ReorderToken | undefined {
  return tokens.find((token) => token.id === id);
}

export function getPoolTokenIds(
  tokens: ReorderToken[],
  selectedOrder: string[],
  poolDisplayOrder?: string[],
): string[] {
  const remaining = tokens.map((t) => t.id).filter((id) => !selectedOrder.includes(id));
  if (!poolDisplayOrder?.length) return remaining;
  const ordered = poolDisplayOrder.filter((id) => remaining.includes(id));
  const missing = remaining.filter((id) => !ordered.includes(id));
  return [...ordered, ...missing];
}

/** Fisher–Yates shuffle (mutates copy) */
export function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function reorderByIds<T extends { id: string }>(items: T[], ids: string[]): T[] {
  const map = new Map(items.map((item) => [item.id, item]));
  return ids.map((id) => map.get(id)).filter((item): item is T => item !== undefined);
}

export function reorderChoicesByIds<T extends { id: string }>(choices: T[], ids: string[]): T[] {
  return reorderByIds(choices, ids);
}

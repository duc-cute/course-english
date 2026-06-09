export function formatElapsedTime(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function buildPracticeSubtitle(questionCount: number): string {
  return questionCount > 0 ? `(${questionCount} câu)` : "";
}

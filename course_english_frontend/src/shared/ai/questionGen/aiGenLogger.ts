/** Structured client logs for AI question-generation flows (dev console + future telemetry). */

export type AiGenLogScope = "question-bank" | "exercise" | "exam-paper" | "vocabulary";

export type AiGenLogLevel = "info" | "warn" | "error" | "debug";

export type AiGenLogPayload = {
  scope: AiGenLogScope;
  event: string;
  taskId?: string;
  elapsedMs?: number;
  [key: string]: unknown;
};

const PREFIX = "[AiQuestionGen]";

function shouldLogDebug(): boolean {
  try {
    return import.meta.env?.DEV === true || import.meta.env?.MODE === "development";
  } catch {
    return false;
  }
}

export function aiGenLog(level: AiGenLogLevel, payload: AiGenLogPayload): void {
  const line = { ...payload, ts: new Date().toISOString() };
  if (level === "error") {
    console.error(PREFIX, line);
    return;
  }
  if (level === "warn") {
    console.warn(PREFIX, line);
    return;
  }
  if (level === "debug") {
    if (shouldLogDebug()) console.debug(PREFIX, line);
    return;
  }
  console.info(PREFIX, line);
}

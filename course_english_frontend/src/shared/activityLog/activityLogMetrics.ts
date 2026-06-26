import type { ActivityLogRecord } from "../api/activityLog";

type LogContext = Record<string, unknown>;

function parseContext(contextJson?: string): LogContext | null {
  if (!contextJson) return null;
  try {
    const parsed = JSON.parse(contextJson) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as LogContext) : null;
  } catch {
    return null;
  }
}

function num(ctx: LogContext | null, key: string): number | null {
  if (!ctx) return null;
  const value = ctx[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return null;
}

function formatThousands(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return String(value);
}

function formatDurationMs(ms: number): string {
  if (ms >= 60_000) return `${(ms / 60_000).toFixed(1)} phút`;
  if (ms >= 1_000) return `${(ms / 1_000).toFixed(1)}s`;
  return `${ms}ms`;
}

function sourceLabel(ctx: LogContext | null): string | null {
  if (!ctx) return null;
  const raw = ctx.documentSource ?? ctx.source;
  if (typeof raw !== "string" || !raw.trim()) return null;
  return raw === "paste" ? "dán text" : raw === "upload" ? "file" : raw;
}

/** Short metrics line for table column — parsed from context_json when message is old format. */
export function formatActivityLogMetrics(row: ActivityLogRecord): string | null {
  const ctx = parseContext(row.contextJson);
  const action = row.action;
  const step = ctx?.step as string | undefined;
  const src = sourceLabel(ctx);

  if (action === "AI_GEN_PROMPT") {
    const total = num(ctx, "totalPromptChars");
    const system = num(ctx, "systemPromptChars");
    const user = num(ctx, "userPromptChars");
    const estTok = num(ctx, "estimatedInputTokens");
    const qCount = num(ctx, "questionCount");
    if (total != null && system != null && user != null) {
      return `${src ? `[${src}] ` : ""}sys ${formatThousands(system)} + user ${formatThousands(user)} = ${formatThousands(total)} chars`
        + (estTok != null ? ` (~${formatThousands(estTok)} tok)` : "")
        + (qCount != null ? ` | ${qCount} câu` : "");
    }
    const doc = num(ctx, "documentChars");
    if (doc != null) {
      return `${src ? `[${src}] ` : ""}doc ${formatThousands(doc)} chars trong prompt`;
    }
  }

  if (action === "AI_OR_ROUND") {
    if (step === "openrouter_response") {
      const duration = num(ctx, "durationMs");
      const inTok = num(ctx, "promptTokens");
      const outTok = num(ctx, "completionTokens");
      const respChars = num(ctx, "responseChars");
      const attempt = num(ctx, "attempt");
      const parts: string[] = [];
      if (attempt != null) parts.push(`lần ${attempt}`);
      if (duration != null) parts.push(formatDurationMs(duration));
      if (inTok != null) parts.push(`in ${formatThousands(inTok)} tok`);
      if (outTok != null) parts.push(`out ${formatThousands(outTok)} tok`);
      if (respChars != null) parts.push(`resp ${formatThousands(respChars)} chars`);
      if (parts.length) return parts.join(" | ");
    }
    if (step === "openrouter_request") {
      const payload = num(ctx, "requestPayloadChars");
      const est = num(ctx, "estimatedInputTokens");
      const attempt = num(ctx, "attempt");
      if (payload != null) {
        return `gửi lần ${attempt ?? "?"}: ${formatThousands(payload)} chars`
          + (est != null ? ` (~${formatThousands(est)} tok)` : "");
      }
    }
  }

  if (action === "AI_GEN_START") {
    const doc = num(ctx, "documentTextChars");
    const estDoc = num(ctx, "estimatedDocumentTokens");
    const queue = num(ctx, "queueWaitMs");
    const parts: string[] = [];
    if (src) parts.push(`[${src}]`);
    if (doc != null) parts.push(`doc ${formatThousands(doc)} chars`);
    if (estDoc != null) parts.push(`~${formatThousands(estDoc)} tok`);
    if (queue != null && queue > 0) parts.push(`queue ${formatDurationMs(queue)}`);
    if (parts.length) return parts.join(" | ");
  }

  if (action === "AI_GEN_RESPONSE") {
    const total = num(ctx, "totalTaskMs");
    const orTotal = num(ctx, "openRouterTotalMs");
    const attempts = num(ctx, "openRouterAttempts");
    const inTok = num(ctx, "promptTokens");
    const outTok = num(ctx, "completionTokens");
    const parts: string[] = [];
    if (total != null) parts.push(`tổng ${formatDurationMs(total)}`);
    if (orTotal != null) parts.push(`OR ${formatDurationMs(orTotal)}`);
    if (attempts != null && attempts > 1) parts.push(`${attempts} lần gọi`);
    if (inTok != null) parts.push(`in ${formatThousands(inTok)} tok`);
    if (outTok != null) parts.push(`out ${formatThousands(outTok)} tok`);
    if (parts.length) return parts.join(" | ");
  }

  if (action === "AI_DOC_READY") {
    const textChars = num(ctx, "textChars");
    const estTok = num(ctx, "estimatedTextTokens");
    const duration = num(ctx, "durationMs");
    const parts: string[] = [];
    if (src) parts.push(`[${src}]`);
    if (textChars != null) parts.push(`${formatThousands(textChars)} chars`);
    if (estTok != null) parts.push(`~${formatThousands(estTok)} tok`);
    if (duration != null && duration > 0) parts.push(`extract ${formatDurationMs(duration)}`);
    if (parts.length) return parts.join(" | ");
  }

  return null;
}

export type ActivityLogMetricField = { label: string; value: string };

/** Structured fields for detail dialog. */
export function extractActivityLogMetricFields(row: ActivityLogRecord): ActivityLogMetricField[] {
  const ctx = parseContext(row.contextJson);
  if (!ctx) return [];

  const fields: ActivityLogMetricField[] = [];
  const add = (label: string, key: string, formatter?: (n: number) => string) => {
    const value = num(ctx, key);
    if (value == null) return;
    fields.push({ label, value: formatter ? formatter(value) : String(value) });
  };

  add("Document (chars)", "documentChars", formatThousands);
  add("Document DB (chars)", "documentTextChars", formatThousands);
  add("Text tài liệu (chars)", "textChars", formatThousands);
  add("Ước tính tok tài liệu", "estimatedTextTokens", formatThousands);
  add("Ước tính tok document DB", "estimatedDocumentTokens", formatThousands);
  add("System prompt (chars)", "systemPromptChars", formatThousands);
  add("User prompt (chars)", "userPromptChars", formatThousands);
  add("Tổng prompt (chars)", "totalPromptChars", formatThousands);
  add("Payload gửi OR (chars)", "requestPayloadChars", formatThousands);
  add("Ước tính input tokens", "estimatedInputTokens", formatThousands);
  add("Prompt tokens (thực)", "promptTokens", formatThousands);
  add("Completion tokens", "completionTokens", formatThousands);
  add("Response (chars)", "responseChars", formatThousands);
  add("Thời gian OR", "durationMs", formatDurationMs);
  add("Tổng task", "totalTaskMs", formatDurationMs);
  add("Tổng OR", "openRouterTotalMs", formatDurationMs);
  add("Queue wait", "queueWaitMs", formatDurationMs);
  add("Số câu", "questionCount");
  add("Lần gọi OR", "openRouterAttempts");
  if (typeof ctx.model === "string" && ctx.model.trim()) {
    fields.push({ label: "Model", value: ctx.model });
  }
  const src = sourceLabel(ctx);
  if (src) {
    fields.push({ label: "Nguồn", value: src });
  }

  return fields;
}

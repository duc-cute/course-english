import { stringifyBlockPayload } from "../api/lesson";

export type SummaryBlockPayload = {
  title?: string;
  items: string[];
};

export function createDefaultSummaryPayload(): SummaryBlockPayload {
  return {
    title: "Điểm chính cần nhớ",
    items: ["", ""],
  };
}

export function buildSummaryPayloadJson(payload: SummaryBlockPayload): string {
  const items = (payload.items ?? []).map((item) => item.trim()).filter(Boolean);
  return stringifyBlockPayload({
    title: payload.title?.trim() || "Điểm chính cần nhớ",
    items,
  });
}

export function parseSummaryBlockPayload(payloadJson?: string): SummaryBlockPayload {
  try {
    const raw = payloadJson ? (JSON.parse(payloadJson) as Record<string, unknown>) : {};
    const itemsRaw = Array.isArray(raw.items) ? raw.items : [];
    const items = itemsRaw
      .map((item) => (typeof item === "string" ? item : ""))
      .filter((item) => item.length > 0);
    return {
      title: typeof raw.title === "string" ? raw.title : undefined,
      items,
    };
  } catch {
    return { items: [] };
  }
}

export function validateSummaryPayload(payload: SummaryBlockPayload): string | null {
  const items = (payload.items ?? []).map((item) => item.trim()).filter(Boolean);
  if (!items.length) {
    return "Cần ít nhất một ý tóm tắt.";
  }
  return null;
}

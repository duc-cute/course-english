import { stringifyBlockPayload } from "../api/lesson";

export type CalloutVariant = "tip" | "warning" | "definition";

export type CalloutBlockPayload = {
  variant: CalloutVariant;
  title?: string;
  html: string;
};

export const CALLOUT_VARIANT_OPTIONS: { value: CalloutVariant; label: string }[] = [
  { value: "tip", label: "Mẹo học" },
  { value: "warning", label: "Cảnh báo / lỗi thường gặp" },
  { value: "definition", label: "Định nghĩa / quy tắc" },
];

export function createDefaultCalloutPayload(): CalloutBlockPayload {
  return {
    variant: "tip",
    title: "",
    html: "<p>Nhập ghi chú nổi bật tại đây...</p>",
  };
}

export function buildCalloutPayloadJson(payload: CalloutBlockPayload): string {
  const variant = CALLOUT_VARIANT_OPTIONS.some((o) => o.value === payload.variant)
    ? payload.variant
    : "tip";
  return stringifyBlockPayload({
    variant,
    title: payload.title?.trim() || undefined,
    html: payload.html?.trim() || "",
  });
}

export function parseCalloutBlockPayload(payloadJson?: string): CalloutBlockPayload {
  try {
    const raw = payloadJson ? (JSON.parse(payloadJson) as Record<string, unknown>) : {};
    const variantRaw = raw.variant;
    const variant: CalloutVariant =
      variantRaw === "warning" || variantRaw === "definition" ? variantRaw : "tip";
    return {
      variant,
      title: typeof raw.title === "string" ? raw.title : undefined,
      html: typeof raw.html === "string" ? raw.html : "",
    };
  } catch {
    return createDefaultCalloutPayload();
  }
}

export function isCalloutHtmlEmpty(html?: string): boolean {
  const trimmed = (html ?? "").trim();
  return !trimmed || trimmed === "<p><br></p>" || trimmed === "<p></p>";
}

export function validateCalloutPayload(payload: CalloutBlockPayload): string | null {
  if (isCalloutHtmlEmpty(payload.html)) {
    return "Nội dung ghi chú không được để trống.";
  }
  return null;
}

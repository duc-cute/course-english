import { parseBlockPayload } from "../api/lesson";

export type SlideDeckDisplayMode = "PRESENTATION" | "SCROLL";

export const SLIDE_DECK_DISPLAY_MODE_PRESENTATION: SlideDeckDisplayMode = "PRESENTATION";
export const SLIDE_DECK_DISPLAY_MODE_SCROLL: SlideDeckDisplayMode = "SCROLL";

export const SLIDE_DECK_DISPLAY_MODE_OPTIONS: { value: SlideDeckDisplayMode; label: string }[] = [
  { value: SLIDE_DECK_DISPLAY_MODE_PRESENTATION, label: "Trình chiếu (từng slide)" },
  { value: SLIDE_DECK_DISPLAY_MODE_SCROLL, label: "Cuộn (xếp ảnh dọc)" },
];

export type SlideDeckSlideRef = {
  assetId: string;
  order: number;
  caption?: string;
};

export type SlideDeckPayload = {
  title?: string;
  aspectRatio?: string;
  displayMode?: SlideDeckDisplayMode;
  slides: SlideDeckSlideRef[];
  source?: {
    type?: string;
    originalFileName?: string;
    pdfCount?: number;
    slideCount?: number;
  };
};

function normalizeDisplayMode(value: unknown): SlideDeckDisplayMode {
  return value === SLIDE_DECK_DISPLAY_MODE_SCROLL
    ? SLIDE_DECK_DISPLAY_MODE_SCROLL
    : SLIDE_DECK_DISPLAY_MODE_PRESENTATION;
}

export function parseSlideDeckPayload(payloadJson?: string): SlideDeckPayload {
  const raw = parseBlockPayload<Partial<SlideDeckPayload>>(payloadJson);
  const slides = Array.isArray(raw.slides)
    ? raw.slides
        .filter((s): s is SlideDeckSlideRef => Boolean(s?.assetId))
        .map((s) => ({
          assetId: String(s.assetId),
          order: typeof s.order === "number" ? s.order : 0,
          caption: typeof s.caption === "string" ? s.caption : undefined,
        }))
        .sort((a, b) => a.order - b.order)
    : [];
  return {
    title: typeof raw.title === "string" ? raw.title : undefined,
    aspectRatio: typeof raw.aspectRatio === "string" ? raw.aspectRatio : "16:9",
    displayMode: normalizeDisplayMode(raw.displayMode),
    slides,
    source: raw.source,
  };
}

export function createDefaultSlideDeckPayload(): SlideDeckPayload {
  return {
    title: "Slide deck",
    aspectRatio: "16:9",
    displayMode: SLIDE_DECK_DISPLAY_MODE_PRESENTATION,
    slides: [],
    source: { type: "PDF_ZIP" },
  };
}

export function buildSlideDeckPayloadJson(payload: SlideDeckPayload): string {
  return JSON.stringify(payload);
}

export function getSlideDeckDisplayModeLabel(mode: SlideDeckDisplayMode): string {
  return SLIDE_DECK_DISPLAY_MODE_OPTIONS.find((o) => o.value === mode)?.label ?? mode;
}

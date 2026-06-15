import type { LessonAssetRecord, LessonBlockRecord } from "../../../shared/api/lesson";
import {
  SLIDE_DECK_DISPLAY_MODE_SCROLL,
  parseSlideDeckPayload,
} from "../../../shared/lesson/slideDeckPayload";
import { SlideScrollView } from "./SlideScrollView";
import { SlideViewer } from "./SlideViewer";

type SlideDeckBlockProps = {
  block: LessonBlockRecord;
  assets: LessonAssetRecord[];
};

/** Router: presentation vs vertical scroll — theo `displayMode` trong payload. */
export function SlideDeckBlock({ block, assets }: SlideDeckBlockProps) {
  const payload = parseSlideDeckPayload(block.payloadJson);
  if (payload.displayMode === SLIDE_DECK_DISPLAY_MODE_SCROLL) {
    return <SlideScrollView block={block} assets={assets} />;
  }
  return <SlideViewer block={block} assets={assets} />;
}

import { useMemo } from "react";
import type { LessonAssetRecord, LessonBlockRecord } from "../../../shared/api/lesson";
import { resolveStorageAssetUrl } from "../../../shared/api/file";
import { parseSlideDeckPayload } from "../../../shared/lesson/slideDeckPayload";

export type ResolvedSlide = {
  url: string;
  caption?: string;
  order: number;
};

export function useSlideDeckSlides(block: LessonBlockRecord, assets: LessonAssetRecord[]) {
  const payload = useMemo(() => parseSlideDeckPayload(block.payloadJson), [block.payloadJson]);
  const slides = useMemo<ResolvedSlide[]>(() => {
    return payload.slides
      .map((ref) => {
        const asset = assets.find((a) => a.id === ref.assetId);
        if (!asset?.url) return null;
        return {
          url: resolveStorageAssetUrl(asset.url),
          caption: ref.caption || asset.caption,
          order: ref.order,
        };
      })
      .filter((s): s is ResolvedSlide => s !== null)
      .sort((a, b) => a.order - b.order);
  }, [assets, payload.slides]);
  return { payload, slides };
}

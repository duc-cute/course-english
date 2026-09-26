import { getCachedFeatureFlags } from "../featureFlags/useFeatureFlags";

/** Fallback khi chưa load được system config BRAND_NAME. */
export const DEFAULT_BRAND_NAME = "MT English";

/** Đọc brand từ feature flags cache (đã sync từ system config BRAND_NAME). */
export function getBrandName(): string {
  const name = (getCachedFeatureFlags().brandName ?? "").trim();
  return name || DEFAULT_BRAND_NAME;
}

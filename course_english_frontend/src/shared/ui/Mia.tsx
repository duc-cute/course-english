/**
 * Mia — mascot thương hiệu (prototype/student/Brand.dc.html).
 * Nguồn ảnh: public/mascot/dist/ (xem mascot-map.json để biết state dùng ở đâu).
 * Khác với MascotAvatar: đó là avatar cosmetic theo phần thưởng, còn đây là nhân vật Mia.
 */

/** Các state có sẵn, kèm gợi ý chỗ dùng. */
export const MIA_STATES = {
  cheering: "Hero Bảng xếp hạng, màn kết quả khi đạt",
  excited: "Từ vựng — thẻ độ thành thạo, mở khoá bộ từ mới",
  greeting: "Hero Trang chủ (desktop + mobile), onboarding",
  happy: "Avatar hồ sơ, logo sidebar (bản crop đầu)",
  loading: "Chờ AI sinh nội dung, chờ tải bài",
  oops: "Trả lời sai, nộp bài chưa đạt",
  proud: "Màn kết quả điểm cao, mở khoá huy hiệu",
  reading: "Hero Bài học, hero Đọc truyện",
  sad: "Bài quá hạn, chuỗi ngày học bị mất",
  sleeping: "Mất streak, không hoạt động nhiều ngày",
  surprised: "Mở khoá huy hiệu, phần thưởng bất ngờ",
  thinking: "Mẹo trong Lesson Player, hero Đề thi, trạng thái trống chung",
} as const;

export type MiaState = keyof typeof MIA_STATES;

/** Ba state này chưa cắt bản đầu — tự lùi về ảnh full. */
const NO_HEAD: ReadonlySet<MiaState> = new Set<MiaState>(["loading", "reading", "sleeping"]);

type MiaProps = {
  state: MiaState;
  /** "full" cả người (hero), "head" chỉ đầu (avatar, nav). Mặc định "full". */
  variant?: "full" | "head";
  /** Cạnh hiển thị tính bằng px. Mặc định 256 (full) / 96 (head). */
  size?: number;
  /**
   * Mô tả cho screen reader. Bỏ trống (mặc định) nếu Mia chỉ để trang trí —
   * khi đó ảnh được ẩn khỏi cây accessibility.
   */
  alt?: string;
  /** CSS class có thể ghi đè width/height — thuộc tính px chỉ là mặc định. */
  className?: string;
  /** Đặt true cho Mia nằm trong khung nhìn đầu tiên (hero trang chủ) để tắt lazy-load. */
  priority?: boolean;
};

/** Chọn file lớn hơn hoặc bằng kích thước hiển thị để ảnh không bị vỡ. */
function assetFor(state: MiaState, variant: "full" | "head", size: number): string {
  if (variant === "head") {
    return `/mascot/dist/mia-${state}-head-${size > 96 ? 256 : 96}.webp`;
  }
  return `/mascot/dist/mia-${state}-${size > 256 ? 512 : 256}.webp`;
}

export function Mia({ state, variant = "full", size, alt, className, priority = false }: MiaProps) {
  const resolvedVariant = variant === "head" && NO_HEAD.has(state) ? "full" : variant;
  const px = size ?? (resolvedVariant === "head" ? 96 : 256);
  const decorative = !alt;

  return (
    <img
      src={assetFor(state, resolvedVariant, px)}
      width={px}
      height={px}
      alt={decorative ? "" : alt}
      aria-hidden={decorative || undefined}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : undefined}
      draggable={false}
      className={className ? `vq-mia ${className}` : "vq-mia"}
    />
  );
}

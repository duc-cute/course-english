import { getBrandName } from "../brand/brand";

type BrandLogoSize = "xs" | "sm" | "md" | "lg";

const SIZE_MAP: Record<BrandLogoSize, { box: number; radius: number }> = {
  xs: { box: 32, radius: 6 },
  sm: { box: 38, radius: 8 },
  md: { box: 46, radius: 8 },
  lg: { box: 56, radius: 10 },
};

type BrandLogoProps = {
  size?: BrandLogoSize;
  className?: string;
};

/** Logo thương hiệu — tên lấy từ system config BRAND_NAME. */
export function BrandLogo({ size = "md", className }: BrandLogoProps) {
  const { box, radius } = SIZE_MAP[size];
  const brandName = getBrandName();

  return (
    <span
      className={className ? `brand-logo ${className}` : "brand-logo"}
      style={{
        width: box,
        height: box,
        borderRadius: radius,
        background: "transparent",
      }}
      aria-hidden
    >
      <img
        src="/images/brand-logo.png?v=3"
        alt={brandName}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          borderRadius: "inherit",
        }}
      />
    </span>
  );
}

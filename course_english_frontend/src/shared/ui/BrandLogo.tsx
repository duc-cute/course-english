import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";

type BrandLogoSize = "xs" | "sm" | "md" | "lg";

const SIZE_MAP: Record<BrandLogoSize, { box: number; icon: number; radius: number }> = {
  xs: { box: 28, icon: 16, radius: 6 },
  sm: { box: 32, icon: 18, radius: 8 },
  md: { box: 40, icon: 20, radius: 8 },
  lg: { box: 48, icon: 24, radius: 10 },
};

type BrandLogoProps = {
  size?: BrandLogoSize;
  className?: string;
};

/** Logo Course English — ô vuông bo góc + mũ tốt nghiệp (khớp admin sidebar). */
export function BrandLogo({ size = "md", className }: BrandLogoProps) {
  const { box, icon, radius } = SIZE_MAP[size];

  return (
    <span
      className={className ? `brand-logo ${className}` : "brand-logo"}
      style={{
        width: box,
        height: box,
        borderRadius: radius,
      }}
      aria-hidden
    >
      <SchoolOutlinedIcon sx={{ fontSize: icon }} />
    </span>
  );
}

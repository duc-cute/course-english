import { Box, Typography } from "@mui/material";
import type { LessonAssetRecord, LessonBlockRecord } from "../../../shared/api/lesson";
import { useSlideDeckSlides } from "./useSlideDeckSlides";

type SlideScrollViewProps = {
  block: LessonBlockRecord;
  assets: LessonAssetRecord[];
};

export function SlideScrollView({ block, assets }: SlideScrollViewProps) {
  const { payload, slides } = useSlideDeckSlides(block, assets);

  if (slides.length === 0) {
    return (
      <Typography sx={{ fontSize: 14, color: "#888780", fontStyle: "italic" }}>
        Chưa có slide — giáo viên cần import ZIP PDF.
      </Typography>
    );
  }

  return (
    <Box
      sx={{
        border: "1px solid #e8e6df",
        borderRadius: "16px",
        bgcolor: "#fafaf8",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.25,
          borderBottom: "1px solid #eceae3",
          bgcolor: "#fff",
        }}
      >
        <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#2c2b28" }}>
          {payload.title || "Slide"}
        </Typography>
        <Typography sx={{ fontSize: 12, color: "#888780", mt: 0.25 }}>
          {slides.length} ảnh · cuộn để xem từng trang
        </Typography>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, p: { xs: 1.5, sm: 2 } }}>
        {slides.map((slide, i) => (
          <Box
            key={`${slide.url}-${i}`}
            component="figure"
            sx={{
              m: 0,
              borderRadius: "12px",
              overflow: "hidden",
              border: "1px solid #eceae3",
              bgcolor: "#fff",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <Box
              sx={{
                position: "relative",
                bgcolor: "#0f1115",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Box
                component="img"
                src={slide.url}
                alt={slide.caption || `Trang ${i + 1}`}
                loading="lazy"
                sx={{
                  width: "100%",
                  height: "auto",
                  display: "block",
                  verticalAlign: "middle",
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  top: 10,
                  left: 10,
                  px: 1,
                  py: 0.25,
                  borderRadius: "6px",
                  bgcolor: "rgba(0,0,0,0.55)",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {i + 1}
              </Box>
            </Box>
            {slide.caption ? (
              <Typography
                component="figcaption"
                sx={{ px: 1.5, py: 1, fontSize: 12, color: "#888780", textAlign: "center" }}
              >
                {slide.caption}
              </Typography>
            ) : null}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

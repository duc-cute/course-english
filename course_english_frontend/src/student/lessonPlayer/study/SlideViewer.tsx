import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CloseIcon from "@mui/icons-material/Close";
import SlideshowIcon from "@mui/icons-material/Slideshow";
import { Box, IconButton, LinearProgress, Tooltip, Typography } from "@mui/material";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { LessonAssetRecord, LessonBlockRecord } from "../../../shared/api/lesson";
import { useSlideDeckSlides, type ResolvedSlide } from "./useSlideDeckSlides";

type SlideViewerProps = {
  block: LessonBlockRecord;
  assets: LessonAssetRecord[];
};

type SlideStageProps = {
  current: ResolvedSlide | undefined;
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  presentation?: boolean;
};

function SlideStage({ current, index, total, onPrev, onNext, presentation = false }: SlideStageProps) {
  const handleStageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width * 0.35) onPrev();
    else if (x > rect.width * 0.65) onNext();
  };

  return (
    <Box
      onClick={handleStageClick}
      sx={{
        position: "relative",
        flex: 1,
        minHeight: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: presentation ? "#000" : "#0f1115",
        borderRadius: presentation ? 0 : "12px",
        overflow: "hidden",
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      {current ? (
        <Box
          component="img"
          key={current.url}
          src={current.url}
          alt={current.caption || `Slide ${index + 1}`}
          draggable={false}
          sx={{
            maxWidth: "100%",
            maxHeight: "100%",
            width: presentation ? "100vw" : "100%",
            height: presentation ? "100vh" : "auto",
            objectFit: "contain",
            display: "block",
          }}
        />
      ) : null}

      <IconButton
        onClick={(e) => {
          e.stopPropagation();
          onPrev();
        }}
        disabled={index === 0}
        aria-label="Slide trước"
        sx={{
          position: "absolute",
          left: presentation ? 16 : 8,
          top: "50%",
          transform: "translateY(-50%)",
          color: "#fff",
          bgcolor: "rgba(0,0,0,0.45)",
          "&:hover": { bgcolor: "rgba(0,0,0,0.65)" },
          "&:disabled": { opacity: 0.25 },
        }}
      >
        <ChevronLeftIcon fontSize="large" />
      </IconButton>

      <IconButton
        onClick={(e) => {
          e.stopPropagation();
          onNext();
        }}
        disabled={index >= total - 1}
        aria-label="Slide sau"
        sx={{
          position: "absolute",
          right: presentation ? 16 : 8,
          top: "50%",
          transform: "translateY(-50%)",
          color: "#fff",
          bgcolor: "rgba(0,0,0,0.45)",
          "&:hover": { bgcolor: "rgba(0,0,0,0.65)" },
          "&:disabled": { opacity: 0.25 },
        }}
      >
        <ChevronRightIcon fontSize="large" />
      </IconButton>
    </Box>
  );
}

export function SlideViewer({ block, assets }: SlideViewerProps) {
  const { payload, slides } = useSlideDeckSlides(block, assets);
  const [index, setIndex] = useState(0);
  const [presenting, setPresenting] = useState(false);
  const presentationRef = useRef<HTMLDivElement>(null);

  const total = slides.length;
  const current = slides[index];
  const progress = total > 0 ? ((index + 1) / total) * 100 : 0;

  const goPrev = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  const goNext = useCallback(() => {
    setIndex((i) => Math.min(total - 1, i + 1));
  }, [total]);

  const exitPresentation = useCallback(async () => {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        /* ignore */
      }
    }
    setPresenting(false);
  }, []);

  const enterPresentation = useCallback(async () => {
    setPresenting(true);
    requestAnimationFrame(() => {
      void presentationRef.current?.requestFullscreen?.().catch(() => {
        /* fallback: portal overlay still works without native fullscreen */
      });
    });
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setPresenting(false);
      }
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  useEffect(() => {
    if (!presenting) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        goNext();
      }
      if (e.key === "Escape") void exitPresentation();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [presenting, goNext, goPrev, exitPresentation]);

  if (total === 0) {
    return (
      <Typography sx={{ fontSize: 14, color: "#888780", fontStyle: "italic" }}>
        Chưa có slide — giáo viên cần import ZIP PDF.
      </Typography>
    );
  }

  const presentationLayer = presenting
    ? createPortal(
        <Box
          ref={presentationRef}
          sx={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            bgcolor: "#000",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <SlideStage
            current={current}
            index={index}
            total={total}
            onPrev={goPrev}
            onNext={goNext}
            presentation
          />

          <Box
            sx={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              gap: 2,
              px: 2,
              py: 1.5,
              background: "linear-gradient(transparent, rgba(0,0,0,0.85))",
              color: "#f5f5f2",
            }}
          >
            <Typography sx={{ flex: 1, fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {payload.title || "Slide"}
            </Typography>
            <Typography sx={{ fontSize: 13, color: "#c5c9d2", flexShrink: 0 }}>
              {index + 1} / {total}
            </Typography>
            <Tooltip title="Thoát (Esc)">
              <IconButton onClick={() => void exitPresentation()} aria-label="Thoát trình chiếu" sx={{ color: "#fff" }}>
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>,
        document.body,
      )
    : null;

  return (
    <>
      {presentationLayer}

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
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 2,
            py: 1.25,
            borderBottom: "1px solid #eceae3",
            bgcolor: "#fff",
          }}
        >
          <Typography sx={{ flex: 1, fontSize: 15, fontWeight: 600, color: "#2c2b28" }}>
            {payload.title || "Slide"}
          </Typography>
          <Typography sx={{ fontSize: 13, color: "#888780" }}>
            {index + 1} / {total}
          </Typography>
          <Tooltip title="Trình chiếu toàn màn hình">
            <IconButton size="small" onClick={() => void enterPresentation()} aria-label="Trình chiếu">
              <SlideshowIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            minHeight: { xs: "52vh", md: "min(68vh, 720px)" },
            p: { xs: 1, sm: 1.5 },
          }}
        >
          <SlideStage current={current} index={index} total={total} onPrev={goPrev} onNext={goNext} />
        </Box>

        <Box sx={{ px: 2, pb: 1.5 }}>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 4,
              borderRadius: 2,
              bgcolor: "#eceae3",
              "& .MuiLinearProgress-bar": { bgcolor: "#6ea8ff", borderRadius: 2 },
            }}
          />
          {current?.caption ? (
            <Typography sx={{ mt: 1, textAlign: "center", fontSize: 12, color: "#888780" }}>
              {current.caption}
            </Typography>
          ) : null}
          <Typography sx={{ mt: 0.75, textAlign: "center", fontSize: 11, color: "#b0aea6" }}>
            Bấm trái/phải ảnh hoặc mũi tên để chuyển slide · nút{" "}
            <SlideshowIcon sx={{ fontSize: 12, verticalAlign: "text-bottom" }} /> để trình chiếu
          </Typography>
        </Box>
      </Box>
    </>
  );
}

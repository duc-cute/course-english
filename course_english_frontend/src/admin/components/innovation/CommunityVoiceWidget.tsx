import AddIcon from "@mui/icons-material/Add";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import ThumbUpAltOutlinedIcon from "@mui/icons-material/ThumbUpAltOutlined";
import {
  Box,
  Button,
  IconButton,
  Skeleton,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  apiGetInnovationHubStats,
  apiSearchInnovationIdeas,
  type InnovationHubStats,
  type InnovationIdeaRecord,
} from "../../../shared/api/innovationHub";
import { paths } from "../../../shared/constants/paths";
import "../../../styles/admin-innovation-hub.css";
import {
  innovationCategoryLabel,
  innovationStatusLabel,
} from "./innovationHubLabels";

type CommunityVoiceWidgetProps = {
  onAddFeedback: () => void;
  refreshKey?: number;
};

const CAROUSEL_MS = 6000;

export function CommunityVoiceWidget({ onAddFeedback, refreshKey = 0 }: CommunityVoiceWidgetProps) {
  const navigate = useNavigate();
  const [carouselIdeas, setCarouselIdeas] = useState<InnovationIdeaRecord[]>([]);
  const [topIdeas, setTopIdeas] = useState<InnovationIdeaRecord[]>([]);
  const [stats, setStats] = useState<InnovationHubStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [slideIndex, setSlideIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ideasRes, statsRes] = await Promise.all([
        apiSearchInnovationIdeas({ page: 0, size: 8, sortMode: "FEATURED" }),
        apiGetInnovationHubStats(),
      ]);
      const ideas = ideasRes.data?.result ?? [];
      setCarouselIdeas(ideas.slice(0, 5));
      setTopIdeas(ideas.slice(0, 3));
      setStats(statsRes.data ?? null);
      setSlideIndex(0);
    } catch {
      setCarouselIdeas([]);
      setTopIdeas([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  useEffect(() => {
    if (paused || carouselIdeas.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % carouselIdeas.length);
    }, CAROUSEL_MS);
    return () => window.clearInterval(timer);
  }, [carouselIdeas.length, paused]);

  const activeIdea = carouselIdeas[slideIndex] ?? null;
  const maxVotes = useMemo(
    () => Math.max(1, ...topIdeas.map((i) => i.voteCount)),
    [topIdeas],
  );

  const goHub = () => navigate(`/${paths.ADMIN}/${paths.INNOVATION_HUB}`);

  const prevSlide = () => {
    if (!carouselIdeas.length) return;
    setSlideIndex((i) => (i - 1 + carouselIdeas.length) % carouselIdeas.length);
  };

  const nextSlide = () => {
    if (!carouselIdeas.length) return;
    setSlideIndex((i) => (i + 1) % carouselIdeas.length);
  };

  return (
    <Box
      className="admin-community-voice"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <Box className="admin-community-voice__header">
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <LightbulbOutlinedIcon sx={{ color: "#5c60f5" }} />
          <Typography fontWeight={800} fontSize="1.1rem" sx={{ color: "#0f172a" }}>
            Community Voice
          </Typography>
        </Box>
        <Button
          size="small"
          onClick={goHub}
          sx={{
            textTransform: "none",
            fontWeight: 700,
            color: "#5c60f5",
            minWidth: 0,
            p: 0,
            "&:hover": { bgcolor: "transparent", textDecoration: "underline" },
          }}
        >
          Xem tất cả
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontSize: "0.875rem" }}>
        {loading ? (
          <Skeleton width="70%" />
        ) : (
          `Hệ thống đã nhận ${stats?.analyzedCount ?? 0} góp ý mới trong tuần này`
        )}
      </Typography>

      <Box className="admin-community-voice__carousel">
        {loading ? (
          <Skeleton variant="rounded" height={160} />
        ) : activeIdea ? (
          <>
            <IconButton
              size="small"
              className="admin-community-voice__nav admin-community-voice__nav--prev"
              onClick={prevSlide}
              aria-label="Trước"
            >
              <ChevronLeftIcon fontSize="small" />
            </IconButton>

            <Box
              className="admin-community-voice__slide"
              role="button"
              tabIndex={0}
              onClick={() =>
                navigate(`/${paths.ADMIN}/${paths.INNOVATION_HUB}/${activeIdea.id}`)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  navigate(`/${paths.ADMIN}/${paths.INNOVATION_HUB}/${activeIdea.id}`);
                }
              }}
            >
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                <Box>
                  <span className="admin-community-voice__badge">🔥 Được quan tâm</span>
                </Box>
                <Typography fontWeight={800} fontSize="1.1rem" sx={{ color: "#0f172a", mt: 0.5, lineHeight: 1.3 }}>
                  {activeIdea.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" className="admin-community-voice__desc" sx={{ m: 0 }}>
                  {activeIdea.description}
                </Typography>
              </Box>
              <Box className="admin-community-voice__slide-meta">
                <span>
                  <ThumbUpAltOutlinedIcon sx={{ fontSize: 14, mr: 0.3, verticalAlign: "text-bottom" }} />
                  {activeIdea.voteCount}
                </span>
                <span>
                  <ChatBubbleOutlineIcon sx={{ fontSize: 14, mr: 0.3, verticalAlign: "text-bottom" }} />
                  {activeIdea.commentCount}
                </span>
                <span className={`innovation-status innovation-status--${activeIdea.status}`}>
                  {innovationStatusLabel(activeIdea.status)}
                </span>
              </Box>
            </Box>

            <IconButton
              size="small"
              className="admin-community-voice__nav admin-community-voice__nav--next"
              onClick={nextSlide}
              aria-label="Sau"
            >
              <ChevronRightIcon fontSize="small" />
            </IconButton>
          </>
        ) : (
          <Box className="admin-community-voice__empty">
            Chưa có góp ý nào. Hãy là người đầu tiên!
          </Box>
        )}
      </Box>

      {carouselIdeas.length > 1 ? (
        <Box className="admin-community-voice__dots">
          {carouselIdeas.map((idea, idx) => (
            <button
              key={idea.id}
              type="button"
              className={`admin-community-voice__dot${idx === slideIndex ? " is-active" : ""}`}
              onClick={() => setSlideIndex(idx)}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </Box>
      ) : null}

      <Box className="admin-community-voice__top">
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
          <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#0f172a" }}>
            Ý tưởng được quan tâm nhất
          </Typography>
          <Button
            size="small"
            onClick={goHub}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              color: "#5c60f5",
              minWidth: 0,
              p: 0,
              "&:hover": { bgcolor: "transparent", textDecoration: "underline" },
            }}
          >
            Xem tất cả
          </Button>
        </Box>

        {loading ? (
          <Skeleton height={90} />
        ) : topIdeas.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Chưa có dữ liệu xếp hạng.
          </Typography>
        ) : (
          topIdeas.map((idea) => (
            <Box
              key={idea.id}
              className="admin-community-voice__top-row"
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/${paths.ADMIN}/${paths.INNOVATION_HUB}/${idea.id}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  navigate(`/${paths.ADMIN}/${paths.INNOVATION_HUB}/${idea.id}`);
                }
              }}
            >
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography fontWeight={700} fontSize="0.85rem" noWrap sx={{ color: "#0f172a" }}>
                  {idea.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {idea.voteCount} votes · {innovationCategoryLabel(idea.category)}
                </Typography>
              </Box>
              <Box className="admin-community-voice__top-bar">
                <span style={{ width: `${Math.round((idea.voteCount / maxVotes) * 100)}%` }} />
              </Box>
            </Box>
          ))
        )}
      </Box>

      <Button
        fullWidth
        variant="contained"
        startIcon={<AddIcon />}
        onClick={onAddFeedback}
        sx={{
          mt: 2,
          textTransform: "none",
          fontWeight: 700,
          borderRadius: "12px",
          py: 1.2,
          bgcolor: "#5c60f5",
          boxShadow: "0 4px 14px rgba(92, 96, 245, 0.25)",
          "&:hover": {
            bgcolor: "#4e51f4",
            boxShadow: "0 6px 20px rgba(92, 96, 245, 0.35)",
          },
        }}
      >
        Gửi góp ý mới
      </Button>
    </Box>
  );
}

import AddIcon from "@mui/icons-material/Add";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import MicNoneOutlinedIcon from "@mui/icons-material/MicNoneOutlined";
import PhoneIphoneOutlinedIcon from "@mui/icons-material/PhoneIphoneOutlined";
import SearchIcon from "@mui/icons-material/Search";
import TableChartOutlinedIcon from "@mui/icons-material/TableChartOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Skeleton,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { InnovationSubmitDrawer } from "../../admin/components/innovation/InnovationSubmitDrawer";
import {
  formatInnovationRelativeTime,
  innovationCategoryLabel,
  INNOVATION_FILTER_CATEGORY_OPTIONS,
  INNOVATION_PRIORITY_LABEL_VI,
  innovationStatusLabel,
} from "../../admin/components/innovation/innovationHubLabels";
import {
  apiGetInnovationHubStats,
  apiSearchInnovationIdeas,
  apiToggleInnovationIdeaVote,
  type InnovationHubStats,
  type InnovationIdeaCategory,
  type InnovationIdeaPriority,
  type InnovationIdeaRecord,
  type InnovationIdeaSortMode,
} from "../../shared/api/innovationHub";
import { paths } from "../../shared/constants/paths";
import "../../styles/admin-innovation-hub.css";

const SORT_OPTIONS: Array<{ value: InnovationIdeaSortMode; label: string }> = [
  { value: "FEATURED", label: "Sắp xếp: Nổi bật" },
  { value: "NEWEST", label: "Sắp xếp: Mới nhất" },
  { value: "TRENDING", label: "Sắp xếp: Trending" },
];

function ideaIcon(category?: string): ReactNode {
  if (category === "UI") return <DarkModeOutlinedIcon fontSize="small" />;
  if (category === "AI") return <MicNoneOutlinedIcon fontSize="small" />;
  if (category === "FEATURE") return <TableChartOutlinedIcon fontSize="small" />;
  if (category === "PERFORMANCE") return <PhoneIphoneOutlinedIcon fontSize="small" />;
  return <LightbulbOutlinedIcon fontSize="small" />;
}

function sidebarCategoryIcon(category: string): ReactNode {
  return ideaIcon(category);
}

function priorityLabel(priority?: InnovationIdeaPriority | string) {
  if (!priority) return "—";
  return INNOVATION_PRIORITY_LABEL_VI[priority as InnovationIdeaPriority] || priority;
}

export function InnovationHubPage() {
  const navigate = useNavigate();
  const [ideas, setIdeas] = useState<InnovationIdeaRecord[]>([]);
  const [stats, setStats] = useState<InnovationHubStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState("");
  const [votingId, setVotingId] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState<InnovationIdeaCategory | "">("");
  const [sortMode, setSortMode] = useState<InnovationIdeaSortMode>("FEATURED");

  const [drawerOpen, setDrawerOpen] = useState(false);

  const loadIdeas = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiSearchInnovationIdeas({
        page: 0,
        size: 24,
        keyword,
        category,
        sortMode,
      });
      setIdeas(res.data?.result ?? []);
    } catch (err) {
      setError((err as { message?: string })?.message || "Không tải được danh sách ý tưởng.");
      setIdeas([]);
    } finally {
      setLoading(false);
    }
  }, [keyword, category, sortMode]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await apiGetInnovationHubStats();
      setStats(res.data ?? null);
    } catch {
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const reloadAll = useCallback(() => {
    void loadIdeas();
    void loadStats();
  }, [loadIdeas, loadStats]);

  useEffect(() => {
    void loadIdeas();
  }, [loadIdeas]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const topShares = useMemo(
    () =>
      (stats?.categoryShares ?? [])
        .filter((s) => s.count > 0)
        .sort((a, b) => b.percent - a.percent)
        .slice(0, 5),
    [stats],
  );

  const handleSearchSubmit = () => {
    setKeyword(searchInput.trim());
  };

  const handleToggleVote = async (idea: InnovationIdeaRecord) => {
    setVotingId(idea.id);
    try {
      const res = await apiToggleInnovationIdeaVote(idea.id);
      const voted = Boolean(res.data?.voted);
      const voteCount = res.data?.voteCount ?? idea.voteCount;
      setIdeas((prev) =>
        prev.map((item) =>
          item.id === idea.id ? { ...item, viewerHasVoted: voted, voteCount } : item,
        ),
      );
      void loadStats();
    } catch (err) {
      setError((err as { message?: string })?.message || "Không vote được.");
    } finally {
      setVotingId(null);
    }
  };

  const openDetail = (id: string) => {
    navigate(`/${paths.ADMIN}/${paths.INNOVATION_HUB}/${id}`);
  };

  const scrollToIdeas = () => {
    document.querySelector(".innovation-hub__grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <Box className="innovation-hub" sx={{ p: { xs: 2, md: 3 } }}>
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      ) : null}

      <Box className="innovation-hub__layout">
        <Box className="innovation-hub__main">
          <Box className="innovation-hub__header">
            <Box>
              <h1 className="innovation-hub__title">
                Innovation Hub
                <span className="innovation-hub__title-sparkle">✨</span>
              </h1>
              <p className="innovation-hub__subtitle">
                Xây dựng Course English tốt hơn mỗi ngày cùng cộng đồng.
              </p>
            </Box>
          </Box>

          <Box className="innovation-hub__banner">
            <Box className="innovation-hub__banner-left">
              <img src="/images/trophy.png" alt="Trophy" className="innovation-hub__banner-icon" />
              <Box className="innovation-hub__banner-left-content">
                <h3 className="innovation-hub__banner-title">❤️ Cảm ơn cộng đồng!</h3>
                <p className="innovation-hub__banner-desc">
                  {stats?.featuredCompleted ? (
                    <>
                      Tính năng <strong>"{stats.featuredCompleted.title}"</strong> đã được đưa vào sản phẩm nhờ{" "}
                      <strong>{stats.featuredCompleted.voteCount}</strong> lượt bình chọn từ cộng đồng.
                    </>
                  ) : (
                    "Vote và góp ý để giúp đội ngũ ưu tiên tính năng tiếp theo."
                  )}
                </p>
              </Box>
            </Box>
            <Box className="innovation-hub__banner-mid">
              <div className="innovation-hub__banner-label">Đề xuất bởi</div>
              <Box className="innovation-hub__banner-user">
                <Avatar sx={{ width: 32, height: 32, bgcolor: "#6366f1", fontSize: 13 }}>
                  {(stats?.featuredCompleted?.createdByDisplayName || "C").slice(0, 1).toUpperCase()}
                </Avatar>
                <Box>
                  <div className="innovation-hub__banner-username">
                    {stats?.featuredCompleted?.createdByDisplayName || "Cộng đồng"}
                  </div>
                </Box>
              </Box>
            </Box>
            <Box className="innovation-hub__banner-right">
              <div className="innovation-hub__banner-right-text">
                <span>{statsLoading ? "…" : (stats?.mineCompletedCount ?? 0)}</span> ý tưởng của bạn đã được đưa vào sản phẩm
              </div>
              <img src="/images/giftbox.png" alt="Giftbox" className="innovation-hub__banner-icon" />
            </Box>
          </Box>

          <Box className="innovation-hub__filters">
            <Box className="innovation-hub__filters-left">
              <TextField
                select
                size="small"
                value={category}
                onChange={(e) => setCategory(e.target.value as InnovationIdeaCategory | "")}
                sx={{ minWidth: 180 }}
                SelectProps={{
                  displayEmpty: true,
                  renderValue: (selected) => {
                    const value = selected as InnovationIdeaCategory | "";
                    if (!value) return "Tất cả danh mục";
                    return innovationCategoryLabel(value);
                  },
                }}
              >
                {INNOVATION_FILTER_CATEGORY_OPTIONS.map((opt) => (
                  <MenuItem key={opt.label} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                size="small"
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as InnovationIdeaSortMode)}
                sx={{ minWidth: 180 }}
              >
                {SORT_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                size="small"
                className="innovation-hub__search-field"
                placeholder="Tìm kiếm ý tưởng..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearchSubmit();
                }}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: "text.secondary" }} fontSize="small" />,
                }}
              />
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setDrawerOpen(true)}
              sx={{
                bgcolor: "#3b82f6",
                textTransform: "none",
                fontWeight: 700,
                borderRadius: "10px",
                px: 2.5,
                height: "40px",
                flexShrink: 0,
                "&:hover": { bgcolor: "#2563eb" },
                boxShadow: "none",
              }}
            >
              Gửi ý tưởng mới
            </Button>
          </Box>

          <Box className="innovation-hub__grid">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <Box key={i} className="innovation-idea-card">
                    <Skeleton variant="rounded" height={28} width="40%" />
                    <Skeleton variant="text" />
                    <Skeleton variant="text" />
                    <Skeleton variant="rounded" height={36} />
                  </Box>
                ))
              : null}

            {!loading && ideas.length === 0 ? (
              <Box className="innovation-hub__empty">
                Chưa có ý tưởng nào. Hãy là người đầu tiên gửi ý tưởng!
              </Box>
            ) : null}

            {!loading
              ? ideas.map((idea) => (
                  <Box key={idea.id} className="innovation-idea-card">
                    <Box className="innovation-idea-card__top">
                      <Box
                        className={`innovation-idea-card__icon innovation-idea-card__icon--${idea.category || "DEFAULT"}`}
                      >
                        {ideaIcon(idea.category)}
                      </Box>
                      <span className={`innovation-status innovation-status--${idea.status}`}>
                        {innovationStatusLabel(idea.status)}
                      </span>
                    </Box>

                    <h3
                      className="innovation-idea-card__title"
                      style={{ cursor: "pointer" }}
                      onClick={() => openDetail(idea.id)}
                    >
                      {idea.title}
                    </h3>

                    <p className="innovation-idea-card__desc">{idea.description}</p>

                    <Box className="innovation-idea-card__tags">
                      <span className="innovation-tag innovation-tag--category">
                        {innovationCategoryLabel(idea.category)}
                      </span>
                      <span className="innovation-tag innovation-tag--priority">
                        {priorityLabel(idea.priority)}
                      </span>
                    </Box>

                    <Box className="innovation-idea-card__stats-box">
                      <Box className="innovation-idea-card__stat-col">
                        <span className="innovation-idea-card__stat-val">{idea.voteCount}</span>
                        <span className="innovation-idea-card__stat-label">Votes</span>
                      </Box>
                      <Box className="innovation-idea-card__stat-col">
                        <span className="innovation-idea-card__stat-val innovation-idea-card__stat-val--comment">
                          <ChatBubbleOutlineIcon fontSize="small" style={{ color: "#64748b" }} />{" "}
                          {idea.commentCount}
                        </span>
                        <span className="innovation-idea-card__stat-label">Bình luận</span>
                      </Box>
                    </Box>

                    <Box className="innovation-idea-card__author-row">
                      <Avatar
                        className="innovation-idea-card__author-avatar"
                        sx={{ width: 24, height: 24 }}
                      >
                        {(idea.createdByDisplayName || "U").slice(0, 1).toUpperCase()}
                      </Avatar>
                      <span>
                        Đề xuất bởi <strong>{idea.createdByDisplayName || "User"}</strong>
                        {idea.createdAt ? ` • ${formatInnovationRelativeTime(idea.createdAt)}` : ""}
                      </span>
                    </Box>

                    <Box className="innovation-idea-card__actions-row">
                      {idea.status === "COMPLETED" ? (
                        <button
                          type="button"
                          className="innovation-idea-card__action-btn innovation-idea-card__action-btn--completed"
                        >
                          ✔️ Đã triển khai
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={`innovation-idea-card__action-btn ${
                            idea.viewerHasVoted ? "innovation-idea-card__action-btn--voted" : ""
                          }`}
                          disabled={votingId === idea.id}
                          onClick={() => void handleToggleVote(idea)}
                        >
                          {votingId === idea.id ? (
                            <CircularProgress size={14} color="inherit" />
                          ) : idea.viewerHasVoted ? (
                            <>👍 Đã vote</>
                          ) : (
                            <>👍 Vote</>
                          )}
                        </button>
                      )}

                      <div className="innovation-idea-card__action-divider" />

                      <button
                        type="button"
                        className="innovation-idea-card__action-btn"
                        onClick={() => openDetail(idea.id)}
                      >
                        💬 Bình luận
                      </button>

                      <div className="innovation-idea-card__action-divider" />

                      <button
                        type="button"
                        className="innovation-idea-card__action-btn"
                        onClick={() => openDetail(idea.id)}
                        style={{ fontWeight: 800 }}
                      >
                        👁️ Xem chi tiết
                      </button>
                    </Box>
                  </Box>
                ))
              : null}
          </Box>
        </Box>

        <aside className="innovation-hub__aside">
          <Box className="innovation-hub__aside-card">
            <h3 className="innovation-hub__aside-title">
              <span className="innovation-hub__aside-title-text">🤖 Emma AI Summary</span>
              <InfoOutlinedIcon className="innovation-hub__aside-info-icon" fontSize="small" />
            </h3>

            <p className="innovation-hub__aside-subtitle">
              Tuần này đã phân tích{" "}
              <strong>{statsLoading ? "…" : (stats?.analyzedCount ?? 0)}</strong> góp ý từ cộng đồng.
            </p>

            {statsLoading ? (
              <Skeleton height={120} />
            ) : topShares.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Chưa đủ dữ liệu thống kê.
              </Typography>
            ) : (
              topShares.map((share) => (
                <div key={share.category} className="innovation-hub__ai-row">
                  <div className="innovation-hub__ai-icon-wrap">{sidebarCategoryIcon(share.category)}</div>
                  <div className="innovation-hub__ai-details">
                    <span className="innovation-hub__ai-cat-name">
                      {innovationCategoryLabel(share.category)}
                    </span>
                    <span className="innovation-hub__ai-cat-mentions">{share.count} lượt đề cập</span>
                  </div>
                  <div className="innovation-hub__ai-progress-wrap">
                    <div className="innovation-hub__ai-bar">
                      <div
                        className="innovation-hub__ai-bar-fill"
                        style={{ width: `${Math.min(100, share.percent)}%` }}
                      />
                    </div>
                    <span className="innovation-hub__ai-percentage">{share.percent}%</span>
                  </div>
                </div>
              ))
            )}

            <button type="button" className="innovation-hub__aside-btn" style={{ marginTop: "8px" }} onClick={scrollToIdeas}>
              Xem tất cả ý tưởng
            </button>
          </Box>

          <Box className="innovation-hub__aside-card">
            <h3 className="innovation-hub__aside-title">
              <span className="innovation-hub__aside-title-text">🏆 Top Contributor tuần này</span>
            </h3>

            {statsLoading ? (
              <Skeleton height={100} />
            ) : (stats?.topContributors?.length ?? 0) === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Chưa có xếp hạng tuần này.
              </Typography>
            ) : (
              stats?.topContributors?.map((c, idx) => (
                <div key={c.userId} className="innovation-hub__contributor">
                  <span className={`innovation-hub__rank-badge innovation-hub__rank-badge--${idx + 1}`}>
                    {idx + 1}
                  </span>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: "#6366f1", fontSize: 13 }}>
                    {(c.displayName || "?").slice(0, 1).toUpperCase()}
                  </Avatar>
                  <div className="innovation-hub__contributor-info">
                    <span className="innovation-hub__contributor-name">{c.displayName || "User"}</span>
                    <span className="innovation-hub__contributor-points">
                      <strong>{c.points}</strong> điểm
                    </span>
                  </div>
                  <span className="innovation-hub__contributor-medal">
                    {idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}
                  </span>
                </div>
              ))
            )}
          </Box>

          <Box className="innovation-hub__cta-card">
            <div className="innovation-hub__cta-content">
              <h3 className="innovation-hub__cta-title">Ý kiến của bạn rất quan trọng!</h3>
              <p className="innovation-hub__cta-desc">
                Cùng nhau làm cho Course English ngày càng hoàn thiện hơn.
              </p>
              <button
                type="button"
                className="innovation-hub__cta-btn"
                onClick={() => setDrawerOpen(true)}
              >
                Gửi góp ý mới →
              </button>
            </div>
            <img
              src="/images/ai-robot-helper-mascot.png"
              alt="AI Robot Mascot"
              className="innovation-hub__cta-mascot"
            />
          </Box>
        </aside>
      </Box>

      <InnovationSubmitDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSuccess={reloadAll}
      />
    </Box>
  );
}

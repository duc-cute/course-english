import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import CheckOutlinedIcon from "@mui/icons-material/CheckOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import MicNoneOutlinedIcon from "@mui/icons-material/MicNoneOutlined";
import PhoneIphoneOutlinedIcon from "@mui/icons-material/PhoneIphoneOutlined";
import TableChartOutlinedIcon from "@mui/icons-material/TableChartOutlined";
import ThumbUpAltIcon from "@mui/icons-material/ThumbUpAlt";
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  MenuItem,
  Skeleton,
  Stack,
  TextField,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  INNOVATION_PRIORITY_LABEL_VI,
  INNOVATION_STATUS_LABEL_VI,
  innovationCategoryLabel,
  innovationStatusLabel,
} from "../../admin/components/innovation/innovationHubLabels";
import { resolveStorageAssetUrl } from "../../shared/api/file";
import {
  apiCreateInnovationIdeaComment,
  apiGetInnovationIdea,
  apiListInnovationIdeaComments,
  apiToggleInnovationIdeaVote,
  apiUpdateInnovationIdeaStatus,
  type InnovationCommentRecord,
  type InnovationIdeaPriority,
  type InnovationIdeaRecord,
  type InnovationIdeaStatus,
} from "../../shared/api/innovationHub";
import { paths } from "../../shared/constants/paths";
import "../../styles/admin-innovation-hub.css";

const STATUS_OPTIONS = Object.keys(INNOVATION_STATUS_LABEL_VI) as InnovationIdeaStatus[];

const TIMELINE_STEPS: Array<{ key: InnovationIdeaStatus; label: string }> = [
  { key: "UNDER_REVIEW", label: "Đang xem xét" },
  { key: "PLANNED", label: "Lên kế hoạch" },
  { key: "IN_PROGRESS", label: "Đang phát triển" },
  { key: "TESTING", label: "Đang kiểm thử" },
  { key: "COMPLETED", label: "Đã hoàn thành" },
];

function ideaIcon(category?: string): ReactNode {
  if (category === "UI") return <DarkModeOutlinedIcon />;
  if (category === "AI") return <MicNoneOutlinedIcon />;
  if (category === "FEATURE") return <TableChartOutlinedIcon />;
  if (category === "PERFORMANCE") return <PhoneIphoneOutlinedIcon />;
  return <LightbulbOutlinedIcon />;
}

function formatDateTime(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN");
}

/** Comment timestamp style: 23:33:01 16/7/2026 */
function formatCommentTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const time = date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const day = date.toLocaleDateString("vi-VN");
  return `${time} ${day}`;
}

function formatDateOnly(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("vi-VN");
}

function priorityUi(priority?: InnovationIdeaPriority | string) {
  if (priority === "HIGH") return { label: INNOVATION_PRIORITY_LABEL_VI.HIGH, color: "#dc2626", dot: "🔴" };
  if (priority === "LOW") return { label: INNOVATION_PRIORITY_LABEL_VI.LOW, color: "#16a34a", dot: "🟢" };
  return { label: INNOVATION_PRIORITY_LABEL_VI.MEDIUM, color: "#d97706", dot: "🟡" };
}

function buildTimeline(currentStatus: InnovationIdeaStatus, createdAt?: string, updatedAt?: string) {
  const activeIdx = TIMELINE_STEPS.findIndex((s) => s.key === currentStatus);
  return TIMELINE_STEPS.map((step, idx) => {
    let state: "completed" | "active" | "pending" = "pending";
    if (activeIdx < 0) {
      state = idx === 0 ? "active" : "pending";
    } else if (idx < activeIdx) {
      state = "completed";
    } else if (idx === activeIdx) {
      state = "active";
    }

    let date = "Chưa bắt đầu";
    if (state === "completed" || state === "active") {
      if (idx === 0) date = formatDateOnly(createdAt);
      else if (state === "active") date = formatDateOnly(updatedAt || createdAt);
      else date = "Đã qua";
    }

    return { ...step, state, date };
  });
}

export function InnovationIdeaDetailPage() {
  const { ideaId } = useParams<{ ideaId: string }>();
  const navigate = useNavigate();
  const commentsRef = useRef<HTMLDivElement | null>(null);

  const [idea, setIdea] = useState<InnovationIdeaRecord | null>(null);
  const [comments, setComments] = useState<InnovationCommentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [voting, setVoting] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [commentBody, setCommentBody] = useState("");
  const [commenting, setCommenting] = useState(false);
  const [statusValue, setStatusValue] = useState<InnovationIdeaStatus>("UNDER_REVIEW");
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!ideaId) return;
    setLoading(true);
    setError("");
    try {
      const [ideaRes, commentRes] = await Promise.all([
        apiGetInnovationIdea(ideaId),
        apiListInnovationIdeaComments(ideaId),
      ]);
      const data = ideaRes.data ?? null;
      setIdea(data);
      if (data?.status) setStatusValue(data.status);
      setComments(commentRes.data ?? []);
    } catch (err) {
      setError((err as { message?: string })?.message || "Không tải được ý tưởng.");
      setIdea(null);
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [ideaId]);

  useEffect(() => {
    void load();
  }, [load]);

  const timeline = useMemo(
    () => (idea ? buildTimeline(idea.status, idea.createdAt, idea.updatedAt) : []),
    [idea],
  );

  const handleVote = async () => {
    if (!idea) return;
    setVoting(true);
    try {
      const res = await apiToggleInnovationIdeaVote(idea.id);
      setIdea((prev) =>
        prev
          ? {
              ...prev,
              viewerHasVoted: Boolean(res.data?.voted),
              voteCount: res.data?.voteCount ?? prev.voteCount,
            }
          : prev,
      );
    } catch (err) {
      setError((err as { message?: string })?.message || "Không vote được.");
    } finally {
      setVoting(false);
    }
  };

  const handleStatusSave = async () => {
    if (!idea) return;
    setSavingStatus(true);
    try {
      const res = await apiUpdateInnovationIdeaStatus(idea.id, statusValue);
      if (res.data) setIdea(res.data);
    } catch (err) {
      setError((err as { message?: string })?.message || "Không cập nhật trạng thái được.");
    } finally {
      setSavingStatus(false);
    }
  };

  const handleComment = async () => {
    if (!idea || !commentBody.trim()) return;
    setCommenting(true);
    try {
      const res = await apiCreateInnovationIdeaComment(idea.id, commentBody.trim());
      if (res.data) {
        setComments((prev) => [...prev, res.data as InnovationCommentRecord]);
        setIdea((prev) =>
          prev ? { ...prev, commentCount: (prev.commentCount ?? 0) + 1 } : prev,
        );
      }
      setCommentBody("");
    } catch (err) {
      setError((err as { message?: string })?.message || "Không gửi bình luận được.");
    } finally {
      setCommenting(false);
    }
  };

  const scrollToComments = () => {
    commentsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <Box className="innovation-detail">
      <button
        type="button"
        className="innovation-detail__back"
        onClick={() => navigate(`/${paths.ADMIN}/${paths.INNOVATION_HUB}`)}
      >
        <ArrowBackIcon fontSize="small" /> Quay lại Innovation Hub
      </button>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      ) : null}

      {loading ? (
        <Box className="innovation-detail__panel-card">
          <Skeleton height={40} width="60%" />
          <Skeleton height={120} />
        </Box>
      ) : null}

      {!loading && !idea ? <Alert severity="warning">Không tìm thấy ý tưởng.</Alert> : null}

      {!loading && idea ? (
        <Box className="innovation-detail__layout">
          <Box className="innovation-detail__main">
            <Box className="innovation-detail__header-card">
              <Box className="innovation-detail__header-left">
                <Box className="innovation-detail__header-top-row">
                  <Box
                    className={`innovation-detail__header-icon-wrap innovation-idea-card__icon--${idea.category || "DEFAULT"}`}
                  >
                    {ideaIcon(idea.category)}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box className="innovation-detail__header-title-row">
                      <h1 className="innovation-detail__header-title">{idea.title}</h1>
                      <span className={`innovation-status innovation-status--${idea.status}`}>
                        {innovationStatusLabel(idea.status)}
                      </span>
                    </Box>
                    <p className="innovation-detail__header-desc">{idea.description}</p>
                  </Box>
                </Box>

                <Box className="innovation-detail__header-meta-row">
                  <Box className="innovation-detail__meta-block">
                    <Avatar sx={{ width: 28, height: 28, bgcolor: "#6366f1", fontSize: 12 }}>
                      {(idea.createdByDisplayName || "U").slice(0, 1).toUpperCase()}
                    </Avatar>
                    <Box>
                      <div className="innovation-detail__meta-label">Đề xuất bởi</div>
                      <div className="innovation-detail__meta-val">
                        {idea.createdByDisplayName || "User"}
                      </div>
                    </Box>
                  </Box>
                  <Box className="innovation-detail__meta-block">
                    <span className="innovation-detail__meta-icon">
                      <CalendarTodayOutlinedIcon sx={{ fontSize: 20 }} />
                    </span>
                    <Box>
                      <div className="innovation-detail__meta-label">Ngày đề xuất</div>
                      <div className="innovation-detail__meta-val">{formatDateOnly(idea.createdAt)}</div>
                    </Box>
                  </Box>
                  <Box className="innovation-detail__meta-block">
                    <span className="innovation-detail__meta-icon">
                      <FolderOutlinedIcon sx={{ fontSize: 20 }} />
                    </span>
                    <Box>
                      <div className="innovation-detail__meta-label">Danh mục</div>
                      <div className="innovation-detail__meta-val">
                        {innovationCategoryLabel(idea.category)}
                      </div>
                    </Box>
                  </Box>
                  <Box className="innovation-detail__meta-block">
                    <span className="innovation-detail__meta-icon">
                      <FlagOutlinedIcon sx={{ fontSize: 20 }} />
                    </span>
                    <Box>
                      <div className="innovation-detail__meta-label">Ưu tiên</div>
                      <div className="innovation-detail__meta-val">
                        {priorityUi(idea.priority).dot} {priorityUi(idea.priority).label}
                      </div>
                    </Box>
                  </Box>
                </Box>
              </Box>

              <Box className="innovation-detail__header-right">
                <div className="innovation-detail__header-vote-count">
                  <ThumbUpAltIcon fontSize="small" />
                  <span>{idea.voteCount}</span>
                </div>
                <div className="innovation-detail__header-vote-label">Votes</div>
                <Button
                  variant="contained"
                  disabled={voting}
                  onClick={() => void handleVote()}
                  size="small"
                  className="innovation-detail__header-vote-btn"
                  sx={{
                    bgcolor: idea.viewerHasVoted ? "#4f46e5" : "#3b82f6",
                    color: "#fff",
                    boxShadow: "none",
                    "&:hover": { bgcolor: idea.viewerHasVoted ? "#3730a3" : "#2563eb" },
                  }}
                >
                  {voting ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : idea.viewerHasVoted ? (
                    "Đã vote"
                  ) : (
                    "Vote"
                  )}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ChatBubbleOutlineIcon fontSize="small" />}
                  size="small"
                  className="innovation-detail__header-share-btn"
                  onClick={scrollToComments}
                >
                  Bình luận
                </Button>
              </Box>
            </Box>

            <Box className="innovation-detail__panel-card">
              <h3 className="innovation-detail__section-title">Mô tả chi tiết</h3>
              <p className="innovation-detail__text" style={{ whiteSpace: "pre-wrap", marginBottom: 0 }}>
                {idea.description}
              </p>
              {idea.imageUrls && idea.imageUrls.length > 0 ? (
                <Box className="innovation-detail__gallery">
                  <h4 className="innovation-detail__gallery-title">Ảnh minh họa</h4>
                  <Box className="innovation-detail__gallery-grid">
                    {idea.imageUrls.map((url) => {
                      const src = resolveStorageAssetUrl(url);
                      return (
                        <button
                          key={url}
                          type="button"
                          className="innovation-detail__gallery-item"
                          onClick={() => setPreviewImageUrl(src)}
                          aria-label="Xem ảnh lớn"
                        >
                          <img src={src} alt="" loading="lazy" />
                        </button>
                      );
                    })}
                  </Box>
                </Box>
              ) : null}
            </Box>

            <Dialog
              open={Boolean(previewImageUrl)}
              onClose={() => setPreviewImageUrl(null)}
              maxWidth="md"
              fullWidth
              PaperProps={{
                sx: {
                  bgcolor: "transparent",
                  boxShadow: "none",
                  overflow: "visible",
                },
              }}
            >
              {previewImageUrl ? (
                <Box
                  component="img"
                  src={previewImageUrl}
                  alt=""
                  sx={{
                    width: "100%",
                    maxHeight: "85vh",
                    objectFit: "contain",
                    borderRadius: "12px",
                    bgcolor: "#0f172a",
                  }}
                  onClick={() => setPreviewImageUrl(null)}
                />
              ) : null}
            </Dialog>

            <Box className="innovation-detail__panel-card innovation-detail__comments-card" ref={commentsRef}>
              <h3 className="innovation-detail__comments-title">
                Thảo luận cộng đồng ({comments.length})
              </h3>

              <Box className="innovation-detail__comment-box">
                <TextField
                  placeholder="Viết bình luận của bạn…"
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  multiline
                  minRows={3}
                  fullWidth
                  inputProps={{ maxLength: 2000 }}
                  className="innovation-detail__comment-input"
                />
                <Box className="innovation-detail__comment-actions">
                  <Button
                    variant="contained"
                    className="innovation-detail__comment-submit"
                    disabled={commenting || !commentBody.trim()}
                    onClick={() => void handleComment()}
                  >
                    {commenting ? "Đang gửi…" : "Gửi bình luận"}
                  </Button>
                </Box>
              </Box>

              <Box className="innovation-detail__comments">
                {comments.length === 0 ? (
                  <p className="innovation-detail__comments-empty">
                    Chưa có bình luận nào. Hãy là người đầu tiên thảo luận!
                  </p>
                ) : (
                  comments.map((c) => (
                    <article key={c.id} className="innovation-detail__comment">
                      <header className="innovation-detail__comment-meta">
                        <span className="innovation-detail__comment-author">
                          {c.displayName || "User"}
                        </span>
                        {c.createdAt ? (
                          <time className="innovation-detail__comment-time" dateTime={c.createdAt}>
                            {formatCommentTime(c.createdAt)}
                          </time>
                        ) : null}
                      </header>
                      <p className="innovation-detail__comment-body">{c.body}</p>
                    </article>
                  ))
                )}
              </Box>
            </Box>
          </Box>

          <Box className="innovation-detail__sidebar">
            <Box className="innovation-detail__sidebar-card">
              <h3 className="innovation-detail__sidebar-title">Thống kê</h3>
              <div className="innovation-detail__stat-row">
                <div className="innovation-detail__stat-icon-wrap innovation-detail__stat-icon-wrap--vote">
                  <ThumbUpAltIcon fontSize="small" />
                </div>
                <div className="innovation-detail__stat-info">
                  <span className="innovation-detail__stat-num">{idea.voteCount}</span>
                  <span className="innovation-detail__stat-lbl">Tổng số lượt vote</span>
                </div>
              </div>
              <div className="innovation-detail__stat-row">
                <div className="innovation-detail__stat-icon-wrap">
                  <ChatBubbleOutlineIcon fontSize="small" />
                </div>
                <div className="innovation-detail__stat-info">
                  <span className="innovation-detail__stat-num">{idea.commentCount}</span>
                  <span className="innovation-detail__stat-lbl">Bình luận</span>
                </div>
              </div>
            </Box>

            <Box className="innovation-detail__sidebar-card">
              <h3 className="innovation-detail__sidebar-title">Thông tin ý tưởng</h3>
              <div className="innovation-detail__info-list">
                <div className="innovation-detail__info-row">
                  <span className="innovation-detail__info-label">Trạng thái</span>
                  <span className="innovation-detail__info-value">
                    <span
                      className={`innovation-detail__info-status-dot innovation-detail__info-status-dot--${idea.status}`}
                    />
                    {innovationStatusLabel(idea.status)}
                  </span>
                </div>
                <div className="innovation-detail__info-row">
                  <span className="innovation-detail__info-label">Mức độ ưu tiên</span>
                  <span
                    className="innovation-detail__info-value"
                    style={{ color: priorityUi(idea.priority).color }}
                  >
                    {priorityUi(idea.priority).dot} {priorityUi(idea.priority).label}
                  </span>
                </div>
                <div className="innovation-detail__info-row">
                  <span className="innovation-detail__info-label">Danh mục</span>
                  <span className="innovation-tag innovation-tag--category">
                    {innovationCategoryLabel(idea.category)}
                  </span>
                </div>
                <div className="innovation-detail__info-row">
                  <span className="innovation-detail__info-label">Ngày tạo</span>
                  <span className="innovation-detail__info-value">{formatDateTime(idea.createdAt)}</span>
                </div>
                <div className="innovation-detail__info-row">
                  <span className="innovation-detail__info-label">Cập nhật lần cuối</span>
                  <span className="innovation-detail__info-value">
                    {formatDateTime(idea.updatedAt || idea.createdAt)}
                  </span>
                </div>
              </div>
            </Box>

            <Box className="innovation-detail__sidebar-card">
              <h3 className="innovation-detail__sidebar-title">Hành trình phát triển</h3>
              <div className="innovation-timeline">
                {timeline.map((step) => (
                  <div
                    key={step.key}
                    className={`innovation-timeline__item ${
                      step.state === "completed" ? "innovation-timeline__item--completed" : ""
                    }`}
                  >
                    <div className={`innovation-timeline__dot innovation-timeline__dot--${step.state}`}>
                      {step.state === "completed" ? <CheckOutlinedIcon sx={{ fontSize: 11 }} /> : null}
                    </div>
                    <div className="innovation-timeline__content">
                      <span
                        className={`innovation-timeline__title ${
                          step.state === "active" ? "innovation-timeline__title--active" : ""
                        }`}
                      >
                        {step.label}
                        {step.state === "active" ? " (Hiện tại)" : ""}
                      </span>
                      <span className="innovation-timeline__date">{step.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Box>

            <Box className="innovation-detail__sidebar-card">
              <h3
                className="innovation-detail__sidebar-title"
                style={{ fontSize: "0.85rem", color: "#64748b" }}
              >
                Chức năng quản trị
              </h3>
              <Stack spacing={1.5}>
                <TextField
                  select
                  size="small"
                  value={statusValue}
                  onChange={(e) => setStatusValue(e.target.value as InnovationIdeaStatus)}
                  fullWidth
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "10px",
                      fontSize: "0.85rem",
                    },
                  }}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <MenuItem key={s} value={s}>
                      {INNOVATION_STATUS_LABEL_VI[s]}
                    </MenuItem>
                  ))}
                </TextField>
                <Button
                  variant="outlined"
                  disabled={savingStatus || statusValue === idea.status}
                  onClick={() => void handleStatusSave()}
                  size="small"
                  fullWidth
                  sx={{ textTransform: "none", borderRadius: "8px", fontWeight: 700 }}
                >
                  {savingStatus ? "Đang lưu…" : "Cập nhật status"}
                </Button>
              </Stack>
            </Box>
          </Box>
        </Box>
      ) : null}
    </Box>
  );
}

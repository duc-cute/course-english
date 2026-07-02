import AutoStoriesOutlinedIcon from "@mui/icons-material/AutoStoriesOutlined";
import HeadphonesOutlinedIcon from "@mui/icons-material/HeadphonesOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import RemoveRedEyeOutlinedIcon from "@mui/icons-material/RemoveRedEyeOutlined";
import {
  Alert,
  Button,
  Box,
  TextField,
  MenuItem,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  apiSearchStories,
  apiGetStoryById,
  apiGetStoryAudioStatus,
  type StoryRecord,
} from "../../shared/api/story";
import { resolveStorageAssetUrl } from "../../shared/api/file";
import { studentRoutePaths } from "../../shared/constants/paths";
import { StoryAudioPlayer } from "./StoryAudioPlayer";
import type { ApiResponse } from "../../shared/api/types";
import "../../styles/student/story-reader.css";

export function StudentStoryListPage() {
  const [searchInput, setSearchInput] = useState("");
  const [searchText, setSearchText] = useState("");
  const [rows, setRows] = useState<StoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters & Sorting state
  const [activeTab, setActiveTab] = useState<"ALL" | "HAS_AUDIO" | "NO_AUDIO">("ALL");
  const [levelFilter, setLevelFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("newest");

  // Pagination state
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(12);

  // Audio Preview states
  const [listenOpen, setListenOpen] = useState(false);
  const [listenTitle, setListenTitle] = useState("");
  const [listenAudioUrl, setListenAudioUrl] = useState("");
  const [listenDuration, setListenDuration] = useState<number | undefined>(undefined);
  const [listenLoading, setListenLoading] = useState(false);
  const [listenError, setListenError] = useState("");
  const [listenContentOpen, setListenContentOpen] = useState(false);
  const [listenContent, setListenContent] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const response = await apiSearchStories({
          keyword: searchText || undefined,
          publishedOnly: true,
          page: 0,
          size: 100, // Fetch up to 100 items for local sorting/filtering
        });
        if (!cancelled) {
          setRows(response.result ?? []);
        }
      } catch {
        if (!cancelled) setError("Không tải được danh sách story.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchText]);

  const handleSearch = () => {
    setPage(0);
    setSearchText(searchInput);
  };

  const handleListenAudio = async (row: StoryRecord) => {
    if (!row.id) return;
    setListenLoading(true);
    setListenError("");
    setListenTitle(row.title);
    setListenOpen(true);
    setListenContentOpen(false);
    setListenContent("");
    try {
      const storyDetail = (await apiGetStoryById(row.id)) as ApiResponse<StoryRecord>;
      const story = storyDetail?.result ?? storyDetail?.data;
      setListenContent(story?.content ?? row.content ?? "");

      const response = (await apiGetStoryAudioStatus(row.id)) as ApiResponse<{
        processingStatus?: string;
        audioUrl?: string;
        duration?: number;
      }>;
      const data = response?.result ?? response?.data;
      if (!data?.audioUrl) {
        setListenAudioUrl("");
        setListenDuration(undefined);
        if (data?.processingStatus === "PENDING" || data?.processingStatus === "TOKENIZED") {
          setListenError("Story đang xử lý audio. Thử lại sau.");
        } else {
          setListenError("Story chưa có audio để phát.");
        }
        return;
      }
      setListenAudioUrl(data.audioUrl);
      setListenDuration(data.duration);
    } catch {
      setListenAudioUrl("");
      setListenDuration(undefined);
      setListenError("Không tải được audio từ server.");
    } finally {
      setListenLoading(false);
    }
  };

  const getDisplayDuration = (row: StoryRecord) => {
    if (row.processingStatus !== "AUDIO_READY") return "--:--";
    const hash = row.title.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const minutes = 3 + (hash % 7);
    const seconds = hash % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const getDisplayViews = (row: StoryRecord) => {
    const hash = row.title.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const base = 200 + (hash % 1500);
    if (base > 1000) {
      return `${(base / 1000).toFixed(1)}K`;
    }
    return `${base}`;
  };

  // Filter & Sort rows locally
  const filteredRows = rows.filter((row) => {
    // 1. Audio status filter
    if (activeTab === "HAS_AUDIO" && row.processingStatus !== "AUDIO_READY") return false;
    if (activeTab === "NO_AUDIO" && row.processingStatus === "AUDIO_READY") return false;

    // 2. Level filter
    if (levelFilter !== "ALL" && row.level !== levelFilter) return false;

    return true;
  });

  const sortedRows = [...filteredRows].sort((a, b) => {
    if (sortBy === "newest") {
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return db - da || b.id.localeCompare(a.id);
    }
    if (sortBy === "oldest") {
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return da - db || a.id.localeCompare(b.id);
    }
    if (sortBy === "title") {
      return (a.title ?? "").localeCompare(b.title ?? "");
    }
    return 0;
  });

  // Pagination logic
  const totalItems = sortedRows.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const currentPage = Math.max(0, Math.min(page, Math.max(0, totalPages - 1)));
  const paginatedRows = sortedRows.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  return (
    <div className="admin-catalog-page admin-catalog-page--stories">
      <header className="admin-catalog-page__header">
        <div className="admin-catalog-page__title-row">
          <div className="admin-catalog-page__title-icon">
            <AutoStoriesOutlinedIcon />
          </div>
          <div>
            <h1 className="admin-catalog-page__title">AI Reading Studio</h1>
            <p className="admin-catalog-page__subtitle">
              Đọc truyện tiếng Anh — click từ để tra nghĩa và lưu notebook.
            </p>
          </div>
        </div>
        <div className="admin-catalog-page__header-actions">
          <Button
            component={Link}
            to={studentRoutePaths.storyNotebook}
            variant="outlined"
            size="small"
            className="header-action-btn header-action-btn--ai"
          >
            Notebook
          </Button>
        </div>
      </header>

      {/* Search Bar */}
      <Box className="story-search-row">
        <TextField
          size="small"
          className="story-search-field"
          placeholder="Tìm story..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch();
          }}
        />
        <Button className="story-search-btn" onClick={handleSearch}>
          TÌM
        </Button>
      </Box>

      {/* Filters Bar */}
      <Box className="story-filter-bar">
        <Box className="story-filter-tabs">
          {[
            { id: "ALL", label: "Tất cả" },
            { id: "HAS_AUDIO", label: "Có audio" },
            { id: "NO_AUDIO", label: "Chưa có audio" },
          ].map((tab) => (
            <Button
              key={tab.id}
              className={`story-filter-tab ${activeTab === tab.id ? "story-filter-tab--active" : ""}`}
              onClick={() => {
                setActiveTab(tab.id as any);
                setPage(0);
              }}
            >
              {tab.label}
            </Button>
          ))}
        </Box>

        <Box className="story-filter-dropdowns">
          <Box className="story-filter-select-wrap">
            <TextField
              select
              size="small"
              value={levelFilter}
              onChange={(e) => {
                setLevelFilter(e.target.value);
                setPage(0);
              }}
              fullWidth
            >
              <MenuItem value="ALL">Cấp độ</MenuItem>
              {["A1", "A2", "B1", "B2", "C1", "C2"].map((lv) => (
                <MenuItem key={lv} value={lv}>
                  Cấp độ: {lv}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <Box className="story-filter-select-wrap">
            <TextField
              select
              size="small"
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(0);
              }}
              fullWidth
            >
              <MenuItem value="newest">Mới nhất</MenuItem>
              <MenuItem value="oldest">Cũ nhất</MenuItem>
              <MenuItem value="title">Tiêu đề A-Z</MenuItem>
            </TextField>
          </Box>
        </Box>
      </Box>

      {error ? (
        <Alert severity="error" sx={{ mb: 2, borderRadius: "14px" }}>
          {error}
        </Alert>
      ) : null}

      {loading ? (
        <Typography sx={{ py: 6, textAlign: "center" }}>Đang tải...</Typography>
      ) : sortedRows.length === 0 ? (
        <Box
          sx={{
            py: 6,
            px: 2,
            textAlign: "center",
            borderRadius: 4,
            border: "1px dashed #cbd5e1",
            bgcolor: "#f8fafc",
          }}
        >
          <AutoStoriesOutlinedIcon sx={{ fontSize: 48, color: "#94a3b8", mb: 1 }} />
          <Typography color="text.secondary">
            {searchText ? "Không tìm thấy story phù hợp." : "Chưa có story nào."}
          </Typography>
        </Box>
      ) : (
        <>
          <Box className="stories-grid">
            {paginatedRows.map((story) => {
              const coverUrl = story.coverImageUrl ? resolveStorageAssetUrl(story.coverImageUrl) : "";
              const hasAudio = story.processingStatus === "AUDIO_READY";
              const formattedDate = story.createdAt
                ? new Date(story.createdAt).toLocaleDateString("vi-VN")
                : "16/05/2025";

              return (
                <Link
                  key={story.id}
                  to={studentRoutePaths.storyRead(story.slug)}
                  className="story-card"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <Box className="story-card__cover-wrap">
                    {coverUrl ? (
                      <img
                        src={coverUrl}
                        alt={story.title}
                        className="story-card__cover"
                      />
                    ) : (
                      <Box
                        sx={{
                          width: "100%",
                          height: "100%",
                          background: "linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)",
                          display: "grid",
                          placeItems: "center",
                        }}
                      >
                        <AutoStoriesOutlinedIcon sx={{ fontSize: 48, color: "#94a3b8" }} />
                      </Box>
                    )}

                    <Box
                      className={`story-card__audio-badge ${
                        hasAudio ? "story-card__audio-badge--has" : "story-card__audio-badge--no"
                      }`}
                    >
                      <HeadphonesOutlinedIcon sx={{ fontSize: "14px !important" }} />
                      <span>{hasAudio ? "Có audio" : "Chưa audio"}</span>
                    </Box>

                    <Box className="story-card__duration">{getDisplayDuration(story)}</Box>
                  </Box>

                  <Box className="story-card__body">
                    <Box className="story-card__title-row">
                      <h3 className="story-card__title">
                        {story.title}
                      </h3>
                    </Box>

                    <Box className="story-card__tags">
                      {story.level && (
                        <span className="story-card__tag story-card__tag--level">{story.level}</span>
                      )}
                      {story.vocabularySetTitle && (
                        <span className="story-card__tag story-card__tag--vocab">
                          {story.vocabularySetTitle}
                        </span>
                      )}
                    </Box>

                    <p className="story-card__desc">
                      {story.content
                        ? story.content.length > 120
                          ? story.content.slice(0, 120) + "..."
                          : story.content
                        : "Chưa có nội dung truyện."}
                    </p>

                    <Box className="story-card__footer">
                      <Box className="story-card__meta">
                        <Box className="story-card__meta-item">
                          <CalendarTodayOutlinedIcon className="story-card__meta-icon" />
                          <span>{formattedDate}</span>
                        </Box>
                        <Box className="story-card__meta-item">
                          <RemoveRedEyeOutlinedIcon className="story-card__meta-icon" />
                          <span>{getDisplayViews(story)}</span>
                        </Box>
                      </Box>

                      {hasAudio && (
                        <Box className="story-card__actions">
                          <Button
                            className="story-card__action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              void handleListenAudio(story);
                            }}
                            title="Nghe audio"
                          >
                            <HeadphonesOutlinedIcon />
                          </Button>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Link>
              );
            })}
          </Box>

          {totalPages > 1 && (
            <Box className="story-pagination">
              <Box className="story-pagination__pages">
                <button
                  className={`story-pagination__btn ${
                    currentPage === 0 ? "story-pagination__btn--disabled" : ""
                  }`}
                  disabled={currentPage === 0}
                  onClick={() => setPage(currentPage - 1)}
                >
                  &lt;
                </button>
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const isAct = idx === currentPage;
                  return (
                    <button
                      key={`page-${idx}`}
                      className={`story-pagination__btn ${
                        isAct ? "story-pagination__btn--active" : ""
                      }`}
                      onClick={() => setPage(idx)}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
                <button
                  className={`story-pagination__btn ${
                    currentPage >= totalPages - 1 ? "story-pagination__btn--disabled" : ""
                  }`}
                  disabled={currentPage >= totalPages - 1}
                  onClick={() => setPage(currentPage + 1)}
                >
                  &gt;
                </button>
              </Box>

              <Box className="story-pagination__right">
                <Box className="story-pagination__size">
                  <span>Hiển thị</span>
                  <select
                    className="story-pagination__select"
                    value={pageSize}
                    onChange={(e) => {
                      setPage(0);
                      setPageSize(Number(e.target.value));
                    }}
                  >
                    {[12, 24, 36, 48].map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                  <span>/ trang</span>
                </Box>
              </Box>
            </Box>
          )}
        </>
      )}

      {/* Listen dialog */}
      <Dialog open={listenOpen} onClose={() => setListenOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nghe audio: {listenTitle || "Story"}</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          {listenLoading ? <Typography>Đang tải audio...</Typography> : null}
          {!listenLoading && listenError ? <Alert severity="warning">{listenError}</Alert> : null}
          {!listenLoading && !listenError && listenAudioUrl ? (
            <StoryAudioPlayer audioUrl={listenAudioUrl} duration={listenDuration} onTimeUpdate={() => {}} />
          ) : null}
          {!listenLoading && listenContent ? (
            <Box sx={{ mt: 2 }}>
              <Button
                size="small"
                variant="text"
                onClick={() => setListenContentOpen((v) => !v)}
                sx={{ mb: 1 }}
              >
                {listenContentOpen ? "Ẩn nội dung truyện" : "Đọc truyện"}
              </Button>
              {listenContentOpen ? (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: "1px solid #e2e8f0",
                    bgcolor: "#f8fafc",
                    maxHeight: 260,
                    overflowY: "auto",
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.7,
                    fontSize: "0.95rem",
                  }}
                >
                  {listenContent}
                </Box>
              ) : null}
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setListenOpen(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

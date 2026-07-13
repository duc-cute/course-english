import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import ExploreOutlinedIcon from "@mui/icons-material/ExploreOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import { Alert, MenuItem, TextField } from "@mui/material";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { resolveStorageAssetUrl } from "../../shared/api/file";
import { studentRoutePaths } from "../../shared/constants/paths";
import { EnrollmentClassroomFilter } from "../lessons/EnrollmentClassroomFilter";
import { useStudentEnrollments } from "../lessons/useStudentEnrollments";
import { useStudentDashboard } from "../shell/StudentDashboardContext";
import { AssignedVocabSetCard } from "./AssignedVocabSetCard";
import { VocabExploreTab } from "./VocabExploreTab";
import { useAssignedVocabSets } from "./useAssignedVocabSets";
import { useVocabPracticeSummary } from "./useVocabPracticeSummary";
import { formatVocabCount } from "./vocabUtils";

type VocabCenterTab = "assigned" | "explore";
type StatusFilterType = "all" | "learning" | "not_started" | "completed";
type SortByType = "newest" | "alphabetical" | "due_soon";

const ITEMS_PER_PAGE = 6;

function formatSimpleDate(iso?: string | null): string {
  if (!iso) return "Chưa giao";
  try {
    return new Date(iso).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "Chưa giao";
  }
}

export function VocabCenterPage() {
  const [tab, setTab] = useState<VocabCenterTab>("assigned");
  const [selectedClassroomId, setSelectedClassroomId] = useState<string | null>(null);

  // Filter & Sorting state
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>("all");
  const [sortBy, setSortBy] = useState<SortByType>("newest");
  const [page, setPage] = useState(1);

  const { stats } = useStudentDashboard();
  const streak = stats?.weeklyStreakCount ?? 0;
  const xp = stats?.xp ?? 0;

  const {
    classrooms,
    hasEnrollment,
    loading: enrollmentLoading,
    error: enrollmentError,
  } = useStudentEnrollments();

  const {
    rows: assignedRows,
    loading: assignedLoading,
    error: assignedError,
  } = useAssignedVocabSets(selectedClassroomId);

  const practiceSetIds = useMemo(
    () => assignedRows.map((row) => row.vocabularySetId).filter(Boolean),
    [assignedRows],
  );
  const { bySetId: practiceBySetId } = useVocabPracticeSummary(
    tab === "assigned" ? practiceSetIds : [],
  );

  const assignedListLoading = assignedLoading || enrollmentLoading;
  const showNoEnrollment = !enrollmentLoading && !hasEnrollment;

  // Featured assignment logic
  const featuredAssignment = useMemo(() => {
    if (assignedRows.length === 0) return null;
    
    // 1. Try to find one in progress (0 < progress < 100)
    const learning = assignedRows.find((row) => {
      const summary = practiceBySetId[row.vocabularySetId];
      const pct = summary?.best?.scorePercent ?? 0;
      return pct > 0 && pct < 100;
    });
    if (learning) return learning;

    // 2. Try to find one not started (progress === 0)
    const notStarted = assignedRows.find((row) => {
      const summary = practiceBySetId[row.vocabularySetId];
      const pct = summary?.best?.scorePercent ?? 0;
      return pct === 0;
    });
    if (notStarted) return notStarted;

    // 3. Fallback to first
    return assignedRows[0] || null;
  }, [assignedRows, practiceBySetId]);

  const featuredProgress = useMemo(() => {
    if (!featuredAssignment) return 0;
    const summary = practiceBySetId[featuredAssignment.vocabularySetId];
    return summary?.best?.scorePercent ?? 0;
  }, [featuredAssignment, practiceBySetId]);

  // Counts for filters
  const filterCounts = useMemo(() => {
    let all = assignedRows.length;
    let learning = 0;
    let not_started = 0;
    let completed = 0;

    for (const row of assignedRows) {
      const summary = practiceBySetId[row.vocabularySetId];
      const pct = summary?.best?.scorePercent ?? 0;
      if (pct === 100) {
        completed++;
      } else if (pct > 0) {
        learning++;
      } else {
        not_started++;
      }
    }

    return { all, learning, not_started, completed };
  }, [assignedRows, practiceBySetId]);

  // Filter & Sort assignments
  const filteredAndSortedRows = useMemo(() => {
    let result = assignedRows.filter((row) => {
      const summary = practiceBySetId[row.vocabularySetId];
      const pct = summary?.best?.scorePercent ?? 0;
      if (statusFilter === "learning") return pct > 0 && pct < 100;
      if (statusFilter === "completed") return pct === 100;
      if (statusFilter === "not_started") return pct === 0;
      return true;
    });

    result = [...result].sort((a, b) => {
      if (sortBy === "alphabetical") {
        const titleA = a.vocabularySetTitle || "";
        const titleB = b.vocabularySetTitle || "";
        return titleA.localeCompare(titleB, "vi");
      }
      if (sortBy === "due_soon") {
        const dueA = a.dueAt ? new Date(a.dueAt).getTime() : Infinity;
        const dueB = b.dueAt ? new Date(b.dueAt).getTime() : Infinity;
        return dueA - dueB;
      }
      const dateA = a.assignedAt ? new Date(a.assignedAt).getTime() : 0;
      const dateB = b.assignedAt ? new Date(b.assignedAt).getTime() : 0;
      return dateB - dateA; // newest
    });

    return result;
  }, [assignedRows, practiceBySetId, statusFilter, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedRows.length / ITEMS_PER_PAGE);
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedRows.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAndSortedRows, page]);

  // Reset page when filter/sort changes
  const handleFilterChange = (filter: StatusFilterType) => {
    setStatusFilter(filter);
    setPage(1);
  };

  const handleSortChange = (sort: SortByType) => {
    setSortBy(sort);
    setPage(1);
  };

  // Circular progress dimensions
  const circleRadius = 42;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const strokeOffset = circleCircumference - (featuredProgress / 100) * circleCircumference;

  return (
    <div className="vq-page vq-vocab-page">
      <header className="vq-vocab-header-new">
        <div className="vq-vocab-header-new__left">
          <div className="vq-vocab-header-new__title-row">
            <span className="vq-vocab-header-new__icon" aria-hidden>📖</span>
            <h1 className="vq-vocab-header-new__title">Từ vựng</h1>
          </div>
          <p className="vq-vocab-header-new__subtitle">
            Học từ vựng mỗi ngày – Ghi nhớ lâu dài – Ứng dụng tự tin
          </p>
        </div>

        <div className="vq-vocab-header-new__right">
          <div className="vq-vocab-header-new__stats">
            <div className="vq-vocab-header-new__stat-pill vq-vocab-header-new__stat-pill--streak">
              <span className="vq-vocab-header-new__stat-emoji">🔥</span>
              <span className="vq-vocab-header-new__stat-text">{streak} Ngày streak</span>
            </div>
            <div className="vq-vocab-header-new__stat-pill vq-vocab-header-new__stat-pill--xp">
              <span className="vq-vocab-header-new__stat-emoji">⭐</span>
              <span className="vq-vocab-header-new__stat-text">{xp} XP</span>
            </div>
          </div>
        </div>

        <img
          src="/images/vocab-header-backpack.png"
          alt=""
          className="vq-vocab-header-new__backpack-img"
          aria-hidden
        />
      </header>

      <div className="vq-vocab-center-tabs" role="tablist" aria-label="Nguồn từ vựng">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "assigned"}
          className={`vq-vocab-center-tabs__btn${tab === "assigned" ? " is-active" : ""}`}
          onClick={() => setTab("assigned")}
        >
          <AssignmentOutlinedIcon sx={{ fontSize: 20 }} />
          Hôm nay học gì
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "explore"}
          className={`vq-vocab-center-tabs__btn${tab === "explore" ? " is-active" : ""}`}
          onClick={() => setTab("explore")}
        >
          <ExploreOutlinedIcon sx={{ fontSize: 20 }} />
          Khám phá
        </button>
      </div>

      <EnrollmentClassroomFilter
        classrooms={classrooms}
        selectedClassroomId={selectedClassroomId}
        onChange={setSelectedClassroomId}
      />

      {enrollmentError ? (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: "14px" }}>
          {enrollmentError}
        </Alert>
      ) : null}

      {tab === "assigned" ? (
        <>
          {assignedError ? (
            <Alert severity="error" sx={{ mb: 2, borderRadius: "14px" }}>
              {assignedError}
            </Alert>
          ) : null}

          {assignedListLoading ? (
            <div className="vq-vocab-list-loading">
              <div className="vq-vocab-featured--skeleton" aria-hidden />
              <div className="vq-vocab-grid-loading">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="vq-vocab-card vq-vocab-card--skeleton" aria-hidden />
                ))}
              </div>
            </div>
          ) : showNoEnrollment ? (
            <div className="vq-lessons-empty">
              <SchoolOutlinedIcon sx={{ fontSize: 48, color: "var(--vq-outline)", mb: 1 }} />
              <p>Bạn chưa được ghi danh lớp nào.</p>
              <span>Liên hệ giáo viên để được thêm vào lớp trước khi nhận bộ từ được giao.</span>
            </div>
          ) : assignedRows.length === 0 ? (
            <div className="vq-lessons-empty vq-vocab-assigned-empty">
              <AssignmentOutlinedIcon sx={{ fontSize: 48, color: "var(--vq-outline)", mb: 1 }} />
              <p>Chưa có bộ từ được giao</p>
              <span>Khi giáo viên gán bộ từ cho lớp, danh sách sẽ hiện ở đây theo thời gian giao.</span>
            </div>
          ) : (
            <>
              {/* Featured Card Section */}
              {featuredAssignment && (
                <section className="vq-vocab-featured-section">
                  <h2 className="vq-vocab-section-title">
                    <span className="vq-vocab-section-title__dot" /> Bộ từ vựng đang học
                  </h2>
                  <div className="vq-vocab-featured">
                    <div className="vq-vocab-featured__cover-wrapper">
                      {featuredAssignment.coverImageUrl ? (
                        <img
                          src={resolveStorageAssetUrl(featuredAssignment.coverImageUrl)}
                          alt={featuredAssignment.vocabularySetTitle}
                          className="vq-vocab-featured__cover-img"
                        />
                      ) : (
                        <div className="vq-vocab-featured__icon-fallback">
                          <MenuBookOutlinedIcon sx={{ fontSize: 48, color: "var(--vq-primary)" }} />
                        </div>
                      )}
                    </div>

                    <div className="vq-vocab-featured__body">
                      <h3 className="vq-vocab-featured__title">
                        {featuredAssignment.vocabularySetTitle}
                      </h3>
                      {featuredAssignment.description && (
                        <p className="vq-vocab-featured__desc">{featuredAssignment.description}</p>
                      )}

                      <div className="vq-vocab-featured__badges">
                        {featuredAssignment.classroomName && (
                          <span className="vq-vocab-featured__badge vq-vocab-featured__badge--classroom">
                            {featuredAssignment.classroomName}
                          </span>
                        )}
                        {featuredAssignment.teacherName && (
                          <span className="vq-vocab-featured__badge vq-vocab-featured__badge--teacher">
                            {featuredAssignment.teacherName}
                          </span>
                        )}
                        <span className="vq-vocab-featured__badge vq-vocab-featured__badge--count">
                          {formatVocabCount(featuredAssignment.itemCount)}
                        </span>
                      </div>

                      <div className="vq-vocab-featured__meta">
                        <span className="vq-vocab-featured__date">
                          Giao: {formatSimpleDate(featuredAssignment.assignedAt)}
                        </span>
                        <span className="vq-vocab-featured__date">
                          Hạn: {formatSimpleDate(featuredAssignment.dueAt)}
                        </span>
                      </div>
                    </div>

                    <div className="vq-vocab-featured__right">
                      <div className="vq-vocab-featured__chart-wrapper">
                        <svg
                          className="vq-vocab-featured__svg"
                          width="120"
                          height="120"
                          viewBox="0 0 120 120"
                          aria-hidden
                        >
                          <circle
                            cx="60"
                            cy="60"
                            r={circleRadius}
                            className="vq-vocab-featured__circle-bg"
                          />
                          <circle
                            cx="60"
                            cy="60"
                            r={circleRadius}
                            className="vq-vocab-featured__circle-fill"
                            strokeDasharray={circleCircumference}
                            strokeDashoffset={strokeOffset}
                            transform="rotate(-90 60 60)"
                          />
                        </svg>
                        <div className="vq-vocab-featured__chart-info">
                          <span className="vq-vocab-featured__pct">{featuredProgress}%</span>
                          <span className="vq-vocab-featured__pct-label">Hoàn thành</span>
                        </div>
                      </div>

                      <Link
                        to={`${studentRoutePaths.vocabSet(featuredAssignment.vocabularySetId)}?assignmentId=${featuredAssignment.id}`}
                        className="vq-vocab-featured__cta"
                      >
                        Học ngay <ArrowForwardIcon sx={{ fontSize: 18 }} />
                      </Link>
                    </div>
                  </div>
                </section>
              )}

              {/* My Vocabulary Sets Grid Section */}
              <section className="vq-vocab-my-sets-section">
                <div className="vq-vocab-section-header">
                  <h2 className="vq-vocab-section-title">
                    <MenuBookOutlinedIcon
                      className="vq-vocab-section-title__icon"
                      sx={{ fontSize: 22, color: "#6366f1" }}
                    />
                    Bộ từ vựng của tôi
                  </h2>
                  <div className="vq-vocab-my-sets-controls">
                    {/* Filter chips */}
                    <div className="vq-vocab-filter-chips">
                      <button
                        type="button"
                        className={`vq-vocab-filter-chip${statusFilter === "all" ? " is-active" : ""}`}
                        onClick={() => handleFilterChange("all")}
                      >
                        Tất cả ({filterCounts.all})
                      </button>
                      <button
                        type="button"
                        className={`vq-vocab-filter-chip${statusFilter === "learning" ? " is-active" : ""}`}
                        onClick={() => handleFilterChange("learning")}
                      >
                        Đang học ({filterCounts.learning})
                      </button>
                      <button
                        type="button"
                        className={`vq-vocab-filter-chip${statusFilter === "not_started" ? " is-active" : ""}`}
                        onClick={() => handleFilterChange("not_started")}
                      >
                        Chưa bắt đầu ({filterCounts.not_started})
                      </button>
                      <button
                        type="button"
                        className={`vq-vocab-filter-chip${statusFilter === "completed" ? " is-active" : ""}`}
                        onClick={() => handleFilterChange("completed")}
                      >
                        Đã hoàn thành ({filterCounts.completed})
                      </button>
                    </div>

                    {/* Sorting Select Dropdown */}
                    <div className="vq-vocab-sort-dropdown">
                      <TextField
                        select
                        size="small"
                        value={sortBy}
                        onChange={(e) => handleSortChange(e.target.value as SortByType)}
                        className="vq-vocab-sort-select"
                        sx={{
                          minWidth: 160,
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "12px",
                            fontFamily: "var(--vq-font-body)",
                            fontSize: "0.85rem",
                            fontWeight: 700,
                            color: "var(--vq-on-surface)",
                            background: "var(--vq-surface-container-lowest)",
                          },
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: "var(--vq-outline-variant)",
                            borderWidth: "2px",
                          },
                          "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: "var(--vq-primary)",
                          },
                        }}
                      >
                        <MenuItem value="newest">Sắp xếp: Mới nhất</MenuItem>
                        <MenuItem value="alphabetical">Sắp xếp: Tên A-Z</MenuItem>
                        <MenuItem value="due_soon">Sắp xếp: Hạn gần nhất</MenuItem>
                      </TextField>
                    </div>
                  </div>
                </div>

                {paginatedRows.length === 0 ? (
                  <div className="vq-lessons-empty vq-vocab-grid-empty">
                    <AssignmentOutlinedIcon sx={{ fontSize: 36, color: "var(--vq-outline)", mb: 1 }} />
                    <p>Không tìm thấy bộ từ vựng phù hợp</p>
                    <span>Thay đổi bộ lọc hoặc xem danh sách tất cả.</span>
                  </div>
                ) : (
                  <>
                    <div className="vq-vocab-grid">
                      {paginatedRows.map((row) => (
                        <AssignedVocabSetCard
                          key={row.id}
                          assignment={row}
                          practiceSummary={practiceBySetId[row.vocabularySetId]}
                        />
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="vq-vocab-pagination">
                        <button
                          type="button"
                          className="vq-vocab-pagination__btn vq-vocab-pagination__btn--arrow"
                          disabled={page === 1}
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          aria-label="Trang trước"
                        >
                          &lt;
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                          <button
                            key={p}
                            type="button"
                            className={`vq-vocab-pagination__btn vq-vocab-pagination__btn--page${page === p ? " is-active" : ""}`}
                            onClick={() => setPage(p)}
                          >
                            {p}
                          </button>
                        ))}
                        <button
                          type="button"
                          className="vq-vocab-pagination__btn vq-vocab-pagination__btn--arrow"
                          disabled={page === totalPages}
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          aria-label="Trang sau"
                        >
                          &gt;
                        </button>
                      </div>
                    )}
                  </>
                )}
              </section>
            </>
          )}
        </>
      ) : showNoEnrollment ? (
        <div className="vq-lessons-empty">
          <SchoolOutlinedIcon sx={{ fontSize: 48, color: "var(--vq-outline)", mb: 1 }} />
          <p>Bạn chưa được ghi danh lớp nào.</p>
          <span>Liên hệ giáo viên để được thêm vào lớp trước khi khám phá journey.</span>
        </div>
      ) : (
        <VocabExploreTab showNoEnrollment={false} />
      )}
    </div>
  );
}

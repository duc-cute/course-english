import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SearchIcon from "@mui/icons-material/Search";
import ViewInArOutlinedIcon from "@mui/icons-material/ViewInArOutlined";
import {
  Alert,
  Box,
  CardActionArea,
  Chip,
  InputAdornment,
  Skeleton,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ContinueLearningCard } from "../../student/components/ContinueLearningCard";
import type { LessonProgressEntry } from "../../student/lessonProgressStorage";
import { resolveContinueLearning } from "../../student/lessonProgressSync";
import { apiGetLessons, type LessonRecord, type LessonsPaginationResult } from "../../shared/api/lesson";
import {
  apiGetLessonPracticeSummary,
  isPracticePassed,
  type LessonPracticeSummaryItem,
} from "../../shared/api/lessonPracticeAttempt";
import type { ApiResponse } from "../../shared/api/types";
import { paths } from "../../shared/constants/paths";
import "../../styles/student-lessons.css";

export function StudentLessonListPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<LessonRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchText, setSearchText] = useState("");
  const [practiceSummary, setPracticeSummary] = useState<Record<string, LessonPracticeSummaryItem>>(
    {},
  );
  const [continueProgress, setContinueProgress] = useState<LessonProgressEntry | null>(null);

  useEffect(() => {
    void resolveContinueLearning().then(setContinueProgress);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, unknown> = {
        page: 0,
        size: 50,
        sort: "displayOrder,asc",
        status: "PUBLISHED",
      };
      const trimmed = searchText.trim();
      if (trimmed) params.keyword = trimmed;

      const response = (await apiGetLessons(params)) as ApiResponse<LessonsPaginationResult>;
      const raw = response?.data?.result ?? response?.result;
      const items = Array.isArray(raw) ? raw : (raw as LessonsPaginationResult | undefined)?.result ?? [];
      setRows(items);

      const ids = items.map((l) => l.id).filter(Boolean);
      const summary = await apiGetLessonPracticeSummary(ids);
      const map: Record<string, LessonPracticeSummaryItem> = {};
      for (const row of summary) {
        map[row.lessonId] = row;
      }
      setPracticeSummary(map);
    } catch (err) {
      setError((err as { message?: string })?.message || "Không thể tải danh sách bài học.");
    } finally {
      setLoading(false);
    }
  }, [searchText]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return (
    <div className="student-page">
      <h1 className="student-page-title">Bài học của bạn</h1>
      <p className="student-page-subtitle">
        Chỉ hiển thị bài đã publish. Mở bài để đọc nội dung và khám phá mô hình 3D.
      </p>

      {continueProgress ? <ContinueLearningCard progress={continueProgress} /> : null}

      <TextField
        className="student-search-field"
        fullWidth
        size="small"
        placeholder="Tìm theo tên bài, môn học..."
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") setSearchText(searchInput);
        }}
        onBlur={() => setSearchText(searchInput)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" sx={{ color: "var(--bio-teal, #0d9488)" }} />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 2.5 }}
      />

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      {loading ? (
        <Box className="student-lesson-list">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={96} sx={{ borderRadius: "16px" }} />
          ))}
        </Box>
      ) : rows.length === 0 ? (
        <div className="student-empty-state">
          <ArticleOutlinedIcon sx={{ fontSize: 44, color: "#94a3b8", mb: 1 }} />
          <Typography color="text.secondary">
            {searchText ? "Không tìm thấy bài học." : "Chưa có bài học đã publish."}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
            Giáo viên cần publish bài ở menu Quản lý bài học.
          </Typography>
        </div>
      ) : (
        <div className="student-lesson-list">
          {rows.map((lesson) => {
            const summaryItem = practiceSummary[lesson.id];
            const practicePassed = isPracticePassed(summaryItem?.best);
            const latest = summaryItem?.latest;

            return (
            <article key={lesson.id} className="student-lesson-card">
              <CardActionArea
                onClick={() => navigate(`/${paths.STUDENT}/${paths.STUDENT_LESSONS}/${lesson.id}`)}
                sx={{ p: 2 }}
              >
                <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1.5 }}>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography className="student-lesson-card-title" noWrap>
                      {lesson.title}
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 1 }}>
                      {lesson.subjectName ? <Chip className="student-chip-teal" label={lesson.subjectName} size="small" /> : null}
                      {lesson.blockCount != null && lesson.blockCount > 0 ? (
                        <Chip className="student-chip-teal" label={`${lesson.blockCount} phần`} size="small" variant="outlined" />
                      ) : null}
                      {practicePassed ? (
                        <Chip
                          className="student-chip-passed"
                          icon={<CheckCircleIcon sx={{ fontSize: "16px !important" }} />}
                          label="Đã đạt"
                          size="small"
                        />
                      ) : null}
                      {!practicePassed && latest ? (
                        <Chip
                          className="student-chip-score"
                          label={`${latest.scorePercent}%`}
                          size="small"
                          variant="outlined"
                        />
                      ) : null}
                    </Box>
                    {lesson.summary ? (
                      <Typography className="student-lesson-card-summary" sx={{ mt: 1.25 }}>
                        {lesson.summary}
                      </Typography>
                    ) : null}
                  </Box>
                  <ViewInArOutlinedIcon sx={{ color: "var(--bio-interactive-purple, #7c3aed)", opacity: 0.5, flexShrink: 0 }} />
                </Box>
              </CardActionArea>
            </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

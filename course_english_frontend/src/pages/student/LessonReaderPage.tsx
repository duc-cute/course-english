import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CenterFocusStrongOutlinedIcon from "@mui/icons-material/CenterFocusStrongOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import ViewListOutlinedIcon from "@mui/icons-material/ViewListOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import { Alert, Box, Button, CircularProgress, Link } from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { LessonBlockReader } from "../../student/components/LessonBlockReader";
import { LessonReaderTocMobile, LessonReaderTocSidebar } from "../../student/components/LessonReaderToc";
import { LessonReaderUpNext } from "../../student/components/LessonReaderUpNext";
import { useLessonReaderScroll } from "../../student/hooks/useLessonReaderScroll";
import { findNextPublishedLesson } from "../../student/lessonNavigation";
import { getLessonProgress, saveLessonProgress } from "../../student/lessonProgressStorage";
import {
  estimateReadingMinutes,
  getBlockCssModifier,
  getBlockTocTitle,
  getBlockTypeLabel,
  getLessonBlockDomId,
} from "../../student/lessonReaderUtils";
import {
  apiGetLessonDetail,
  type LessonAssetRecord,
  type LessonBlockRecord,
  type LessonDetailRecord,
  type LessonRecord,
} from "../../shared/api/lesson";
import type { ApiResponse } from "../../shared/api/types";
import { paths } from "../../shared/constants/paths";
import "../../styles/lesson-reader.css";

export function LessonReaderPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lesson, setLesson] = useState<LessonDetailRecord | null>(null);
  const [nextLesson, setNextLesson] = useState<LessonRecord | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [resumeDismissed, setResumeDismissed] = useState(false);
  const saveTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!lessonId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const response = (await apiGetLessonDetail(lessonId)) as ApiResponse<LessonDetailRecord>;
        const detail = response?.result ?? response?.data ?? null;
        if (!cancelled) setLesson(detail);
        if (detail && !cancelled) {
          const next = await findNextPublishedLesson(detail);
          if (!cancelled) setNextLesson(next);
        }
      } catch (err) {
        if (!cancelled) setError((err as { message?: string })?.message || "Không thể tải bài học.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  const blocks = useMemo(() => {
    const list = lesson?.blocks ?? [];
    return [...list].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }, [lesson?.blocks]);

  const assets: LessonAssetRecord[] = lesson?.assets ?? [];
  const readingMin = useMemo(() => estimateReadingMinutes(blocks), [blocks]);
  const hasBlocks = blocks.length > 0;

  const persistProgress = useCallback(
    (activeBlockId: string | null, scrollPercent: number) => {
      if (!lesson?.id || !activeBlockId) return;
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(() => {
        saveLessonProgress({
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          subjectName: lesson.subjectName,
          lastBlockId: activeBlockId,
          scrollPercent,
        });
      }, 400);
    },
    [lesson],
  );

  const { scrollProgress, activeBlockId, scrollToBlock } = useLessonReaderScroll({
    blocks,
    enabled: hasBlocks && !loading,
    onProgress: persistProgress,
  });

  const savedProgress = useMemo(
    () => (lessonId ? getLessonProgress(lessonId) : null),
    [lessonId, lesson?.id],
  );

  const showResume =
    !resumeDismissed &&
    savedProgress &&
    savedProgress.lastBlockId &&
    savedProgress.scrollPercent > 2 &&
    savedProgress.scrollPercent < 98;

  useEffect(() => {
    const root = document.querySelector(".student-layout-root");
    if (!root) return;
    root.classList.toggle("student-layout-root--reader-focus", focusMode);
    return () => root.classList.remove("student-layout-root--reader-focus");
  }, [focusMode]);

  useEffect(() => {
    if (!lesson?.id || !hasBlocks) return;
    saveLessonProgress({
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      subjectName: lesson.subjectName,
      lastBlockId: blocks[0]?.id ?? "",
      scrollPercent: 0,
    });
  }, [lesson?.id, lesson?.title, lesson?.subjectName, hasBlocks, blocks]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !lesson) {
    return (
      <div className="lesson-reader-shell">
        <Alert severity="error">{error || "Không tìm thấy bài học."}</Alert>
      </div>
    );
  }

  const isDraft = lesson.status !== "PUBLISHED";
  const listPath = `/${paths.STUDENT}/${paths.STUDENT_LESSONS}`;

  const layoutClass = [
    "lesson-reader-layout",
    hasBlocks ? "lesson-reader-layout--with-toc" : "",
    focusMode ? "lesson-reader-layout--focus" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <div className={layoutClass}>
        {hasBlocks ? (
          <LessonReaderTocSidebar
            blocks={blocks}
            activeBlockId={activeBlockId}
            scrollProgress={scrollProgress}
            onSelect={scrollToBlock}
          />
        ) : null}

        <article className="lesson-reader-main">
          <Box className="lesson-reader-toolbar" sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center", mb: 1 }}>
            <Link
              component="button"
              type="button"
              className="lesson-reader-back"
              underline="none"
              onClick={() => navigate(listPath)}
              sx={{ border: "none", background: "none", cursor: "pointer", font: "inherit", mb: 0 }}
            >
              <ArrowBackIcon sx={{ fontSize: 18 }} />
              Danh sách bài học
            </Link>
            <Button
              size="small"
              variant={focusMode ? "contained" : "outlined"}
              className={focusMode ? "student-btn-teal" : "student-btn-teal-outlined"}
              startIcon={<CenterFocusStrongOutlinedIcon />}
              onClick={() => setFocusMode((v) => !v)}
              sx={{ textTransform: "none", borderRadius: "999px", ml: "auto" }}
            >
              {focusMode ? "Thoát focus" : "Chế độ tập trung"}
            </Button>
          </Box>

          {showResume ? (
            <Alert
              severity="info"
              className="lesson-reader-resume"
              sx={{ mb: 2, borderRadius: "14px" }}
              action={
                <Button color="inherit" size="small" onClick={() => setResumeDismissed(true)}>
                  Đóng
                </Button>
              }
            >
              Bạn đang đọc dở (~{Math.round(savedProgress.scrollPercent)}%).{" "}
              <Button size="small" variant="outlined" onClick={() => scrollToBlock(savedProgress.lastBlockId)} sx={{ ml: 1 }}>
                Nhảy tới chỗ cũ
              </Button>
            </Alert>
          ) : null}

          {isDraft ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Bài học chưa publish — bạn đang xem bản nháp.
            </Alert>
          ) : null}

          <header className="lesson-reader-hero">
            <div className="lesson-reader-hero-eyebrow">
              <MenuBookOutlinedIcon sx={{ fontSize: 16 }} />
              Bài học
              {lesson.subjectName ? (
                <>
                  <span aria-hidden>·</span>
                  <span className="lesson-reader-hero-subject">{lesson.subjectName}</span>
                </>
              ) : null}
            </div>
            <h1 className="lesson-reader-hero-title">{lesson.title}</h1>
            {lesson.summary ? <p className="lesson-reader-hero-summary">{lesson.summary}</p> : null}
          </header>

          {hasBlocks ? (
            <div className="lesson-reader-meta" role="status">
              <span>
                <ViewListOutlinedIcon sx={{ fontSize: 16, verticalAlign: "text-bottom", mr: 0.5 }} />
                <strong>{blocks.length}</strong> phần nội dung
              </span>
              <span>
                <ScheduleOutlinedIcon sx={{ fontSize: 16, verticalAlign: "text-bottom", mr: 0.5 }} />
                Khoảng <strong>{readingMin}</strong> phút đọc
              </span>
            </div>
          ) : null}

          {blocks.length === 0 ? (
            <Alert severity="info">Bài học chưa có nội dung. Giáo viên cần thêm block và publish.</Alert>
          ) : (
            <div className="lesson-reader-blocks">
              {blocks.map((block: LessonBlockRecord, index) => (
                <section
                  key={block.id}
                  id={getLessonBlockDomId(block.id)}
                  className={`lesson-reader-block ${getBlockCssModifier(block.blockType)} ${
                    block.id === activeBlockId ? "is-active-section" : ""
                  }`.trim()}
                  aria-labelledby={`block-label-${block.id}`}
                >
                  <div className="lesson-reader-block-head">
                    <span className="lesson-reader-block-index" aria-hidden>
                      {index + 1}
                    </span>
                    <div>
                      <span id={`block-label-${block.id}`} className="lesson-reader-block-label">
                        {getBlockTocTitle(block, index)}
                      </span>
                      <span className="lesson-reader-block-type">{getBlockTypeLabel(block.blockType)}</span>
                    </div>
                  </div>
                  <LessonBlockReader block={block} assets={assets} variant="reader" />
                </section>
              ))}
            </div>
          )}

          {nextLesson ? <LessonReaderUpNext nextLesson={nextLesson} /> : null}
        </article>
      </div>

      {hasBlocks ? (
        <LessonReaderTocMobile blocks={blocks} activeBlockId={activeBlockId} onSelect={scrollToBlock} />
      ) : null}
    </>
  );
}

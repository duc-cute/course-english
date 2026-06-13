import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import { Alert, Button, CircularProgress } from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { LessonReaderTocMobile, LessonReaderTocSidebar } from "../components/LessonReaderToc";
import { useLessonReaderScroll } from "../hooks/useLessonReaderScroll";
import { findNextPublishedLesson } from "../lessonNavigation";
import { getLessonProgress } from "../lessonProgressStorage";
import { hydrateLessonProgressForLesson, syncLessonProgress } from "../lessonProgressSync";
import { ExercisePlayer } from "./exercise/ExercisePlayer";
import { useLessonPlayerChrome } from "./LessonPlayerChromeContext";
import { LessonPlayerTabs } from "./LessonPlayerTabs";
import { LessonReaderToolbar } from "./LessonReaderToolbar";
import { PlayerMascotTip } from "./PlayerMascotTip";
import { StudyPanel } from "./StudyPanel";
import {
  defaultLessonPlayerTab,
  filterBlocksForTab,
  lessonHasPracticeTab,
  lessonHasStudyTab,
  type LessonPlayerTab,
} from "../../shared/lesson/blockTypes";
import {
  apiGetLessonDetail,
  apiGetLessonDetailBySlug,
  type LessonAssetRecord,
  type LessonDetailRecord,
  type LessonRecord,
} from "../../shared/api/lesson";
import type { ApiResponse } from "../../shared/api/types";
import { STUDENT_SCROLL_ROOT_ID } from "../../shared/constants/scrollRoots";
import { paths } from "../../shared/constants/paths";
import { isLessonUuid } from "../../shared/lesson/isLessonUuid";
import { studentLessonPath } from "../../shared/lesson/lessonPaths";

export function LessonReaderPage() {
  const { lessonSlug } = useParams<{ lessonSlug: string }>();
  const navigate = useNavigate();
  const { patchChrome, resetChrome } = useLessonPlayerChrome();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lesson, setLesson] = useState<LessonDetailRecord | null>(null);
  const [nextLesson, setNextLesson] = useState<LessonRecord | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [resumeDismissed, setResumeDismissed] = useState(false);
  const [exerciseView, setExerciseView] = useState<"exercise" | "result" | "review">("exercise");
  const [savedProgress, setSavedProgress] = useState<ReturnType<typeof getLessonProgress>>(null);
  const saveTimer = useRef<number | null>(null);

  const tabFromUrl = searchParams.get("tab");

  useEffect(() => () => resetChrome(), [resetChrome]);

  useEffect(() => {
    if (!lessonSlug) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const response = (isLessonUuid(lessonSlug)
          ? await apiGetLessonDetail(lessonSlug)
          : await apiGetLessonDetailBySlug(lessonSlug)) as ApiResponse<LessonDetailRecord>;
        const detail = response?.result ?? response?.data ?? null;
        if (!detail) {
          if (!cancelled) setError("Không tìm thấy bài học.");
          return;
        }
        if (!cancelled && detail.slug && detail.slug !== lessonSlug) {
          const tab = tabFromUrl === "practice" || tabFromUrl === "study" ? tabFromUrl : undefined;
          navigate(studentLessonPath(detail, tab ? { tab } : undefined), { replace: true });
          return;
        }
        if (!cancelled) setLesson(detail);
        if (!cancelled) {
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
  }, [lessonSlug, tabFromUrl, navigate]);

  const blocks = useMemo(() => {
    const list = lesson?.blocks ?? [];
    return [...list].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }, [lesson?.blocks]);

  const assets: LessonAssetRecord[] = lesson?.assets ?? [];
  const showStudy = lessonHasStudyTab(blocks);
  const showPractice = lessonHasPracticeTab(blocks);
  const hasPracticeOnly = showPractice && !showStudy;

  const activeTab: LessonPlayerTab = useMemo(() => {
    if (tabFromUrl === "practice" && showPractice) return "practice";
    if (tabFromUrl === "study" && showStudy) return "study";
    return defaultLessonPlayerTab(blocks);
  }, [tabFromUrl, showPractice, showStudy, blocks]);

  const setActiveTab = useCallback(
    (tab: LessonPlayerTab) => {
      setExerciseView("exercise");
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set("tab", tab);
        return next;
      });
    },
    [setSearchParams],
  );

  useEffect(() => {
    if (!lesson || loading) return;
    if (tabFromUrl === "practice" && !showPractice) setActiveTab("study");
    if (tabFromUrl === "study" && !showStudy && showPractice) setActiveTab("practice");
  }, [lesson, loading, tabFromUrl, showPractice, showStudy, setActiveTab]);

  const studyBlocks = useMemo(() => filterBlocksForTab(blocks, "study"), [blocks]);
  const practiceBlocks = useMemo(() => filterBlocksForTab(blocks, "practice"), [blocks]);
  const scrollBlocks = activeTab === "study" ? studyBlocks : [];
  const hasScrollBlocks = scrollBlocks.length > 0;

  const persistProgress = useCallback(
    (activeBlockId: string | null, scrollPercent: number) => {
      if (!lesson?.id || !activeBlockId || activeTab !== "study") return;
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(() => {
        syncLessonProgress({
          lessonId: lesson.id,
          lessonSlug: lesson.slug,
          lessonTitle: lesson.title,
          subjectName: lesson.subjectName,
          lastBlockId: activeBlockId,
          scrollPercent,
          lastTab: "study",
        });
      }, 400);
    },
    [lesson, activeTab],
  );

  const { scrollProgress, activeBlockId, scrollToBlock } = useLessonReaderScroll({
    blocks: scrollBlocks,
    enabled: hasScrollBlocks && !loading && activeTab === "study",
    onProgress: persistProgress,
  });

  useEffect(() => {
    if (!lesson?.id) {
      setSavedProgress(null);
      return;
    }
    let cancelled = false;
    setSavedProgress(getLessonProgress(lesson.id));
    void hydrateLessonProgressForLesson(lesson.id).then((merged) => {
      if (!cancelled) setSavedProgress(merged ?? getLessonProgress(lesson.id));
    });
    return () => {
      cancelled = true;
    };
  }, [lesson?.id]);

  useEffect(() => {
    if (!lesson) return;
    patchChrome({ lessonTitle: lesson.title });
  }, [lesson, patchChrome]);

  useEffect(() => {
    if (activeTab !== "study") return;
    patchChrome({
      progressPercent: scrollProgress,
      progressHint: "Đọc bài",
    });
  }, [activeTab, scrollProgress, patchChrome]);

  useEffect(() => {
    if (activeTab !== "practice") return;
    if (exerciseView === "result") {
      patchChrome({ progressPercent: 100, progressHint: "Hoàn thành" });
    } else if (exerciseView === "review") {
      patchChrome({ progressHint: "Xem lại" });
    }
  }, [activeTab, exerciseView, patchChrome]);

  const handleExerciseProgress = useCallback(
    (current: number, total: number) => {
      patchChrome({
        progressPercent: total > 0 ? Math.round((current / total) * 100) : 0,
        progressHint: total > 0 ? `Câu ${current}/${total}` : "Bài tập",
      });
    },
    [patchChrome],
  );

  const showResume =
    activeTab === "study" &&
    !resumeDismissed &&
    savedProgress &&
    savedProgress.lastBlockId &&
    savedProgress.scrollPercent > 2 &&
    savedProgress.scrollPercent < 98;

  useEffect(() => {
    const root = document.querySelector(".student-zone-root");
    if (!root) return;
    root.classList.toggle("student-layout-root--reader-focus", focusMode);
    return () => root.classList.remove("student-layout-root--reader-focus");
  }, [focusMode]);

  useEffect(() => {
    const main = document.getElementById(STUDENT_SCROLL_ROOT_ID);
    if (!main) return;
    main.classList.add("student-layout-main--lesson-reader");
    return () => main.classList.remove("student-layout-main--lesson-reader");
  }, []);

  useEffect(() => {
    if (!lesson?.id || !hasScrollBlocks || activeTab !== "study") return;
    syncLessonProgress({
      lessonId: lesson.id,
      lessonSlug: lesson.slug,
      lessonTitle: lesson.title,
      subjectName: lesson.subjectName,
      lastBlockId: studyBlocks[0]?.id ?? "",
      scrollPercent: 0,
      lastTab: "study",
    });
  }, [lesson?.id, lesson?.slug, lesson?.title, lesson?.subjectName, hasScrollBlocks, studyBlocks, activeTab]);

  useEffect(() => {
    if (!lesson?.id || loading) return;
    const existing = getLessonProgress(lesson.id);
    syncLessonProgress({
      lessonId: lesson.id,
      lessonSlug: lesson.slug,
      lessonTitle: lesson.title,
      subjectName: lesson.subjectName,
      lastBlockId: existing?.lastBlockId ?? studyBlocks[0]?.id ?? "",
      scrollPercent: existing?.scrollPercent ?? 0,
      lastTab: activeTab,
    });
  }, [lesson?.id, lesson?.slug, lesson?.title, lesson?.subjectName, activeTab, loading, studyBlocks]);

  const handleContinueAfterExercise = useCallback(() => {
    if (nextLesson) {
      navigate(studentLessonPath(nextLesson));
      return;
    }
    if (showStudy) {
      setActiveTab("study");
      return;
    }
    navigate(`/${paths.STUDENT}/${paths.STUDENT_LESSONS}`);
  }, [nextLesson, showStudy, navigate, setActiveTab]);

  if (loading) {
    return (
      <div className="lesson-reader-root vq-player vq-player--loading">
        <CircularProgress />
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="lesson-reader-root vq-player lesson-reader-shell">
        <Alert severity="error">{error || "Không tìm thấy bài học."}</Alert>
      </div>
    );
  }

  const isDraft = lesson.status !== "PUBLISHED";
  const listPath = `/${paths.STUDENT}/${paths.STUDENT_LESSONS}`;
  const showToc = activeTab === "study" && hasScrollBlocks && !focusMode;
  const showResultLayout = activeTab === "practice" && exerciseView !== "exercise";

  const layoutClass = [
    "lesson-reader-layout",
    showToc ? "lesson-reader-layout--with-toc" : "",
    activeTab === "practice" ? "lesson-reader-layout--practice" : "",
    showResultLayout ? "lesson-reader-layout--result" : "",
    hasPracticeOnly ? "lesson-reader-layout--practice-only" : "",
    focusMode ? "lesson-reader-layout--focus" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="lesson-reader-root vq-player">
      <div className={layoutClass}>
        {showToc ? (
          <LessonReaderTocSidebar
            blocks={studyBlocks}
            activeBlockId={activeBlockId}
            scrollProgress={scrollProgress}
            onSelect={scrollToBlock}
          />
        ) : null}

        <article className="lesson-reader-main">
          {!showResultLayout ? (
            <LessonReaderToolbar
              focusMode={focusMode}
              onToggleFocus={() => setFocusMode((v) => !v)}
              visible={activeTab === "study" && hasScrollBlocks}
            />
          ) : null}

          {showResume ? (
            <Alert
              severity="info"
              className="lesson-reader-resume vq-player-resume"
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
            <Alert severity="warning" sx={{ mb: 2, borderRadius: "14px" }}>
              Bài học chưa publish — bạn đang xem bản nháp.
            </Alert>
          ) : null}

          {!showResultLayout ? (
            <header className="lesson-reader-hero">
              <div className="lesson-reader-hero-eyebrow">
                <MenuBookOutlinedIcon sx={{ fontSize: 16 }} />
                {hasPracticeOnly ? "Bài tập" : "Bài học"}
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
          ) : null}

          {!showResultLayout ? (
            <LessonPlayerTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              showStudy={showStudy}
              showPractice={showPractice}
            />
          ) : null}

          {activeTab === "study" ? (
            <StudyPanel
              studyBlocks={studyBlocks}
              assets={assets}
              activeBlockId={activeBlockId}
              nextLesson={nextLesson}
            />
          ) : (
            <ExercisePlayer
              lessonId={lesson.id}
              lessonTitle={lesson.title}
              subjectName={lesson.subjectName}
              practiceBlocks={practiceBlocks}
              nextLessonTitle={nextLesson?.title}
              onViewChange={setExerciseView}
              onProgressChange={handleExerciseProgress}
              onContinueStudy={handleContinueAfterExercise}
              onBackToLessons={() => navigate(listPath)}
            />
          )}
        </article>
      </div>

      {showToc ? (
        <LessonReaderTocMobile blocks={studyBlocks} activeBlockId={activeBlockId} onSelect={scrollToBlock} />
      ) : null}

      <PlayerMascotTip
        blocks={studyBlocks}
        activeBlockId={activeBlockId}
        visible={activeTab === "study" && hasScrollBlocks && !focusMode && !showResultLayout}
      />
    </div>
  );
}

import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import { Alert } from "@mui/material";
import { useState } from "react";
import { HomeContinueCard } from "../home/HomeContinueCard";
import { EnrollmentClassroomFilter } from "./EnrollmentClassroomFilter";
import { LessonListCard } from "./LessonListCard";
import { LessonListSearch } from "./LessonListSearch";
import { LessonsViewTabs } from "./LessonsViewTabs";
import { getLessonCardMeta } from "./lessonListUtils";
import { usePublishedLessons } from "./usePublishedLessons";
import { useStudentEnrollments } from "./useStudentEnrollments";

export function LessonListPage() {
  const [searchInput, setSearchInput] = useState("");
  const [searchText, setSearchText] = useState("");
  const [selectedClassroomId, setSelectedClassroomId] = useState<string | null>(null);

  const {
    classrooms,
    hasEnrollment,
    loading: enrollmentLoading,
    error: enrollmentError,
  } = useStudentEnrollments();

  const {
    rows,
    loading,
    error,
    practiceSummary,
    continueProgress,
    continuePractice,
    localProgress,
  } = usePublishedLessons(searchText, { classroomId: selectedClassroomId });

  const applySearch = () => setSearchText(searchInput);
  const listLoading = loading || enrollmentLoading;
  const showNoEnrollment = !enrollmentLoading && !hasEnrollment;

  return (
    <div className="vq-page vq-lessons-page">
      <LessonsViewTabs />

      <header className="vq-lessons-header">
        <h1 className="vq-page-title">Bài học của bạn</h1>
        <p className="vq-page-subtitle">
          Chỉ hiển thị bài đã publish thuộc lớp bạn đã ghi danh.
        </p>
      </header>

      {continueProgress ? (
        <div className="vq-lessons-continue">
          <HomeContinueCard progress={continueProgress} practiceLatest={continuePractice} />
        </div>
      ) : null}

      <EnrollmentClassroomFilter
        classrooms={classrooms}
        selectedClassroomId={selectedClassroomId}
        onChange={setSelectedClassroomId}
      />

      <LessonListSearch value={searchInput} onChange={setSearchInput} onSubmit={applySearch} />

      {enrollmentError ? (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: "14px" }}>
          {enrollmentError}
        </Alert>
      ) : null}

      {error ? (
        <Alert severity="error" sx={{ mb: 2, borderRadius: "14px" }}>
          {error}
        </Alert>
      ) : null}

      {listLoading ? (
        <div className="vq-lesson-list">
          {[1, 2, 3].map((i) => (
            <div key={i} className="vq-lesson-card vq-lesson-card--skeleton" aria-hidden />
          ))}
        </div>
      ) : showNoEnrollment ? (
        <div className="vq-lessons-empty">
          <SchoolOutlinedIcon sx={{ fontSize: 48, color: "var(--vq-outline)", mb: 1 }} />
          <p>Bạn chưa được ghi danh lớp nào.</p>
          <span>Liên hệ giáo viên hoặc quản trị để được thêm vào lớp học.</span>
        </div>
      ) : rows.length === 0 ? (
        <div className="vq-lessons-empty">
          <ArticleOutlinedIcon sx={{ fontSize: 48, color: "var(--vq-outline)", mb: 1 }} />
          <p>{searchText ? "Không tìm thấy bài học." : "Chưa có bài học trong lớp của bạn."}</p>
          <span>
            {searchText
              ? "Thử từ khóa khác hoặc chọn lớp khác."
              : "Giáo viên cần publish bài thuộc môn của lớp bạn."}
          </span>
        </div>
      ) : (
        <div className="vq-lesson-list">
          {rows.map((lesson) => {
            const meta = getLessonCardMeta(lesson.id, localProgress, practiceSummary);
            const latest = practiceSummary[lesson.id]?.latest;
            return <LessonListCard key={lesson.id} lesson={lesson} meta={meta} latestAttempt={latest} />;
          })}
        </div>
      )}
    </div>
  );
}

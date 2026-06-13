import MapOutlinedIcon from "@mui/icons-material/MapOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import { Alert } from "@mui/material";
import { useState } from "react";
import { EnrollmentClassroomFilter } from "./EnrollmentClassroomFilter";
import { LessonsViewTabs } from "./LessonsViewTabs";
import { PathUnitSection } from "./PathUnitSection";
import { groupLessonsBySubject } from "./lessonListUtils";
import { usePublishedLessons } from "./usePublishedLessons";
import { useStudentEnrollments } from "./useStudentEnrollments";

export function LearningPathPage() {
  const [searchText] = useState("");
  const [selectedClassroomId, setSelectedClassroomId] = useState<string | null>(null);

  const {
    classrooms,
    hasEnrollment,
    loading: enrollmentLoading,
    error: enrollmentError,
  } = useStudentEnrollments();

  const { rows, loading, error, practiceSummary, localProgress } = usePublishedLessons(searchText, {
    classroomId: selectedClassroomId,
  });

  const groups = groupLessonsBySubject(rows);
  const listLoading = loading || enrollmentLoading;
  const showNoEnrollment = !enrollmentLoading && !hasEnrollment;

  return (
    <div className="vq-page vq-lessons-page vq-path-page">
      <LessonsViewTabs />

      <header className="vq-lessons-header">
        <h1 className="vq-page-title">Lộ trình học</h1>
        <p className="vq-page-subtitle">
          Bản đồ bài học theo môn — chỉ lớp bạn đã ghi danh.
        </p>
      </header>

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

      {error ? (
        <Alert severity="error" sx={{ mb: 2, borderRadius: "14px" }}>
          {error}
        </Alert>
      ) : null}

      {listLoading ? (
        <div className="vq-path-loading">
          {[1, 2].map((i) => (
            <div key={i} className="vq-path-unit vq-path-unit--skeleton" aria-hidden />
          ))}
        </div>
      ) : showNoEnrollment ? (
        <div className="vq-lessons-empty">
          <SchoolOutlinedIcon sx={{ fontSize: 48, color: "var(--vq-outline)", mb: 1 }} />
          <p>Bạn chưa được ghi danh lớp nào.</p>
          <span>Liên hệ giáo viên để được thêm vào lớp trước khi học.</span>
        </div>
      ) : groups.length === 0 ? (
        <div className="vq-lessons-empty">
          <MapOutlinedIcon sx={{ fontSize: 48, color: "var(--vq-outline)", mb: 1 }} />
          <p>Chưa có bài học để hiển thị lộ trình.</p>
          <span>Giáo viên cần publish bài thuộc môn lớp của bạn.</span>
        </div>
      ) : (
        <div className="vq-path-units">
          {groups.map((group, index) => (
            <PathUnitSection
              key={group.key}
              group={group}
              unitIndex={index}
              localProgress={localProgress}
              practiceSummary={practiceSummary}
            />
          ))}
        </div>
      )}
    </div>
  );
}

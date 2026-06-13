import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import { Alert } from "@mui/material";
import { useState } from "react";
import { LessonListSearch } from "../lessons/LessonListSearch";
import { EnrollmentClassroomFilter } from "../lessons/EnrollmentClassroomFilter";
import { useStudentEnrollments } from "../lessons/useStudentEnrollments";
import { VocabSetCard } from "./VocabSetCard";
import { usePublishedVocabSets } from "./usePublishedVocabSets";

export function VocabCenterPage() {
  const [searchInput, setSearchInput] = useState("");
  const [searchText, setSearchText] = useState("");
  const [selectedClassroomId, setSelectedClassroomId] = useState<string | null>(null);

  const {
    classrooms,
    hasEnrollment,
    loading: enrollmentLoading,
    error: enrollmentError,
  } = useStudentEnrollments();

  const { rows, loading, error } = usePublishedVocabSets(searchText, {
    classroomId: selectedClassroomId,
  });

  const listLoading = loading || enrollmentLoading;
  const showNoEnrollment = !enrollmentLoading && !hasEnrollment;

  return (
    <div className="vq-page vq-vocab-page">
      <header className="vq-vocab-header">
        <h1 className="vq-page-title">Trung tâm từ vựng</h1>
        <p className="vq-page-subtitle">
          Ôn tập flashcard các bộ từ đã publish — thuộc lớp bạn đã ghi danh.
        </p>
      </header>

      <EnrollmentClassroomFilter
        classrooms={classrooms}
        selectedClassroomId={selectedClassroomId}
        onChange={setSelectedClassroomId}
      />

      <LessonListSearch
        value={searchInput}
        onChange={setSearchInput}
        onSubmit={() => setSearchText(searchInput)}
        placeholder="Tìm theo tên bộ từ, môn học..."
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
        <div className="vq-vocab-list">
          {[1, 2, 3].map((i) => (
            <div key={i} className="vq-vocab-card vq-vocab-card--skeleton" aria-hidden />
          ))}
        </div>
      ) : showNoEnrollment ? (
        <div className="vq-lessons-empty">
          <SchoolOutlinedIcon sx={{ fontSize: 48, color: "var(--vq-outline)", mb: 1 }} />
          <p>Bạn chưa được ghi danh lớp nào.</p>
          <span>Liên hệ giáo viên để được thêm vào lớp trước khi ôn từ vựng.</span>
        </div>
      ) : rows.length === 0 ? (
        <div className="vq-lessons-empty">
          <MenuBookOutlinedIcon sx={{ fontSize: 48, color: "var(--vq-outline)", mb: 1 }} />
          <p>{searchText ? "Không tìm thấy bộ từ vựng." : "Chưa có bộ từ vựng trong lớp của bạn."}</p>
          <span>Giáo viên cần publish bộ từ và gán môn thuộc lớp bạn.</span>
        </div>
      ) : (
        <div className="vq-vocab-list">
          {rows.map((set) => (
            <VocabSetCard key={set.id} set={set} />
          ))}
        </div>
      )}
    </div>
  );
}

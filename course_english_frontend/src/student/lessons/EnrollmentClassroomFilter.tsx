import type { StudentClassroomOption } from "./useStudentEnrollments";

type EnrollmentClassroomFilterProps = {
  classrooms: StudentClassroomOption[];
  selectedClassroomId: string | null;
  onChange: (classroomId: string | null) => void;
};

export function EnrollmentClassroomFilter({
  classrooms,
  selectedClassroomId,
  onChange,
}: EnrollmentClassroomFilterProps) {
  if (classrooms.length <= 1) return null;

  return (
    <div className="vq-enrollment-filter" role="group" aria-label="Lọc theo lớp">
      <button
        type="button"
        className={`vq-enrollment-filter__chip${selectedClassroomId === null ? " is-active" : ""}`}
        onClick={() => onChange(null)}
      >
        Tất cả lớp
      </button>
      {classrooms.map((item) => (
        <button
          key={item.classroomId}
          type="button"
          className={`vq-enrollment-filter__chip${selectedClassroomId === item.classroomId ? " is-active" : ""}`}
          onClick={() => onChange(item.classroomId)}
        >
          {item.classroomName}
        </button>
      ))}
    </div>
  );
}

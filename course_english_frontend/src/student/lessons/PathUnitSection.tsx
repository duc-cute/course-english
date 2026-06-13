import PublicOutlinedIcon from "@mui/icons-material/PublicOutlined";
import type { LessonPracticeSummaryItem } from "../../shared/api/lessonPracticeAttempt";
import type { LessonProgressEntry } from "../lessonProgressStorage";
import { VqProgressBar } from "../ui";
import { PathLessonNode } from "./PathLessonNode";
import {
  buildPathNodes,
  countCompletedLessons,
  type SubjectLessonGroup,
} from "./lessonListUtils";

type PathUnitSectionProps = {
  group: SubjectLessonGroup;
  unitIndex: number;
  localProgress: Record<string, LessonProgressEntry>;
  practiceSummary: Record<string, LessonPracticeSummaryItem>;
};

export function PathUnitSection({
  group,
  unitIndex,
  localProgress,
  practiceSummary,
}: PathUnitSectionProps) {
  const nodes = buildPathNodes(group.lessons, localProgress, practiceSummary);
  const completed = countCompletedLessons(nodes);
  const total = nodes.length;
  const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const activeIndex = nodes.findIndex((n) => n.state === "active");
  const summary =
    group.lessons.find((l) => l.summary)?.summary ??
    "Học theo thứ tự để mở khóa các bài tiếp theo.";

  return (
    <section className="vq-path-unit">
      <div className="vq-path-unit__header">
        <div className="vq-path-unit__header-text">
          <p className="vq-path-unit__eyebrow">Unit {unitIndex + 1}</p>
          <h2 className="vq-path-unit__title">{group.subjectName}</h2>
          <p className="vq-path-unit__desc">{summary}</p>
        </div>
        <PublicOutlinedIcon className="vq-path-unit__bg-icon" aria-hidden />
        <div className="vq-path-unit__progress">
          <VqProgressBar value={progressPct} label={`${completed} / ${total} bài`} />
        </div>
      </div>

      <div className="vq-path-unit__trail">
        <svg className="vq-path-unit__line" viewBox="0 0 400 800" preserveAspectRatio="none" aria-hidden>
          <path
            d="M200 0C200 80 340 120 340 220C340 320 60 360 60 460C60 560 340 600 340 700"
            fill="none"
            stroke="var(--vq-outline-variant)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray="1 24"
          />
        </svg>

        <div className="vq-path-unit__nodes">
          {nodes.map((node, index) => (
            <PathLessonNode
              key={node.lesson.id}
              node={node}
              showMascotTip={index === activeIndex}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

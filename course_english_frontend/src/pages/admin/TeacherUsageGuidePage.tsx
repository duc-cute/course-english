import { teacherGuideContent } from "../../shared/guide/teacherGuideContent";
import { UsageGuideView } from "../../shared/guide/UsageGuideView";
import "../../styles/usage-guide.css";

export function TeacherUsageGuidePage() {
  return <UsageGuideView variant="teacher" content={teacherGuideContent} />;
}

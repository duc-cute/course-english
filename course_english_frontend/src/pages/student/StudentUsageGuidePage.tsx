import { studentGuideContent } from "../../shared/guide/studentGuideContent";
import { UsageGuideView } from "../../shared/guide/UsageGuideView";
import "../../styles/usage-guide.css";

export function StudentUsageGuidePage() {
  return <UsageGuideView variant="student" content={studentGuideContent} />;
}

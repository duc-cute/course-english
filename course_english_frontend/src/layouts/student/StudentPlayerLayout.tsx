import { StudentPlayerShell } from "../../student/shell";
import { LessonPlayerChromeProvider } from "../../student/lessonPlayer/LessonPlayerChromeContext";
import "../../styles/student/index.css";
import "../../styles/lesson-reader.css";
import "../../styles/lesson-player.css";

/** Focus mode for lesson reader — no app nav. */
export function StudentPlayerLayout() {
  return (
    <LessonPlayerChromeProvider>
      <StudentPlayerShell />
    </LessonPlayerChromeProvider>
  );
}

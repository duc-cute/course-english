import type { LessonBlockRecord } from "../../shared/api/lesson";
import type { ExamSectionRecord } from "../../shared/api/examPaper";
import { parseExerciseSetPayload } from "../lessonPlayer/exercise/parseExerciseSet";
import { buildExerciseSetPayloadJson } from "../../shared/lesson/exercisePayload";

/** Map exam sections → fake EXERCISE_SET blocks for ExercisePlayer. */
export function examSectionsToPracticeBlocks(
  sections: ExamSectionRecord[],
  passScorePercent: number,
): LessonBlockRecord[] {
  return sections.map((section, index) => {
    let payloadJson = section.payloadJson ?? "{}";
    try {
      const parsed = parseExerciseSetPayload(payloadJson);
      payloadJson = buildExerciseSetPayloadJson({
        ...parsed,
        title: section.title?.trim() || parsed.title,
        instruction: section.instruction?.trim() || parsed.instruction,
        shuffleQuestions: false,
        shuffleOptions: false,
        passScorePercent,
      });
    } catch {
      // keep raw
    }
    return {
      id: section.id || `exam-sec-${index}`,
      displayOrder: section.displayOrder ?? index,
      blockType: "EXERCISE_SET" as const,
      payloadJson,
    };
  });
}

export function formatExamCountdown(remainingMs: number): string {
  const ms = Math.max(0, remainingMs);
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

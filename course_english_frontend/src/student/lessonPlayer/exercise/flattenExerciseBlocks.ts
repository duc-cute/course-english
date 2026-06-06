import type { LessonBlockRecord } from "../../../shared/api/lesson";
import { parseExerciseSetPayload } from "./parseExerciseSet";
import type { ExerciseQuestion, ExerciseSetPayload } from "./types";

export type FlatExerciseItem = {
  blockId: string;
  blockTitle?: string;
  instruction?: string;
  question: ExerciseQuestion;
  questionIndexInBlock: number;
  questionsInBlock: number;
};

export function flattenExerciseBlocks(blocks: LessonBlockRecord[]): FlatExerciseItem[] {
  const items: FlatExerciseItem[] = [];

  for (const block of blocks) {
    if (block.blockType !== "EXERCISE_SET") continue;
    const payload: ExerciseSetPayload = parseExerciseSetPayload(block.payloadJson);
    payload.questions.forEach((question, index) => {
      items.push({
        blockId: block.id,
        blockTitle: payload.title,
        instruction: payload.instruction,
        question,
        questionIndexInBlock: index,
        questionsInBlock: payload.questions.length,
      });
    });
  }

  return items;
}

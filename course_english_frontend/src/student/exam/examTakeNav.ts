import type { ExerciseAnswerSnapshot } from "../lessonPlayer/exerciseSessionStorage";
import type { PreparedExerciseItem } from "../lessonPlayer/exercise/prepareExerciseItems";

/** One navigable “câu” in the exam sidebar (global 1…N). */
export type ExamNavUnit = {
  /** 0-based index in the units array */
  unitIndex: number;
  /** 1-based number shown in the grid */
  displayNumber: number;
  /** Index into prepared exercise items */
  itemIndex: number;
  questionId: string;
  /**
   * blankId (GAP_FILL_MCQ) or subQuestionId (READING) — undefined for whole-question units.
   */
  partKey?: string;
  kind: "single" | "gap" | "reading_sub";
};

export function examUnitFlagId(unit: Pick<ExamNavUnit, "questionId" | "partKey">): string {
  return unit.partKey ? `${unit.questionId}::${unit.partKey}` : unit.questionId;
}

export function buildExamNavUnits(items: PreparedExerciseItem[]): ExamNavUnit[] {
  const units: ExamNavUnit[] = [];

  items.forEach((item, itemIndex) => {
    const q = item.displayQuestion;

    if (q.type === "GAP_FILL_MCQ" && q.blanks.length > 0) {
      q.blanks.forEach((blank) => {
        const unitIndex = units.length;
        units.push({
          unitIndex,
          displayNumber: unitIndex + 1,
          itemIndex,
          questionId: q.id,
          partKey: blank.id,
          kind: "gap",
        });
      });
      return;
    }

    if (q.type === "READING_COMPREHENSION" && q.subQuestions.length > 0) {
      q.subQuestions.forEach((sub) => {
        const unitIndex = units.length;
        units.push({
          unitIndex,
          displayNumber: unitIndex + 1,
          itemIndex,
          questionId: q.id,
          partKey: sub.id,
          kind: "reading_sub",
        });
      });
      return;
    }

    const unitIndex = units.length;
    units.push({
      unitIndex,
      displayNumber: unitIndex + 1,
      itemIndex,
      questionId: q.id,
      kind: "single",
    });
  });

  return units;
}

export function isExamUnitAnswered(
  unit: ExamNavUnit,
  answers: Record<string, ExerciseAnswerSnapshot>,
): boolean {
  const ans = answers[unit.questionId];
  if (!ans) return false;

  if (unit.kind === "gap" && unit.partKey) {
    return Boolean(ans.gapFillMcqAnswers?.[unit.partKey]);
  }
  if (unit.kind === "reading_sub" && unit.partKey) {
    return Boolean(ans.readingSubAnswers?.[unit.partKey]);
  }

  if (ans.selectedChoiceId) return true;
  if (ans.typedAnswer?.trim()) return true;
  if (ans.fillBlankAnswers && Object.keys(ans.fillBlankAnswers).length > 0) {
    return true;
  }
  if (ans.reorderTokenOrder && ans.reorderTokenOrder.length > 0) return true;
  if (ans.matchingSelections && Object.keys(ans.matchingSelections).length > 0) return true;
  if (ans.gapFillMcqAnswers && Object.keys(ans.gapFillMcqAnswers).length > 0) return true;
  if (ans.readingSubAnswers && Object.keys(ans.readingSubAnswers).length > 0) return true;
  return ans.correct === true || ans.correct === false;
}

export function countAnsweredExamUnits(
  units: ExamNavUnit[],
  answers: Record<string, ExerciseAnswerSnapshot>,
): number {
  return units.filter((u) => isExamUnitAnswered(u, answers)).length;
}

export function findUnitIndexForItem(units: ExamNavUnit[], itemIndex: number): number {
  const i = units.findIndex((u) => u.itemIndex === itemIndex);
  return i >= 0 ? i : 0;
}

export function examUnitDomId(unit: Pick<ExamNavUnit, "questionId" | "partKey">): string {
  if (unit.partKey) return `exam-unit-${unit.questionId}-${unit.partKey}`;
  return `exam-unit-${unit.questionId}`;
}

function unitBlockId(unit: ExamNavUnit, items: PreparedExerciseItem[]): string {
  return items[unit.itemIndex]?.blockId ?? `item-${unit.itemIndex}`;
}

/** Index of first unit in current Part (same blockId). */
export function findPartStartUnitIndex(
  units: ExamNavUnit[],
  items: PreparedExerciseItem[],
  unitIndex: number,
): number {
  const unit = units[unitIndex];
  if (!unit) return 0;
  const blockId = unitBlockId(unit, items);
  let start = unitIndex;
  while (start > 0 && unitBlockId(units[start - 1]!, items) === blockId) {
    start -= 1;
  }
  return start;
}

/**
 * Jump to first unit of previous/next Part (exam section / blockId).
 * Returns null if no adjacent Part.
 */
export function findAdjacentPartUnitIndex(
  units: ExamNavUnit[],
  items: PreparedExerciseItem[],
  currentUnitIndex: number,
  direction: -1 | 1,
): number | null {
  const current = units[currentUnitIndex];
  if (!current) return null;
  const currentBlock = unitBlockId(current, items);

  if (direction > 0) {
    for (let i = currentUnitIndex + 1; i < units.length; i += 1) {
      if (unitBlockId(units[i]!, items) !== currentBlock) return i;
    }
    return null;
  }

  const startOfCurrent = findPartStartUnitIndex(units, items, currentUnitIndex);
  if (startOfCurrent <= 0) return null;
  return findPartStartUnitIndex(units, items, startOfCurrent - 1);
}


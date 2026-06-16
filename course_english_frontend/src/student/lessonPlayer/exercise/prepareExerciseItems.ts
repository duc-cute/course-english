import type { LessonBlockRecord } from "../../../shared/api/lesson";
import type { ExerciseAnswerSnapshot } from "../exerciseSessionStorage";
import { parseExerciseSetPayload } from "./parseExerciseSet";
import { parseQuestionRefPayload } from "./parseQuestionRef";
import { shuffleArray, reorderChoicesByIds } from "./exerciseShuffle";
import type { FlatExerciseItem } from "./flattenExerciseBlocks";
import { flattenExerciseBlocks } from "./flattenExerciseBlocks";
import { sameStringSet } from "./matchingUtils";
import type {
  ExerciseQuestion,
  GapFillMcqQuestion,
  ReadingComprehensionQuestion,
  ListenChooseQuestion,
  MatchingQuestion,
  MultipleChoiceQuestion,
  ReorderSentenceQuestion,
} from "./types";
import { gapFillChoiceOrderKey } from "../../../shared/lesson/gapFillMcqUtils";
import { subQuestionChoiceOrderKey } from "../../../shared/lesson/readingComprehensionUtils";

export type BlockExerciseSettings = {
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  passScorePercent: number;
};

export type PreparedExerciseItem = FlatExerciseItem & {
  displayQuestion: ExerciseQuestion;
};

export type PreparedExercisePlan = {
  items: PreparedExerciseItem[];
  questionIdsOrder: string[];
  choiceOrders: Record<string, string[]>;
  passScorePercent: number;
};

export function readBlockExerciseSettings(block: LessonBlockRecord): BlockExerciseSettings {
  if (block.blockType === "EXERCISE_SET") {
    const payload = parseExerciseSetPayload(block.payloadJson);
    return {
      shuffleQuestions: payload.shuffleQuestions === true,
      shuffleOptions: payload.shuffleOptions !== false,
      passScorePercent: payload.passScorePercent ?? 80,
    };
  }
  if (block.blockType === "QUESTION_REF") {
    const payload = parseQuestionRefPayload(block.payloadJson);
    return {
      shuffleQuestions: payload.shuffleQuestions === true,
      shuffleOptions: payload.shuffleOptions !== false,
      passScorePercent: payload.passScorePercent ?? 80,
    };
  }
  return { shuffleQuestions: false, shuffleOptions: true, passScorePercent: 80 };
}

type ChoiceShuffleQuestion = MultipleChoiceQuestion | ListenChooseQuestion;

function applyMcqShuffle(
  question: ChoiceShuffleQuestion,
  shuffleOptions: boolean,
  savedChoiceOrder?: string[],
): { display: ChoiceShuffleQuestion; choiceOrder: string[] } {
  const defaultOrder = question.choices.map((c) => c.id);

  if (!shuffleOptions) {
    return { display: question, choiceOrder: defaultOrder };
  }

  const choiceOrder =
    savedChoiceOrder &&
    savedChoiceOrder.length === defaultOrder.length &&
    savedChoiceOrder.every((id) => defaultOrder.includes(id))
      ? savedChoiceOrder
      : shuffleArray(defaultOrder);

  return {
    display: { ...question, choices: reorderChoicesByIds(question.choices, choiceOrder) },
    choiceOrder,
  };
}

function applyMatchingShuffle(
  question: MatchingQuestion,
  shuffleOptions: boolean,
  savedRightOrder?: string[],
): { display: MatchingQuestion; choiceOrder: string[] } {
  const defaultRights = question.pairs.map((pair) => pair.right);

  if (!shuffleOptions) {
    return { display: { ...question, rightDisplayOrder: defaultRights }, choiceOrder: defaultRights };
  }

  const rightOrder =
    savedRightOrder &&
    savedRightOrder.length === defaultRights.length &&
    sameStringSet(savedRightOrder, defaultRights)
      ? savedRightOrder
      : shuffleArray(defaultRights);

  return {
    display: { ...question, rightDisplayOrder: rightOrder },
    choiceOrder: rightOrder,
  };
}

function applyReorderShuffle(
  question: ReorderSentenceQuestion,
  shuffleOptions: boolean,
  savedPoolOrder?: string[],
): { display: ReorderSentenceQuestion; choiceOrder: string[] } {
  const defaultOrder = question.tokens.map((token) => token.id);

  if (!shuffleOptions) {
    return { display: question, choiceOrder: [] };
  }

  const poolOrder =
    savedPoolOrder &&
    savedPoolOrder.length === defaultOrder.length &&
    sameStringSet(savedPoolOrder, defaultOrder)
      ? savedPoolOrder
      : shuffleArray(defaultOrder);

  return {
    display: { ...question, poolDisplayOrder: poolOrder },
    choiceOrder: poolOrder,
  };
}

function applyGapFillMcqShuffle(
  question: GapFillMcqQuestion,
  shuffleOptions: boolean,
  savedChoiceOrders?: Record<string, string[]>,
): { display: GapFillMcqQuestion; choiceOrders: Record<string, string[]> } {
  const choiceOrders: Record<string, string[]> = {};
  const blanks = question.blanks.map((blank) => {
    const defaultOrder = blank.choices.map((c) => c.id);
    const orderKey = gapFillChoiceOrderKey(question.id, blank.id);
    const saved = savedChoiceOrders?.[orderKey];

    const choiceOrder =
      !shuffleOptions
        ? defaultOrder
        : saved &&
            saved.length === defaultOrder.length &&
            saved.every((id) => defaultOrder.includes(id))
          ? saved
          : shuffleArray(defaultOrder);

    choiceOrders[orderKey] = choiceOrder;
    return {
      ...blank,
      choices: reorderChoicesByIds(blank.choices, choiceOrder),
    };
  });

  return {
    display: { ...question, blanks },
    choiceOrders,
  };
}

function applyReadingComprehensionShuffle(
  question: ReadingComprehensionQuestion,
  shuffleOptions: boolean,
  savedChoiceOrders?: Record<string, string[]>,
): { display: ReadingComprehensionQuestion; choiceOrders: Record<string, string[]> } {
  const choiceOrders: Record<string, string[]> = {};
  const subQuestions = question.subQuestions.map((sub) => {
    const defaultOrder = sub.choices.map((c) => c.id);
    const orderKey = subQuestionChoiceOrderKey(question.id, sub.id);
    const saved = savedChoiceOrders?.[orderKey];

    const choiceOrder =
      !shuffleOptions
        ? defaultOrder
        : saved &&
            saved.length === defaultOrder.length &&
            saved.every((id) => defaultOrder.includes(id))
          ? saved
          : shuffleArray(defaultOrder);

    choiceOrders[orderKey] = choiceOrder;
    return {
      ...sub,
      choices: reorderChoicesByIds(sub.choices, choiceOrder),
    };
  });

  return {
    display: { ...question, subQuestions },
    choiceOrders,
  };
}

function applyQuestionDisplay(
  question: ExerciseQuestion,
  shuffleOptions: boolean,
  savedChoiceOrders?: Record<string, string[]>,
): { display: ExerciseQuestion; choiceOrderEntries: Record<string, string[]> } {
  if (question.type === "MULTIPLE_CHOICE" || question.type === "LISTEN_CHOOSE") {
    const { display, choiceOrder } = applyMcqShuffle(
      question,
      shuffleOptions,
      savedChoiceOrders?.[question.id],
    );
    return {
      display,
      choiceOrderEntries: choiceOrder.length ? { [question.id]: choiceOrder } : {},
    };
  }
  if (question.type === "MATCHING") {
    const { display, choiceOrder } = applyMatchingShuffle(
      question,
      shuffleOptions,
      savedChoiceOrders?.[question.id],
    );
    return {
      display,
      choiceOrderEntries: choiceOrder.length ? { [question.id]: choiceOrder } : {},
    };
  }
  if (question.type === "REORDER_SENTENCE") {
    const { display, choiceOrder } = applyReorderShuffle(
      question,
      shuffleOptions,
      savedChoiceOrders?.[question.id],
    );
    return {
      display,
      choiceOrderEntries: choiceOrder.length ? { [question.id]: choiceOrder } : {},
    };
  }
  if (question.type === "GAP_FILL_MCQ") {
    const { display, choiceOrders } = applyGapFillMcqShuffle(
      question,
      shuffleOptions,
      savedChoiceOrders,
    );
    return { display, choiceOrderEntries: choiceOrders };
  }
  if (question.type === "READING_COMPREHENSION") {
    const { display, choiceOrders } = applyReadingComprehensionShuffle(
      question,
      shuffleOptions,
      savedChoiceOrders,
    );
    return { display, choiceOrderEntries: choiceOrders };
  }
  return { display: question, choiceOrderEntries: {} };
}

function groupItemsByBlock(items: FlatExerciseItem[]): FlatExerciseItem[][] {
  const groups: FlatExerciseItem[][] = [];
  let currentBlockId = "";
  let current: FlatExerciseItem[] = [];

  for (const item of items) {
    if (item.blockId !== currentBlockId) {
      if (current.length) groups.push(current);
      current = [item];
      currentBlockId = item.blockId;
    } else {
      current.push(item);
    }
  }
  if (current.length) groups.push(current);
  return groups;
}

function sameIdSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort().join("\0");
  const sortedB = [...b].sort().join("\0");
  return sortedA === sortedB;
}

function reorderFlatByQuestionIds(
  flat: FlatExerciseItem[],
  questionIds: string[],
): FlatExerciseItem[] {
  const byQuestionId = new Map(flat.map((item) => [item.question.id, item]));
  return questionIds
    .map((id) => byQuestionId.get(id))
    .filter((item): item is FlatExerciseItem => item !== undefined);
}

function orderFlatItems(
  flat: FlatExerciseItem[],
  blocks: LessonBlockRecord[],
  savedQuestionIdsOrder?: string[],
): FlatExerciseItem[] {
  const flatIds = flat.map((f) => f.question.id);
  if (savedQuestionIdsOrder && sameIdSet(flatIds, savedQuestionIdsOrder)) {
    return reorderFlatByQuestionIds(flat, savedQuestionIdsOrder);
  }

  const settingsByBlock = new Map(blocks.map((b) => [b.id, readBlockExerciseSettings(b)]));
  const groups = groupItemsByBlock(flat);
  const result: FlatExerciseItem[] = [];

  for (const group of groups) {
    const settings = settingsByBlock.get(group[0].blockId);
    if (settings?.shuffleQuestions) {
      result.push(...shuffleArray(group));
    } else {
      result.push(...group);
    }
  }

  return result;
}

function computeWeightedPassScore(blocks: LessonBlockRecord[], items: FlatExerciseItem[]): number {
  if (!items.length) return 80;
  const settingsByBlock = new Map(blocks.map((b) => [b.id, readBlockExerciseSettings(b)]));
  let sum = 0;
  for (const item of items) {
    sum += settingsByBlock.get(item.blockId)?.passScorePercent ?? 80;
  }
  return Math.round(sum / items.length);
}

export function prepareExercisePlan(
  practiceBlocks: LessonBlockRecord[],
  savedQuestionIdsOrder?: string[],
  savedChoiceOrders?: Record<string, string[]>,
): PreparedExercisePlan {
  const flat = flattenExerciseBlocks(practiceBlocks);
  const passScorePercent = computeWeightedPassScore(practiceBlocks, flat);

  if (!flat.length) {
    return { items: [], questionIdsOrder: [], choiceOrders: {}, passScorePercent };
  }

  const settingsByBlock = new Map(practiceBlocks.map((b) => [b.id, readBlockExerciseSettings(b)]));
  const orderedFlat = orderFlatItems(flat, practiceBlocks, savedQuestionIdsOrder);

  const choiceOrders: Record<string, string[]> = {};
  const items: PreparedExerciseItem[] = orderedFlat.map((item) => {
    const settings = settingsByBlock.get(item.blockId) ?? readBlockExerciseSettings(practiceBlocks[0]);
    const { display, choiceOrderEntries } = applyQuestionDisplay(
      item.question,
      settings.shuffleOptions,
      savedChoiceOrders,
    );
    Object.assign(choiceOrders, choiceOrderEntries);
    return { ...item, displayQuestion: display };
  });

  return {
    items,
    questionIdsOrder: items.map((i) => i.question.id),
    choiceOrders,
    passScorePercent,
  };
}

/** Chỉ giữ câu trả lời sai — dùng cho chế độ luyện lại câu sai. */
export function filterWrongExerciseItems(
  items: PreparedExerciseItem[],
  answers: Record<string, ExerciseAnswerSnapshot>,
): PreparedExerciseItem[] {
  return items.filter((item) => answers[item.displayQuestion.id]?.correct === false);
}

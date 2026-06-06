import { stringifyBlockPayload } from "../api/lesson";
import type { ExercisePresentation } from "../../student/lessonPlayer/exercise/types";

export type QuestionRefPayload = {
  title?: string;
  instruction?: string;
  presentation?: ExercisePresentation;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  passScorePercent?: number;
  refs: string[];
};

export function createDefaultQuestionRefPayload(): QuestionRefPayload {
  return {
    title: "Bài tập từ ngân hàng",
    instruction: "Chọn đáp án đúng",
    presentation: "stepped",
    shuffleQuestions: false,
    shuffleOptions: true,
    passScorePercent: 80,
    refs: [],
  };
}

export function buildQuestionRefPayloadJson(payload: QuestionRefPayload): string {
  return stringifyBlockPayload(payload);
}

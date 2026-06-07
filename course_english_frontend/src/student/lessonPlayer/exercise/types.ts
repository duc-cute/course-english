/** Dạng câu trong block EXERCISE_SET (mở rộng dần — Phase 3+) */
export type ExerciseQuestionType =
  | "MULTIPLE_CHOICE"
  | "MATCHING"
  | "FILL_BLANK"
  | "TRUE_FALSE"
  | "LISTEN_CHOOSE";

export type ExerciseChoice = {
  id: string;
  text: string;
};

export type ExercisePrompt = {
  text: string;
  lang?: string;
};

export type MultipleChoiceQuestion = {
  id: string;
  type: "MULTIPLE_CHOICE";
  prompt: ExercisePrompt;
  choices: ExerciseChoice[];
  correctChoiceId: string;
  explanation?: string;
};

export type MatchingPair = {
  left: string;
  right: string;
};

export type MatchingQuestion = {
  id: string;
  type: "MATCHING";
  prompt?: ExercisePrompt;
  pairs: MatchingPair[];
  /** Thứ tự cột phải sau shuffle — gán lúc prepare */
  rightDisplayOrder?: string[];
  explanation?: string;
};

export type ExerciseQuestion = MultipleChoiceQuestion | MatchingQuestion;

export type ExercisePresentation = "stepped" | "inline";

/** Payload của LessonBlock blockType = EXERCISE_SET */
export type ExerciseSetPayload = {
  title?: string;
  instruction?: string;
  presentation?: ExercisePresentation;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  passScorePercent?: number;
  questions: ExerciseQuestion[];
};

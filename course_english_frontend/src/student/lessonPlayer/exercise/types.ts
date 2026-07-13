/** Dạng câu trong block EXERCISE_SET (mở rộng dần — Phase 3+) */
export type ExerciseQuestionType =
  | "MULTIPLE_CHOICE"
  | "MATCHING"
  | "FILL_BLANK"
  | "GAP_FILL_MCQ"
  | "READING_COMPREHENSION"
  | "TRUE_FALSE"
  | "LISTEN_CHOOSE"
  | "SPELLING"
  | "LISTEN_TYPE"
  | "REORDER_SENTENCE";

export type ExerciseChoice = {
  id: string;
  text: string;
};

export type ExercisePrompt = {
  text: string;
  lang?: string;
};

export type TypedAnswerOptions = {
  caseSensitive?: boolean;
};

export type MultipleChoiceQuestion = {
  id: string;
  type: "MULTIPLE_CHOICE";
  prompt: ExercisePrompt;
  choices: ExerciseChoice[];
  correctChoiceId: string;
  explanation?: string;
  wordEn?: string;
  phonetic?: string;
  partOfSpeech?: string;
  coverImageUrl?: string;
  audioUkUrl?: string;
  audioUsUrl?: string;
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

export type ListenChooseQuestion = {
  id: string;
  type: "LISTEN_CHOOSE";
  /** URL audio snapshot lúc sinh bài (UK hoặc US) */
  audioUrl: string;
  audioAccent?: "UK" | "US";
  wordEn?: string;
  prompt?: ExercisePrompt;
  choices: ExerciseChoice[];
  correctChoiceId: string;
  explanation?: string;
};

export type SpellingQuestion = {
  id: string;
  type: "SPELLING";
  prompt: ExercisePrompt;
  correctAnswer: string;
  wordEn?: string;
  hint?: string;
  caseSensitive?: boolean;
  explanation?: string;
};

export type ListenTypeQuestion = {
  id: string;
  type: "LISTEN_TYPE";
  audioUrl: string;
  audioAccent?: "UK" | "US";
  correctAnswer: string;
  wordEn?: string;
  prompt?: ExercisePrompt;
  caseSensitive?: boolean;
  explanation?: string;
};

export type FillBlankSlot = {
  id: string;
  acceptedAnswers: string[];
  placeholder?: string;
};

export type FillBlankQuestion = {
  id: string;
  type: "FILL_BLANK";
  prompt: ExercisePrompt;
  blanks: FillBlankSlot[];
  wordEn?: string;
  caseSensitive?: boolean;
  explanation?: string;
};

export type GapFillMcqBlank = {
  id: string;
  choices: ExerciseChoice[];
  correctChoiceId: string;
};

export type GapFillMcqQuestion = {
  id: string;
  type: "GAP_FILL_MCQ";
  prompt: ExercisePrompt;
  blanks: GapFillMcqBlank[];
  explanation?: string;
};

export type ReadingSubQuestion = {
  id: string;
  prompt: ExercisePrompt;
  choices: ExerciseChoice[];
  correctChoiceId: string;
  explanation?: string;
};

export type ReadingPassage = {
  title?: string;
  text: string;
  lang?: string;
};

export type ReadingPresentation = "split" | "stepped";

export type ReadingComprehensionQuestion = {
  id: string;
  type: "READING_COMPREHENSION";
  passage: ReadingPassage;
  subQuestions: ReadingSubQuestion[];
  presentation?: ReadingPresentation;
  explanation?: string;
};

export type ReorderToken = {
  id: string;
  text: string;
};

export type ReorderSentenceQuestion = {
  id: string;
  type: "REORDER_SENTENCE";
  prompt?: ExercisePrompt;
  tokens: ReorderToken[];
  correctOrder: string[];
  sourceSentence?: string;
  /** Thứ tự chip trong pool sau shuffle — gán lúc prepare */
  poolDisplayOrder?: string[];
  explanation?: string;
};

/** choice id "true" | "false" — khớp selectedChoiceId trong snapshot */
export const TRUE_FALSE_TRUE_ID = "true";
export const TRUE_FALSE_FALSE_ID = "false";

export type TrueFalseQuestion = {
  id: string;
  type: "TRUE_FALSE";
  prompt: ExercisePrompt;
  correctAnswer: boolean;
  explanation?: string;
};

export type ExerciseQuestion =
  | MultipleChoiceQuestion
  | MatchingQuestion
  | ListenChooseQuestion
  | SpellingQuestion
  | ListenTypeQuestion
  | FillBlankQuestion
  | GapFillMcqQuestion
  | ReadingComprehensionQuestion
  | ReorderSentenceQuestion
  | TrueFalseQuestion;

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

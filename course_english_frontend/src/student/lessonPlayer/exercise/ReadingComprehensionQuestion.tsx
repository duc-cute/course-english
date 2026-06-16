import { useState } from "react";
import {
  READING_PRESENTATION_SPLIT,
  READING_PRESENTATION_STEPPED,
  scoreReadingComprehension,
} from "../../../shared/lesson/readingComprehensionUtils";
import { MultipleChoiceQuestion } from "./MultipleChoiceQuestion";
import type {
  MultipleChoiceQuestion as McqType,
  ReadingComprehensionQuestion as ReadingType,
  ReadingSubQuestion,
} from "./types";

type ReadingComprehensionQuestionProps = {
  question: ReadingType;
  subAnswers: Record<string, string>;
  disabled?: boolean;
  showResult?: boolean;
  isCorrect?: boolean;
  onSelectSub: (subId: string, choiceId: string) => void;
};

function toMcqShape(sub: ReadingSubQuestion): McqType {
  return {
    id: sub.id,
    type: "MULTIPLE_CHOICE",
    prompt: sub.prompt,
    choices: sub.choices,
    correctChoiceId: sub.correctChoiceId,
    explanation: sub.explanation,
  };
}

function ReadingPassageCard({ question }: { question: ReadingType }) {
  const title = question.passage.title?.trim();
  return (
    <div className="exercise-reading-passage">
      {title ? <h3 className="exercise-reading-passage-title">{title}</h3> : null}
      <div className="exercise-reading-passage-text">{question.passage.text}</div>
    </div>
  );
}

function SubMcqBlock({
  sub,
  index,
  total,
  selectedId,
  disabled,
  showResult,
  compact,
  onSelect,
}: {
  sub: ReadingSubQuestion;
  index: number;
  total: number;
  selectedId: string | null;
  disabled?: boolean;
  showResult?: boolean;
  compact?: boolean;
  onSelect: (choiceId: string) => void;
}) {
  return (
    <div className={`exercise-reading-sub${compact ? " exercise-reading-sub--compact" : ""}`}>
      <p className="exercise-reading-sub-label">
        Câu {index + 1}/{total}
      </p>
      <MultipleChoiceQuestion
        question={toMcqShape(sub)}
        selectedId={selectedId}
        disabled={disabled}
        showResult={showResult}
        onSelect={onSelect}
      />
      {showResult && sub.explanation?.trim() ? (
        <p className="exercise-reading-sub-explain">{sub.explanation}</p>
      ) : null}
    </div>
  );
}

export function ReadingComprehensionQuestion({
  question,
  subAnswers,
  disabled = false,
  showResult = false,
  isCorrect = false,
  onSelectSub,
}: ReadingComprehensionQuestionProps) {
  const isStepped = question.presentation === READING_PRESENTATION_STEPPED;
  const [stepIndex, setStepIndex] = useState(0);
  const subs = question.subQuestions;
  const scored = showResult ? scoreReadingComprehension(subs, subAnswers) : null;

  const safeStep = Math.min(stepIndex, Math.max(0, subs.length - 1));
  const currentSub = subs[safeStep];

  return (
    <div className={`exercise-reading${showResult ? (isCorrect ? " is-correct" : " is-wrong") : ""}`}>
      <ReadingPassageCard question={question} />

      {isStepped ? (
        <>
          {currentSub ? (
            <SubMcqBlock
              sub={currentSub}
              index={safeStep}
              total={subs.length}
              selectedId={subAnswers[currentSub.id] ?? null}
              disabled={disabled}
              showResult={showResult}
              onSelect={(choiceId) => onSelectSub(currentSub.id, choiceId)}
            />
          ) : null}
          {!showResult && subs.length > 1 ? (
            <div className="exercise-reading-step-nav">
              <button
                type="button"
                className="exercise-reading-step-btn"
                disabled={safeStep <= 0}
                onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
              >
                Câu trước
              </button>
              <div className="exercise-reading-step-dots">
                {subs.map((sub, index) => (
                  <button
                    key={sub.id}
                    type="button"
                    className={`exercise-reading-step-dot${
                      index === safeStep ? " is-active" : ""
                    }${subAnswers[sub.id] ? " is-answered" : ""}`}
                    aria-label={`Câu ${index + 1}`}
                    onClick={() => setStepIndex(index)}
                  />
                ))}
              </div>
              <button
                type="button"
                className="exercise-reading-step-btn"
                disabled={safeStep >= subs.length - 1}
                onClick={() => setStepIndex((i) => Math.min(subs.length - 1, i + 1))}
              >
                Câu sau
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <div className="exercise-reading-subs">
          {subs.map((sub, index) => (
            <SubMcqBlock
              key={sub.id}
              sub={sub}
              index={index}
              total={subs.length}
              selectedId={subAnswers[sub.id] ?? null}
              disabled={disabled}
              showResult={showResult}
              compact
              onSelect={(choiceId) => onSelectSub(sub.id, choiceId)}
            />
          ))}
        </div>
      )}

      {showResult ? (
        <p className="exercise-reading-reveal">
          Đúng {scored?.correctSubCount ?? 0}/{scored?.totalSubQuestions ?? 0} câu
        </p>
      ) : null}
    </div>
  );
}

type QuestionExplanationPanelProps = {
  explanation: string;
};

export function QuestionExplanationPanel({ explanation }: QuestionExplanationPanelProps) {
  return (
    <div className="exercise-explanation-panel">
      <p className="exercise-explanation-text">{explanation}</p>
    </div>
  );
}

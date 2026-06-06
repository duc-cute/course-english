import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HighlightOffOutlinedIcon from "@mui/icons-material/HighlightOffOutlined";

type QuestionFeedbackProps = {
  correct: boolean;
  explanation?: string;
};

export function QuestionFeedback({ correct, explanation }: QuestionFeedbackProps) {
  return (
    <div className={`exercise-feedback${correct ? " exercise-feedback--ok" : " exercise-feedback--wrong"}`}>
      <div className="exercise-feedback-title">
        {correct ? (
          <>
            <CheckCircleOutlineIcon fontSize="small" /> Đúng rồi!
          </>
        ) : (
          <>
            <HighlightOffOutlinedIcon fontSize="small" /> Chưa đúng
          </>
        )}
      </div>
      {explanation ? <p className="exercise-feedback-text">{explanation}</p> : null}
    </div>
  );
}

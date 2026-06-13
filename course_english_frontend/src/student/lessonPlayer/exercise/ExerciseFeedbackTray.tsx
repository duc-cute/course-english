import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HighlightOffOutlinedIcon from "@mui/icons-material/HighlightOffOutlined";

type ExerciseFeedbackTrayProps = {
  correct: boolean;
};

export function ExerciseFeedbackTray({ correct }: ExerciseFeedbackTrayProps) {
  return (
    <div
      className={`vq-exercise-feedback vq-exercise-feedback--${correct ? "ok" : "wrong"}`}
      role="status"
    >
      <p className="vq-exercise-feedback__title">
        {correct ? (
          <>
            <CheckCircleOutlineIcon sx={{ fontSize: 22 }} />
            Tuyệt vời!
          </>
        ) : (
          <>
            <HighlightOffOutlinedIcon sx={{ fontSize: 22 }} />
            Chưa đúng — thử lại lần sau nhé!
          </>
        )}
      </p>
      <p className="vq-exercise-feedback__hint">
        {correct ? "Bạn có thể xem giải thích rồi làm câu tiếp theo." : "Nhấn GIẢI THÍCH để xem đáp án chi tiết."}
      </p>
    </div>
  );
}

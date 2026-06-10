import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import type { ExerciseAnswerSnapshot } from "../exerciseSessionStorage";
import type { PreparedExerciseItem } from "./prepareExerciseItems";
import type { ListenChooseQuestion, ListenTypeQuestion, MatchingQuestion, MultipleChoiceQuestion, SpellingQuestion } from "./types";
import { ListenChooseQuestion as ListenChooseReview } from "./ListenChooseQuestion";
import { ListenTypeQuestion as ListenTypeReview } from "./ListenTypeQuestion";
import { SpellingQuestion as SpellingReview } from "./SpellingQuestion";
import { QuestionExplanationPanel } from "./QuestionExplanationPanel";

type ExerciseReviewScreenProps = {
  lessonTitle: string;
  items: PreparedExerciseItem[];
  answers: Record<string, ExerciseAnswerSnapshot>;
  onBack: () => void;
};

export function ExerciseReviewScreen({ lessonTitle, items, answers, onBack }: ExerciseReviewScreenProps) {
  return (
    <div className="exercise-review">
      <header className="exercise-review-head">
        <button type="button" className="exercise-review-back" onClick={onBack}>
          <ArrowBackIcon sx={{ fontSize: 20 }} />
          Quay lại kết quả
        </button>
        <div>
          <h2 className="exercise-review-title">Xem lại bài làm</h2>
          <p className="exercise-review-sub">{lessonTitle}</p>
        </div>
      </header>

      <ol className="exercise-review-list">
        {items.map((item, index) => {
          const question = item.displayQuestion;

          if (question.type === "MULTIPLE_CHOICE") {
            const mcq = question as MultipleChoiceQuestion;
            const answer = answers[mcq.id];
            const selectedId = answer?.selectedChoiceId ?? null;
            const isCorrect = answer?.correct === true;
            const answeredWrong = Boolean(selectedId && selectedId !== mcq.correctChoiceId);

            return (
              <li key={mcq.id} className={`exercise-review-item${isCorrect ? " is-correct" : " is-wrong"}`}>
                <div className="exercise-review-item-head">
                  <span className="exercise-review-item-num">Câu {index + 1}</span>
                  <span className={`exercise-review-item-badge${isCorrect ? " is-ok" : " is-bad"}`}>
                    {isCorrect ? (
                      <>
                        <CheckIcon sx={{ fontSize: 14 }} /> Đúng
                      </>
                    ) : (
                      <>
                        <CloseIcon sx={{ fontSize: 14 }} /> Sai
                      </>
                    )}
                  </span>
                </div>

                <p className="exercise-review-prompt">{mcq.prompt.text}</p>

                <div className="exercise-review-choices">
                  {mcq.choices.map((choice, choiceIndex) => {
                    const isSelected = selectedId === choice.id;
                    const isRight = choice.id === mcq.correctChoiceId;
                    let stateClass = "";

                    if (isRight && (isSelected || answeredWrong)) {
                      stateClass = " is-correct";
                    } else if (isSelected && !isRight) {
                      stateClass = " is-wrong";
                    } else if (isSelected) {
                      stateClass = " is-selected";
                    }

                    return (
                      <div key={choice.id} className={`exercise-review-choice${stateClass}`}>
                        <span className="exercise-review-choice-num">{choiceIndex + 1}</span>
                        <span className="exercise-review-choice-text">{choice.text}</span>
                        {isSelected ? <span className="exercise-review-choice-tag">Bạn chọn</span> : null}
                        {isRight ? <span className="exercise-review-choice-tag is-answer">Đáp án đúng</span> : null}
                      </div>
                    );
                  })}
                </div>

                {!selectedId ? (
                  <p className="exercise-review-missing">Không có dữ liệu lựa chọn cho câu này.</p>
                ) : null}

                {mcq.explanation?.trim() ? (
                  <div className="exercise-review-explain">
                    <QuestionExplanationPanel explanation={mcq.explanation} />
                  </div>
                ) : null}
              </li>
            );
          }

          if (question.type === "LISTEN_CHOOSE") {
            const listen = question as ListenChooseQuestion;
            const answer = answers[listen.id];
            const selectedId = answer?.selectedChoiceId ?? null;
            const isCorrect = answer?.correct === true;

            return (
              <li key={listen.id} className={`exercise-review-item${isCorrect ? " is-correct" : " is-wrong"}`}>
                <div className="exercise-review-item-head">
                  <span className="exercise-review-item-num">Câu {index + 1}</span>
                  <span className="exercise-review-item-type">Nghe chọn</span>
                  <span className={`exercise-review-item-badge${isCorrect ? " is-ok" : " is-bad"}`}>
                    {isCorrect ? (
                      <>
                        <CheckIcon sx={{ fontSize: 14 }} /> Đúng
                      </>
                    ) : (
                      <>
                        <CloseIcon sx={{ fontSize: 14 }} /> Sai
                      </>
                    )}
                  </span>
                </div>
                <ListenChooseReview
                  question={listen}
                  selectedId={selectedId}
                  showResult
                  onSelect={() => undefined}
                />
                {listen.explanation?.trim() ? (
                  <div className="exercise-review-explain">
                    <QuestionExplanationPanel explanation={listen.explanation} />
                  </div>
                ) : null}
              </li>
            );
          }

          if (question.type === "SPELLING") {
            const spelling = question as SpellingQuestion;
            const answer = answers[spelling.id];
            const isCorrect = answer?.correct === true;

            return (
              <li key={spelling.id} className={`exercise-review-item${isCorrect ? " is-correct" : " is-wrong"}`}>
                <div className="exercise-review-item-head">
                  <span className="exercise-review-item-num">Câu {index + 1}</span>
                  <span className="exercise-review-item-type">Gõ chính tả</span>
                  <span className={`exercise-review-item-badge${isCorrect ? " is-ok" : " is-bad"}`}>
                    {isCorrect ? (
                      <>
                        <CheckIcon sx={{ fontSize: 14 }} /> Đúng
                      </>
                    ) : (
                      <>
                        <CloseIcon sx={{ fontSize: 14 }} /> Sai
                      </>
                    )}
                  </span>
                </div>
                <SpellingReview
                  question={spelling}
                  value={answer?.typedAnswer ?? ""}
                  showResult
                  isCorrect={isCorrect}
                  onChange={() => undefined}
                />
                {spelling.explanation?.trim() ? (
                  <div className="exercise-review-explain">
                    <QuestionExplanationPanel explanation={spelling.explanation} />
                  </div>
                ) : null}
              </li>
            );
          }

          if (question.type === "LISTEN_TYPE") {
            const listenType = question as ListenTypeQuestion;
            const answer = answers[listenType.id];
            const isCorrect = answer?.correct === true;

            return (
              <li key={listenType.id} className={`exercise-review-item${isCorrect ? " is-correct" : " is-wrong"}`}>
                <div className="exercise-review-item-head">
                  <span className="exercise-review-item-num">Câu {index + 1}</span>
                  <span className="exercise-review-item-type">Nghe gõ</span>
                  <span className={`exercise-review-item-badge${isCorrect ? " is-ok" : " is-bad"}`}>
                    {isCorrect ? (
                      <>
                        <CheckIcon sx={{ fontSize: 14 }} /> Đúng
                      </>
                    ) : (
                      <>
                        <CloseIcon sx={{ fontSize: 14 }} /> Sai
                      </>
                    )}
                  </span>
                </div>
                <ListenTypeReview
                  question={listenType}
                  value={answer?.typedAnswer ?? ""}
                  showResult
                  isCorrect={isCorrect}
                  onChange={() => undefined}
                />
                {listenType.explanation?.trim() ? (
                  <div className="exercise-review-explain">
                    <QuestionExplanationPanel explanation={listenType.explanation} />
                  </div>
                ) : null}
              </li>
            );
          }

          if (question.type === "MATCHING") {
            const matching = question as MatchingQuestion;
            const answer = answers[matching.id];
            const selections = answer?.matchingSelections ?? {};
            const isCorrect = answer?.correct === true;
            const correctByLeft = Object.fromEntries(matching.pairs.map((pair) => [pair.left, pair.right]));

            return (
              <li key={matching.id} className={`exercise-review-item${isCorrect ? " is-correct" : " is-wrong"}`}>
                <div className="exercise-review-item-head">
                  <span className="exercise-review-item-num">Câu {index + 1}</span>
                  <span className="exercise-review-item-type">Ghép cặp</span>
                  <span className={`exercise-review-item-badge${isCorrect ? " is-ok" : " is-bad"}`}>
                    {isCorrect ? (
                      <>
                        <CheckIcon sx={{ fontSize: 14 }} /> Đúng
                      </>
                    ) : (
                      <>
                        <CloseIcon sx={{ fontSize: 14 }} /> Sai
                      </>
                    )}
                  </span>
                </div>

                {matching.prompt?.text ? (
                  <p className="exercise-review-prompt">{matching.prompt.text}</p>
                ) : null}

                <div className="exercise-review-matching">
                  {matching.pairs.map((pair) => {
                    const userRight = selections[pair.left];
                    const pairCorrect = userRight === pair.right;
                    return (
                      <div
                        key={pair.left}
                        className={`exercise-review-matching-row${pairCorrect ? " is-correct" : " is-wrong"}`}
                      >
                        <span className="exercise-review-matching-left">{pair.left}</span>
                        <span className="exercise-review-matching-arrow">→</span>
                        <span className="exercise-review-matching-user">{userRight ?? "—"}</span>
                        {!pairCorrect ? (
                          <>
                            <span className="exercise-review-matching-sep">·</span>
                            <span className="exercise-review-matching-answer">Đúng: {correctByLeft[pair.left]}</span>
                          </>
                        ) : null}
                      </div>
                    );
                  })}
                </div>

                {matching.explanation?.trim() ? (
                  <div className="exercise-review-explain">
                    <QuestionExplanationPanel explanation={matching.explanation} />
                  </div>
                ) : null}
              </li>
            );
          }

          return null;
        })}
      </ol>
    </div>
  );
}

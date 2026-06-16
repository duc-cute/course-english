import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import ReplayOutlinedIcon from "@mui/icons-material/ReplayOutlined";
import type { ExerciseAnswerSnapshot } from "../exerciseSessionStorage";
import type { PreparedExerciseItem } from "./prepareExerciseItems";
import type {
  FillBlankQuestion,
  GapFillMcqQuestion,
  ReadingComprehensionQuestion,
  ListenChooseQuestion,
  ListenTypeQuestion,
  MatchingQuestion,
  MultipleChoiceQuestion,
  ReorderSentenceQuestion,
  SpellingQuestion,
  TrueFalseQuestion,
} from "./types";
import { TrueFalseQuestion as TrueFalseReview, trueFalseCorrectChoiceId } from "./TrueFalseQuestion";
import { VqButton } from "../../ui/VqButton";
import { FillBlankQuestion as FillBlankReview } from "./FillBlankQuestion";
import { GapFillMcqQuestion as GapFillMcqReview } from "./GapFillMcqQuestion";
import { ReadingComprehensionQuestion as ReadingReview } from "./ReadingComprehensionQuestion";
import { ReorderSentenceQuestion as ReorderReview } from "./ReorderSentenceQuestion";
import { ListenChooseQuestion as ListenChooseReview } from "./ListenChooseQuestion";
import { ListenTypeQuestion as ListenTypeReview } from "./ListenTypeQuestion";
import { SpellingQuestion as SpellingReview } from "./SpellingQuestion";
import { QuestionExplanationPanel } from "./QuestionExplanationPanel";

type ExerciseReviewScreenProps = {
  lessonTitle: string;
  items: PreparedExerciseItem[];
  answers: Record<string, ExerciseAnswerSnapshot>;
  wrongCount?: number;
  onRetryWrong?: () => void;
  onBack: () => void;
};

export function ExerciseReviewScreen({
  lessonTitle,
  items,
  answers,
  wrongCount: wrongCountProp,
  onRetryWrong,
  onBack,
}: ExerciseReviewScreenProps) {
  const wrongCount = wrongCountProp ?? Object.values(answers).filter((a) => !a.correct).length;

  return (
    <div className="vq-exercise-review exercise-review">
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

          if (question.type === "FILL_BLANK") {
            const fillBlank = question as FillBlankQuestion;
            const answer = answers[fillBlank.id];
            const isCorrect = answer?.correct === true;

            return (
              <li key={fillBlank.id} className={`exercise-review-item${isCorrect ? " is-correct" : " is-wrong"}`}>
                <div className="exercise-review-item-head">
                  <span className="exercise-review-item-num">Câu {index + 1}</span>
                  <span className="exercise-review-item-type">Điền khuyết</span>
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
                <FillBlankReview
                  question={fillBlank}
                  answers={answer?.fillBlankAnswers ?? {}}
                  showResult
                  isCorrect={isCorrect}
                  onChange={() => undefined}
                />
                {fillBlank.explanation?.trim() ? (
                  <div className="exercise-review-explain">
                    <QuestionExplanationPanel explanation={fillBlank.explanation} />
                  </div>
                ) : null}
              </li>
            );
          }

          if (question.type === "GAP_FILL_MCQ") {
            const gapFill = question as GapFillMcqQuestion;
            const answer = answers[gapFill.id];
            const isCorrect = answer?.correct === true;
            const partialLabel =
              answer?.correctBlankCount != null && answer?.totalBlanks != null
                ? `${answer.correctBlankCount}/${answer.totalBlanks} ô`
                : isCorrect
                  ? "Đúng"
                  : "Sai";

            return (
              <li key={gapFill.id} className={`exercise-review-item${isCorrect ? " is-correct" : " is-wrong"}`}>
                <div className="exercise-review-item-head">
                  <span className="exercise-review-item-num">Câu {index + 1}</span>
                  <span className="exercise-review-item-type">Chọn điền khuyết</span>
                  <span className={`exercise-review-item-badge${isCorrect ? " is-ok" : " is-bad"}`}>
                    {isCorrect ? (
                      <>
                        <CheckIcon sx={{ fontSize: 14 }} /> {partialLabel}
                      </>
                    ) : (
                      <>
                        <CloseIcon sx={{ fontSize: 14 }} /> {partialLabel}
                      </>
                    )}
                  </span>
                </div>
                <GapFillMcqReview
                  question={gapFill}
                  answers={answer?.gapFillMcqAnswers ?? {}}
                  showResult
                  isCorrect={isCorrect}
                  onChange={() => undefined}
                />
                {gapFill.explanation?.trim() ? (
                  <div className="exercise-review-explain">
                    <QuestionExplanationPanel explanation={gapFill.explanation} />
                  </div>
                ) : null}
              </li>
            );
          }

          if (question.type === "READING_COMPREHENSION") {
            const reading = question as ReadingComprehensionQuestion;
            const answer = answers[reading.id];
            const isCorrect = answer?.correct === true;
            const partialLabel =
              answer?.correctSubCount != null && answer?.totalSubQuestions != null
                ? `${answer.correctSubCount}/${answer.totalSubQuestions} câu`
                : isCorrect
                  ? "Đúng"
                  : "Sai";

            return (
              <li key={reading.id} className={`exercise-review-item${isCorrect ? " is-correct" : " is-wrong"}`}>
                <div className="exercise-review-item-head">
                  <span className="exercise-review-item-num">Câu {index + 1}</span>
                  <span className="exercise-review-item-type">Đọc hiểu</span>
                  <span className={`exercise-review-item-badge${isCorrect ? " is-ok" : " is-bad"}`}>
                    {isCorrect ? (
                      <>
                        <CheckIcon sx={{ fontSize: 14 }} /> {partialLabel}
                      </>
                    ) : (
                      <>
                        <CloseIcon sx={{ fontSize: 14 }} /> {partialLabel}
                      </>
                    )}
                  </span>
                </div>
                <ReadingReview
                  question={reading}
                  subAnswers={answer?.readingSubAnswers ?? {}}
                  showResult
                  isCorrect={isCorrect}
                  onSelectSub={() => undefined}
                />
                {reading.explanation?.trim() ? (
                  <div className="exercise-review-explain">
                    <QuestionExplanationPanel explanation={reading.explanation} />
                  </div>
                ) : null}
              </li>
            );
          }

          if (question.type === "REORDER_SENTENCE") {
            const reorder = question as ReorderSentenceQuestion;
            const answer = answers[reorder.id];
            const isCorrect = answer?.correct === true;

            return (
              <li key={reorder.id} className={`exercise-review-item${isCorrect ? " is-correct" : " is-wrong"}`}>
                <div className="exercise-review-item-head">
                  <span className="exercise-review-item-num">Câu {index + 1}</span>
                  <span className="exercise-review-item-type">Sắp xếp câu</span>
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
                <ReorderReview
                  question={reorder}
                  selectedOrder={answer?.reorderTokenOrder ?? []}
                  showResult
                  isCorrect={isCorrect}
                  onTapPool={() => undefined}
                  onTapSentence={() => undefined}
                />
                {reorder.explanation?.trim() ? (
                  <div className="exercise-review-explain">
                    <QuestionExplanationPanel explanation={reorder.explanation} />
                  </div>
                ) : null}
              </li>
            );
          }

          if (question.type === "TRUE_FALSE") {
            const tf = question as TrueFalseQuestion;
            const answer = answers[tf.id];
            const selectedId = answer?.selectedChoiceId ?? null;
            const isCorrect = answer?.correct === true;
            const correctId = trueFalseCorrectChoiceId(tf);

            return (
              <li key={tf.id} className={`exercise-review-item${isCorrect ? " is-correct" : " is-wrong"}`}>
                <div className="exercise-review-item-head">
                  <span className="exercise-review-item-num">Câu {index + 1}</span>
                  <span className="exercise-review-item-type">Đúng/Sai</span>
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
                <TrueFalseReview
                  question={tf}
                  selectedId={selectedId}
                  showResult
                  onSelect={() => undefined}
                />
                {!selectedId ? (
                  <p className="exercise-review-missing">Không có dữ liệu lựa chọn cho câu này.</p>
                ) : null}
                {!isCorrect && selectedId ? (
                  <p className="exercise-review-tf-answer">
                    Đáp án đúng: <strong>{correctId === "true" ? "Đúng" : "Sai"}</strong>
                  </p>
                ) : null}
                {tf.explanation?.trim() ? (
                  <div className="exercise-review-explain">
                    <QuestionExplanationPanel explanation={tf.explanation} />
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

      {onRetryWrong && wrongCount > 0 ? (
        <footer className="vq-exercise-review__footer">
          <VqButton fullWidth onClick={onRetryWrong}>
            <ReplayOutlinedIcon sx={{ fontSize: 20 }} />
            Luyện lại {wrongCount} câu sai
          </VqButton>
        </footer>
      ) : null}
    </div>
  );
}

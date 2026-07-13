import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import { Alert, Button } from "@mui/material";
import { useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { studentRoutePaths } from "../../shared/constants/paths";
import { useFeatureFlags } from "../../shared/featureFlags/useFeatureFlags";
import { ExercisePlayer } from "../lessonPlayer/exercise/ExercisePlayer";
import { buildVocabPracticeSession } from "./buildVocabPracticeSession";
import { VocabWordList } from "./VocabWordList";
import { toResolvedVocabularyItems } from "./vocabUtils";
import { useVocabSetDetail } from "./useVocabSetDetail";

export function VocabSetPracticePage() {
  const { setId } = useParams<{ setId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const mode = searchParams.get("mode") === "practice" ? "practice" : "learn";
  const assignmentId = searchParams.get("assignmentId");
  const { set, loading, error } = useVocabSetDetail(setId);
  const { flags } = useFeatureFlags();
  const [sessionKey, setSessionKey] = useState(0);

  const items = useMemo(
    () => toResolvedVocabularyItems(set?.items ?? []),
    [set?.items],
  );

  const practiceSession = useMemo(() => {
    if (mode !== "practice" || items.length === 0) return null;
    return buildVocabPracticeSession(
      items.map((item) => ({
        id: item.id,
        wordEn: item.wordEn,
        meaningVi: item.meaningVi,
        audioUkUrl: item.audioUkUrl,
        audioUsUrl: item.audioUsUrl,
        partOfSpeech: item.partOfSpeech,
        phonetic: item.phonetic,
      })),
      {
        title: set?.title ? `Luyện: ${set.title}` : "Luyện tập từ vựng",
        audioAccent: flags.vocabularyAudioAccent,
        maxQuestions: flags.vocabularyPracticeMaxQuestions,
        passScorePercent: flags.vocabularyPracticePassScore,
        sessionKey,
      },
    );
  }, [
    mode,
    items,
    set?.title,
    flags.vocabularyAudioAccent,
    flags.vocabularyPracticeMaxQuestions,
    flags.vocabularyPracticePassScore,
    sessionKey,
  ]);

  const startPractice = () => {
    setSessionKey((k) => k + 1);
    const next = new URLSearchParams(searchParams);
    next.set("mode", "practice");
    setSearchParams(next, { replace: false });
  };

  const backToLearn = () => {
    const next = new URLSearchParams();
    if (assignmentId) next.set("assignmentId", assignmentId);
    setSearchParams(next, { replace: true });
  };

  return (
    <div className={`vq-page vq-vocab-page vq-vocab-practice${mode === "practice" ? " is-playing" : ""}`}>
      <Link to={studentRoutePaths.vocab} className="vq-vocab-practice__back">
        <ArrowBackIcon sx={{ fontSize: 20 }} />
        Quay lại danh sách
      </Link>

      {loading ? (
        <div className="vq-vocab-practice__skeleton" aria-hidden />
      ) : error ? (
        <Alert severity="error" sx={{ borderRadius: "14px" }}>
          {error}
        </Alert>
      ) : !set || items.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: "14px" }}>
          Bộ từ vựng không có từ nào để ôn tập.
        </Alert>
      ) : mode === "practice" && practiceSession ? (
        <>
          <div className="vq-vocab-practice__practice-bar">
            <button type="button" className="vq-vocab-practice__back" onClick={backToLearn}>
              <ArrowBackIcon sx={{ fontSize: 20 }} />
              Về danh sách từ
            </button>
            {practiceSession.warnings.length > 0 ? (
              <Alert severity="info" sx={{ borderRadius: "12px", flex: 1 }}>
                {practiceSession.warnings[0]}
              </Alert>
            ) : null}
          </div>
          {practiceSession.practiceBlocks.length === 0 ? (
            <Alert severity="warning" sx={{ borderRadius: "14px" }}>
              Không tạo được bài luyện. Thử lại hoặc kiểm tra bộ từ có đủ mục.
            </Alert>
          ) : (
            <ExercisePlayer
              key={practiceSession.sessionId}
              lessonId={practiceSession.sessionId}
              lessonTitle={set.title}
              subjectName={set.subjectName}
              practiceBlocks={practiceSession.practiceBlocks}
              persistAttempts
              vocabularySetId={set.id}
              assignmentId={assignmentId}
              onBackToLessons={backToLearn}
              onContinueStudy={backToLearn}
            />
          )}
        </>
      ) : (
        <>
          <header className="vq-vocab-practice__head vq-vocab-practice__head--with-cta">
            <div className="vq-vocab-practice__head-text">
              <h1 className="vq-vocab-practice__title">{set.title}</h1>
              {set.subjectName ? (
                <p className="vq-vocab-practice__subject">{set.subjectName}</p>
              ) : null}
              {set.description?.trim() ? (
                <p className="vq-vocab-practice__desc">{set.description}</p>
              ) : null}
            </div>
            <Button
              variant="contained"
              className="vq-vocab-practice__cta"
              startIcon={<FitnessCenterIcon />}
              onClick={startPractice}
            >
              Luyện tập
            </Button>
          </header>

          <p className="vq-vocab-practice__learn-hint">
            Xem danh sách từ bên dưới, hoặc bấm <strong>Luyện tập</strong> để làm bài ngay (trắc
            nghiệm, ghép cặp, nghe, chính tả…).
          </p>

          <VocabWordList items={items} />
        </>
      )}
    </div>
  );
}

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import SchoolIcon from "@mui/icons-material/School";
import SearchIcon from "@mui/icons-material/Search";
import StarIcon from "@mui/icons-material/Star";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import { Alert, InputAdornment, TextField } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { resolveStorageAssetUrl } from "../../shared/api/file";
import {
  apiGetStudentTopicSets,
  type VocabularyTopicRecord,
} from "../../shared/api/vocabularyJourney";
import { isVocabPracticePassed } from "../../shared/api/vocabularyPracticeAttempt";
import {
  apiGetVocabularySetById,
  type VocabularySetRecord,
} from "../../shared/api/vocabularySet";
import { studentRoutePaths } from "../../shared/constants/paths";
import { useVocabPracticeSummary } from "./useVocabPracticeSummary";
import { toResolvedVocabularyItems } from "./vocabUtils";

export function VocabTopicSetsPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const [topic, setTopic] = useState<VocabularyTopicRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [setsDetails, setSetsDetails] = useState<VocabularySetRecord[]>([]);
  const [loadingSets, setLoadingSets] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!topicId) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    void apiGetStudentTopicSets(topicId)
      .then((data) => {
        if (!cancelled) setTopic(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setTopic(null);
          setError((err as { message?: string })?.message || "Không tải được chủ đề.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [topicId]);

  const sets: VocabularySetRecord[] = useMemo(
    () =>
      (topic?.members ?? []).map((m) => ({
        id: m.vocabularySetId,
        title: m.vocabularySetTitle || "Bộ từ",
        description: m.description,
        coverImageUrl: m.coverImageUrl,
        subjectName: m.subjectName,
        status: (m.status as VocabularySetRecord["status"]) || "PUBLISHED",
        itemCount: m.itemCount,
      })),
    [topic],
  );

  const setIds = useMemo(() => sets.map((s) => s.id), [sets]);
  const { bySetId } = useVocabPracticeSummary(setIds);

  useEffect(() => {
    if (sets.length === 0) {
      setSetsDetails([]);
      return;
    }
    let cancelled = false;
    setLoadingSets(true);
    Promise.all(
      sets.map((s) =>
        apiGetVocabularySetById(s.id)
          .then((res) => res.result ?? res.data)
          .catch(() => null)
      )
    )
      .then((results) => {
        if (!cancelled) {
          const valid = results.filter((r): r is VocabularySetRecord => !!r && !!r.id);
          setSetsDetails(valid);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingSets(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sets]);

  const allWords = useMemo(() => {
    return setsDetails.flatMap((set) => {
      const resolvedItems = toResolvedVocabularyItems(set.items ?? []);
      return resolvedItems.map((item) => ({
        ...item,
        setId: set.id,
        setTitle: set.title,
      }));
    });
  }, [setsDetails]);

  const filteredWords = useMemo(() => {
    if (!searchQuery.trim()) return allWords;
    const query = searchQuery.toLowerCase().trim();
    return allWords.filter(
      (w) =>
        w.wordEn.toLowerCase().includes(query) ||
        w.meaningVi.toLowerCase().includes(query)
    );
  }, [allWords, searchQuery]);

  const completedSetsCount = useMemo(() => {
    return sets.filter((s) => isVocabPracticePassed(bySetId[s.id]?.best)).length;
  }, [sets, bySetId]);

  const progressPercent = useMemo(() => {
    if (sets.length === 0) return 0;
    return Math.round((completedSetsCount / sets.length) * 100);
  }, [sets, completedSetsCount]);

  const estimatedMinutes = useMemo(() => {
    // Roughly 40s per word study time
    return Math.max(5, Math.ceil((allWords.length * 40) / 60));
  }, [allWords]);

  const xpReward = useMemo(() => {
    // 10 XP per word
    return allWords.length * 10;
  }, [allWords]);

  const journeyAssets = useMemo(() => [
    "/images/journey/journey_forest.png",
    "/images/journey/journey_ocean.png",
    "/images/journey/journey_city.png",
    "/images/journey/journey_academy.png",
    "/images/journey/journey_mountain.png",
    "/images/journey/journey_space.png",
    "/images/journey/journey_desert.png",
    "/images/journey/journey_garden.png",
    "/images/journey/journey_castle.png",
    "/images/journey/journey_beach.png",
    "/images/journey/journey_jungle.png",
    "/images/journey/journey_volcano.png",
  ], []);

  const topicCoverUrl = useMemo(() => {
    if (!topic) return "";
    if (topic.coverImageUrl) return resolveStorageAssetUrl(topic.coverImageUrl);
    const order = topic.displayOrder ?? 0;
    return journeyAssets[order % journeyAssets.length];
  }, [topic, journeyAssets]);

  const getWordStatus = (setId: string) => {
    const summary = bySetId[setId];
    if (!summary?.best) return "Need study";
    if (isVocabPracticePassed(summary.best)) return "Mastered";
    return "Learning";
  };

  const playAudio = (url?: string) => {
    if (!url) return;
    const audio = new Audio(resolveStorageAssetUrl(url));
    void audio.play().catch((err) => console.error("Phát âm thanh thất bại:", err));
  };

  const backHref = topic?.journeyId
    ? studentRoutePaths.vocabJourney(topic.journeyId)
    : studentRoutePaths.vocab;

  return (
    <div className="vq-page vq-vocab-page">
      <Link to={backHref} className="vq-vocab-practice__back" style={{ marginBottom: "20px" }}>
        <ArrowBackIcon sx={{ fontSize: 20 }} />
        Quay lại Journey
      </Link>

      {loading ? (
        <div className="vq-vocab-practice__skeleton" aria-hidden />
      ) : error ? (
        <Alert severity="error" sx={{ borderRadius: "14px" }}>
          {error}
        </Alert>
      ) : !topic ? (
        <Alert severity="info" sx={{ borderRadius: "14px" }}>
          Không tìm thấy chủ đề.
        </Alert>
      ) : (
        <div className="vq-vocab-topic-dashboard">
          {/* Left Column: Topic Overview */}
          <div className="vq-vocab-topic-left">
            <div className="vq-vocab-topic-card">
              <div className="vq-vocab-topic-card__hero">
                <img
                  src={topicCoverUrl}
                  alt={topic.title}
                  className="vq-vocab-topic-card__img"
                />
                <div className="vq-vocab-topic-card__header">
                  <h1 className="vq-vocab-topic-card__title">{topic.title}</h1>
                  {topic.subtitle ? (
                    <p className="vq-vocab-topic-card__subtitle">{topic.subtitle}</p>
                  ) : (
                    <p className="vq-vocab-topic-card__subtitle">
                      Học bộ từ và thực hành ôn luyện để thành thạo từ vựng.
                    </p>
                  )}
                </div>
              </div>

              <div className="vq-vocab-topic-card__stats">
                <div className="vq-vocab-topic-card__stat-item">
                  <strong>{allWords.length || topic.setCount}</strong>
                  <span>Từ vựng</span>
                </div>
                <div className="vq-vocab-topic-card__stat-item">
                  <strong>{estimatedMinutes}</strong>
                  <span>Phút học</span>
                </div>
                <div className="vq-vocab-topic-card__stat-item">
                  <strong>+{xpReward}</strong>
                  <span>XP thưởng</span>
                </div>
                <div className="vq-vocab-topic-card__stat-item">
                  <div className="vq-vocab-topic-card__stars">
                    <StarIcon sx={{ fontSize: 14, color: "#ffb300" }} />
                    <StarIcon sx={{ fontSize: 14, color: "#ffb300" }} />
                    <StarIcon sx={{ fontSize: 14, color: "#ffb300" }} />
                  </div>
                  <span>Độ khó</span>
                </div>
              </div>

              <div className="vq-vocab-topic-card__progress-container">
                <div className="vq-vocab-topic-card__progress-label">
                  <span>Tiến độ chủ đề</span>
                  <strong>{progressPercent}%</strong>
                </div>
                <div className="vq-vocab-topic-card__progress-track">
                  <div
                    className="vq-vocab-topic-card__progress-bar"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Mascot Tip */}
            <div className="vq-vocab-topic-mascot">
              <img
                src="/images/study-owl-mascot.png"
                alt="Mascot"
                className="vq-vocab-topic-mascot__img"
              />
              <div className="vq-vocab-topic-mascot__speech">
                <p>
                  <strong>Emma gợi ý:</strong> Chào bạn! Bạn đã vượt qua{" "}
                  <strong>{completedSetsCount}</strong> trên tổng số{" "}
                  <strong>{sets.length}</strong> bộ từ của chủ đề này. Hãy ôn luyện để ghi nhớ lâu hơn nhé!
                </p>
              </div>
            </div>

            {/* Sets List */}
            <div className="vq-vocab-topic-sets">
              <h3 className="vq-vocab-topic-sets__title">Bộ từ vựng trong chủ đề</h3>
              {sets.length === 0 ? (
                <div className="vq-lessons-empty">
                  <p>Chưa có bộ từ nào.</p>
                </div>
              ) : (
                <div className="vq-vocab-topic-sets__list">
                  {sets.map((set) => {
                    const passed = isVocabPracticePassed(bySetId[set.id]?.best);
                    const bestScore = bySetId[set.id]?.best?.scorePercent;

                    return (
                      <div key={set.id} className="vq-vocab-topic-set-row">
                        <div className="vq-vocab-topic-set-row__info">
                          <h4>{set.title}</h4>
                          <div className="vq-vocab-topic-set-row__meta">
                            <span>{set.itemCount} từ</span>
                            {bestScore !== undefined ? (
                              <span className={`vq-vocab-topic-set-row__score${passed ? " is-passed" : ""}`}>
                                {passed ? "Đạt" : "Chưa đạt"} · {bestScore}%
                              </span>
                            ) : (
                              <span className="vq-vocab-topic-set-row__score">Chưa học</span>
                            )}
                          </div>
                        </div>
                        <div className="vq-vocab-topic-set-row__actions">
                          <Link
                            to={`${studentRoutePaths.vocabSet(set.id)}?mode=learn`}
                            className="vq-vocab-topic-set-row__btn-learn"
                          >
                            <SchoolIcon sx={{ fontSize: 16 }} />
                            Học từ
                          </Link>
                          <Link
                            to={`${studentRoutePaths.vocabSet(set.id)}?mode=practice`}
                            className="vq-vocab-topic-set-row__btn-practice"
                          >
                            <FitnessCenterIcon sx={{ fontSize: 16 }} />
                            Luyện tập
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Words details list */}
          <div className="vq-vocab-topic-right">
            <div className="vq-vocab-topic-words-card">
              <div className="vq-vocab-topic-words-header">
                <h3>Chi tiết từ vựng ({filteredWords.length})</h3>
                <TextField
                  size="small"
                  placeholder="Tìm kiếm từ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: "text.secondary", fontSize: 20 }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{
                    width: { xs: "100%", sm: "240px" },
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "9999px",
                      backgroundColor: "#f5f5f5",
                      paddingLeft: "12px",
                      "& fieldset": { border: "none" },
                    },
                  }}
                />
              </div>

              {loadingSets ? (
                <div className="vq-vocab-practice__skeleton" aria-hidden />
              ) : filteredWords.length === 0 ? (
                <div className="vq-vocab-topic-words__empty">
                  <p>Không tìm thấy từ vựng nào.</p>
                </div>
              ) : (
                <div className="vq-vocab-topic-words__list">
                  {filteredWords.map((word) => {
                    const wordStatus = getWordStatus(word.setId);
                    let badgeColorClass = "status-need-study";
                    let badgeText = "Cần học";
                    if (wordStatus === "Mastered") {
                      badgeColorClass = "status-mastered";
                      badgeText = "Thành thạo";
                    } else if (wordStatus === "Learning") {
                      badgeColorClass = "status-learning";
                      badgeText = "Đang học";
                    }

                    return (
                      <div key={word.id} className="vq-vocab-topic-word-row">
                        <div className="vq-vocab-topic-word-row__main">
                          <div className="vq-vocab-topic-word-row__title-wrap">
                            <strong className="vq-vocab-topic-word-row__word">{word.wordEn}</strong>
                            {word.phonetic ? (
                              <span className="vq-vocab-topic-word-row__phonetic">{word.phonetic}</span>
                            ) : null}
                          </div>
                          <div className="vq-vocab-topic-word-row__mean-wrap">
                            <span className="vq-vocab-topic-word-row__pos">{word.partOfSpeech || "n."}</span>
                            <span className="vq-vocab-topic-word-row__meaning">{word.meaningVi}</span>
                          </div>
                          {word.exampleSentence ? (
                            <p className="vq-vocab-topic-word-row__example">
                              <em>Ví dụ:</em> {word.exampleSentence}
                            </p>
                          ) : null}
                        </div>

                        <div className="vq-vocab-topic-word-row__actions">
                          <span className={`vq-vocab-topic-word-row__badge ${badgeColorClass}`}>
                            {badgeText}
                          </span>
                          <button
                            type="button"
                            className="vq-vocab-topic-word-row__btn-play"
                            onClick={() => playAudio(word.audioUsUrl || word.audioUkUrl)}
                            disabled={!word.audioUsUrl && !word.audioUkUrl}
                            title="Nghe phát âm"
                          >
                            <VolumeUpIcon sx={{ fontSize: 18 }} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

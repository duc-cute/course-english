import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ExploreOutlinedIcon from "@mui/icons-material/ExploreOutlined";
import { Alert } from "@mui/material";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  apiGetStudentVocabJourney,
  type VocabularyJourneyRecord,
  type VocabularyTopicRecord,
} from "../../shared/api/vocabularyJourney";
import { isVocabPracticePassed } from "../../shared/api/vocabularyPracticeAttempt";
import { studentRoutePaths } from "../../shared/constants/paths";
import { useVocabPracticeSummary } from "./useVocabPracticeSummary";

function topicSetIds(topic: VocabularyTopicRecord): string[] {
  return (topic.members ?? [])
    .map((m) => m.vocabularySetId)
    .filter(Boolean);
}

const JOURNEY_ASSETS = [
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
] as const;

export function VocabExploreJourneyPage() {
  const { journeyId } = useParams<{ journeyId: string }>();
  const navigate = useNavigate();
  const [journey, setJourney] = useState<VocabularyJourneyRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!journeyId) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    void apiGetStudentVocabJourney(journeyId)
      .then((data) => {
        if (!cancelled) setJourney(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setJourney(null);
          setError((err as { message?: string })?.message || "Không tải được journey.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [journeyId]);

  const topics: VocabularyTopicRecord[] = journey?.topics ?? [];

  const allSetIds = useMemo(
    () => topics.flatMap((t) => topicSetIds(t)),
    [topics],
  );
  const { bySetId } = useVocabPracticeSummary(allSetIds);

  const isTopicCompleted = (topic: VocabularyTopicRecord): boolean => {
    const ids = topicSetIds(topic);
    if (ids.length === 0) return false;
    return ids.every((id) => isVocabPracticePassed(bySetId[id]?.best));
  };

  const colWidth = 220;
  const gap = 80;
  const itemWidth = colWidth + gap;
  const totalWidth = topics.length > 0 ? (topics.length - 1) * itemWidth + colWidth : 0;
  const svgHeight = 240;
  const mobileSvgHeight = topics.length > 0 ? (topics.length - 1) * 170 + 200 : 0;

  const segments = useMemo(() => {
    const list: { d: string; color: string }[] = [];
    for (let i = 1; i < topics.length; i++) {
      const prevCompleted = isTopicCompleted(topics[i - 1]);
      const currentCompleted = isTopicCompleted(topics[i]);

      const x1 = (i - 1) * itemWidth + colWidth / 2;
      const y1 = (i - 1) % 2 === 0 ? 110 : 160;
      const x2 = i * itemWidth + colWidth / 2;
      const y2 = i % 2 === 0 ? 110 : 160;
      const d = `M ${x1} ${y1} C ${x1 + itemWidth * 0.4} ${y1}, ${x2 - itemWidth * 0.4} ${y2}, ${x2} ${y2}`;

      let color = "#e0e0e0";
      if (prevCompleted && currentCompleted) {
        color = "#4caf50";
      } else if (prevCompleted) {
        color = topics[i].themeColor || "var(--vq-primary, #1976d2)";
      }
      list.push({ d, color });
    }
    return list;
  }, [topics, bySetId, itemWidth, colWidth]);

  const mobileSegments = useMemo(() => {
    const list: { d: string; color: string }[] = [];
    for (let i = 1; i < topics.length; i++) {
      const prevCompleted = isTopicCompleted(topics[i - 1]);
      const currentCompleted = isTopicCompleted(topics[i]);

      const x1 = (i - 1) % 2 === 0 ? 90 : 250;
      const y1 = (i - 1) * 170 + 75;
      const x2 = i % 2 === 0 ? 90 : 250;
      const y2 = i * 170 + 75;
      const d = `M ${x1} ${y1} C ${x1} ${y1 + 75}, ${x2} ${y2 - 75}, ${x2} ${y2}`;

      let color = "#e0e0e0";
      if (prevCompleted && currentCompleted) {
        color = "#4caf50";
      } else if (prevCompleted) {
        color = topics[i].themeColor || "var(--vq-primary, #1976d2)";
      }
      list.push({ d, color });
    }
    return list;
  }, [topics, bySetId]);

  return (
    <div className="vq-page vq-vocab-page vq-vocab-journey">
      <Link to={studentRoutePaths.vocab} className="vq-vocab-practice__back">
        <ArrowBackIcon sx={{ fontSize: 20 }} />
        Quay lại Khám phá
      </Link>

      {loading ? (
        <div className="vq-vocab-practice__skeleton" aria-hidden />
      ) : error ? (
        <Alert severity="error" sx={{ borderRadius: "14px" }}>
          {error}
        </Alert>
      ) : !journey ? (
        <Alert severity="info" sx={{ borderRadius: "14px" }}>
          Không tìm thấy journey.
        </Alert>
      ) : (
        <>
          <header className="vq-vocab-journey__header">
            <div className="vq-vocab-journey__header-title-row">
              <ExploreOutlinedIcon
                className="vq-vocab-journey__header-icon"
                sx={{ fontSize: 30, color: "var(--vq-primary)" }}
              />
              <h1 className="vq-page-title">{journey.title}</h1>
            </div>
            {journey.description?.trim() ? (
              <p className="vq-page-subtitle">{journey.description}</p>
            ) : (
              <p className="vq-page-subtitle">Chọn một chủ đề để xem bộ từ và luyện tập.</p>
            )}
          </header>

          {topics.length === 0 ? (
            <div className="vq-lessons-empty">
              <p>Chưa có chủ đề nào được xuất bản.</p>
              <span>Giáo viên cần publish topic trong journey này.</span>
            </div>
          ) : (
            <div className="vq-vocab-journey__path-wrapper">
              <svg
                className="vq-vocab-journey__svg-path is-desktop"
                width={totalWidth}
                height={svgHeight}
                viewBox={`0 0 ${totalWidth} ${svgHeight}`}
                aria-hidden="true"
              >
                {segments.map((seg, idx) => (
                  <path
                    key={idx}
                    d={seg.d}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth="6"
                    strokeDasharray="10 10"
                    strokeLinecap="round"
                    style={{ transition: "stroke 0.3s ease" }}
                  />
                ))}
              </svg>

              <svg
                className="vq-vocab-journey__svg-path is-mobile"
                width="340"
                height={mobileSvgHeight}
                viewBox={`0 0 340 ${mobileSvgHeight}`}
                aria-hidden="true"
              >
                {mobileSegments.map((seg, idx) => (
                  <path
                    key={idx}
                    d={seg.d}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth="6"
                    strokeDasharray="10 10"
                    strokeLinecap="round"
                    style={{ transition: "stroke 0.3s ease" }}
                  />
                ))}
              </svg>

              <div
                className="vq-vocab-journey__path"
                role="list"
                style={
                  {
                    "--vq-path-mobile-height": `${(topics.length - 1) * 170 + 200}px`,
                  } as CSSProperties
                }
              >
                {topics.map((topic, index) => {
                  const completed = isTopicCompleted(topic);
                  const imageUrl =
                    topic.coverImageUrl || JOURNEY_ASSETS[index % JOURNEY_ASSETS.length];

                  return (
                    <div
                      key={topic.id}
                      className="vq-vocab-journey__node-slot"
                      style={
                        {
                          ["--vq-node-mobile-left" as string]: `${index % 2 === 0 ? 10 : 170}px`,
                          ["--vq-node-mobile-top" as string]: `${index * 170}px`,
                        } as CSSProperties
                      }
                    >
                      <button
                        type="button"
                        role="listitem"
                        className={`vq-vocab-journey__node${completed ? " is-completed" : ""}`}
                        style={
                          {
                            ["--vq-topic-accent" as string]: topic.themeColor || undefined,
                            animationDelay: `${index * 60}ms`,
                          } as CSSProperties
                        }
                        onClick={() => navigate(studentRoutePaths.vocabTopic(topic.id))}
                      >
                        <div className="vq-vocab-journey__node-island">
                          <img
                            src={imageUrl}
                            alt=""
                            className="vq-vocab-journey__node-img"
                          />
                        </div>

                        <div className="vq-vocab-journey__node-capsule-container">
                          <div className="vq-vocab-journey__node-capsule">
                            <strong>{topic.title}</strong>
                          </div>

                          <div className="vq-vocab-journey__node-status">
                            {completed ? (
                              <CheckCircleIcon
                                className="vq-vocab-journey__icon-completed"
                                sx={{ fontSize: 22 }}
                              />
                            ) : (
                              <span className="vq-vocab-journey__active-indicator" />
                            )}
                          </div>
                        </div>

                        <div className="vq-vocab-journey__node-count">
                          {completed
                            ? "Đã luyện xong"
                            : `${topic.setCount ?? topicSetIds(topic).length} bộ từ`}
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

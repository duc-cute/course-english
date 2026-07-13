import ExploreOutlinedIcon from "@mui/icons-material/ExploreOutlined";
import { Alert } from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  apiGetStudentVocabJourneys,
  type VocabularyJourneyRecord,
} from "../../shared/api/vocabularyJourney";
import { studentRoutePaths } from "../../shared/constants/paths";

type VocabExploreTabProps = {
  showNoEnrollment: boolean;
};

export function VocabExploreTab({ showNoEnrollment }: VocabExploreTabProps) {
  const navigate = useNavigate();
  const [journeys, setJourneys] = useState<VocabularyJourneyRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (showNoEnrollment) {
      setJourneys([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    void apiGetStudentVocabJourneys()
      .then((list) => {
        if (cancelled) return;
        setJourneys(list);
        if (list.length === 1) {
          navigate(studentRoutePaths.vocabJourney(list[0].id), { replace: true });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setJourneys([]);
          setError((err as { message?: string })?.message || "Không tải được journey.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [showNoEnrollment, navigate]);

  if (showNoEnrollment) {
    return null;
  }

  if (loading) {
    return (
      <div className="vq-vocab-list">
        {[1, 2, 3].map((i) => (
          <div key={i} className="vq-vocab-card vq-vocab-card--skeleton" aria-hidden />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2, borderRadius: "14px" }}>
        {error}
      </Alert>
    );
  }

  if (journeys.length === 0) {
    return (
      <div className="vq-lessons-empty">
        <ExploreOutlinedIcon sx={{ fontSize: 48, color: "var(--vq-outline)", mb: 1 }} />
        <p>Chưa có Learning Journey</p>
        <span>Khi giáo viên publish và gán journey cho lớp bạn, lộ trình sẽ hiện ở đây.</span>
      </div>
    );
  }

  if (journeys.length === 1) {
    return (
      <div className="vq-lessons-empty">
        <p>Đang mở journey…</p>
      </div>
    );
  }

  return (
    <div className="vq-vocab-list">
      {journeys.map((journey) => (
        <button
          key={journey.id}
          type="button"
          className="vq-vocab-card vq-vocab-card--button"
          onClick={() => navigate(studentRoutePaths.vocabJourney(journey.id))}
        >
          <div className="vq-vocab-card__icon" aria-hidden>
            <ExploreOutlinedIcon />
          </div>
          <div className="vq-vocab-card__body">
            <h3 className="vq-vocab-card__title">{journey.title}</h3>
            {journey.description?.trim() ? (
              <p className="vq-vocab-card__desc">{journey.description}</p>
            ) : null}
            <div className="vq-vocab-card__meta">
              <span className="vq-vocab-card__count">{journey.topicCount ?? 0} chủ đề</span>
            </div>
          </div>
          <span className="vq-vocab-card__cta">Vào →</span>
        </button>
      ))}
    </div>
  );
}

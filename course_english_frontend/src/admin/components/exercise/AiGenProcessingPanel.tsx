import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import CheckIcon from "@mui/icons-material/Check";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";
import { useCallback, useEffect, useState } from "react";
import {
  AI_GEN_FUN_FACT_CATEGORY_LABEL,
  AI_GEN_FUN_FACT_ROTATE_MS,
  AI_GEN_FUN_FACTS,
  pickRandomFunFactIndex,
} from "../../../shared/ai/questionGen/aiGenFunFacts";

/** Smooth bar while server reports 0% or polls slowly; never exceed server when server is high. */
export function resolveAiGenDisplayPercent(
  progressPercent: number | null,
  elapsedSec: number,
): number {
  const synthetic = Math.min(92, 6 + elapsedSec * 2);
  if (progressPercent === null || Number.isNaN(progressPercent)) {
    return synthetic;
  }
  const server = Math.min(100, Math.max(0, progressPercent));
  if (server <= 0) {
    return synthetic;
  }
  return Math.max(server, Math.min(synthetic, server + 8));
}

type AiGenProcessingPanelProps = {
  progressMessage: string;
  progressPercent: number | null;
  elapsedSec: number;
  active?: boolean;
};

export function AiGenProcessingPanel({
  progressMessage,
  progressPercent,
  elapsedSec,
  active = true,
}: AiGenProcessingPanelProps) {
  const displayPercent = resolveAiGenDisplayPercent(progressPercent, elapsedSec);

  const statusText =
    progressMessage ||
    (elapsedSec < 5 ? "Đang đọc tài liệu…" : "Đang chắt lọc từ vựng quan trọng…");

  return (
    <>
      <div className="ai-gen-processing__hero">
        <h3 className="ai-gen-processing__hero-title">
          AI đang làm việc cho bạn ✨
        </h3>
        <p className="ai-gen-processing__hero-sub">
          Quá trình này có thể mất 1–2 phút, vui lòng đợi trong giây lát…
        </p>
      </div>

      <div className="ai-gen-processing__progress-card">
        <div className="ai-gen-processing__bar-track">
          <div className="ai-gen-processing__bar-fill" style={{ width: `${displayPercent}%` }} />
        </div>
        <span className="ai-gen-processing__bar-pct">{Math.round(displayPercent)}%</span>
      </div>

      <div className="ai-gen-processing__status">
        <span className="ai-gen-processing__status-badge">🤖</span>
        <span className="ai-gen-processing__status-text">{statusText}</span>
      </div>
    </>
  );
}

export function AiGenFunFactsPanel({ active = true }: { active?: boolean }) {
  const [factIndex, setFactIndex] = useState(() => pickRandomFunFactIndex());

  const goNext = useCallback(() => {
    setFactIndex((i) => (i + 1) % AI_GEN_FUN_FACTS.length);
  }, []);

  const goPrev = useCallback(() => {
    setFactIndex((i) => (i - 1 + AI_GEN_FUN_FACTS.length) % AI_GEN_FUN_FACTS.length);
  }, []);

  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(goNext, AI_GEN_FUN_FACT_ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [active, goNext]);

  const fact = AI_GEN_FUN_FACTS[factIndex];
  const categoryLabel = AI_GEN_FUN_FACT_CATEGORY_LABEL[fact.category];

  return (
    <section className="ai-gen-funfacts" aria-label="Bạn có biết?">
      <div className="ai-gen-funfacts__header">
        <p className="ai-gen-funfacts__header-title">
          💡 <strong style={{ color: "#2563eb" }}>Bạn có biết?</strong> Những sự thật thú vị về tiếng Anh và mẹo học tập
        </p>
      </div>

      <div className="ai-gen-funfacts__card">
        <button type="button" className="ai-gen-funfacts__nav ai-gen-funfacts__nav--prev" onClick={goPrev} aria-label="Sự thật trước">
          <ChevronLeftIcon sx={{ fontSize: 18 }} />
        </button>

        <div className="ai-gen-funfacts__illus" aria-hidden>
          <img
            src="/images/english-facts-illus.png"
            alt="English Facts"
            className="ai-gen-funfacts__illus-img"
          />
        </div>

        <div className="ai-gen-funfacts__body">
          <span className="ai-gen-funfacts__quote-deco" aria-hidden>
            "
          </span>
          <span className="ai-gen-funfacts__category">{categoryLabel}</span>
          <p className="ai-gen-funfacts__text">
            <strong>Bạn có biết?</strong> {fact.text}
          </p>
          <p className="ai-gen-funfacts__footer">
            <span style={{ color: "#ec4899", marginRight: 4 }}>♡</span> Thú vị phải không nào?
          </p>
        </div>

        <button type="button" className="ai-gen-funfacts__nav ai-gen-funfacts__nav--next" onClick={goNext} aria-label="Sự thật tiếp">
          <ChevronRightIcon sx={{ fontSize: 18 }} />
        </button>
      </div>

      <div className="ai-gen-funfacts__dots" role="tablist" aria-label="Chọn sự thật">
        {AI_GEN_FUN_FACTS.map((f, i) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={i === factIndex}
            className={`ai-gen-funfacts__dot${i === factIndex ? " is-active" : ""}`}
            onClick={() => setFactIndex(i)}
            aria-label={`Sự thật ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}

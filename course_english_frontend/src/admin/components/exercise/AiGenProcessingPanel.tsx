import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import CheckIcon from "@mui/icons-material/Check";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AI_GEN_FUN_FACT_CATEGORY_LABEL,
  AI_GEN_FUN_FACT_ROTATE_MS,
  AI_GEN_FUN_FACTS,
  pickRandomFunFactIndex,
} from "../../../shared/ai/questionGen/aiGenFunFacts";

/**
 * Client display % while polling AI tasks.
 * Server value is the floor; bar creeps upward between updates but stays below 98 until server hits 100.
 */
export function resolveAiGenDisplayPercent(
  progressPercent: number | null,
  elapsedSec: number,
): number {
  const server =
    progressPercent == null || Number.isNaN(progressPercent)
      ? 0
      : Math.min(100, Math.max(0, progressPercent));

  if (server >= 100) {
    return 100;
  }

  const buffer = Math.min(28, 5 + 23 * (1 - Math.exp(-elapsedSec / 50)));
  const ceiling = Math.min(97, server + buffer);
  const timeFloor = Math.min(92, 4 + elapsedSec * 0.35);

  return Math.max(server, Math.min(ceiling, timeFloor));
}

/** Sparkles, AI⁺ badge, and floating mascot — shared across AI gen dialogs. */
export function AiGenProcessingDecorations() {
  const [msgIndex, setMsgIndex] = useState(0);

  const owlMessages = [
    "Tớ đang đọc tài liệu nhé... 📖",
    "Nhiều kiến thức hay quá! 📚",
    "Đang cùng Robot soạn bài... 🧠",
    "Sắp có đề xịn rồi nha! 🌱",
  ];

  const robotMessages = [
    "Tớ đang kết nối dữ liệu AI... ⚡",
    "Đang sinh câu hỏi siêu nhanh! 🪄",
    "Đang rà soát đáp án kỹ lưỡng... 🔍",
    "Đợi tớ một chút xíu thôi! 🎉",
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % owlMessages.length);
    }, 5000); // Thay đổi mỗi 5 giây cho sinh động
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <div className="ai-gen-processing__sparkles" aria-hidden>
        <span className="ai-gen-processing__sparkle sparkle-1">✨</span>
        <span className="ai-gen-processing__sparkle sparkle-2">✨</span>
        <span className="ai-gen-processing__sparkle sparkle-3">✨</span>
      </div>

      <div className="ai-gen-processing__floating-card" aria-hidden>
        <div className="ai-gen-processing__floating-card-badge">
          AI<span className="ai-gen-processing__floating-card-plus">⁺</span>
        </div>
      </div>

      {/* Mascot bên trái: Cú thông thái chăm học */}
      <div className="ai-gen-processing__mascot-left-container" aria-hidden>
        <div className="ai-gen-processing__speech-bubble bubble-left">
          {owlMessages[msgIndex]}
        </div>
        <img
          src="/images/study-owl-mascot.png"
          alt="Study Owl Mascot"
          className="ai-gen-processing__mascot-left-img"
        />
      </div>

      {/* Mascot bên phải: Robot AI đáng yêu */}
      <div className="ai-gen-processing__mascot-right-container" aria-hidden>
        <div className="ai-gen-processing__speech-bubble bubble-right">
          {robotMessages[msgIndex]}
        </div>
        <img
          src="/images/ai-robot-helper-mascot.png"
          alt="AI Robot Mascot"
          className="ai-gen-processing__mascot-right-img"
        />
      </div>
    </>
  );
}

type AiGenProcessingPanelProps = {
  progressMessage: string;
  progressPercent: number | null;
  elapsedSec: number;
  active?: boolean;
};

const SMOOTH_ELAPSED_TICK_MS = 150;

export function AiGenProcessingPanel({
  progressMessage,
  progressPercent,
  elapsedSec,
  active = true,
}: AiGenProcessingPanelProps) {
  const startedAtRef = useRef<number | null>(null);
  const [smoothElapsedSec, setSmoothElapsedSec] = useState(0);

  useEffect(() => {
    if (!active) {
      startedAtRef.current = null;
      setSmoothElapsedSec(0);
      return undefined;
    }
    const startedAt = startedAtRef.current ?? Date.now() - elapsedSec * 1000;
    startedAtRef.current = startedAt;

    const tick = () => {
      setSmoothElapsedSec((Date.now() - startedAt) / 1000);
    };
    tick();
    const id = window.setInterval(tick, SMOOTH_ELAPSED_TICK_MS);
    return () => window.clearInterval(id);
  }, [active, elapsedSec]);

  const effectiveElapsedSec = Math.max(elapsedSec, smoothElapsedSec);
  const displayPercent = resolveAiGenDisplayPercent(progressPercent, effectiveElapsedSec);

  const statusText =
    progressMessage ||
    (effectiveElapsedSec < 5 ? "Đang đọc tài liệu…" : "Đang chắt lọc từ vựng quan trọng…");

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

const CATEGORY_IMAGE_MAP: Record<string, string> = {
  GRAMMAR: "/images/english-facts-illus-grammar.png",
  VOCAB: "/images/english-facts-illus-vocab.png",
  IDIOM: "/images/english-facts-illus-idioms.png",
  TIP: "/images/english-facts-illus-tips.png",
  HISTORY: "/images/english-facts-illus-history.png",
};

const CATEGORY_EMOJI_MAP: Record<string, string> = {
  GRAMMAR: "📝",
  VOCAB: "📚",
  IDIOM: "🗣️",
  TIP: "💡",
  HISTORY: "📜",
};

export function AiGenFunFactsPanel({ active = true }: { active?: boolean }) {
  const [myFacts] = useState(() => {
    const shuffled = [...AI_GEN_FUN_FACTS].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  });
  const [factIndex, setFactIndex] = useState(0);

  const goNext = useCallback(() => {
    setFactIndex((i) => (i + 1) % myFacts.length);
  }, [myFacts.length]);

  const goPrev = useCallback(() => {
    setFactIndex((i) => (i - 1 + myFacts.length) % myFacts.length);
  }, [myFacts.length]);

  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(goNext, AI_GEN_FUN_FACT_ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [active, goNext]);

  if (!myFacts.length) return null;

  const fact = myFacts[factIndex];
  const categoryLabel = AI_GEN_FUN_FACT_CATEGORY_LABEL[fact.category];
  const factImage = CATEGORY_IMAGE_MAP[fact.category] || "/images/english-facts-illus.png";

  return (
    <section className="ai-gen-funfacts" aria-label="Bạn có biết?">
      <div className="ai-gen-funfacts__header">
        <p className="ai-gen-funfacts__header-title">
          💡 <strong>Bạn có biết?</strong>
          <span className="ai-gen-funfacts__header-extra">
            {" "}
            Những sự thật thú vị về tiếng Anh và mẹo học tập
          </span>
        </p>
      </div>

      <div className="ai-gen-funfacts__card">
        <button type="button" className="ai-gen-funfacts__nav ai-gen-funfacts__nav--prev" onClick={goPrev} aria-label="Sự thật trước">
          <ChevronLeftIcon sx={{ fontSize: 18 }} />
        </button>

        <div className="ai-gen-funfacts__illus" aria-hidden>
          <img
            src={factImage}
            alt="English Facts"
            className="ai-gen-funfacts__illus-img"
          />
        </div>

        <div className="ai-gen-funfacts__body">
          <span className="ai-gen-funfacts__quote-deco" aria-hidden>
            "
          </span>
          <span className="ai-gen-funfacts__category">
            {CATEGORY_EMOJI_MAP[fact.category] || "✨"} {categoryLabel}
          </span>
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
        {myFacts.map((f, i) => (
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

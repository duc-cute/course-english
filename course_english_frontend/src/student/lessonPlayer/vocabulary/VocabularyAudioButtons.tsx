import type { MouseEvent } from "react";

type VocabularyAudioButtonsProps = {
  audioUkUrl?: string;
  audioUsUrl?: string;
  className?: string;
};

function playUrl(url: string, event: MouseEvent<HTMLButtonElement>) {
  event.stopPropagation();
  event.preventDefault();
  const audio = new Audio(url);
  void audio.play().catch(() => {
    /* missing file or autoplay policy */
  });
}

export function VocabularyAudioButtons({
  audioUkUrl,
  audioUsUrl,
  className = "",
}: VocabularyAudioButtonsProps) {
  const hasUk = Boolean(audioUkUrl?.trim());
  const hasUs = Boolean(audioUsUrl?.trim());

  if (!hasUk && !hasUs) {
    return null;
  }

  return (
    <div className={`vocabulary-audio-buttons${className ? ` ${className}` : ""}`}>
      {hasUk ? (
        <button
          type="button"
          className="vocabulary-audio-btn vocabulary-audio-btn--uk"
          onClick={(e) => playUrl(audioUkUrl!, e)}
          aria-label="Nghe phát âm UK"
        >
          <span className="vocabulary-audio-btn-icon" aria-hidden>
            🔊
          </span>
          UK
        </button>
      ) : null}
      {hasUs ? (
        <button
          type="button"
          className="vocabulary-audio-btn vocabulary-audio-btn--us"
          onClick={(e) => playUrl(audioUsUrl!, e)}
          aria-label="Nghe phát âm US"
        >
          <span className="vocabulary-audio-btn-icon" aria-hidden>
            🔊
          </span>
          US
        </button>
      ) : null}
    </div>
  );
}

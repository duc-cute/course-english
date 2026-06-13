import type { ReactNode } from "react";
import "./ui.css";

type VqSpeechBubbleProps = {
  label?: string;
  title?: string;
  children: ReactNode;
};

export function VqSpeechBubble({ label, title, children }: VqSpeechBubbleProps) {
  return (
    <div className="vq-speech-bubble vq-speech-bubble--left">
      {label ? <p className="vq-speech-bubble__label">{label}</p> : null}
      {title ? <h2 className="vq-speech-bubble__title">{title}</h2> : null}
      <div className="vq-speech-bubble__text">{children}</div>
    </div>
  );
}

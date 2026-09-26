import { Box, Button } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useMemo, useRef, useEffect } from "react";
import type { StoryScene, StorySentence, StoryToken } from "../../shared/api/story";
import { resolveStorageAssetUrl } from "../../shared/api/file";
import { speakerColor } from "./mockStorybookScenes";
import { getStoryScrollContainer, scrollIntoComfortZone } from "./useKaraokeHighlight";

type StorybookPageProps = {
  scene: StoryScene;
  sceneIndex: number;
  totalScenes: number;
  tokens: StoryToken[];
  sentences?: StorySentence[];
  activeWordIndex: number | null;
  activeSentenceIndex: number | null;
  highlightOn?: boolean;
  showTranslation?: boolean;
  autoScrollOn?: boolean;
  isMock?: boolean;
  onPrev: () => void;
  onNext: () => void;
  onWordClick: (token: StoryToken, event: React.MouseEvent<HTMLSpanElement>) => void;
  clickedWordIndex?: number | null;
};

function renderSegmentText(
  text: string,
  allTokens: StoryToken[],
  activeWordIndex: number | null,
  highlightOn: boolean,
  clickedWordIndex: number | null | undefined,
  onWordClick: (token: StoryToken, event: React.MouseEvent<HTMLSpanElement>) => void,
  wordRange?: { start: number; end: number },
) {
  const words = text.split(/(\s+)/);
  let searchFrom = 0;
  return words.map((chunk, i) => {
    if (/^\s+$/.test(chunk) || !chunk) {
      return <span key={`ws-${i}`}>{chunk}</span>;
    }
    const needle = chunk.replace(/^[^\w']+|[^\w']+$/g, "").toLowerCase();
    let matched: StoryToken | undefined;
    for (let ti = searchFrom; ti < allTokens.length; ti++) {
      const t = allTokens[ti];
      if (t.type !== "word" || !t.text) continue;
      const wi = t.wordIndex ?? -1;
      if (wordRange && (wi < wordRange.start || wi > wordRange.end)) continue;
      if (t.text.toLowerCase() === needle || t.text.toLowerCase() === chunk.toLowerCase()) {
        matched = t;
        searchFrom = ti + 1;
        break;
      }
    }
    if (!matched) {
      return <span key={`t-${i}`}>{chunk}</span>;
    }
    const isActive = highlightOn && activeWordIndex != null && matched.wordIndex === activeWordIndex;
    const isClicked = clickedWordIndex != null && matched.wordIndex === clickedWordIndex;
    const classes = [
      "story-reader__word",
      matched.isVocab ? "story-reader__word--vocab" : "story-reader__word--plain",
      isActive ? "story-reader__word--active" : "",
      isClicked ? "story-reader__word--clicked" : "",
    ]
      .filter(Boolean)
      .join(" ");
    return (
      <span
        key={`w-${matched.wordIndex}-${i}`}
        className={classes}
        onClick={(e) => onWordClick(matched!, e)}
        role="button"
        tabIndex={0}
      >
        {chunk}
      </span>
    );
  });
}

function findSpeakerForSentence(
  sentence: StorySentence,
  scene: StoryScene,
): string | undefined {
  const text = sentence.text?.trim() ?? "";
  if (!text || !scene.segments?.length) return undefined;
  for (const seg of scene.segments) {
    if (seg.type !== "dialogue" || !seg.speaker) continue;
    const segText = seg.text?.trim() ?? "";
    if (!segText) continue;
    if (text.includes(segText) || segText.includes(text.replace(/^["“]|["”]$/g, ""))) {
      return seg.speaker;
    }
  }
  return undefined;
}

export function StorybookPage({
  scene,
  sceneIndex,
  totalScenes,
  tokens,
  sentences,
  activeWordIndex,
  activeSentenceIndex,
  highlightOn = true,
  showTranslation = false,
  autoScrollOn = true,
  isMock,
  onPrev,
  onNext,
  onWordClick,
  clickedWordIndex,
}: StorybookPageProps) {
  const imageSrc = scene.imageUrl ? resolveStorageAssetUrl(scene.imageUrl) : "";
  const activeBlockRef = useRef<HTMLDivElement | null>(null);

  const sceneSentences = useMemo(() => {
    if (!sentences?.length) return [];
    return sentences.filter(
      (s) => s.sentenceIndex >= scene.sentenceStart && s.sentenceIndex <= scene.sentenceEnd,
    );
  }, [sentences, scene.sentenceStart, scene.sentenceEnd]);

  const segments = scene.segments?.length
    ? scene.segments
    : [{ type: "narration" as const, text: scene.description || "" }];

  const effectiveSentence = highlightOn ? activeSentenceIndex : null;
  const hasActive = effectiveSentence != null;

  // Bám lại câu/từ đang đọc sau khi user cuộn tay (tắt được bằng icon trên ProgressSky).
  useEffect(() => {
    if (!autoScrollOn || !highlightOn || !activeBlockRef.current) return;
    const container = getStoryScrollContainer(activeBlockRef.current);
    if (!container) return;
    scrollIntoComfortZone(activeBlockRef.current, container);
  }, [effectiveSentence, activeWordIndex, sceneIndex, highlightOn, autoScrollOn]);

  return (
    <Box className="storybook-page">
      <Box className="storybook-page__header">
        <span className="storybook-page__indicator">
          Scene {sceneIndex} / {totalScenes}
          {isMock ? " · demo" : ""}
        </span>
        {scene.location ? <span className="storybook-page__location">{scene.location}</span> : null}
      </Box>

      <Box className="storybook-page__illustration-wrap">
        {imageSrc ? (
          <img src={imageSrc} alt={scene.description || `Scene ${sceneIndex}`} className="storybook-page__illustration" />
        ) : (
          <Box className="storybook-page__illustration storybook-page__illustration--placeholder" aria-hidden>
            <span>Illustration 4:3</span>
            <span className="storybook-page__placeholder-sub">
              {scene.description || "Ảnh minh họa sẽ hiện sau khi Admin sinh illustrations"}
            </span>
          </Box>
        )}
      </Box>

      <Box className="storybook-page__text">
        {sceneSentences.length > 0
          ? sceneSentences.map((sentence, idx) => {
              const isActive = sentence.sentenceIndex === effectiveSentence;
              const isDimmed = hasActive && !isActive;
              const speaker = findSpeakerForSentence(sentence, scene);
              const color = speaker ? speakerColor(speaker, idx) : undefined;
              const vi = sentence.textVi?.trim();
              return (
                <div
                  key={`sent-${sentence.sentenceIndex}`}
                  ref={isActive ? activeBlockRef : undefined}
                  className={[
                    "storybook-page__sentence",
                    speaker ? "storybook-page__sentence--dialogue" : "storybook-page__sentence--narration",
                    isActive ? "storybook-page__sentence--active" : "",
                    isDimmed ? "storybook-page__sentence--dim" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={speaker && color ? { borderLeftColor: color } : undefined}
                  data-sentence-index={sentence.sentenceIndex}
                >
                  {speaker ? (
                    <span className="storybook-page__speaker" style={color ? { color } : undefined}>
                      {speaker}
                    </span>
                  ) : null}
                  <div className="storybook-page__sentence-en">
                    {renderSegmentText(
                      sentence.text,
                      tokens,
                      activeWordIndex,
                      highlightOn,
                      clickedWordIndex,
                      onWordClick,
                      { start: sentence.startWordIndex, end: sentence.endWordIndex },
                    )}
                  </div>
                  {showTranslation && vi ? (
                    <p className="storybook-page__sentence-vi">{vi}</p>
                  ) : null}
                </div>
              );
            })
          : segments.map((seg, idx) => {
              if (seg.type === "dialogue") {
                const color = speakerColor(seg.speaker, idx);
                return (
                  <Box
                    key={`seg-${idx}`}
                    className="storybook-page__dialogue storybook-page__sentence"
                    style={{ borderLeftColor: color }}
                  >
                    {seg.speaker ? (
                      <span className="storybook-page__speaker" style={{ color }}>
                        {seg.speaker}
                      </span>
                    ) : null}
                    <p className="storybook-page__dialogue-text">
                      &ldquo;
                      {renderSegmentText(
                        seg.text,
                        tokens,
                        activeWordIndex,
                        highlightOn,
                        clickedWordIndex,
                        onWordClick,
                      )}
                      &rdquo;
                    </p>
                  </Box>
                );
              }
              return (
                <p key={`seg-${idx}`} className="storybook-page__narration storybook-page__sentence">
                  {renderSegmentText(
                    seg.text,
                    tokens,
                    activeWordIndex,
                    highlightOn,
                    clickedWordIndex,
                    onWordClick,
                  )}
                </p>
              );
            })}
      </Box>

      <Box className="storybook-page__nav">
        <Button
          startIcon={<ChevronLeftIcon />}
          disabled={sceneIndex <= 1}
          onClick={onPrev}
          className="storybook-page__nav-btn"
        >
          Prev
        </Button>
        <Box className="storybook-page__dots">
          {Array.from({ length: totalScenes }, (_, i) => (
            <span
              key={i}
              className={`storybook-page__dot ${i + 1 === sceneIndex ? "storybook-page__dot--active" : ""}`}
            />
          ))}
        </Box>
        <Button
          endIcon={<ChevronRightIcon />}
          disabled={sceneIndex >= totalScenes}
          onClick={onNext}
          className="storybook-page__nav-btn"
        >
          Next
        </Button>
      </Box>
    </Box>
  );
}

import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import type { StorySentence, StoryToken } from "../../shared/api/story";
import { isWordInSentence } from "./storyKaraoke";
import {
  getStoryScrollContainer,
  scrollIntoComfortZone,
  useLeavingWordIndex,
} from "./useKaraokeHighlight";

type StoryReaderContentProps = {
  tokens: StoryToken[];
  sentences?: StorySentence[];
  activeWordIndex: number | null;
  activeSentenceIndex: number | null;
  highlightOn?: boolean;
  /** Hiện bản dịch VI ngay dưới từng câu (prototype karaoke-block). */
  showTranslation?: boolean;
  onWordClick: (token: StoryToken, event: React.MouseEvent<HTMLSpanElement>) => void;
  clickedWordIndex?: number | null;
  onTextSelect?: (selectedText: string) => void;
  autoScrollOn?: boolean;
};

type StoryWordTokenProps = {
  token: StoryToken;
  isActiveWord: boolean;
  isLeavingWord: boolean;
  isClickedWord: boolean;
  isReadWord: boolean;
  inActiveSentence: boolean;
  onWordClick: (token: StoryToken, event: React.MouseEvent<HTMLSpanElement>) => void;
  innerRef?: React.Ref<HTMLSpanElement>;
};

function wordTokenPropsEqual(prev: StoryWordTokenProps, next: StoryWordTokenProps): boolean {
  return (
    prev.token.wordIndex === next.token.wordIndex &&
    prev.token.text === next.token.text &&
    prev.isActiveWord === next.isActiveWord &&
    prev.isLeavingWord === next.isLeavingWord &&
    prev.isReadWord === next.isReadWord &&
    prev.isClickedWord === next.isClickedWord &&
    prev.inActiveSentence === next.inActiveSentence
  );
}

const StoryWordToken = memo(function StoryWordToken({
  token,
  isActiveWord,
  isLeavingWord,
  isClickedWord,
  isReadWord,
  inActiveSentence,
  onWordClick,
  innerRef,
}: StoryWordTokenProps) {
  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLSpanElement>) => {
      event.stopPropagation();
      onWordClick(token, event);
    },
    [token, onWordClick],
  );

  const handleDoubleClick = useCallback((event: React.MouseEvent<HTMLSpanElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const classes = [
    "story-reader__word",
    token.isVocab ? "story-reader__word--vocab" : "story-reader__word--plain",
    inActiveSentence ? "story-reader__word--sentence-active" : "",
    isReadWord ? "story-reader__word--read" : "",
    isLeavingWord ? "story-reader__word--leaving" : "",
    isActiveWord ? "story-reader__word--active" : "",
    isClickedWord ? "story-reader__word--clicked" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span
      ref={innerRef}
      className={classes}
      data-word-index={token.wordIndex}
      data-vocabulary-id={token.vocabularyId ?? ""}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onWordClick(token, e as unknown as React.MouseEvent<HTMLSpanElement>);
        }
      }}
    >
      {token.text}
    </span>
  );
}, wordTokenPropsEqual);

type WordRenderFlags = {
  isActiveWord: boolean;
  isLeavingWord: boolean;
  isClickedWord: boolean;
  isReadWord: boolean;
  inActiveSentence: boolean;
};

function getWordRenderFlags(
  wordIndex: number | undefined,
  effectiveActive: number | null,
  leavingWordIndex: number | null,
  clickedWordIndex: number | null | undefined,
  activeSentenceIndex: number | null,
  sentences: StorySentence[] | undefined,
): WordRenderFlags {
  const wi = wordIndex ?? -1;
  return {
    isActiveWord: wi >= 0 && effectiveActive !== null && wi === effectiveActive,
    isLeavingWord: wi >= 0 && leavingWordIndex !== null && wi === leavingWordIndex,
    isClickedWord: wi >= 0 && clickedWordIndex != null && wi === clickedWordIndex,
    isReadWord: wi >= 0 && effectiveActive !== null && wi < effectiveActive,
    inActiveSentence: wi >= 0 && isWordInSentence(wi, activeSentenceIndex, sentences),
  };
}

export const StoryReaderContent = memo(function StoryReaderContent({
  tokens,
  sentences,
  activeWordIndex,
  activeSentenceIndex,
  highlightOn = true,
  showTranslation = false,
  onWordClick,
  clickedWordIndex,
  onTextSelect,
  autoScrollOn = true,
}: StoryReaderContentProps) {
  const activeWordRef = useRef<HTMLSpanElement | null>(null);
  const activeSentenceRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const effectiveActive = highlightOn ? activeWordIndex : null;
  const effectiveSentence = highlightOn ? activeSentenceIndex : null;
  const leavingWordIndex = useLeavingWordIndex(effectiveActive, highlightOn);

  useEffect(() => {
    if (!autoScrollOn || !highlightOn) return;
    const container = getStoryScrollContainer(contentRef.current);
    if (!container) return;

    if (activeWordRef.current) {
      scrollIntoComfortZone(activeWordRef.current, container);
      return;
    }

    if (activeSentenceRef.current) {
      scrollIntoComfortZone(activeSentenceRef.current, container);
    }
  }, [effectiveSentence, effectiveActive, autoScrollOn, highlightOn, sentences]);

  const handleMouseUp = useCallback(() => {
    if (!onTextSelect) return;
    const selection = window.getSelection();
    const text = selection?.toString().trim() ?? "";
    if (text.length >= 2) {
      onTextSelect(text);
    }
  }, [onTextSelect]);

  const renderWordToken = useCallback(
    (token: StoryToken, index: number) => {
      const flags = getWordRenderFlags(
        token.wordIndex,
        effectiveActive,
        leavingWordIndex,
        clickedWordIndex,
        effectiveSentence,
        sentences,
      );
      return (
        <StoryWordToken
          key={`w-${token.wordIndex ?? index}`}
          innerRef={flags.isActiveWord ? activeWordRef : undefined}
          token={token}
          {...flags}
          onWordClick={onWordClick}
        />
      );
    },
    [
      effectiveActive,
      leavingWordIndex,
      clickedWordIndex,
      effectiveSentence,
      sentences,
      onWordClick,
    ],
  );

  const sentenceBlocks = useMemo(() => {
    if (!sentences?.length) {
      return null;
    }
    return sentences.map((sentence) => {
      const slice: { token: StoryToken; index: number }[] = [];
      tokens.forEach((token, index) => {
        if (token.type === "word") {
          const wi = token.wordIndex ?? -1;
          if (wi >= sentence.startWordIndex && wi <= sentence.endWordIndex) {
            slice.push({ token, index });
          }
        } else {
          const prevWord = tokens
            .slice(0, index)
            .reverse()
            .find((t) => t.type === "word");
          const nextWord = tokens.slice(index + 1).find((t) => t.type === "word");
          const prevIdx = prevWord?.wordIndex ?? -1;
          const nextIdx = nextWord?.wordIndex ?? -1;
          if (
            prevIdx >= sentence.startWordIndex &&
            prevIdx <= sentence.endWordIndex &&
            nextIdx >= sentence.startWordIndex &&
            nextIdx <= sentence.endWordIndex
          ) {
            slice.push({ token, index });
          }
        }
      });
      return { sentence, slice };
    });
  }, [sentences, tokens]);

  const hasActiveSentence = effectiveSentence != null;

  return (
    <div
      ref={contentRef}
      className={`story-reader__content ${sentenceBlocks ? "story-reader__content--blocks" : ""} ${
        showTranslation ? "story-reader__content--translate" : ""
      }`}
      onMouseUp={handleMouseUp}
    >
      {sentenceBlocks ? (
        sentenceBlocks.map(({ sentence, slice }) => {
          const isSentenceActive = sentence.sentenceIndex === effectiveSentence;
          const isDimmed = hasActiveSentence && !isSentenceActive;
          const vi = sentence.textVi?.trim();
          return (
            <div
              key={`s-${sentence.sentenceIndex}`}
              ref={isSentenceActive ? (activeSentenceRef as React.RefObject<HTMLDivElement | null>) : undefined}
              className={[
                "story-reader__sentence-block",
                isSentenceActive ? "story-reader__sentence-block--active" : "",
                isDimmed ? "story-reader__sentence-block--dim" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              data-sentence-index={sentence.sentenceIndex}
            >
              <div className="story-reader__sentence-en">
                {slice.map(({ token, index }) => {
                  if (token.type === "text") {
                    return <span key={`t-${index}`}>{token.value}</span>;
                  }
                  return renderWordToken(token, index);
                })}
              </div>
              {showTranslation && vi ? (
                <p className="story-reader__sentence-vi">{vi}</p>
              ) : null}
            </div>
          );
        })
      ) : (
        tokens.map((token, index) => {
          if (token.type === "text") {
            return <span key={`t-${index}`}>{token.value}</span>;
          }
          return renderWordToken(token, index);
        })
      )}
    </div>
  );
});

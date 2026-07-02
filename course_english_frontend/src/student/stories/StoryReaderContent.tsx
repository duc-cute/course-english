import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import type { StorySentence, StoryToken } from "../../shared/api/story";
import { isWordInSentence } from "./storyKaraoke";

type StoryReaderContentProps = {
  tokens: StoryToken[];
  sentences?: StorySentence[];
  activeWordIndex: number | null;
  activeSentenceIndex: number | null;
  onWordClick: (token: StoryToken, event: React.MouseEvent<HTMLSpanElement>) => void;
  clickedWordIndex?: number | null;
  translateOn?: boolean;
  onTextSelect?: (selectedText: string) => void;
};

function renderToken(
  token: StoryToken,
  index: number,
  activeWordIndex: number | null,
  activeSentenceIndex: number | null,
  clickedWordIndex: number | null | undefined,
  sentences: StorySentence[] | undefined,
  onWordClick: (token: StoryToken, event: React.MouseEvent<HTMLSpanElement>) => void,
  handleClick: (token: StoryToken) => (event: React.MouseEvent<HTMLSpanElement>) => void,
  handleDoubleClick: (event: React.MouseEvent<HTMLSpanElement>) => void,
  activeWordRef?: React.RefObject<HTMLSpanElement | null>,
) {
  if (token.type === "text") {
    return <span key={`t-${index}`}>{token.value}</span>;
  }

  const isActiveWord = token.wordIndex != null && token.wordIndex === activeWordIndex;
  const isClickedWord = token.wordIndex != null && token.wordIndex === clickedWordIndex;
  const inActiveSentence = isWordInSentence(token.wordIndex, activeSentenceIndex, sentences);

  const classes = [
    "story-reader__word",
    token.isVocab ? "story-reader__word--vocab" : "story-reader__word--plain",
    inActiveSentence ? "story-reader__word--sentence-active" : "",
    isActiveWord ? "story-reader__word--active" : "",
    isClickedWord ? "story-reader__word--clicked" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span
      key={`w-${token.wordIndex ?? index}`}
      ref={isActiveWord ? activeWordRef : undefined}
      className={classes}
      data-word-index={token.wordIndex}
      data-vocabulary-id={token.vocabularyId ?? ""}
      onClick={handleClick(token)}
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
}

export const StoryReaderContent = memo(function StoryReaderContent({
  tokens,
  sentences,
  activeWordIndex,
  activeSentenceIndex,
  onWordClick,
  clickedWordIndex,
  translateOn = false,
  onTextSelect,
}: StoryReaderContentProps) {
  const activeWordRef = useRef<HTMLSpanElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (activeWordRef.current) {
      activeWordRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeWordIndex]);

  const handleClick = useCallback(
    (token: StoryToken) => (event: React.MouseEvent<HTMLSpanElement>) => {
      event.stopPropagation();
      onWordClick(token, event);
    },
    [onWordClick],
  );

  const handleDoubleClick = useCallback((event: React.MouseEvent<HTMLSpanElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!onTextSelect) return;
    const selection = window.getSelection();
    const text = selection?.toString().trim() ?? "";
    if (text.length >= 2) {
      onTextSelect(text);
    }
  }, [onTextSelect]);

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
          // punctuation/space: include if between words of this sentence
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

  return (
    <div
      ref={contentRef}
      className="story-reader__content"
      onMouseUp={handleMouseUp}
    >
      {sentenceBlocks && (translateOn || sentences?.some((s) => s.textVi)) ? (
        sentenceBlocks.map(({ sentence, slice }) => (
          <p key={`s-${sentence.sentenceIndex}`} className="story-reader__sentence-block">
            <span className="story-reader__sentence-en">
              {slice.map(({ token, index }) =>
                renderToken(
                  token,
                  index,
                  activeWordIndex,
                  activeSentenceIndex,
                  clickedWordIndex,
                  sentences,
                  onWordClick,
                  handleClick,
                  handleDoubleClick,
                  activeWordRef,
                ),
              )}
            </span>
            {translateOn && sentence.textVi ? (
              <span className="story-reader__sentence-vi">{sentence.textVi}</span>
            ) : null}
          </p>
        ))
      ) : (
        tokens.map((token, index) =>
          renderToken(
            token,
            index,
            activeWordIndex,
            activeSentenceIndex,
            clickedWordIndex,
            sentences,
            onWordClick,
            handleClick,
            handleDoubleClick,
            activeWordRef,
          ),
        )
      )}
    </div>
  );
});

import { useEffect, useMemo, useState } from "react";
import type { StoryReaderPayload, StoryToken } from "../../shared/api/story";
import { StorybookPage } from "./StorybookPage";
import { buildMockStorybookScenes } from "./mockStorybookScenes";

type StorybookReaderProps = {
  payload: StoryReaderPayload;
  activeWordIndex: number | null;
  activeSentenceIndex: number | null;
  highlightOn?: boolean;
  showTranslation?: boolean;
  autoScrollOn?: boolean;
  forceMock?: boolean;
  onWordClick: (token: StoryToken, event: React.MouseEvent<HTMLSpanElement>) => void;
  clickedWordIndex?: number | null;
};

export function StorybookReader({
  payload,
  activeWordIndex,
  activeSentenceIndex,
  highlightOn = true,
  showTranslation = false,
  autoScrollOn = true,
  forceMock = false,
  onWordClick,
  clickedWordIndex,
}: StorybookReaderProps) {
  const realScenes = payload.scenes?.filter((s) => s && s.sceneIndex != null) ?? [];
  const hasRealImages = realScenes.some((s) => !!s.imageUrl);
  const useMock = forceMock || realScenes.length === 0;

  const scenes = useMemo(() => {
    if (!useMock && realScenes.length > 0) {
      return [...realScenes].sort((a, b) => a.sceneIndex - b.sceneIndex);
    }
    return buildMockStorybookScenes(payload.sentences, payload.tokens);
  }, [useMock, realScenes, payload.sentences, payload.tokens]);

  const [page, setPage] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [payload.id, scenes.length]);

  useEffect(() => {
    if (!autoScrollOn || activeSentenceIndex == null) return;
    const idx = scenes.findIndex(
      (s) => activeSentenceIndex >= s.sentenceStart && activeSentenceIndex <= s.sentenceEnd,
    );
    if (idx >= 0 && idx !== page) {
      setPage(idx);
    }
  }, [activeSentenceIndex, scenes, page, autoScrollOn]);

  const current = scenes[page] ?? scenes[0];
  if (!current) return null;

  return (
    <StorybookPage
      scene={current}
      sceneIndex={page + 1}
      totalScenes={scenes.length}
      tokens={payload.tokens ?? []}
      sentences={payload.sentences}
      activeWordIndex={activeWordIndex}
      activeSentenceIndex={activeSentenceIndex}
      highlightOn={highlightOn}
      showTranslation={showTranslation}
      autoScrollOn={autoScrollOn}
      isMock={useMock || !hasRealImages}
      onPrev={() => setPage((p) => Math.max(0, p - 1))}
      onNext={() => setPage((p) => Math.min(scenes.length - 1, p + 1))}
      onWordClick={onWordClick}
      clickedWordIndex={clickedWordIndex}
    />
  );
}

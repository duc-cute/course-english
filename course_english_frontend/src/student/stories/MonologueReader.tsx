import { Box } from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import type { StoryReaderPayload, StoryScene, StoryToken } from "../../shared/api/story";
import { resolveStorageAssetUrl } from "../../shared/api/file";
import { getStoryScrollContainer, scrollIntoComfortZone } from "./useKaraokeHighlight";

/**
 * Reader cho truyện tự sự (MONOLOGUE): ảnh ẩn dụ dính phía trên (tự đổi theo câu đang đọc),
 * bên dưới là toàn bộ câu — mỗi câu một dòng EN chữ to + VI nhỏ, câu đang đọc nổi thẻ.
 */
type MonologueReaderProps = {
  payload: StoryReaderPayload;
  activeWordIndex: number | null;
  activeSentenceIndex: number | null;
  highlightOn?: boolean;
  showTranslation?: boolean;
  autoScrollOn?: boolean;
  onWordClick: (token: StoryToken, event: React.MouseEvent<HTMLSpanElement>) => void;
  clickedWordIndex?: number | null;
};

export function MonologueReader({
  payload,
  activeWordIndex,
  activeSentenceIndex,
  highlightOn = true,
  showTranslation = true,
  autoScrollOn = true,
  onWordClick,
  clickedWordIndex,
}: MonologueReaderProps) {
  const sentences = payload.sentences ?? [];
  const tokens = payload.tokens ?? [];

  const scenes = useMemo<StoryScene[]>(
    () =>
      (payload.scenes ?? [])
        .filter((s) => s && s.sceneIndex != null && !!s.imageUrl)
        .sort((a, b) => a.sceneIndex - b.sceneIndex),
    [payload.scenes],
  );

  // Câu "đang đọc": karaoke nếu có audio, nếu không thì câu user vừa bấm.
  const [manualSentence, setManualSentence] = useState<number | null>(null);
  const effectiveSentence = highlightOn && activeSentenceIndex != null ? activeSentenceIndex : manualSentence;

  useEffect(() => {
    setManualSentence(null);
  }, [payload.id]);

  // Scene theo câu đang đọc (karaoke / câu vừa bấm).
  const followScene = useMemo(() => {
    if (scenes.length === 0) return null;
    if (effectiveSentence == null) return scenes[0];
    return (
      scenes.find((s) => effectiveSentence >= s.sentenceStart && effectiveSentence <= s.sentenceEnd) ??
      scenes[0]
    );
  }, [scenes, effectiveSentence]);

  // Vuốt ảnh = chỉ "ghim" scene để xem, KHÔNG đổi câu / không cuộn chữ. Khi karaoke sang scene khác thì thả ghim.
  const [pinnedSceneIdx, setPinnedSceneIdx] = useState<number | null>(null);
  const followIdx = followScene ? scenes.indexOf(followScene) : -1;
  useEffect(() => {
    setPinnedSceneIdx(null);
  }, [followIdx, payload.id]);
  const currentScene = pinnedSceneIdx != null ? scenes[pinnedSceneIdx] ?? followScene : followScene;

  const swipeRef = useRef<{ x: number; y: number; id: number } | null>(null);
  const goScene = (delta: number) => {
    if (scenes.length === 0) return;
    const base = pinnedSceneIdx ?? followIdx;
    const next = Math.max(0, Math.min(scenes.length - 1, base + delta));
    if (next !== base) setPinnedSceneIdx(next);
  };
  const onPointerDown = (e: React.PointerEvent) => {
    swipeRef.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const start = swipeRef.current;
    swipeRef.current = null;
    if (!start || start.id !== e.pointerId) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    goScene(dx < 0 ? 1 : -1);
  };

  const activeRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!autoScrollOn || !highlightOn || activeSentenceIndex == null || !activeRef.current) return;
    const container = getStoryScrollContainer(activeRef.current);
    if (!container) return;
    scrollIntoComfortZone(activeRef.current, container);
  }, [activeSentenceIndex, autoScrollOn, highlightOn]);

  const wordsBySentence = useMemo(() => {
    const map = new Map<number, StoryToken[]>();
    for (const s of sentences) {
      map.set(
        s.sentenceIndex,
        tokens.filter(
          (t) =>
            t.type === "word" &&
            t.wordIndex != null &&
            t.wordIndex >= s.startWordIndex &&
            t.wordIndex <= s.endWordIndex,
        ),
      );
    }
    return map;
  }, [sentences, tokens]);

  const imageSrc = currentScene?.imageUrl ? resolveStorageAssetUrl(currentScene.imageUrl) : "";
  const sceneNo = currentScene ? scenes.indexOf(currentScene) + 1 : 0;

  return (
    <Box className="monologue-reader">
      <Box className="monologue-reader__sticky">
      <Box className="monologue-reader__heading">
        <h2 className="monologue-reader__title">{payload.title}</h2>
        {payload.titleVi ? <p className="monologue-reader__title-vi">{payload.titleVi}</p> : null}
      </Box>
      <Box
        className="monologue-reader__hero"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (swipeRef.current = null)}
      >
        {imageSrc ? (
          <img
            key={currentScene?.id ?? sceneNo}
            src={imageSrc}
            alt={currentScene?.description || `Scene ${sceneNo}`}
            className="monologue-reader__image"
          />
        ) : (
          <Box className="monologue-reader__image monologue-reader__image--placeholder" aria-hidden>
            <span>{payload.titleVi || payload.title}</span>
          </Box>
        )}
        {scenes.length > 1 ? (
          <Box className="monologue-reader__dots" aria-hidden>
            {scenes.map((s, i) => (
              <span
                key={s.id ?? i}
                className={`monologue-reader__dot ${i + 1 === sceneNo ? "monologue-reader__dot--active" : ""}`}
              />
            ))}
          </Box>
        ) : null}
      </Box>

      </Box>

      <Box className="monologue-reader__lines">
        {sentences.map((sentence) => {
          const isActive = sentence.sentenceIndex === effectiveSentence;
          const words = wordsBySentence.get(sentence.sentenceIndex) ?? [];
          const vi = sentence.textVi?.trim();
          return (
            <div
              key={sentence.sentenceIndex}
              ref={isActive ? activeRef : undefined}
              className={`monologue-reader__line ${isActive ? "monologue-reader__line--active" : ""}`}
              data-sentence-index={sentence.sentenceIndex}
              onClick={() => setManualSentence(sentence.sentenceIndex)}
            >
              <div className="monologue-reader__en">
                {words.map((t) => {
                  const wordActive = highlightOn && activeWordIndex != null && t.wordIndex === activeWordIndex;
                  const wordClicked = clickedWordIndex != null && t.wordIndex === clickedWordIndex;
                  return (
                    <span
                      key={t.wordIndex}
                      className={[
                        "monologue-reader__word",
                        t.isVocab ? "monologue-reader__word--vocab" : "",
                        wordActive ? "monologue-reader__word--active" : "",
                        wordClicked ? "monologue-reader__word--clicked" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        onWordClick(t, e);
                      }}
                    >
                      {t.text}
                    </span>
                  );
                })}
              </div>
              {showTranslation && vi ? <div className="monologue-reader__vi">{vi}</div> : null}
            </div>
          );
        })}
      </Box>
    </Box>
  );
}

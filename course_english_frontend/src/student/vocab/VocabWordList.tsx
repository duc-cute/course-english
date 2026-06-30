import type { ResolvedVocabularyItem } from "../../shared/lesson/vocabularyPayload";
import { useFeatureFlags } from "../../shared/featureFlags/useFeatureFlags";
import { VocabularyAudioButtons } from "../lessonPlayer/vocabulary/VocabularyAudioButtons";

type VocabWordListProps = {
  items: ResolvedVocabularyItem[];
};

export function VocabWordList({ items }: VocabWordListProps) {
  const { flags } = useFeatureFlags();
  const audioEnabled = flags.vocabularyAudioEnabled;
  const audioAccent = flags.vocabularyAudioAccent;

  return (
    <ul className="vq-vocab-word-list">
      {items.map((item, index) => (
        <li key={item.id ?? `${item.wordEn}-${index}`} className="vq-vocab-word-list__item">
          <div className="vq-vocab-word-list__head">
            <span className="vq-vocab-word-list__en">{item.wordEn}</span>
            {item.partOfSpeech ? (
              <span className="vq-vocab-word-list__pos">{item.partOfSpeech}</span>
            ) : null}
            {item.phonetic ? <span className="vq-vocab-word-list__phonetic">{item.phonetic}</span> : null}
            {audioEnabled ? (
              <VocabularyAudioButtons
                audioUkUrl={item.audioUkUrl}
                audioUsUrl={item.audioUsUrl}
                accentMode={audioAccent}
              />
            ) : null}
          </div>
          <p className="vq-vocab-word-list__vi">{item.meaningVi}</p>
          {item.exampleSentence?.trim() ? (
            <p className="vq-vocab-word-list__example">{item.exampleSentence}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

import { Alert } from "@mui/material";
import type { LessonBlockRecord } from "../../../shared/api/lesson";
import {
  parseResolvedVocabularyItems,
  parseVocabularyBlockPayload,
} from "../../../shared/lesson/vocabularyPayload";
import { useFeatureFlags } from "../../../shared/featureFlags/useFeatureFlags";
import { VocabularyAudioButtons } from "./VocabularyAudioButtons";
import { VocabularyFlashcard } from "./VocabularyFlashcard";

type VocabularyBlockProps = {
  block: LessonBlockRecord;
};

export function VocabularyBlock({ block }: VocabularyBlockProps) {
  const { flags } = useFeatureFlags();
  const audioEnabled = flags.vocabularyAudioEnabled;
  const audioAccent = flags.vocabularyAudioAccent;
  const payload = parseVocabularyBlockPayload(block.payloadJson);
  const items = parseResolvedVocabularyItems(block.resolvedVocabularyJson);
  const showPhonetic = payload.showPhonetic !== false;

  if (!payload.vocabularySetId) {
    return (
      <Alert severity="warning" sx={{ borderRadius: "12px" }}>
        Khối từ vựng chưa được gắn bộ từ. Giáo viên cần chọn bộ từ trong phần soạn bài.
      </Alert>
    );
  }

  if (items.length === 0) {
    return (
      <Alert severity="info" sx={{ borderRadius: "12px" }}>
        Bộ từ chưa có mục hiển thị (chưa publish hoặc bộ từ trống). Hãy kiểm tra trang{" "}
        <strong>Bộ từ vựng</strong> trong Admin.
      </Alert>
    );
  }

  const isFlashcard = payload.presentation === "flashcard";

  return (
    <div className={`vocabulary-block${isFlashcard ? " vocabulary-block--flashcard" : ""}`}>
      {payload.instruction ? (
        <p className="vocabulary-block-instruction">{payload.instruction}</p>
      ) : null}

      {isFlashcard ? (
        <VocabularyFlashcard
          items={items}
          showPhonetic={showPhonetic}
          audioEnabled={audioEnabled}
          audioAccent={audioAccent}
        />
      ) : (
        <ul className="vocabulary-block-list">
          {items.map((item, index) => (
            <li key={item.id ?? `${item.wordEn}-${index}`} className="vocabulary-block-item">
              <div className="vocabulary-block-word">
                <span className="vocabulary-block-word-en">{item.wordEn}</span>
                {showPhonetic && item.phonetic ? (
                  <span className="vocabulary-block-phonetic">{item.phonetic}</span>
                ) : null}
                {audioEnabled ? (
                  <VocabularyAudioButtons
                    audioUkUrl={item.audioUkUrl}
                    audioUsUrl={item.audioUsUrl}
                    accentMode={audioAccent}
                  />
                ) : null}
              </div>
              <p className="vocabulary-block-meaning">{item.meaningVi}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

import CloseIcon from "@mui/icons-material/Close";
import BookmarkAddOutlinedIcon from "@mui/icons-material/BookmarkAddOutlined";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import { Alert, Button, CircularProgress, IconButton } from "@mui/material";
import { useEffect, useState, useCallback } from "react";
import type { StoryWordLookup } from "../../shared/api/story";
import { resolveStorageAssetUrl } from "../../shared/api/file";

type StoryWordPopupProps = {
  open: boolean;
  anchorX: number;
  anchorY: number;
  loading: boolean;
  enriching?: boolean;
  lookup: StoryWordLookup | null;
  error: string;
  canSave: boolean;
  saving: boolean;
  saved: boolean;
  onClose: () => void;
  onSave: () => void;
};

// Mock dictionary for synonyms to make the student UI look exactly like the design specs
const SYNONYMS_MOCK: Record<string, string[]> = {
  jump: ["leaped", "hopped", "sprang"],
  jumped: ["leaped", "hopped", "sprang"],
  boat: ["vessel", "craft", "ship"],
  ocean: ["sea", "marine", "deep"],
  whale: ["cetacean", "leviathan"],
  coral: ["coelenterate", "polyp"],
  dolphin: ["porpoise"],
  dolphins: ["porpoises"],
  fish: ["sea creature", "finny"],
  blue: ["azure", "sapphire", "cobalt"],
  happy: ["cheerful", "joyful", "glad"],
  beautiful: ["lovely", "gorgeous", "pretty"],
  friendly: ["amiable", "kind", "warm"],
  water: ["liquid", "aqua", "sea"],
};

// Mock dictionary for example sentence translations
const EXAMPLE_TRANSLATIONS_MOCK: Record<string, string> = {
  "She jumped into the water.": "Cô ấy nhảy xuống nước.",
  "They were on a small boat.": "Họ đã ở trên một chiếc thuyền nhỏ.",
  "The ocean is blue.": "Đại dương màu xanh.",
  "Is it a whale?": "Đó có phải là cá voi không?",
  "Maybe it is a whale shark.": "Có lẽ đó là cá nhám voi.",
  "They saw a beautiful coral.": "Họ đã thấy rặng san hô đẹp.",
  "They saw a group of dolphins.": "Họ đã thấy một đàn cá heo.",
};

function getSynonyms(word: string): string[] {
  const cleanWord = word.toLowerCase().trim();
  return SYNONYMS_MOCK[cleanWord] ?? [];
}

function getExampleTranslation(sentence: string): string {
  const cleanSentence = sentence.trim();
  return EXAMPLE_TRANSLATIONS_MOCK[cleanSentence] ?? "";
}

function formatExampleSentence(sentence: string, targetWord: string): string {
  if (!sentence) return "";
  // Escape regex special chars
  const escaped = targetWord.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
  // Highlight word and basic suffixes
  const regex = new RegExp(`\\b(${escaped}(?:ing|ed|s|es|r|er)?)\\b`, "gi");
  return sentence.replace(regex, "<strong>$1</strong>");
}

export function StoryWordPopup({
  open,
  anchorX,
  anchorY,
  loading,
  enriching = false,
  lookup,
  error,
  canSave,
  saving,
  saved,
  onClose,
  onSave,
}: StoryWordPopupProps) {
  const [position, setPosition] = useState({ top: anchorY, left: anchorX });
  const [backdropReady, setBackdropReady] = useState(false);

  useEffect(() => {
    if (!open) {
      setBackdropReady(false);
      return;
    }
    setBackdropReady(false);
    const timer = window.setTimeout(() => setBackdropReady(true), 350);
    return () => window.clearTimeout(timer);
  }, [open, anchorX, anchorY]);

  useEffect(() => {
    if (!open) return;
    const margin = 16;
    const width = Math.min(360, window.innerWidth - margin * 2);
    const height = 320; // Expanded slightly for image/synonyms content
    let left = anchorX - width / 2;
    let top = anchorY + 12;
    left = Math.max(margin, Math.min(left, window.innerWidth - width - margin));
    if (top + height > window.innerHeight - margin) {
      top = Math.max(margin, anchorY - height - 12);
    }
    setPosition({ top, left });
  }, [open, anchorX, anchorY]);

  const playAudio = useCallback(() => {
    const url = lookup?.audioUsUrl || lookup?.audioUkUrl;
    if (url) {
      const audio = new Audio(resolveStorageAssetUrl(url));
      void audio.play();
    }
  }, [lookup]);

  if (!open) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        aria-label="Đóng popup"
        onClick={backdropReady ? onClose : undefined}
        style={{
          position: "fixed",
          inset: 0,
          border: "none",
          background: "transparent",
          zIndex: 1399,
          pointerEvents: backdropReady ? "auto" : "none",
        }}
      />
      <div
        className="story-word-popup"
        style={{ top: position.top, left: position.left, padding: "1.25rem", zIndex: 1400 }}
        onClick={(e) => e.stopPropagation()}
      >
        <IconButton
          size="small"
          onClick={onClose}
          aria-label="Đóng"
          style={{ position: "absolute", top: 12, right: 12, color: "#94a3b8" }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "2rem 0" }}>
            <CircularProgress size={24} />
          </div>
        ) : error ? (
          <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>
        ) : lookup ? (
          <div className="story-word-popup__body-wrap" style={{ fontFamily: "inherit" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
              {/* Word & Phonetics */}
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: "8px", marginBottom: "4px" }}>
                  {(lookup.audioUsUrl || lookup.audioUkUrl) && (
                    <IconButton
                      onClick={playAudio}
                      size="small"
                      sx={{
                        color: "#2563eb",
                        bgcolor: "#eff6ff",
                        "&:hover": { bgcolor: "#dbeafe" },
                        width: 32,
                        height: 32,
                        marginRight: "4px",
                        alignSelf: "center",
                      }}
                      aria-label="Phát âm"
                    >
                      <VolumeUpIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  )}
                  <h4 className="story-word-popup__word" style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "#0f172a" }}>
                    {lookup.wordEn}
                  </h4>
                  {lookup.phonetic && (
                    <span
                      className="story-word-popup__phonetic"
                      style={{
                        color: "#64748b",
                        fontSize: "0.85rem",
                      }}
                    >
                      /{lookup.phonetic}/
                    </span>
                  )}
                </div>

                {lookup.partOfSpeech && (
                  <span
                    className="story-word-popup__pos"
                    style={{
                      display: "inline-block",
                      marginLeft: lookup.audioUsUrl || lookup.audioUkUrl ? "40px" : "0",
                      padding: "2px 10px",
                      borderRadius: "12px",
                      background: "#eff6ff",
                      color: "#2563eb",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      textTransform: "lowercase",
                      marginTop: "4px",
                    }}
                  >
                    {lookup.partOfSpeech}
                  </span>
                )}
              </div>

              {/* Right Side Illustration Image */}
              {lookup.imageUrl && (
                <div
                  style={{
                    width: "68px",
                    height: "68px",
                    borderRadius: "10px",
                    overflow: "hidden",
                    flexShrink: 0,
                    marginTop: "4px",
                    border: "1px solid #f1f5f9",
                  }}
                >
                  <img
                    src={resolveStorageAssetUrl(lookup.imageUrl)}
                    alt={lookup.wordEn}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
              )}
            </div>

            {/* Vietnamese meaning */}
            <div style={{ marginTop: "14px" }}>
              {lookup.meaningVi ? (
                <div style={{ color: "#0f172a", fontSize: "0.95rem", fontWeight: 600 }}>{lookup.meaningVi}</div>
              ) : enriching ? (
                <div style={{ color: "#64748b", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: 8 }}>
                  <CircularProgress size={14} />
                  Đang dịch theo ngữ cảnh câu...
                </div>
              ) : (
                <div style={{ color: "#64748b", fontSize: "0.9rem" }}>Chưa có nghĩa tiếng Việt.</div>
              )}
              {lookup.meaningSource === "story" ? (
                <span className="story-word-popup__source-badge story-word-popup__source-badge--story">Bản dịch story</span>
              ) : lookup.meaningSource === "db" ? (
                <span className="story-word-popup__source-badge story-word-popup__source-badge--db">Từ điển hệ thống</span>
              ) : lookup.meaningSource === "ai" ? (
                <span className="story-word-popup__source-badge">AI gợi ý</span>
              ) : null}
            </div>

            {/* Example sentence */}
            {lookup.exampleSentence && (
              <div style={{ marginTop: "12px", display: "flex", gap: "6px", alignItems: "flex-start" }}>
                <span style={{ color: "#94a3b8", fontSize: "1.1rem", lineHeight: 1 }}>•</span>
                <div style={{ fontSize: "0.875rem", color: "#334155" }}>
                  <div
                    style={{ lineHeight: 1.4 }}
                    dangerouslySetInnerHTML={{ __html: formatExampleSentence(lookup.exampleSentence, lookup.wordEn) }}
                  />
                  {getExampleTranslation(lookup.exampleSentence) && (
                    <div style={{ color: "#64748b", marginTop: "2px" }}>
                      {getExampleTranslation(lookup.exampleSentence)}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Synonyms list */}
            {getSynonyms(lookup.wordEn).length > 0 && (
              <div
                style={{
                  marginTop: "16px",
                  paddingTop: "12px",
                  borderTop: "1px solid #f1f5f9",
                  fontSize: "0.8rem",
                  color: "#64748b",
                }}
              >
                <span>Synonyms: </span>
                {getSynonyms(lookup.wordEn).map((syn, idx) => (
                  <span key={syn}>
                    {idx > 0 && <span style={{ color: "#94a3b8", margin: "0 6px" }}>•</span>}
                    <span style={{ color: "#2563eb", fontWeight: 600 }}>{syn}</span>
                  </span>
                ))}
              </div>
            )}

            {/* Bookmark notebook trigger */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
              {canSave && (
                <Button
                  size="small"
                  variant="text"
                  startIcon={<BookmarkAddOutlinedIcon />}
                  disabled={saving || saved}
                  onClick={onSave}
                  sx={{
                    textTransform: "none",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: saved ? "#166534" : "#2563eb",
                    padding: "4px 8px",
                  }}
                >
                  {saved ? "Đã lưu vào notebook" : "Lưu notebook"}
                </Button>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}

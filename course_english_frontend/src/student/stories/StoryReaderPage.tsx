import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import TextIncreaseOutlinedIcon from "@mui/icons-material/TextIncreaseOutlined";
import TextDecreaseOutlinedIcon from "@mui/icons-material/TextDecreaseOutlined";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import EditIcon from "@mui/icons-material/Edit";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import ListAltIcon from "@mui/icons-material/ListAlt";
import QuestionAnswerIcon from "@mui/icons-material/QuestionAnswer";
import DescriptionIcon from "@mui/icons-material/Description";
import AutoStoriesOutlinedIcon from "@mui/icons-material/AutoStoriesOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import { Alert, Button, Chip, CircularProgress, IconButton, Box, Slider, TextField } from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  apiGetStoryReaderPayloadBySlug,
  apiEnrichStoryWord,
  apiLookupStoryWord,
  apiSearchStories,
  type StoryReaderPayload,
  type StoryToken,
  type StoryWordLookup,
  type StoryRecord,
} from "../../shared/api/story";
import { apiSaveNotebookEntry } from "../../shared/api/notebook";
import type { ApiResponse } from "../../shared/api/types";
import { resolveStorageAssetUrl } from "../../shared/api/file";
import { studentRoutePaths } from "../../shared/constants/paths";
import { StoryReaderContent } from "./StoryReaderContent";
import { StoryAudioPlayer } from "./StoryAudioPlayer";
import { StoryWordPopup } from "./StoryWordPopup";
import { findActiveSentenceIndex, findActiveWordIndex } from "./storyKaraoke";
import { buildGlossaryMap, findSentenceBySelection, resolveWordLookupFromPayload } from "./storyReaderLookup";
import "../../styles/student/story-reader.css";

function findSentenceForWord(payload: StoryReaderPayload, wordIndex?: number): string {
  if (wordIndex == null || !payload.sentences?.length) {
    return "";
  }
  const sentence = payload.sentences.find(
    (s) => wordIndex >= s.startWordIndex && wordIndex <= s.endWordIndex,
  );
  return sentence?.text ?? "";
}

export function StoryReaderPage() {
  const { storySlug } = useParams<{ storySlug: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payload, setPayload] = useState<StoryReaderPayload | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [fontScale, setFontScale] = useState(1);

  const [otherStories, setOtherStories] = useState<StoryRecord[]>([]);
  const [storyVocabs, setStoryVocabs] = useState<any[]>([]);
  const [rightTab, setRightTab] = useState<"vocab" | "notes">("vocab");
  const [notesText, setNotesText] = useState("");

  const [highlightOn, setHighlightOn] = useState(true);
  const [autoScrollOn, setAutoScrollOn] = useState(true);
  const [lineFocusOn, setLineFocusOn] = useState(false);
  const [translateOn, setTranslateOn] = useState(false);

  const [popupOpen, setPopupOpen] = useState(false);
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });
  const [lookupLoading, setLookupLoading] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [lookup, setLookup] = useState<StoryWordLookup | null>(null);
  const [activeToken, setActiveToken] = useState<StoryToken | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);
  const [activeSentenceIndex, setActiveSentenceIndex] = useState<number | null>(null);
  const [sentencePopup, setSentencePopup] = useState<{ text: string; textVi: string } | null>(null);
  const enrichRequestRef = useRef(0);
  const lastWordClickRef = useRef<{ wordIndex: number | null; at: number }>({ wordIndex: null, at: 0 });

  const handleClosePopup = useCallback(() => {
    setPopupOpen(false);
    setActiveToken(null);
  }, []);

  const handleAudioTimeUpdate = useCallback(
    (time: number) => {
      if (!payload) return;
      setActiveWordIndex(findActiveWordIndex(time, payload.wordTimeline));
      setActiveSentenceIndex(findActiveSentenceIndex(time, payload.sentenceTimeline));
    },
    [payload],
  );

  useEffect(() => {
    if (!storySlug) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const response = (await apiGetStoryReaderPayloadBySlug(storySlug)) as ApiResponse<StoryReaderPayload>;
        const data = response?.result ?? response?.data ?? null;
        if (!data) {
          if (!cancelled) setError("Không tìm thấy story.");
          return;
        }
        if (!cancelled) setPayload(data);
      } catch {
        if (!cancelled) setError("Không tải được story.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [storySlug]);

  useEffect(() => {
    void (async () => {
      try {
        const resp = await apiSearchStories({ size: 10 });
        const list = resp?.result ?? [];
        setOtherStories(list);
      } catch (err) {
        console.error("Failed to load other stories:", err);
      }
    })();
  }, []);

  useEffect(() => {
    if (storySlug) {
      const storedNotes = localStorage.getItem(`story-notes-${storySlug}`);
      setNotesText(storedNotes ?? "");
    }
  }, [storySlug]);

  useEffect(() => {
    if (!payload?.glossary?.length) {
      setStoryVocabs([]);
      return;
    }
    setStoryVocabs(
      payload.glossary
        .filter((g) => g.meaningVi)
        .slice(0, 12)
        .map((g) => ({
          id: g.vocabularyId ?? g.wordKey,
          wordEn: g.wordEn ?? g.wordKey,
          meaningVi: g.meaningVi,
          partOfSpeech: g.partOfSpeech,
          audioUsUrl: g.audioUsUrl,
          audioUkUrl: g.audioUkUrl,
          imageUrl: g.imageUrl,
        })),
    );
  }, [payload]);

  const handlePlayVocabAudio = (vocab: any) => {
    const url = vocab.audioUsUrl || vocab.audioUkUrl;
    if (url) {
      const audio = new Audio(resolveStorageAssetUrl(url));
      void audio.play();
    }
  };

  const handleNotesTextChange = (txt: string) => {
    setNotesText(txt);
    if (storySlug) {
      localStorage.setItem(`story-notes-${storySlug}`, txt);
    }
  };

  const glossaryMap = useMemo(() => buildGlossaryMap(payload?.glossary), [payload?.glossary]);
  const hasBilingualPack = Boolean(payload?.glossary?.length || payload?.sentences?.some((s) => s.textVi));

  const handleTextSelect = useCallback(
    (selectedText: string) => {
      if (!payload) return;
      const match = findSentenceBySelection(payload, selectedText);
      if (match?.textVi) {
        setSentencePopup({ text: match.text, textVi: match.textVi });
      }
    },
    [payload],
  );

  const contentStyle = useMemo(
    () => ({ fontSize: `${1.125 * fontScale}rem` }),
    [fontScale],
  );

  const handleWordClick = useCallback(
    async (token: StoryToken, event: React.MouseEvent<HTMLSpanElement>) => {
      if (!token.text) return;
      event.stopPropagation();
      setSentencePopup(null);

      const wordIndex = token.wordIndex ?? null;
      const now = Date.now();
      if (
        wordIndex != null &&
        wordIndex === lastWordClickRef.current.wordIndex &&
        now - lastWordClickRef.current.at < 400
      ) {
        return;
      }
      lastWordClickRef.current = { wordIndex, at: now };

      const rect = event.currentTarget.getBoundingClientRect();
      setPopupPos({ x: rect.left + rect.width / 2, y: rect.bottom });
      setActiveToken(token);
      setPopupOpen(true);
      setLookup(null);
      setLookupError("");
      setSaved(false);
      setEnriching(false);

      if (payload && glossaryMap.size > 0) {
        const local = resolveWordLookupFromPayload(payload, glossaryMap, token);
        if (local) {
          setLookup(local);
          setLookupLoading(false);
          return;
        }
      }

      if (!hasBilingualPack) {
        const requestId = ++enrichRequestRef.current;
        const contextSentence = payload ? findSentenceForWord(payload, token.wordIndex) : "";
        setLookupLoading(true);
        try {
          const response = (await apiLookupStoryWord(token.text)) as ApiResponse<StoryWordLookup>;
          let data = response?.result ?? response?.data ?? null;
          if (!data) {
            setLookupError("Không tra được từ.");
            return;
          }
          if (token.vocabularyId && !data.vocabularyId) {
            data.vocabularyId = token.vocabularyId;
          }
          if (enrichRequestRef.current !== requestId) return;
          setLookup(data);
          setLookupLoading(false);

          if (!data.meaningVi?.trim()) {
            setEnriching(true);
            try {
              const enrichResponse = await apiEnrichStoryWord({
                word: token.text,
                contextSentence,
                level: payload?.level,
                partOfSpeech: data.partOfSpeech,
              });
              if (enrichRequestRef.current !== requestId) return;
              const enrichData = enrichResponse?.result ?? enrichResponse?.data;
              if (enrichData?.meaningVi) {
                setLookup((prev) =>
                  prev ? { ...prev, meaningVi: enrichData.meaningVi, meaningSource: "ai" } : prev,
                );
              }
            } catch {
              if (enrichRequestRef.current === requestId) {
                setLookupError((prev) => prev || "Chưa dịch được nghĩa theo ngữ cảnh.");
              }
            } finally {
              if (enrichRequestRef.current === requestId) setEnriching(false);
            }
          }
        } catch {
          if (enrichRequestRef.current === requestId) {
            setLookupError("Không tra được từ.");
            setLookupLoading(false);
          }
        }
        return;
      }

      setLookup({
        wordEn: token.text,
        wordKey: token.text.toLowerCase(),
        vocabularyId: token.vocabularyId,
        inDatabase: Boolean(token.vocabularyId),
        meaningSource: "none",
      });
      setLookupLoading(false);
    },
    [glossaryMap, hasBilingualPack, payload],
  );

  const handleSaveNotebook = useCallback(async () => {
    const wordId = lookup?.vocabularyId ?? activeToken?.vocabularyId;
    if (!payload || !wordId) return;
    setSaving(true);
    try {
      await apiSaveNotebookEntry({
        wordId,
        storyId: payload.id,
        contextSentence: findSentenceForWord(payload, activeToken?.wordIndex),
      });
      setSaved(true);
    } catch {
      setLookupError("Không lưu được notebook.");
    } finally {
      setSaving(false);
    }
  }, [activeToken, lookup, payload]);

  if (loading) {
    return (
      <div className="story-reader" style={{ display: "grid", placeItems: "center", minHeight: "50vh" }}>
        <CircularProgress />
      </div>
    );
  }

  if (error || !payload) {
    return (
      <div className="story-reader story-reader__shell">
        <Alert severity="error">{error || "Story không tồn tại."}</Alert>
        <Button sx={{ mt: 2 }} onClick={() => navigate(studentRoutePaths.stories)}>
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  return (
    <Box className={`story-reader__layout-wrapper${darkMode ? " story-reader--dark" : ""}`}>
      {/* Left Sidebar */}
      <Box className="story-reader__sidebar-left">
        <Box className="brand-logo-area">
          <AutoStoriesOutlinedIcon className="brand-logo-icon" />
          <Box className="brand-logo-texts">
            <span className="brand-logo-title">Course English</span>
            <span className="brand-logo-sub">Learning made easy</span>
          </Box>
        </Box>

        <Box className="sidebar-section">
          <h4 className="sidebar-section__title">STORIES</h4>
          <Box className="sidebar-stories-list">
            {otherStories.map((s) => {
              const isActive = s.slug === storySlug;
              return (
                <Box
                  key={s.id}
                  className={`sidebar-story-item ${isActive ? "sidebar-story-item--active" : ""}`}
                  onClick={() => {
                    if (!isActive) navigate(`/student/stories/${s.slug}`);
                  }}
                >
                  <Box className="sidebar-story-cover">
                    {s.coverImageUrl ? (
                      <img src={resolveStorageAssetUrl(s.coverImageUrl)} alt="" />
                    ) : (
                      <ImageOutlinedIcon sx={{ color: "#94a3b8" }} />
                    )}
                  </Box>
                  <Box className="sidebar-story-info">
                    <span className="sidebar-story-title">{s.title}</span>
                    <span className="sidebar-story-sub">{s.readingTimeMinutes ?? 5} min</span>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>

        <Box className="sidebar-section" style={{ marginTop: "auto" }}>
          <h4 className="sidebar-section__title">SETTINGS</h4>
          <Box className="sidebar-settings-list">
            <Box
              className="sidebar-setting-item sidebar-setting-item--clickable"
              onClick={() => setDarkMode((prev) => !prev)}
            >
              <Box className="setting-label">
                {darkMode ? <DarkModeOutlinedIcon fontSize="small" /> : <LightModeOutlinedIcon fontSize="small" />}
                <span>Dark Mode</span>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Center Reading Panel */}
      <Box className="story-reader__center-panel">
        <h1 className="story-reader__title">{payload.title}</h1>
        <Box className="story-reader__meta">
          {payload.level ? (
            <Chip
              size="small"
              label={payload.level}
              sx={{ background: "#faf5ff", color: "#6b21a8", fontWeight: 700 }}
            />
          ) : null}
          {payload.readingTimeMinutes ? (
            <Chip
              size="small"
              label={`${payload.readingTimeMinutes} phút đọc`}
              sx={{ background: "#f1f5f9", color: "#475569", fontWeight: 600 }}
            />
          ) : null}
          {payload.processingStatus === "AUDIO_READY" ? (
            <Chip
              size="small"
              label="Có audio"
              sx={{ background: "#dcfce7", color: "#166534", fontWeight: 600 }}
            />
          ) : (
            <Chip
              size="small"
              label="Chưa có audio"
              sx={{ background: "#fef3c7", color: "#b45309", fontWeight: 600 }}
            />
          )}
        </Box>

        {payload.audioUrl ? (
          <Box className="story-reader__player-premium">
            <StoryAudioPlayer
              audioUrl={payload.audioUrl}
              duration={payload.duration}
              onTimeUpdate={handleAudioTimeUpdate}
            />
          </Box>
        ) : (
          <Alert severity="info">
            Story chưa có audio. Admin cần bấm &quot;Sinh audio&quot; trước khi nghe karaoke.
          </Alert>
        )}

        <Box style={contentStyle}>
          <StoryReaderContent
            tokens={payload.tokens ?? []}
            sentences={payload.sentences}
            activeWordIndex={activeWordIndex}
            activeSentenceIndex={activeSentenceIndex}
            onWordClick={handleWordClick}
            clickedWordIndex={activeToken?.wordIndex}
            translateOn={translateOn}
            onTextSelect={handleTextSelect}
          />
        </Box>

        {/* Bottom Options Toolbar */}
        <Box className="story-reader__options-toolbar">
          <Button
            size="small"
            className={`option-toggle-btn ${highlightOn ? "option-toggle-btn--active" : ""}`}
            onClick={() => setHighlightOn((v) => !v)}
          >
            Highlight {highlightOn ? "ON" : "OFF"}
          </Button>
          <Button
            size="small"
            className={`option-toggle-btn ${autoScrollOn ? "option-toggle-btn--active" : ""}`}
            onClick={() => setAutoScrollOn((v) => !v)}
          >
            Auto Scroll {autoScrollOn ? "ON" : "OFF"}
          </Button>
          <Button
            size="small"
            className={`option-toggle-btn ${lineFocusOn ? "option-toggle-btn--active" : ""}`}
            onClick={() => setLineFocusOn((v) => !v)}
          >
            Line Focus {lineFocusOn ? "ON" : "OFF"}
          </Button>
          <Button
            size="small"
            className={`option-toggle-btn ${translateOn ? "option-toggle-btn--active" : ""}`}
            onClick={() => setTranslateOn((v) => !v)}
          >
            Translate {translateOn ? "ON" : "OFF"}
          </Button>
        </Box>
      </Box>

      {/* Right Sidebar Quick Panel */}
      <Box className="story-reader__sidebar-right">
        <Box className="quick-actions-row">
          <button className="quick-action-btn" onClick={() => setRightTab("notes")}>
            <EditIcon fontSize="small" />
            <span>Notes</span>
          </button>
          <button className="quick-action-btn" onClick={() => setRightTab("vocab")}>
            <MenuBookIcon fontSize="small" />
            <span>Dictionary</span>
          </button>
          <button className="quick-action-btn" onClick={() => navigate(studentRoutePaths.stories)}>
            <ArrowBackIcon fontSize="small" />
            <span>Back</span>
          </button>
        </Box>

        <Box className="right-sidebar-tabs">
          <span
            className={`right-sidebar-tab ${rightTab === "vocab" ? "right-sidebar-tab--active" : ""}`}
            onClick={() => setRightTab("vocab")}
          >
            Vocabulary
          </span>
          <span
            className={`right-sidebar-tab ${rightTab === "notes" ? "right-sidebar-tab--active" : ""}`}
            onClick={() => setRightTab("notes")}
          >
            Notes
          </span>
        </Box>

        <Box className="right-sidebar-content-area">
          {rightTab === "vocab" ? (
            storyVocabs.length > 0 ? (
              <>
                {storyVocabs.map((v) => (
                  <Box key={v.id} className="vocab-card">
                    <IconButton
                      size="small"
                      className="vocab-card__play"
                      onClick={() => handlePlayVocabAudio(v)}
                    >
                      <VolumeUpIcon fontSize="small" />
                    </IconButton>
                    <Box className="vocab-card__texts">
                      <span className="vocab-card__word">
                        {v.wordEn} <span className="vocab-card__pos">({v.partOfSpeech || "n"})</span>
                      </span>
                      <span className="vocab-card__meaning">
                        {v.meaningVi}
                      </span>
                    </Box>
                    <Box className="vocab-card__img">
                      {v.imageUrl ? (
                        <img src={resolveStorageAssetUrl(v.imageUrl)} alt={v.wordEn} />
                      ) : (
                        <ImageOutlinedIcon sx={{ color: "#cbd5e1", fontSize: "20px" }} />
                      )}
                    </Box>
                  </Box>
                ))}
                <Box style={{ marginTop: "auto" }}>
                  <a href="#" className="view-all-vocab-link">
                    View all vocabulary ({storyVocabs.length}) &gt;
                  </a>
                </Box>
              </>
            ) : (
              <Box style={{ padding: "20px", textAlign: "center", color: "#94a3b8", fontSize: "0.85rem" }}>
                Không có từ vựng CEFR nào được đánh dấu trong truyện này.
              </Box>
            )
          ) : (
            <TextField
              multiline
              minRows={14}
              placeholder="Ghi chú từ vựng hoặc ý kiến của bạn về câu chuyện tại đây..."
              fullWidth
              value={notesText}
              onChange={(e) => handleNotesTextChange(e.target.value)}
            />
          )}
        </Box>
      </Box>

      {sentencePopup ? (
        <Box className="story-sentence-popup">
          <Box className="story-sentence-popup__inner">
            <Button
              size="small"
              onClick={() => setSentencePopup(null)}
              sx={{ position: "absolute", top: 8, right: 8, minWidth: 0 }}
            >
              ✕
            </Button>
            <p className="story-sentence-popup__en">{sentencePopup.text}</p>
            <p className="story-sentence-popup__vi">{sentencePopup.textVi}</p>
          </Box>
        </Box>
      ) : null}

      {/* Floating Word Lookup Dialog Popup */}
      <StoryWordPopup
        open={popupOpen}
        anchorX={popupPos.x}
        anchorY={popupPos.y}
        loading={lookupLoading}
        enriching={enriching}
        lookup={lookup}
        error={lookupError}
        canSave={Boolean((lookup?.vocabularyId ?? activeToken?.vocabularyId) && payload.id)}
        saving={saving}
        saved={saved}
        onClose={handleClosePopup}
        onSave={handleSaveNotebook}
      />
    </Box>
  );
}

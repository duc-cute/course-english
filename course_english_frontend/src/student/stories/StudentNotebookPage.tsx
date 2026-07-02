import BookmarkBorderOutlinedIcon from "@mui/icons-material/BookmarkBorderOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { Alert, Button, IconButton } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { VocabularyAudioButtons } from "../lessonPlayer/vocabulary/VocabularyAudioButtons";
import {
  apiDeleteNotebookEntry,
  apiSearchNotebook,
  type NotebookEntryRecord,
} from "../../shared/api/notebook";
import { studentRoutePaths } from "../../shared/constants/paths";
import "../../styles/student/story-reader.css";

export function StudentNotebookPage() {
  const [rows, setRows] = useState<NotebookEntryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadRows = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiSearchNotebook({ page: 0, size: 100 });
      setRows(response.result ?? []);
    } catch {
      setError("Không tải được notebook.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await apiDeleteNotebookEntry(id);
      setRows((prev) => prev.filter((row) => row.id !== id));
    } catch {
      setError("Không xóa được mục notebook.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="vq-page">
      <header className="vq-vocab-header">
        <h1 className="vq-page-title">Notebook</h1>
        <p className="vq-page-subtitle">Từ đã lưu khi đọc story — ôn lại sau.</p>
        <Button component={Link} to={studentRoutePaths.stories} sx={{ mt: 1 }}>
          Quay lại danh sách story
        </Button>
      </header>

      {error ? (
        <Alert severity="error" sx={{ mb: 2, borderRadius: "14px" }}>
          {error}
        </Alert>
      ) : null}

      {loading ? (
        <p>Đang tải...</p>
      ) : rows.length === 0 ? (
        <div className="vq-lessons-empty">
          <BookmarkBorderOutlinedIcon sx={{ fontSize: 48, color: "var(--vq-outline)", mb: 1 }} />
          <p>Chưa có từ nào trong notebook.</p>
          <Button component={Link} to={studentRoutePaths.stories} variant="contained" sx={{ mt: 1 }}>
            Đọc story
          </Button>
        </div>
      ) : (
        <div className="story-notebook-list">
          {rows.map((row) => (
            <article key={row.id} className="story-notebook-card">
              <div className="story-notebook-card__head">
                <div>
                  <h2 className="story-notebook-card__word">{row.wordEn ?? "—"}</h2>
                  {row.phonetic ? (
                    <p className="story-notebook-card__phonetic">/{row.phonetic}/</p>
                  ) : null}
                  {row.partOfSpeech ? (
                    <span className="story-notebook-card__pos">{row.partOfSpeech}</span>
                  ) : null}
                </div>
                <IconButton
                  size="small"
                  aria-label="Xóa"
                  disabled={deletingId === row.id}
                  onClick={() => void handleDelete(row.id)}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </div>
              {row.meaningVi ? <p className="story-notebook-card__meaning">{row.meaningVi}</p> : null}
              {row.contextSentence ? (
                <p className="story-notebook-card__context">"{row.contextSentence}"</p>
              ) : null}
              {row.storyTitle ? (
                <p className="story-notebook-card__story">
                  Story:{" "}
                  {row.storySlug ? (
                    <Link to={studentRoutePaths.storyRead(row.storySlug)}>{row.storyTitle}</Link>
                  ) : (
                    row.storyTitle
                  )}
                </p>
              ) : null}
              <VocabularyAudioButtons
                audioUkUrl={row.audioUkUrl}
                audioUsUrl={row.audioUsUrl}
                accentMode="BOTH"
              />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

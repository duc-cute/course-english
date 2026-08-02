import AddIcon from "@mui/icons-material/Add";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import LibraryBooksOutlinedIcon from "@mui/icons-material/LibraryBooksOutlined";
import { Alert, CircularProgress, IconButton } from "@mui/material";
import { useRef, useState } from "react";
import type { VocabularyItemRecord, VocabularySetStatus } from "../../../shared/api/vocabularySet";
import { apiUploadFile, buildStoragePublicUrl, resolveStorageAssetUrl } from "../../../shared/api/file";
import { apiLookupVocabularyWord } from "../../../shared/api/vocabularyWord";
import { VocabularyAudioPreview } from "./VocabularyAudioPreview";

export type VocabularySetFormState = {
  title: string;
  description: string;
  coverImageUrl?: string;
  status: VocabularySetStatus;
  items: VocabularyItemRecord[];
};

type VocabularySetFormProps = {
  form: VocabularySetFormState;
  error?: string;
  onChange: (next: VocabularySetFormState) => void;
  onAiGenClick?: () => void;
  onPickFromLibrary?: () => void;
  /** Khi sửa bộ từ đã có — dùng folder upload theo id */
  setId?: string;
  onUploadError?: (message: string) => void;
};

function emptyItem(): VocabularyItemRecord {
  return { wordEn: "", meaningVi: "" };
}

export function VocabularySetForm({
  form,
  error,
  onChange,
  onAiGenClick,
  onPickFromLibrary,
  setId,
  onUploadError,
}: VocabularySetFormProps) {
  const [lookupIndex, setLookupIndex] = useState<number | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef(form);
  formRef.current = form;
  const lookupCache = useRef<Record<string, boolean>>({});

  const updateItem = (index: number, patch: Partial<VocabularyItemRecord>) => {
    const items = form.items.map((item, i) => (i === index ? { ...item, ...patch } : item));
    onChange({ ...form, items });
  };

  const pickCover = () => {
    if (!coverUploading) coverInputRef.current?.click();
  };

  const uploadCover = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      onUploadError?.("Chỉ chấp nhận file ảnh (JPG, PNG, WebP).");
      return;
    }
    setCoverUploading(true);
    try {
      const folder = setId ? `vocabulary-sets/${setId}/cover` : "vocabulary-sets/covers";
      const uploaded = await apiUploadFile(file, folder);
      const url = buildStoragePublicUrl(folder, uploaded.fileName);
      onChange({ ...formRef.current, coverImageUrl: url });
    } catch (err) {
      onUploadError?.((err as { message?: string })?.message || "Upload ảnh bìa thất bại.");
    } finally {
      setCoverUploading(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  };

  const addItem = () => {
    onChange({ ...form, items: [...form.items, emptyItem()] });
  };

  const removeItem = (index: number) => {
    onChange({ ...form, items: form.items.filter((_, i) => i !== index) });
  };

  const lookupWord = async (index: number) => {
    const item = form.items[index];
    const word = item?.wordEn?.trim();
    if (!word) return;

    const cacheKey = word.toLowerCase();
    if (lookupCache.current[cacheKey] && item.phonetic) return;

    setLookupIndex(index);
    try {
      const preview = await apiLookupVocabularyWord(word);
      lookupCache.current[cacheKey] = true;
      if (preview) {
        updateItem(index, {
          phonetic: preview.phonetic ?? item.phonetic,
          audioUkUrl: preview.audioUkUrl ?? item.audioUkUrl,
          audioUsUrl: preview.audioUsUrl ?? item.audioUsUrl,
          partOfSpeech: item.partOfSpeech || preview.partOfSpeech,
        });
      }
    } finally {
      setLookupIndex(null);
    }
  };

  return (
    <div className="vocab-set-editor">
      {error ? (
        <Alert severity="error" className="vocab-set-editor__alert">
          {error}
        </Alert>
      ) : null}

      <div className="vocab-set-editor__hero">
        <div className="vocab-set-editor__cover-wrap">
          <button
            type="button"
            className={`vocab-set-editor__cover${form.coverImageUrl ? "" : " vocab-set-editor__cover--placeholder"}${coverUploading ? " vocab-set-editor__cover--uploading" : ""}`}
            onClick={pickCover}
            disabled={coverUploading}
            aria-label={form.coverImageUrl ? "Thay đổi ảnh bìa" : "Chọn ảnh bìa"}
          >
            {form.coverImageUrl ? (
              <img src={resolveStorageAssetUrl(form.coverImageUrl)} alt="" />
            ) : (
              <ImageOutlinedIcon />
            )}
            <span className="vocab-set-editor__cover-overlay">
              {coverUploading ? (
                <CircularProgress size={22} sx={{ color: "#fff" }} />
              ) : (
                <>
                  <ImageOutlinedIcon fontSize="small" />
                  <span>{form.coverImageUrl ? "Đổi ảnh" : "Chọn ảnh"}</span>
                </>
              )}
            </span>
          </button>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg,image/webp"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void uploadCover(file);
            }}
          />
          {form.coverImageUrl && !coverUploading ? (
            <button
              type="button"
              className="vocab-set-editor__cover-clear"
              onClick={() => onChange({ ...form, coverImageUrl: undefined })}
              aria-label="Xóa ảnh bìa"
            >
              <DeleteOutlineIcon fontSize="inherit" />
            </button>
          ) : null}
        </div>

        <div className="vocab-set-editor__meta">
          <div className="vocab-set-editor__meta-row">
            <div className="vocab-set-editor__field vocab-set-editor__field--grow">
              <label className="vocab-set-editor__label" htmlFor="vocab-set-title">
                Tiêu đề bộ từ
              </label>
              <input
                id="vocab-set-title"
                className="vocab-set-editor__title-input"
                value={form.title}
                onChange={(e) => onChange({ ...form, title: e.target.value })}
                placeholder="Wild Animals Vocabulary (B1)"
              />
            </div>
            <div className="vocab-set-editor__field vocab-set-editor__field--status">
              <label className="vocab-set-editor__label" htmlFor="vocab-set-status">
                Trạng thái
              </label>
              <select
                id="vocab-set-status"
                className="vocab-set-editor__status-select"
                value={form.status}
                onChange={(e) => onChange({ ...form, status: e.target.value as VocabularySetStatus })}
              >
                <option value="DRAFT">Nháp</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Lưu trữ</option>
              </select>
            </div>
          </div>

          <div className="vocab-set-editor__field">
            <label className="vocab-set-editor__label" htmlFor="vocab-set-desc">
              Mô tả chi tiết
            </label>
            <textarea
              id="vocab-set-desc"
              className="vocab-set-editor__desc-input"
              rows={2}
              value={form.description}
              onChange={(e) => onChange({ ...form, description: e.target.value })}
              placeholder="Mô tả ngắn về chủ đề và trình độ bộ từ…"
            />
          </div>
        </div>
      </div>

      <div className="vocab-set-editor__toolbar">
        <div className="vocab-set-editor__toolbar-left">
          <span className="vocab-set-editor__toolbar-title">Danh sách từ</span>
          <span className="vocab-set-editor__toolbar-count">{form.items.length} từ</span>
        </div>
        <div className="vocab-set-editor__toolbar-actions">
          {onPickFromLibrary ? (
            <button type="button" className="vocab-set-editor__btn vocab-set-editor__btn--outline" onClick={onPickFromLibrary}>
              <LibraryBooksOutlinedIcon fontSize="small" />
              Chọn từ thư viện
            </button>
          ) : null}
          {onAiGenClick ? (
            <button type="button" className="vocab-set-editor__btn vocab-set-editor__btn--ai" onClick={onAiGenClick}>
              <AutoAwesomeOutlinedIcon fontSize="small" />
              Sinh bằng AI
            </button>
          ) : null}
          <button type="button" className="vocab-set-editor__btn vocab-set-editor__btn--primary" onClick={addItem}>
            <AddIcon fontSize="small" />
            Thêm từ
          </button>
        </div>
      </div>

      <div className="vocab-set-editor__table-wrap">
        <div className="vocab-set-editor__table-card">
          <table className="vocab-set-editor__table">
            <thead>
              <tr>
                <th className="vocab-set-editor__th vocab-set-editor__th--num">#</th>
                <th className="vocab-set-editor__th">Từ vựng (Word)</th>
                <th className="vocab-set-editor__th">Nghĩa (Meaning)</th>
                <th className="vocab-set-editor__th vocab-set-editor__th--pos">Loại từ</th>
                <th className="vocab-set-editor__th">Ví dụ (Example)</th>
                <th className="vocab-set-editor__th vocab-set-editor__th--audio">Audio</th>
                <th className="vocab-set-editor__th vocab-set-editor__th--action" />
              </tr>
            </thead>
            <tbody>
              {form.items.map((item, index) => (
                <tr key={index} className="vocab-set-editor__row">
                  <td className="vocab-set-editor__td vocab-set-editor__td--num">{index + 1}</td>
                  <td className="vocab-set-editor__td">
                    <div className="vocab-set-editor__word-cell">
                      <input
                        className="vocab-set-editor__cell-input vocab-set-editor__cell-input--word"
                        value={item.wordEn}
                        onChange={(e) => updateItem(index, { wordEn: e.target.value })}
                        onBlur={() => void lookupWord(index)}
                        placeholder="apple"
                        size={Math.max(item.wordEn.length || 5, 5)}
                      />
                      {item.phonetic ? (
                        <span className="vocab-set-editor__phonetic">{item.phonetic}</span>
                      ) : null}
                      {lookupIndex === index ? (
                        <CircularProgress size={12} className="vocab-set-editor__lookup" />
                      ) : null}
                    </div>
                  </td>
                  <td className="vocab-set-editor__td">
                    <input
                      className="vocab-set-editor__cell-input"
                      value={item.meaningVi}
                      onChange={(e) => updateItem(index, { meaningVi: e.target.value })}
                      placeholder="quả táo"
                    />
                  </td>
                  <td className="vocab-set-editor__td">
                    <input
                      className="vocab-set-editor__pos-input"
                      value={item.partOfSpeech ?? ""}
                      onChange={(e) => updateItem(index, { partOfSpeech: e.target.value })}
                      placeholder="noun"
                    />
                  </td>
                  <td className="vocab-set-editor__td">
                    <input
                      className="vocab-set-editor__cell-input vocab-set-editor__cell-input--example"
                      value={item.exampleSentence ?? ""}
                      onChange={(e) => updateItem(index, { exampleSentence: e.target.value })}
                      placeholder="One short example sentence…"
                    />
                  </td>
                  <td className="vocab-set-editor__td vocab-set-editor__td--audio">
                    <VocabularyAudioPreview audioUkUrl={item.audioUkUrl} audioUsUrl={item.audioUsUrl} compact />
                  </td>
                  <td className="vocab-set-editor__td vocab-set-editor__td--action">
                    <IconButton
                      size="small"
                      className="vocab-set-editor__delete-btn"
                      onClick={() => removeItem(index)}
                      disabled={form.items.length <= 1}
                      aria-label="Xóa dòng"
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function createDefaultVocabularySetForm(): VocabularySetFormState {
  return {
    title: "",
    description: "",
    status: "DRAFT",
    items: [
      { wordEn: "apple", meaningVi: "quả táo" },
      { wordEn: "book", meaningVi: "cuốn sách" },
      { wordEn: "happy", meaningVi: "vui" },
      { wordEn: "school", meaningVi: "trường học" },
      { wordEn: "water", meaningVi: "nước" },
    ],
  };
}

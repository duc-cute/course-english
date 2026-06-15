import { Box, Button, MenuItem, TextField, Typography } from "@mui/material";
import { useState } from "react";
import type { LessonAssetRecord, LessonBlockRecord } from "../../shared/api/lesson";
import { parseBlockPayload, stringifyBlockPayload } from "../../shared/api/lesson";
import { apiCreateLessonAsset, apiUpdateLessonBlock } from "../../shared/api/lesson";
import { apiUploadFile, buildStoragePublicUrl } from "../../shared/api/file";
import {
  muBtnSmPrimary,
  muFooterBtnOutlined,
  muTextFieldSx,
} from "../../pages/admin/manageUserUiStyles";
import { LessonImageUpload } from "./LessonImageUpload";
import { LessonRichTextEditor } from "./LessonRichTextEditor";
import { CalloutBlockEditor } from "./CalloutBlockEditor";
import { ExerciseSetEditor } from "./exercise/ExerciseSetEditor";
import { QuestionRefEditor } from "./question/QuestionRefEditor";
import { SummaryBlockEditor } from "./SummaryBlockEditor";
import { VocabularyBlockEditor } from "./vocabulary/VocabularyBlockEditor";
import {
  SLIDE_DECK_DISPLAY_MODE_OPTIONS,
  parseSlideDeckPayload,
} from "../../shared/lesson/slideDeckPayload";

type TextPayload = { html?: string };
type ImagePayload = { assetId?: string; caption?: string };

type LessonBlockEditorPanelProps = {
  block: LessonBlockRecord;
  lessonId: string;
  assets: LessonAssetRecord[];
  onSaved: () => void;
  onCancel: () => void;
};

export function LessonBlockEditorPanel({
  block,
  lessonId,
  assets,
  onSaved,
  onCancel,
}: LessonBlockEditorPanelProps) {
  const [draft, setDraft] = useState({ ...block });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const saveBlock = async (nextPayload: string) => {
    setSaving(true);
    setError("");
    try {
      await apiUpdateLessonBlock(block.id, {
        blockType: block.blockType,
        displayOrder: block.displayOrder,
        payloadJson: nextPayload,
      });
      onSaved();
    } catch (err) {
      setError((err as { message?: string })?.message || "Không thể lưu block.");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => {
    void saveBlock(draft.payloadJson ?? "{}");
  };

  if (block.blockType === "TEXT") {
    const payload = parseBlockPayload<TextPayload>(draft.payloadJson);
    return (
      <Box sx={{ display: "grid", gap: 1.5, pt: 1 }}>
        <LessonRichTextEditor
          value={payload.html ?? ""}
          onChange={(html) =>
            setDraft((d) => ({
              ...d,
              payloadJson: stringifyBlockPayload({ html }),
            }))
          }
        />
        {error ? <Typography color="error" fontSize={12}>{error}</Typography> : null}
        <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
          <Button size="small" sx={muFooterBtnOutlined} onClick={onCancel}>
            Hủy
          </Button>
          <Button size="small" variant="contained" sx={muBtnSmPrimary} disabled={saving} onClick={handleSave}>
            {saving ? "Đang lưu..." : "Lưu đoạn văn"}
          </Button>
        </Box>
      </Box>
    );
  }

  if (block.blockType === "IMAGE") {
    const payload = parseBlockPayload<ImagePayload>(draft.payloadJson);
    const linkedAsset = assets.find((a) => a.id === payload.assetId);
    const imageUrl = linkedAsset?.url;

    const uploadImage = async (file: File) => {
      setUploading(true);
      setError("");
      try {
        const folder = `lessons/${lessonId}`;
        const uploaded = await apiUploadFile(file, folder);
        const url = buildStoragePublicUrl(folder, uploaded.fileName);
        const assetRes = await apiCreateLessonAsset(lessonId, {
          type: "IMAGE",
          url,
          caption: payload.caption || file.name,
        });
        const asset =
          (assetRes as { result?: LessonAssetRecord }).result ??
          (assetRes as { data?: LessonAssetRecord }).data;
        const nextPayload = stringifyBlockPayload({
          assetId: asset?.id ?? "",
          caption: payload.caption || file.name,
        });
        setDraft((d) => ({ ...d, payloadJson: nextPayload }));
        await saveBlock(nextPayload);
      } catch (err) {
        setError((err as { message?: string })?.message || "Upload ảnh thất bại.");
      } finally {
        setUploading(false);
      }
    };

    return (
      <Box sx={{ display: "grid", gap: 1.5, pt: 1 }}>
        <LessonImageUpload imageUrl={imageUrl} uploading={uploading} onFileSelected={uploadImage} />
        <TextField
          label="Chú thích ảnh"
          size="small"
          fullWidth
          sx={muTextFieldSx}
          value={payload.caption ?? ""}
          onChange={(e) =>
            setDraft((d) => ({
              ...d,
              payloadJson: stringifyBlockPayload({ ...payload, caption: e.target.value }),
            }))
          }
        />
        {error ? <Typography color="error" fontSize={12}>{error}</Typography> : null}
        <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
          <Button size="small" sx={muFooterBtnOutlined} onClick={onCancel}>
            Hủy
          </Button>
          <Button size="small" variant="contained" sx={muBtnSmPrimary} disabled={saving} onClick={handleSave}>
            {saving ? "Đang lưu..." : "Lưu chú thích"}
          </Button>
        </Box>
      </Box>
    );
  }

  if (block.blockType === "EXERCISE_SET") {
    return (
      <ExerciseSetEditor
        payloadJson={draft.payloadJson ?? "{}"}
        saving={saving}
        error={error}
        onSave={saveBlock}
        onCancel={onCancel}
      />
    );
  }

  if (block.blockType === "QUESTION_REF") {
    return (
      <QuestionRefEditor
        payloadJson={draft.payloadJson ?? "{}"}
        saving={saving}
        error={error}
        onSave={saveBlock}
        onCancel={onCancel}
      />
    );
  }

  if (block.blockType === "VOCABULARY") {
    return (
      <VocabularyBlockEditor
        payloadJson={draft.payloadJson ?? "{}"}
        resolvedVocabularyJson={block.resolvedVocabularyJson}
        saving={saving}
        error={error}
        onSave={saveBlock}
        onCancel={onCancel}
      />
    );
  }

  if (block.blockType === "SUMMARY") {
    return (
      <SummaryBlockEditor
        payloadJson={draft.payloadJson ?? "{}"}
        saving={saving}
        error={error}
        onSave={saveBlock}
        onCancel={onCancel}
      />
    );
  }

  if (block.blockType === "CALLOUT") {
    return (
      <CalloutBlockEditor
        payloadJson={draft.payloadJson ?? "{}"}
        saving={saving}
        error={error}
        onSave={saveBlock}
        onCancel={onCancel}
      />
    );
  }

  if (block.blockType === "SLIDE_DECK") {
    const payload = parseSlideDeckPayload(draft.payloadJson);
    return (
      <Box sx={{ display: "grid", gap: 1.5, pt: 1 }}>
        <Typography sx={{ fontSize: 13, color: "#5F5E5A" }}>
          {payload.slides.length} slide · nguồn: {payload.source?.originalFileName || "ZIP PDF"}
        </Typography>
        <TextField
          label="Tiêu đề slide deck"
          size="small"
          fullWidth
          sx={muTextFieldSx}
          value={payload.title ?? ""}
          onChange={(e) =>
            setDraft((d) => ({
              ...d,
              payloadJson: stringifyBlockPayload({ ...payload, title: e.target.value }),
            }))
          }
        />
        <TextField
          select
          label="Cách hiển thị"
          size="small"
          fullWidth
          sx={muTextFieldSx}
          value={payload.displayMode ?? "PRESENTATION"}
          onChange={(e) =>
            setDraft((d) => ({
              ...d,
              payloadJson: stringifyBlockPayload({
                ...payload,
                displayMode: e.target.value as typeof payload.displayMode,
              }),
            }))
          }
        >
          {SLIDE_DECK_DISPLAY_MODE_OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value}>
              {o.label}
            </MenuItem>
          ))}
        </TextField>
        <Typography sx={{ fontSize: 12, color: "#888780" }}>
          Để thay slide, dùng &quot;Import slide ZIP&quot; và xóa khối cũ nếu cần.
        </Typography>
        {error ? <Typography color="error" fontSize={12}>{error}</Typography> : null}
        <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
          <Button size="small" sx={muFooterBtnOutlined} onClick={onCancel}>
            Hủy
          </Button>
          <Button size="small" variant="contained" sx={muBtnSmPrimary} disabled={saving} onClick={handleSave}>
            {saving ? "Đang lưu..." : "Lưu"}
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Typography fontSize={12} color="text.secondary" sx={{ pt: 1 }}>
      Loại block này chưa có trình soạn — sẽ bổ sung ở Phase P1/P2.
    </Typography>
  );
}

import LibraryBooksOutlinedIcon from "@mui/icons-material/LibraryBooksOutlined";
import StyleOutlinedIcon from "@mui/icons-material/StyleOutlined";
import ViewListOutlinedIcon from "@mui/icons-material/ViewListOutlined";
import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import {
  muBtnSmPrimary,
  muFooterBtnOutlined,
  muTextFieldSx,
} from "../../../pages/admin/manageUserUiStyles";
import type { VocabularySetRecord } from "../../../shared/api/vocabularySet";
import {
  buildVocabularyPayloadJson,
  createDefaultVocabularyPayload,
  parseVocabularyBlockPayload,
  type VocabularyBlockPayload,
} from "../../../shared/lesson/vocabularyPayload";
import { VocabularySetPickerDialog } from "./VocabularySetPickerDialog";

type VocabularyBlockEditorProps = {
  payloadJson: string;
  resolvedVocabularyJson?: string;
  saving: boolean;
  error?: string;
  onSave: (payloadJson: string) => Promise<void>;
  onCancel: () => void;
};

export function VocabularyBlockEditor({
  payloadJson,
  resolvedVocabularyJson,
  saving,
  error,
  onSave,
  onCancel,
}: VocabularyBlockEditorProps) {
  const initial = useMemo(() => parseVocabularyBlockPayload(payloadJson), [payloadJson]);
  const [draft, setDraft] = useState<VocabularyBlockPayload>(initial);
  const [pickerOpen, setPickerOpen] = useState(false);

  const resolvedCount = useMemo(() => {
    try {
      const parsed = resolvedVocabularyJson ? JSON.parse(resolvedVocabularyJson) : [];
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
  }, [resolvedVocabularyJson]);

  const hasSet = Boolean(draft.vocabularySetId?.trim());

  const handlePickSet = (set: VocabularySetRecord) => {
    const base = createDefaultVocabularyPayload(set.id, set.title);
    setDraft((d) => ({
      ...base,
      title: d.title?.trim() ? d.title : base.title,
      instruction: d.instruction ?? base.instruction,
      showPhonetic: d.showPhonetic,
    }));
    setPickerOpen(false);
  };

  const handleSave = async () => {
    if (!hasSet) return;
    await onSave(buildVocabularyPayloadJson(draft));
  };

  return (
    <Box sx={{ display: "grid", gap: 1.5, pt: 1 }}>
      {!hasSet ? (
        <Alert severity="warning" sx={{ fontSize: 12 }}>
          Khối này <strong>chưa gắn bộ từ</strong>. Bấm <strong>Chọn bộ từ</strong> bên dưới, hoặc xóa khối và dùng{" "}
          <strong>+ Bộ từ vào bài</strong> (tự tạo từ vựng + MCQ).
        </Alert>
      ) : (
        <Alert severity="info" sx={{ fontSize: 12 }}>
          Bộ từ: <strong>{draft.vocabularySetTitle || draft.vocabularySetId}</strong>
          {resolvedCount > 0
            ? ` · ${resolvedCount} mục (live — HS F5 để cập nhật)`
            : " · chưa có từ hiển thị (kiểm tra bộ từ đã Publish?)"}
        </Alert>
      )}

      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
        <Button
          size="small"
          variant="outlined"
          startIcon={<LibraryBooksOutlinedIcon />}
          sx={{ ...muFooterBtnOutlined, textTransform: "none" }}
          onClick={() => setPickerOpen(true)}
        >
          {hasSet ? "Đổi bộ từ" : "Chọn bộ từ"}
        </Button>
        {hasSet ? (
          <Typography sx={{ fontSize: 11, color: "text.secondary" }}>
            Sửa nội dung từ tại trang <strong>Bộ từ vựng</strong>.
          </Typography>
        ) : null}
      </Box>

      <TextField
        label="Tiêu đề khối"
        size="small"
        fullWidth
        sx={muTextFieldSx}
        value={draft.title ?? ""}
        onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
      />

      <TextField
        label="Hướng dẫn học sinh"
        size="small"
        fullWidth
        sx={muTextFieldSx}
        value={draft.instruction ?? ""}
        onChange={(e) => setDraft((d) => ({ ...d, instruction: e.target.value }))}
      />

      <Box>
        <Typography sx={{ fontSize: 12, fontWeight: 600, mb: 0.75, color: "text.secondary" }}>
          Cách hiển thị (học sinh)
        </Typography>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={draft.presentation ?? "list"}
          onChange={(_, value: "list" | "flashcard" | null) => {
            if (value) setDraft((d) => ({ ...d, presentation: value }));
          }}
          sx={{ "& .MuiToggleButton-root": { textTransform: "none", gap: 0.5, px: 1.5 } }}
        >
          <ToggleButton value="list">
            <ViewListOutlinedIcon sx={{ fontSize: 18 }} />
            Danh sách
          </ToggleButton>
          <ToggleButton value="flashcard">
            <StyleOutlinedIcon sx={{ fontSize: 18 }} />
            Flashcard
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <FormControlLabel
        control={
          <Switch
            checked={draft.showPhonetic !== false}
            onChange={(e) => setDraft((d) => ({ ...d, showPhonetic: e.target.checked }))}
          />
        }
        label="Hiện phiên âm (nếu có)"
      />

      {error ? (
        <Typography color="error" fontSize={12}>
          {error}
        </Typography>
      ) : null}

      <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
        <Button size="small" sx={muFooterBtnOutlined} onClick={onCancel}>
          Hủy
        </Button>
        <Button
          size="small"
          variant="contained"
          sx={muBtnSmPrimary}
          disabled={saving || !hasSet}
          onClick={() => void handleSave()}
        >
          {saving ? "Đang lưu..." : "Lưu khối từ vựng"}
        </Button>
      </Box>

      <VocabularySetPickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handlePickSet}
      />
    </Box>
  );
}

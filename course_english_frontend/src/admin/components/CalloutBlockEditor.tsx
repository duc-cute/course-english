import { Box, Button, MenuItem, TextField, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import {
  buildCalloutPayloadJson,
  CALLOUT_VARIANT_OPTIONS,
  parseCalloutBlockPayload,
  validateCalloutPayload,
  type CalloutVariant,
} from "../../shared/lesson/calloutPayload";
import { muBtnSmPrimary, muFooterBtnOutlined, muTextFieldSx } from "../../pages/admin/manageUserUiStyles";
import { LessonRichTextEditor } from "./LessonRichTextEditor";

type CalloutBlockEditorProps = {
  payloadJson: string;
  saving: boolean;
  error: string;
  onSave: (nextPayload: string) => void | Promise<void>;
  onCancel: () => void;
};

export function CalloutBlockEditor({
  payloadJson,
  saving,
  error,
  onSave,
  onCancel,
}: CalloutBlockEditorProps) {
  const initial = useMemo(() => parseCalloutBlockPayload(payloadJson), [payloadJson]);
  const [variant, setVariant] = useState<CalloutVariant>(initial.variant);
  const [title, setTitle] = useState(initial.title ?? "");
  const [html, setHtml] = useState(initial.html);
  const [localError, setLocalError] = useState("");

  const handleSave = () => {
    const payload = { variant, title, html };
    const validationError = validateCalloutPayload(payload);
    if (validationError) {
      setLocalError(validationError);
      return;
    }
    setLocalError("");
    void onSave(buildCalloutPayloadJson(payload));
  };

  return (
    <Box sx={{ display: "grid", gap: 1.5, pt: 1 }}>
      <TextField
        select
        label="Loại ghi chú"
        size="small"
        fullWidth
        sx={muTextFieldSx}
        value={variant}
        onChange={(e) => setVariant(e.target.value as CalloutVariant)}
      >
        {CALLOUT_VARIANT_OPTIONS.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        label="Tiêu đề (tuỳ chọn)"
        size="small"
        fullWidth
        sx={muTextFieldSx}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Ví dụ: Mẹo nhớ thì"
      />
      <LessonRichTextEditor value={html} onChange={setHtml} />
      {localError || error ? (
        <Typography color="error" fontSize={12}>
          {localError || error}
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
          disabled={saving}
          onClick={handleSave}
        >
          {saving ? "Đang lưu..." : "Lưu ghi chú"}
        </Button>
      </Box>
    </Box>
  );
}

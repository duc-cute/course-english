import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { Box, Button, IconButton, TextField, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import {
  buildSummaryPayloadJson,
  parseSummaryBlockPayload,
  validateSummaryPayload,
} from "../../shared/lesson/summaryPayload";
import { muBtnSmPrimary, muFooterBtnOutlined, muTextFieldSx } from "../../pages/admin/manageUserUiStyles";

type SummaryBlockEditorProps = {
  payloadJson: string;
  saving: boolean;
  error: string;
  onSave: (nextPayload: string) => void | Promise<void>;
  onCancel: () => void;
};

export function SummaryBlockEditor({
  payloadJson,
  saving,
  error,
  onSave,
  onCancel,
}: SummaryBlockEditorProps) {
  const initial = useMemo(() => parseSummaryBlockPayload(payloadJson), [payloadJson]);
  const [title, setTitle] = useState(initial.title ?? "Điểm chính cần nhớ");
  const [items, setItems] = useState<string[]>(
    initial.items.length ? initial.items : ["", ""],
  );
  const [localError, setLocalError] = useState("");

  const handleSave = () => {
    const payload = { title, items };
    const validationError = validateSummaryPayload(payload);
    if (validationError) {
      setLocalError(validationError);
      return;
    }
    setLocalError("");
    void onSave(buildSummaryPayloadJson(payload));
  };

  return (
    <Box sx={{ display: "grid", gap: 1.5, pt: 1 }}>
      <TextField
        label="Tiêu đề khối"
        size="small"
        fullWidth
        sx={muTextFieldSx}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <Typography sx={{ fontSize: 12, color: "#5F5E5A" }}>
        Danh sách ý cần nhớ — học sinh thấy dạng bullet ở cuối phần đọc.
      </Typography>
      {items.map((item, index) => (
        <Box key={index} sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
          <TextField
            label={`Ý ${index + 1}`}
            size="small"
            fullWidth
            sx={muTextFieldSx}
            value={item}
            onChange={(e) =>
              setItems((prev) => prev.map((row, i) => (i === index ? e.target.value : row)))
            }
          />
          <IconButton
            size="small"
            aria-label="Xóa ý"
            disabled={items.length <= 1}
            onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Box>
      ))}
      <Button
        size="small"
        startIcon={<AddIcon />}
        sx={{ alignSelf: "flex-start", textTransform: "none" }}
        onClick={() => setItems((prev) => [...prev, ""])}
      >
        Thêm ý
      </Button>
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
          {saving ? "Đang lưu..." : "Lưu tóm tắt"}
        </Button>
      </Box>
    </Box>
  );
}

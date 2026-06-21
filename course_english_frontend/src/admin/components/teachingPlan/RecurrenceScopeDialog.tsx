import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  Radio,
  RadioGroup,
} from "@mui/material";
import { useEffect, useState } from "react";
import type { RecurrenceScope } from "../../../shared/api/classSession";

type RecurrenceScopeDialogProps = {
  open: boolean;
  mode: "update" | "cancel";
  onClose: () => void;
  onConfirm: (scope: RecurrenceScope) => void;
  loading?: boolean;
};

const OPTIONS: { value: RecurrenceScope; label: string; description: string }[] = [
  {
    value: "THIS_ONLY",
    label: "Chỉ buổi này",
    description: "Các buổi khác trong chuỗi lặp giữ nguyên.",
  },
  {
    value: "THIS_AND_FOLLOWING",
    label: "Buổi này và các buổi sau",
    description: "Áp dụng từ buổi đang chọn trở về sau.",
  },
  {
    value: "ALL_IN_SERIES",
    label: "Cả chuỗi lặp",
    description: "Áp dụng mọi buổi còn lại trong chuỗi.",
  },
];

export function RecurrenceScopeDialog({
  open,
  mode,
  onClose,
  onConfirm,
  loading = false,
}: RecurrenceScopeDialogProps) {
  const [scope, setScope] = useState<RecurrenceScope>("THIS_ONLY");

  useEffect(() => {
    if (open) setScope("THIS_ONLY");
  }, [open]);

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{mode === "cancel" ? "Hủy buổi trong chuỗi lặp" : "Sửa chuỗi lặp"}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Buổi này thuộc lịch lặp tuần. Bạn muốn áp dụng thay đổi cho phạm vi nào?
        </DialogContentText>
        <RadioGroup value={scope} onChange={(e) => setScope(e.target.value as RecurrenceScope)}>
          {OPTIONS.map((opt) => (
            <FormControlLabel
              key={opt.value}
              value={opt.value}
              control={<Radio />}
              label={
                <span>
                  <strong>{opt.label}</strong>
                  <br />
                  <span style={{ fontSize: "0.85rem", opacity: 0.8 }}>{opt.description}</span>
                </span>
              }
            />
          ))}
        </RadioGroup>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Quay lại
        </Button>
        <Button
          color={mode === "cancel" ? "error" : "primary"}
          variant="contained"
          disabled={loading}
          onClick={() => onConfirm(scope)}
        >
          {loading ? "Đang xử lý…" : mode === "cancel" ? "Xác nhận hủy" : "Áp dụng"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

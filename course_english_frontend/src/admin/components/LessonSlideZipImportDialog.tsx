import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { useRef, useState } from "react";
import { apiImportLessonSlidesZip } from "../../shared/api/lesson";
import type { ApiResponse } from "../../shared/api/types";
import {
  SLIDE_DECK_DISPLAY_MODE_OPTIONS,
  SLIDE_DECK_DISPLAY_MODE_PRESENTATION,
  type SlideDeckDisplayMode,
} from "../../shared/lesson/slideDeckPayload";
import {
  muBtnSmPrimary,
  muDialogFooter,
  muDialogPaper,
  muFieldLabel,
  muFooterBtnOutlined,
  muFooterBtnPrimary,
  muTextFieldSx,
} from "../../pages/admin/manageUserUiStyles";

type LessonSlideZipImportDialogProps = {
  open: boolean;
  lessonId: string;
  onClose: () => void;
  onImported: () => void;
};

export function LessonSlideZipImportDialog({
  open,
  lessonId,
  onClose,
  onImported,
}: LessonSlideZipImportDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [displayMode, setDisplayMode] = useState<SlideDeckDisplayMode>(SLIDE_DECK_DISPLAY_MODE_PRESENTATION);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setFile(null);
    setTitle("");
    setDisplayMode(SLIDE_DECK_DISPLAY_MODE_PRESENTATION);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleClose = () => {
    if (uploading) return;
    reset();
    onClose();
  };

  const handleImport = async () => {
    if (!file) {
      setError("Chọn file ZIP chứa các file PDF.");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const response = (await apiImportLessonSlidesZip(
        lessonId,
        file,
        title.trim() || undefined,
        displayMode,
      )) as ApiResponse<{
        slideCount?: number;
      }>;
      const result = response?.result ?? response?.data;
      const count = result?.slideCount ?? 0;
      reset();
      onImported();
      onClose();
      if (count > 0) {
        // parent shows message via loadDetail
      }
    } catch (err) {
      setError((err as { message?: string })?.message || "Import slide thất bại.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} PaperProps={{ sx: muDialogPaper }} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 600, color: "#0C447C" }}>Import slide từ ZIP (PDF)</DialogTitle>
      <DialogContent>
        <Typography sx={{ fontSize: 13, color: "#5F5E5A", mb: 2 }}>
          Nén folder các file PDF (mỗi file = 1 slide Canva) thành <strong>.zip</strong>, đặt tên có số thứ tự
          (vd. <code>01-intro.pdf</code>). Hệ thống convert sang ảnh và tạo khối Slide deck.
        </Typography>

        <Typography sx={muFieldLabel}>Tiêu đề slide deck (tuỳ chọn)</Typography>
        <TextField
          fullWidth
          size="small"
          placeholder="Unit 1 — Greetings"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          sx={{ ...muTextFieldSx, mb: 2 }}
        />

        <Typography sx={muFieldLabel}>Cách hiển thị</Typography>
        <TextField
          select
          fullWidth
          size="small"
          value={displayMode}
          onChange={(e) => setDisplayMode(e.target.value as SlideDeckDisplayMode)}
          sx={{ ...muTextFieldSx, mb: 2 }}
        >
          {SLIDE_DECK_DISPLAY_MODE_OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value}>
              {o.label}
            </MenuItem>
          ))}
        </TextField>

        <input
          ref={inputRef}
          type="file"
          accept=".zip,application/zip"
          hidden
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setError("");
          }}
        />

        <Box
          onClick={() => !uploading && inputRef.current?.click()}
          sx={{
            border: "2px dashed #C5D4E8",
            borderRadius: "12px",
            p: 3,
            textAlign: "center",
            cursor: uploading ? "wait" : "pointer",
            bgcolor: "#F8FAFD",
          }}
        >
          {uploading ? (
            <CircularProgress size={28} />
          ) : (
            <>
              <UploadFileOutlinedIcon sx={{ fontSize: 36, color: "#0C447C", mb: 1 }} />
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#0C447C" }}>
                {file ? file.name : "Chọn file .zip"}
              </Typography>
              <Typography sx={{ fontSize: 12, color: "#888780", mt: 0.5 }}>
                Tối đa 50MB · tối đa 100 file PDF
              </Typography>
            </>
          )}
        </Box>

        {error ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        ) : null}
      </DialogContent>
      <DialogActions sx={muDialogFooter}>
        <Button onClick={handleClose} disabled={uploading} sx={muFooterBtnOutlined}>
          Hủy
        </Button>
        <Button variant="contained" onClick={() => void handleImport()} disabled={uploading || !file} sx={muFooterBtnPrimary}>
          {uploading ? "Đang xử lý..." : "Import slide"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import SearchIcon from "@mui/icons-material/Search";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  MenuItem,
  Skeleton,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  muDialogFooter,
  muDialogPaper,
  muFooterBtnOutlined,
  muFooterBtnPrimary,
  muTextFieldSx,
} from "../../../pages/admin/manageUserUiStyles";
import { apiCreateLessonBlock, apiGetLessons, type LessonRecord } from "../../../shared/api/lesson";
import type { ApiResponse } from "../../../shared/api/types";
import { paths } from "../../../shared/constants/paths";

type AttachMcqToLessonDialogProps = {
  open: boolean;
  payloadJson: string;
  questionCount: number;
  blockTitle: string;
  /** Gắn thẳng vào lesson đang soạn — bỏ qua chọn lesson */
  fixedLessonId?: string;
  fixedLessonTitle?: string;
  onClose: () => void;
  onAttached?: () => void;
};

export function AttachMcqToLessonDialog({
  open,
  payloadJson,
  questionCount,
  blockTitle,
  fixedLessonId,
  fixedLessonTitle,
  onClose,
  onAttached,
}: AttachMcqToLessonDialogProps) {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<LessonRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [selectedLessonId, setSelectedLessonId] = useState("");

  const fetchLessons = useCallback(async () => {
    setLoading(true);
    try {
      const response = (await apiGetLessons({
        page: 0,
        size: 100,
        sort: "title,asc",
        keyword: keyword.trim() || undefined,
      })) as ApiResponse<{ result?: LessonRecord[] }>;
      const items = response?.result ?? response?.data?.result ?? [];
      setLessons(Array.isArray(items) ? items : []);
    } catch {
      setLessons([]);
    } finally {
      setLoading(false);
    }
  }, [keyword]);

  useEffect(() => {
    if (!open || fixedLessonId) return;
    void fetchLessons();
  }, [open, fixedLessonId, fetchLessons]);

  useEffect(() => {
    if (!open) {
      setSelectedLessonId("");
      setError("");
      setKeyword("");
    }
  }, [open]);

  const targetLessonId = fixedLessonId ?? selectedLessonId;
  const targetTitle =
    fixedLessonTitle ?? lessons.find((l) => l.id === selectedLessonId)?.title ?? "";

  const handleAttach = async () => {
    if (!targetLessonId || !payloadJson) return;
    setSubmitting(true);
    setError("");
    try {
      await apiCreateLessonBlock(targetLessonId, {
        blockType: "EXERCISE_SET",
        payloadJson,
      });
      onAttached?.();
      onClose();
      if (!fixedLessonId) {
        navigate(`/${paths.ADMIN}/manage-lesson/${targetLessonId}/edit`);
      }
    } catch (err) {
      setError((err as { message?: string })?.message || "Không thể tạo block bài tập.");
    } finally {
      setSubmitting(false);
    }
  };

  const isFixed = Boolean(fixedLessonId);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: muDialogPaper }}>
      <DialogTitle sx={{ fontWeight: 700, fontSize: 18 }}>
        {isFixed ? "Thêm bài tập vào lesson này" : "Gắn bài tập vào bài học"}
      </DialogTitle>
      <DialogContent sx={{ display: "grid", gap: 2 }}>
        <Alert severity="info" sx={{ fontSize: 13 }}>
          Sẽ tạo khối <strong>Bài tập (EXERCISE_SET)</strong>: &quot;{blockTitle}&quot; —{" "}
          <strong>{questionCount}</strong> câu MCQ.
        </Alert>

        {isFixed ? (
          <Typography sx={{ fontSize: 14 }}>
            Bài học: <strong>{fixedLessonTitle ?? fixedLessonId}</strong>
          </Typography>
        ) : (
          <>
            <TextField
              size="small"
              placeholder="Tìm bài học..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void fetchLessons();
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={muTextFieldSx}
            />
            <TextField
              select
              label="Chọn bài học"
              size="small"
              fullWidth
              value={selectedLessonId}
              onChange={(e) => setSelectedLessonId(e.target.value)}
              sx={muTextFieldSx}
            >
              <MenuItem value="">— Chọn —</MenuItem>
              {loading ? (
                <MenuItem disabled>Đang tải…</MenuItem>
              ) : (
                lessons.map((lesson) => (
                  <MenuItem key={lesson.id} value={lesson.id}>
                    {lesson.title}
                    {lesson.status === "PUBLISHED" ? " (Published)" : ""}
                  </MenuItem>
                ))
              )}
            </TextField>
            {loading ? <Skeleton height={32} /> : null}
            {!loading && lessons.length === 0 ? (
              <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                Không thấy bài học. Tạo lesson mới ở Quản lý bài học trước.
              </Typography>
            ) : null}
          </>
        )}

        {error ? <Alert severity="error">{error}</Alert> : null}
      </DialogContent>
      <DialogActions sx={muDialogFooter}>
        <Button onClick={onClose} sx={muFooterBtnOutlined} disabled={submitting}>
          Hủy
        </Button>
        {!isFixed && targetLessonId ? (
          <Button
            startIcon={<OpenInNewOutlinedIcon />}
            sx={muFooterBtnOutlined}
            onClick={() => navigate(`/${paths.ADMIN}/manage-lesson/${targetLessonId}/edit`)}
          >
            Mở lesson
          </Button>
        ) : null}
        <Button
          variant="contained"
          disabled={!targetLessonId || submitting}
          onClick={() => void handleAttach()}
          sx={muFooterBtnPrimary}
        >
          {submitting ? <CircularProgress size={22} color="inherit" /> : isFixed ? "Thêm block bài tập" : "Tạo block & mở lesson"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

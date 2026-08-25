import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useCallback, useEffect, useState } from "react";
import {
  apiCancelExamAssignment,
  apiGetExamAssignmentScores,
  apiSearchExamAssignments,
  type ExamAssignmentRecord,
  type ExamClassScoreRecord,
} from "../../../shared/api/examAssignment";
import type { ExamPaperRecord } from "../../../shared/api/examPaper";
import type { ApiResponse } from "../../../shared/api/types";
import {
  muDialogFooter,
  muFooterBtnOutlined,
  muFooterBtnPrimary,
} from "../../../pages/admin/manageUserUiStyles";

type ExamAssignmentScoresDialogProps = {
  open: boolean;
  paper: Pick<ExamPaperRecord, "id" | "title"> | null;
  onClose: () => void;
  onAssignClick?: () => void;
  onMessage?: (message: string) => void;
};

function unwrapAssignments(response: unknown): ExamAssignmentRecord[] {
  const payload = response as ApiResponse<{ result?: ExamAssignmentRecord[] }> & {
    result?: ExamAssignmentRecord[];
    data?: { result?: ExamAssignmentRecord[] };
  };
  const raw = payload?.data?.result ?? payload?.result;
  return Array.isArray(raw) ? raw : [];
}

function unwrapScores(response: unknown): ExamClassScoreRecord[] {
  const payload = response as ApiResponse<ExamClassScoreRecord[]> & {
    result?: ExamClassScoreRecord[];
    data?: ExamClassScoreRecord[];
  };
  const raw = payload?.data ?? payload?.result;
  return Array.isArray(raw) ? raw : [];
}

function formatWhen(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("vi-VN");
  } catch {
    return "—";
  }
}

function statusChip(status?: string) {
  switch (status) {
    case "SUBMITTED":
    case "TIMED_OUT":
      return <Chip size="small" color="success" label={status === "TIMED_OUT" ? "Hết giờ" : "Đã nộp"} />;
    case "IN_PROGRESS":
      return <Chip size="small" color="warning" label="Đang làm" />;
    case "NOT_STARTED":
    default:
      return <Chip size="small" variant="outlined" label="Chưa làm" />;
  }
}

export function ExamAssignmentScoresDialog({
  open,
  paper,
  onClose,
  onAssignClick,
  onMessage,
}: ExamAssignmentScoresDialogProps) {
  const [assignments, setAssignments] = useState<ExamAssignmentRecord[]>([]);
  const [selected, setSelected] = useState<ExamAssignmentRecord | null>(null);
  const [scores, setScores] = useState<ExamClassScoreRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingScores, setLoadingScores] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");

  const loadAssignments = useCallback(async () => {
    if (!paper?.id) return;
    setLoading(true);
    setError("");
    try {
      const response = await apiSearchExamAssignments({
        page: 0,
        size: 50,
        examPaperId: paper.id,
        status: "ACTIVE",
        sort: "assignedAt,desc",
      });
      setAssignments(unwrapAssignments(response));
    } catch (err) {
      setAssignments([]);
      setError((err as { message?: string })?.message || "Không tải được danh sách gán đề.");
    } finally {
      setLoading(false);
    }
  }, [paper?.id]);

  useEffect(() => {
    if (!open) return;
    setSelected(null);
    setScores([]);
    setError("");
    void loadAssignments();
  }, [open, loadAssignments]);

  const openScores = async (row: ExamAssignmentRecord) => {
    setSelected(row);
    setLoadingScores(true);
    setError("");
    try {
      const response = await apiGetExamAssignmentScores(row.id);
      setScores(unwrapScores(response));
    } catch (err) {
      setScores([]);
      setError((err as { message?: string })?.message || "Không tải được bảng điểm.");
    } finally {
      setLoadingScores(false);
    }
  };

  const cancelAssignment = async (row: ExamAssignmentRecord) => {
    if (!window.confirm(`Hủy gán đề cho lớp “${row.classroomName ?? ""}”?`)) return;
    setCancelling(true);
    setError("");
    try {
      await apiCancelExamAssignment(row.id);
      onMessage?.(`Đã hủy gán đề cho lớp ${row.classroomName ?? ""}.`);
      if (selected?.id === row.id) {
        setSelected(null);
        setScores([]);
      }
      await loadAssignments();
    } catch (err) {
      setError((err as { message?: string })?.message || "Không hủy được lần gán.");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {selected ? (
          <IconButton size="small" onClick={() => setSelected(null)} aria-label="Quay lại">
            <ArrowBackIcon fontSize="small" />
          </IconButton>
        ) : null}
        {selected
          ? `Điểm lớp — ${selected.classroomName ?? "Lớp"}`
          : `Gán đề / điểm — ${paper?.title ?? ""}`}
      </DialogTitle>
      <DialogContent>
        {error ? (
          <Alert severity="error" sx={{ mb: 1.5, borderRadius: "12px" }}>
            {error}
          </Alert>
        ) : null}

        {!selected ? (
          <>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress size={28} />
              </Box>
            ) : assignments.length === 0 ? (
              <Alert severity="info" sx={{ borderRadius: "12px" }}>
                Chưa gán đề này cho lớp nào. Bấm “Gán cho lớp” để bắt đầu.
              </Alert>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Lớp</TableCell>
                    <TableCell>Gán lúc</TableCell>
                    <TableCell>Hạn / Đóng</TableCell>
                    <TableCell>Lần làm</TableCell>
                    <TableCell align="right">Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {assignments.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>{row.classroomName ?? "—"}</TableCell>
                      <TableCell>{formatWhen(row.assignedAt)}</TableCell>
                      <TableCell>
                        <Typography variant="caption" display="block">
                          Hạn: {formatWhen(row.dueAt)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Đóng: {formatWhen(row.closeAt)}
                        </Typography>
                      </TableCell>
                      <TableCell>{row.maxAttempts ?? 1}</TableCell>
                      <TableCell align="right">
                        <Button size="small" onClick={() => void openScores(row)}>
                          Xem điểm
                        </Button>
                        <IconButton
                          size="small"
                          color="error"
                          disabled={cancelling}
                          onClick={() => void cancelAssignment(row)}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </>
        ) : loadingScores ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Học sinh</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Lần</TableCell>
                <TableCell>Điểm</TableCell>
                <TableCell>Nộp lúc</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {scores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography color="text.secondary">Lớp chưa có học sinh ghi danh.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                scores.map((row) => (
                  <TableRow key={row.studentId}>
                    <TableCell>
                      <Typography fontSize={13}>{row.studentName ?? "—"}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {row.studentEmail}
                      </Typography>
                    </TableCell>
                    <TableCell>{statusChip(row.attemptStatus)}</TableCell>
                    <TableCell>{row.attemptNo ?? "—"}</TableCell>
                    <TableCell>
                      {row.scorePercent != null ? `${row.scorePercent}%` : "—"}
                      {row.passed === true ? (
                        <Chip size="small" label="Đạt" color="success" sx={{ ml: 0.5 }} />
                      ) : null}
                      {row.passed === false && row.scorePercent != null ? (
                        <Chip size="small" label="Chưa đạt" sx={{ ml: 0.5 }} />
                      ) : null}
                    </TableCell>
                    <TableCell>{formatWhen(row.submittedAt)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </DialogContent>
      <DialogActions sx={muDialogFooter}>
        <Button onClick={onClose} sx={muFooterBtnOutlined}>
          Đóng
        </Button>
        {!selected && onAssignClick ? (
          <Button variant="contained" onClick={onAssignClick} sx={muFooterBtnPrimary}>
            Gán cho lớp
          </Button>
        ) : null}
      </DialogActions>
    </Dialog>
  );
}

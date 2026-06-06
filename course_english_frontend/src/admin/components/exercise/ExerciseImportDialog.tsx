import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Radio,
  RadioGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import {
  muDialogFooter,
  muDialogPaper,
  muFooterBtnOutlined,
  muFooterBtnPrimary,
} from "../../../pages/admin/manageUserUiStyles";
import {
  applyImportToEditor,
  downloadMcqExcelTemplate,
  parseMcqCsvFile,
  parseMcqExcelFile,
  type ExerciseImportMode,
  type ExerciseImportResult,
} from "../../../shared/lesson/exerciseImport";
import type { ExerciseSetPayload } from "../../../student/lessonPlayer/exercise/types";

export type ExerciseImportFormat = "csv" | "excel";

type ExerciseImportDialogProps = {
  open: boolean;
  format: ExerciseImportFormat;
  currentPayload: ExerciseSetPayload;
  onClose: () => void;
  onApplied: (nextPayload: ExerciseSetPayload) => void;
};

const FORMAT_META: Record<
  ExerciseImportFormat,
  { title: string; accept: string; chooseLabel: string; hint: string }
> = {
  csv: {
    title: "Import CSV",
    accept: ".csv,text/csv",
    chooseLabel: "Chọn file CSV",
    hint: "File UTF-8, cùng cột với mẫu Excel/CSV.",
  },
  excel: {
    title: "Import Excel",
    accept: ".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel",
    chooseLabel: "Chọn file Excel (.xlsx)",
    hint: "Sheet đầu tiên, hàng 1 là tiêu đề cột. Có thể tải file mẫu bên dưới.",
  },
};

export function ExerciseImportDialog({
  open,
  format,
  currentPayload,
  onClose,
  onApplied,
}: ExerciseImportDialogProps) {
  const meta = FORMAT_META[format];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState<ExerciseImportResult | null>(null);
  const [mode, setMode] = useState<ExerciseImportMode>("replace");

  const reset = () => {
    setFileName("");
    setResult(null);
    setMode("replace");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  useEffect(() => {
    if (!open) return;
    setFileName("");
    setResult(null);
    setMode("replace");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [open, format]);

  const handleFileChange = async (file: File | null) => {
    if (!file) return;
    setParsing(true);
    setFileName(file.name);
    const parsed =
      format === "excel" ? await parseMcqExcelFile(file) : await parseMcqCsvFile(file);
    setResult(parsed);
    setParsing(false);
  };

  const handleConfirm = () => {
    if (!result?.ok || !result.payload) return;
    const next = applyImportToEditor(currentPayload, result.payload, mode);
    onApplied(next);
    handleClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: muDialogPaper }}
    >
      <DialogTitle>{meta.title} — Bài tập MCQ</DialogTitle>
      <DialogContent>
        <Typography sx={{ fontSize: 12, color: "#5F5E5A", mb: 1.5 }}>{meta.hint}</Typography>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
          <input
            ref={fileInputRef}
            type="file"
            accept={meta.accept}
            hidden
            onChange={(e) => void handleFileChange(e.target.files?.[0] ?? null)}
          />
          <Button
            size="small"
            variant="outlined"
            startIcon={<UploadFileOutlinedIcon />}
            sx={muFooterBtnOutlined}
            onClick={() => fileInputRef.current?.click()}
            disabled={parsing}
          >
            {parsing ? "Đang đọc..." : fileName ? `Đã chọn: ${fileName}` : meta.chooseLabel}
          </Button>
          {format === "excel" ? (
            <Button
              size="small"
              variant="outlined"
              startIcon={<DownloadOutlinedIcon />}
              sx={muFooterBtnOutlined}
              onClick={() => downloadMcqExcelTemplate()}
            >
              Tải mẫu Excel
            </Button>
          ) : null}
        </Box>

        {result?.warnings.map((w) => (
          <Alert key={w} severity="info" sx={{ mt: 1.5, fontSize: 12 }}>
            {w}
          </Alert>
        ))}

        {result?.errors.map((err) => (
          <Alert key={err} severity="error" sx={{ mt: 1.5, fontSize: 12 }}>
            {err}
          </Alert>
        ))}

        {result && result.previewRows.length > 0 ? (
          <Box sx={{ mt: 2 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#0C447C", mb: 1 }}>
              Preview — {result.rowCount} câu hợp lệ / {result.previewRows.length} dòng
            </Typography>
            <TableContainer sx={{ maxHeight: 280, border: "1px solid #ECEAE3", borderRadius: "8px" }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontSize: 11, fontWeight: 700 }}>#</TableCell>
                    <TableCell sx={{ fontSize: 11, fontWeight: 700 }}>Câu hỏi</TableCell>
                    <TableCell sx={{ fontSize: 11, fontWeight: 700 }}>A</TableCell>
                    <TableCell sx={{ fontSize: 11, fontWeight: 700 }}>B</TableCell>
                    <TableCell sx={{ fontSize: 11, fontWeight: 700 }}>C</TableCell>
                    <TableCell sx={{ fontSize: 11, fontWeight: 700 }}>D</TableCell>
                    <TableCell sx={{ fontSize: 11, fontWeight: 700 }}>Đúng</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {result.previewRows.map((row) => (
                    <TableRow
                      key={row.rowNumber}
                      sx={{ bgcolor: row.errors.length ? "rgba(186,26,26,0.06)" : undefined }}
                    >
                      <TableCell sx={{ fontSize: 12 }}>{row.rowNumber}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{row.prompt || "—"}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{row.choiceA}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{row.choiceB}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{row.choiceC}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{row.choiceD}</TableCell>
                      <TableCell sx={{ fontSize: 12, fontWeight: 700 }}>{row.correctChoiceId}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        ) : null}

        {result?.ok ? (
          <Box sx={{ mt: 2 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, mb: 0.5 }}>Cách import</Typography>
            <RadioGroup value={mode} onChange={(e) => setMode(e.target.value as ExerciseImportMode)}>
              <FormControlLabel
                value="replace"
                control={<Radio size="small" />}
                label={<Typography fontSize={12}>Ghi đè toàn bộ câu MCQ hiện tại</Typography>}
              />
              <FormControlLabel
                value="merge"
                control={<Radio size="small" />}
                label={<Typography fontSize={12}>Thêm vào cuối danh sách câu hiện tại</Typography>}
              />
            </RadioGroup>
          </Box>
        ) : null}
      </DialogContent>
      <DialogActions sx={muDialogFooter}>
        <Button sx={muFooterBtnOutlined} onClick={handleClose}>
          Hủy
        </Button>
        <Button
          sx={muFooterBtnPrimary}
          disabled={!result?.ok}
          onClick={handleConfirm}
        >
          Import {result?.rowCount ?? 0} câu
        </Button>
      </DialogActions>
    </Dialog>
  );
}

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
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import {
  muDialogFooter,
  muDialogPaper,
  muFooterBtnOutlined,
  muFooterBtnPrimary,
  muFieldLabel,
  muTextFieldSx,
} from "../../../pages/admin/manageUserUiStyles";
import {
  apiGetQuestionCategories,
  type QuestionCategoryRecord,
  type QuestionStatus,
} from "../../../shared/api/question";
import {
  downloadMcqExcelTemplate,
  parseMcqCsvFile,
  parseMcqExcelFile,
  type ExerciseImportResult,
} from "../../../shared/lesson/exerciseImport";
import {
  extractMcqFromImportResult,
  importMcqQuestionsToBank,
} from "../../../shared/lesson/questionBankImport";

export type QuestionBankImportFormat = "csv" | "excel";

type QuestionBankImportDialogProps = {
  open: boolean;
  format: QuestionBankImportFormat;
  onClose: () => void;
  onImported: () => void;
};

const FORMAT_META: Record<
  QuestionBankImportFormat,
  { title: string; accept: string; chooseLabel: string }
> = {
  csv: {
    title: "Import CSV vào ngân hàng",
    accept: ".csv,text/csv",
    chooseLabel: "Chọn file CSV",
  },
  excel: {
    title: "Import Excel vào ngân hàng",
    accept: ".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    chooseLabel: "Chọn file Excel (.xlsx)",
  },
};

export function QuestionBankImportDialog({
  open,
  format,
  onClose,
  onImported,
}: QuestionBankImportDialogProps) {
  const meta = FORMAT_META[format];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ExerciseImportResult | null>(null);
  const [categories, setCategories] = useState<QuestionCategoryRecord[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState<QuestionStatus>("PUBLISHED");
  const [batchError, setBatchError] = useState("");

  useEffect(() => {
    if (!open) return;
    void apiGetQuestionCategories().then((res) => {
      const list = (res as { result?: QuestionCategoryRecord[] }).result ?? res.data ?? [];
      const items = Array.isArray(list) ? list : [];
      setCategories(items);
      const vocab = items.find((c) => c.slug === "vocabulary");
      if (vocab) setCategoryId(vocab.id);
    });
  }, [open]);

  useEffect(() => {
    if (!open) {
      setFileName("");
      setResult(null);
      setBatchError("");
      setParsing(false);
      setImporting(false);
    }
  }, [open]);

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setFileName(file.name);
    setParsing(true);
    setResult(null);
    setBatchError("");
    try {
      const parsed =
        format === "csv" ? await parseMcqCsvFile(file) : await parseMcqExcelFile(file);
      setResult(parsed);
    } finally {
      setParsing(false);
    }
  };

  const handleImport = async () => {
    if (!result?.ok) return;
    const questions = extractMcqFromImportResult(result);
    if (!questions.length) {
      setBatchError("Không có câu MCQ hợp lệ để import.");
      return;
    }
    setImporting(true);
    setBatchError("");
    try {
      const batch = await importMcqQuestionsToBank(questions, { categoryId: categoryId || undefined, status });
      if (batch.failed > 0) {
        setBatchError(
          `Import ${batch.imported}/${questions.length} câu. Lỗi: ${batch.errors.slice(0, 3).join("; ")}${batch.errors.length > 3 ? "…" : ""}`,
        );
      }
      if (batch.imported > 0) {
        onImported();
        if (batch.failed === 0) onClose();
      }
    } catch (err) {
      setBatchError((err as { message?: string })?.message ?? "Import thất bại.");
    } finally {
      setImporting(false);
    }
  };

  const questionCount = result?.payload?.questions.length ?? 0;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" PaperProps={{ sx: muDialogPaper }}>
      <DialogTitle>{meta.title}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "grid", gap: 1.5 }}>
          <Typography fontSize={12} color="text.secondary">
            Mỗi dòng CSV/Excel = 1 câu MCQ trong ngân hàng (cùng format import bài tập). Cột{" "}
            <code>lesson_title</code> được bỏ qua.
          </Typography>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1 }}>
            <Box>
              <Typography sx={muFieldLabel}>Danh mục mặc định</Typography>
              <TextField
                select
                size="small"
                fullWidth
                sx={muTextFieldSx}
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <MenuItem value="">— Chưa phân loại —</MenuItem>
                {categories.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
            <Box>
              <Typography sx={muFieldLabel}>Trạng thái sau import</Typography>
              <TextField
                select
                size="small"
                fullWidth
                sx={muTextFieldSx}
                value={status}
                onChange={(e) => setStatus(e.target.value as QuestionStatus)}
              >
                <MenuItem value="PUBLISHED">Published (dùng ngay)</MenuItem>
                <MenuItem value="DRAFT">Nháp</MenuItem>
              </TextField>
            </Box>
          </Box>

          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
            <input
              ref={fileInputRef}
              type="file"
              accept={meta.accept}
              hidden
              onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
            />
            <Button
              size="small"
              variant="outlined"
              startIcon={<UploadFileOutlinedIcon />}
              disabled={parsing || importing}
              onClick={() => fileInputRef.current?.click()}
            >
              {meta.chooseLabel}
            </Button>
            {format === "excel" ? (
              <Button
                size="small"
                variant="text"
                startIcon={<DownloadOutlinedIcon />}
                onClick={() => downloadMcqExcelTemplate()}
              >
                Tải mẫu Excel
              </Button>
            ) : null}
            {fileName ? (
              <Typography fontSize={12} color="text.secondary">
                {fileName}
                {parsing ? " — đang đọc…" : result?.ok ? ` — ${questionCount} câu` : ""}
              </Typography>
            ) : null}
          </Box>

          {result?.errors.length ? (
            <Alert severity="error" sx={{ fontSize: 12 }}>
              {result.errors.join(" ")}
            </Alert>
          ) : null}

          {result?.warnings.length ? (
            <Alert severity="info" sx={{ fontSize: 12 }}>
              {result.warnings.join(" ")}
            </Alert>
          ) : null}

          {batchError ? (
            <Alert severity={batchError.includes("Import 0") ? "error" : "warning"} sx={{ fontSize: 12 }}>
              {batchError}
            </Alert>
          ) : null}

          {result?.previewRows.length ? (
            <TableContainer sx={{ maxHeight: 280, border: "1px solid #ECEAE3", borderRadius: "6px" }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Câu hỏi</TableCell>
                    <TableCell>Đúng</TableCell>
                    <TableCell>Lỗi</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {result.previewRows.map((row) => (
                    <TableRow key={row.rowNumber} sx={{ bgcolor: row.errors.length ? "#fff5f5" : undefined }}>
                      <TableCell>{row.rowNumber}</TableCell>
                      <TableCell>{row.prompt || "—"}</TableCell>
                      <TableCell>{row.correctChoiceId.toUpperCase()}</TableCell>
                      <TableCell sx={{ color: "#c62828", fontSize: 11 }}>
                        {row.errors.join("; ")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : null}
        </Box>
      </DialogContent>
      <DialogActions sx={muDialogFooter}>
        <Button sx={muFooterBtnOutlined} onClick={onClose} disabled={importing}>
          Đóng
        </Button>
        <Button
          variant="contained"
          sx={muFooterBtnPrimary}
          disabled={!result?.ok || importing || questionCount === 0}
          onClick={() => void handleImport()}
        >
          {importing ? "Đang import…" : `Import ${questionCount} câu vào bank`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

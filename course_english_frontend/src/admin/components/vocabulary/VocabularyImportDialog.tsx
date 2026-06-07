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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useRef, useState } from "react";
import {
  muDialogFooter,
  muDialogPaper,
  muFooterBtnOutlined,
  muFooterBtnPrimary,
} from "../../../pages/admin/manageUserUiStyles";
import type { VocabularyItemRecord } from "../../../shared/api/vocabularySet";
import {
  parseVocabCsvFile,
  VOCAB_CSV_SAMPLE,
  vocabImportRowsToItems,
  type VocabImportResult,
} from "../../../shared/lesson/vocabImport";

type VocabularyImportDialogProps = {
  open: boolean;
  onClose: () => void;
  onImported: (items: VocabularyItemRecord[]) => void;
};

export function VocabularyImportDialog({ open, onClose, onImported }: VocabularyImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState<VocabImportResult | null>(null);

  const reset = () => {
    setFileName("");
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFile = async (file: File) => {
    setParsing(true);
    setFileName(file.name);
    try {
      const parsed = await parseVocabCsvFile(file);
      setResult(parsed);
    } catch (err) {
      setResult({
        valid: false,
        rows: [],
        errors: [(err as { message?: string })?.message ?? "Không đọc được file."],
      });
    } finally {
      setParsing(false);
    }
  };

  const handleConfirm = () => {
    if (!result?.valid || !result.rows.length) return;
    onImported(vocabImportRowsToItems(result.rows));
    handleClose();
  };

  const downloadSample = () => {
    const blob = new Blob([VOCAB_CSV_SAMPLE], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mau_bo_tu_vung.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth PaperProps={{ sx: muDialogPaper }}>
      <DialogTitle sx={{ fontWeight: 700, fontSize: 18 }}>Import CSV bộ từ vựng</DialogTitle>
      <DialogContent sx={{ display: "grid", gap: 2 }}>
        <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
          Cột bắt buộc: <strong>word_en</strong>, <strong>meaning_vi</strong>. Tuỳ chọn: phonetic.
        </Typography>

        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button
            variant="outlined"
            startIcon={<DownloadOutlinedIcon />}
            onClick={downloadSample}
            sx={{ textTransform: "none" }}
          >
            Tải file mẫu
          </Button>
          <Button
            variant="contained"
            startIcon={<UploadFileOutlinedIcon />}
            onClick={() => fileInputRef.current?.click()}
            disabled={parsing}
            sx={{ textTransform: "none" }}
          >
            {parsing ? "Đang đọc…" : "Chọn file CSV"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
        </Box>

        {fileName ? (
          <Typography sx={{ fontSize: 12, color: "text.secondary" }}>File: {fileName}</Typography>
        ) : null}

        {result?.errors.length ? (
          <Alert severity="error" sx={{ fontSize: 13 }}>
            {result.errors.map((err) => (
              <div key={err}>{err}</div>
            ))}
          </Alert>
        ) : null}

        {result?.rows.length ? (
          <TableContainer sx={{ border: "1px solid #ECEAE3", borderRadius: "10px", maxHeight: 280 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Word</TableCell>
                  <TableCell>Meaning</TableCell>
                  <TableCell>Phonetic</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {result.rows.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell>{row.wordEn}</TableCell>
                    <TableCell>{row.meaningVi}</TableCell>
                    <TableCell>{row.phonetic ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : null}
      </DialogContent>
      <DialogActions sx={muDialogFooter}>
        <Button onClick={handleClose} sx={muFooterBtnOutlined}>
          Hủy
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={!result?.valid}
          sx={muFooterBtnPrimary}
        >
          Nhập {result?.rows.length ?? 0} từ
        </Button>
      </DialogActions>
    </Dialog>
  );
}

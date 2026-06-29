import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import {
  Alert,
  Box,
  Button,
  Checkbox,
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
import type { QuestionType } from "../../../shared/api/question";
import {
  applyExamSectionMcqImport,
  downloadExamSectionMcqTemplate,
  parseExamSectionMcqCsvFile,
  parseExamSectionMcqExcelFile,
  type ExamSectionImportMode,
  type ExamSectionMcqImportResult,
} from "../../../shared/lesson/exerciseImport/examSectionMcqImport";

export type ExamSectionImportFormat = "csv" | "excel";

export type ExamSectionImportAppliedMeta = {
  payloadJson: string;
  title?: string;
  instruction?: string;
};

type ExamSectionImportDialogProps = {
  open: boolean;
  format: ExamSectionImportFormat;
  expectedQuestionType?: QuestionType;
  sectionTitle?: string;
  sectionInstruction?: string;
  currentPayloadJson: string;
  onClose: () => void;
  onApplied: (result: ExamSectionImportAppliedMeta) => void;
};

const FORMAT_META: Record<
  ExamSectionImportFormat,
  { title: string; accept: string; chooseLabel: string; hint: string }
> = {
  csv: {
    title: "Import CSV vào phần",
    accept: ".csv,text/csv",
    chooseLabel: "Chọn file CSV",
    hint: "UTF-8. Cột câu hỏi giống mẫu Excel section (question_id, prompt_en, choice_a…).",
  },
  excel: {
    title: "Import Excel vào phần",
    accept: ".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel",
    chooseLabel: "Chọn file Excel (.xlsx)",
    hint: "Sheet đầu tiên. section_title / section_instruction tùy chọn (dòng đầu).",
  },
};

export function ExamSectionImportDialog({
  open,
  format,
  expectedQuestionType,
  sectionTitle,
  sectionInstruction,
  currentPayloadJson,
  onClose,
  onApplied,
}: ExamSectionImportDialogProps) {
  const meta = FORMAT_META[format];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState<ExamSectionMcqImportResult | null>(null);
  const [mode, setMode] = useState<ExamSectionImportMode>("replace");
  const [updateSectionMeta, setUpdateSectionMeta] = useState(false);

  const typeBlocked =
    expectedQuestionType != null && expectedQuestionType !== "MULTIPLE_CHOICE";

  const reset = () => {
    setFileName("");
    setResult(null);
    setMode("replace");
    setUpdateSectionMeta(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  useEffect(() => {
    if (!open) return;
    reset();
  }, [open, format]);

  const handleFileChange = async (file: File | null) => {
    if (!file || typeBlocked) return;
    setParsing(true);
    setFileName(file.name);
    const parsed =
      format === "excel"
        ? await parseExamSectionMcqExcelFile(file)
        : await parseExamSectionMcqCsvFile(file);
    setResult(parsed);
    setParsing(false);
  };

  const handleConfirm = () => {
    if (!result?.ok || !result.payloadJson) return;
    const nextPayloadJson = applyExamSectionMcqImport(currentPayloadJson, result.payloadJson, mode);
    const applied: ExamSectionImportAppliedMeta = { payloadJson: nextPayloadJson };

    if (updateSectionMeta) {
      if (result.sectionTitle?.trim()) applied.title = result.sectionTitle.trim();
      if (result.sectionInstruction?.trim()) applied.instruction = result.sectionInstruction.trim();
    }

    onApplied(applied);
    handleClose();
  };

  const sectionLabel = sectionTitle?.trim() || "Phần đang chọn";

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: muDialogPaper }}
    >
      <DialogTitle>{meta.title} — {sectionLabel}</DialogTitle>
      <DialogContent>
        {typeBlocked ? (
          <Alert severity="warning" sx={{ mb: 1.5, fontSize: 12 }}>
            Phần này là loại <strong>{expectedQuestionType}</strong>. Import Excel/CSV hiện chỉ hỗ
            trợ <strong>MULTIPLE_CHOICE</strong>.
          </Alert>
        ) : (
          <Typography sx={{ fontSize: 12, color: "#5F5E5A", mb: 1.5 }}>{meta.hint}</Typography>
        )}

        {sectionInstruction?.trim() ? (
          <Typography sx={{ fontSize: 11, color: "#888780", mb: 1.5, fontStyle: "italic" }}>
            Instruction hiện tại: {sectionInstruction.trim()}
          </Typography>
        ) : null}

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
            disabled={parsing || typeBlocked}
          >
            {parsing ? "Đang đọc..." : fileName ? `Đã chọn: ${fileName}` : meta.chooseLabel}
          </Button>
          {format === "excel" ? (
            <Button
              size="small"
              variant="outlined"
              startIcon={<DownloadOutlinedIcon />}
              sx={muFooterBtnOutlined}
              onClick={() => downloadExamSectionMcqTemplate()}
              disabled={typeBlocked}
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
            <RadioGroup value={mode} onChange={(e) => setMode(e.target.value as ExamSectionImportMode)}>
              <FormControlLabel
                value="replace"
                control={<Radio size="small" />}
                label={<Typography fontSize={12}>Ghi đè toàn bộ câu trong phần này</Typography>}
              />
              <FormControlLabel
                value="merge"
                control={<Radio size="small" />}
                label={<Typography fontSize={12}>Thêm vào cuối danh sách câu hiện tại</Typography>}
              />
            </RadioGroup>
            {(result.sectionTitle?.trim() || result.sectionInstruction?.trim()) ? (
              <FormControlLabel
                sx={{ mt: 0.5 }}
                control={
                  <Checkbox
                    size="small"
                    checked={updateSectionMeta}
                    onChange={(e) => setUpdateSectionMeta(e.target.checked)}
                  />
                }
                label={
                  <Typography fontSize={12}>
                    Cập nhật tiêu đề / hướng dẫn phần từ file
                    {result.sectionTitle?.trim() ? ` (title: "${result.sectionTitle.trim()}")` : ""}
                  </Typography>
                }
              />
            ) : null}
          </Box>
        ) : null}
      </DialogContent>
      <DialogActions sx={muDialogFooter}>
        <Button sx={muFooterBtnOutlined} onClick={handleClose}>
          Hủy
        </Button>
        <Button sx={muFooterBtnPrimary} disabled={!result?.ok || typeBlocked} onClick={handleConfirm}>
          Import {result?.rowCount ?? 0} câu vào phần
        </Button>
      </DialogActions>
    </Dialog>
  );
}

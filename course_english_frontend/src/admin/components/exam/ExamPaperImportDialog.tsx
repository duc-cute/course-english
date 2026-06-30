import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  Radio,
  RadioGroup,
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
  applyExamPaperImport,
  downloadExamPaperImportTemplate,
  parseExamPaperImportCsvFile,
  parseExamPaperImportExcelFile,
  type ExamPaperImportMode,
  type ExamPaperImportResult,
} from "../../../shared/lesson/exerciseImport/examPaperImport";
import type { ExamSectionDraft } from "./ExamSectionListPanel";

export type ExamPaperImportFormat = "csv" | "excel";

export type ExamPaperImportApplied = {
  examTitle?: string;
  paperInstruction?: string;
  updatePaperMeta: boolean;
  sections: ExamSectionDraft[];
};

type ExamPaperImportDialogProps = {
  open: boolean;
  format: ExamPaperImportFormat;
  currentSections: ExamSectionDraft[];
  currentExamTitle?: string;
  newClientKey: () => string;
  onClose: () => void;
  onApplied: (result: ExamPaperImportApplied) => void;
};

const FORMAT_META: Record<
  ExamPaperImportFormat,
  { title: string; accept: string; chooseLabel: string; hint: string }
> = {
  csv: {
    title: "Import CSV — cả đề",
    accept: ".csv,text/csv",
    chooseLabel: "Chọn file CSV",
    hint: "Một file chứa nhiều phần — group theo section_key hoặc khi đổi section_instruction / question_type.",
  },
  excel: {
    title: "Import Excel — cả đề",
    accept:
      ".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel",
    chooseLabel: "Chọn file Excel (.xlsx)",
    hint: "Dòng trống section_* được fill-down. Không cần I/II nếu chỉ có instruction.",
  },
};

function sectionTypeLabel(type?: string): string {
  if (type === "MULTIPLE_CHOICE") return "MCQ";
  return type ?? "—";
}

export function ExamPaperImportDialog({
  open,
  format,
  currentSections,
  currentExamTitle,
  newClientKey,
  onClose,
  onApplied,
}: ExamPaperImportDialogProps) {
  const meta = FORMAT_META[format];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState<ExamPaperImportResult | null>(null);
  const [mode, setMode] = useState<ExamPaperImportMode>("replace_all");
  const [updatePaperMeta, setUpdatePaperMeta] = useState(true);

  const reset = () => {
    setFileName("");
    setResult(null);
    setMode("replace_all");
    setUpdatePaperMeta(true);
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
    if (!file) return;
    setParsing(true);
    setFileName(file.name);
    const parsed =
      format === "excel"
        ? await parseExamPaperImportExcelFile(file)
        : await parseExamPaperImportCsvFile(file);
    setResult(parsed);
    setParsing(false);
  };

  const handleConfirm = () => {
    if (!result?.ok || !result.sections.length) return;
    const nextSections = applyExamPaperImport(
      currentSections,
      result.sections,
      mode,
      newClientKey,
    ) as ExamSectionDraft[];

    onApplied({
      examTitle: result.examTitle,
      paperInstruction: result.paperInstruction,
      updatePaperMeta,
      sections: nextSections,
    });
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
      <DialogTitle>{meta.title}</DialogTitle>
      <DialogContent>
        <Typography sx={{ fontSize: 12, color: "#5F5E5A", mb: 1.5 }}>
          {meta.hint}
        </Typography>
        {currentExamTitle?.trim() ? (
          <Typography sx={{ fontSize: 11, color: "#888780", mb: 1 }}>
            Đề hiện tại: {currentExamTitle.trim()} ({currentSections.length}{" "}
            phần)
          </Typography>
        ) : null}

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
            alignItems: "center",
          }}
        >
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
            {parsing
              ? "Đang đọc..."
              : fileName
                ? `Đã chọn: ${fileName}`
                : meta.chooseLabel}
          </Button>
          {format === "excel" ? (
            <Button
              size="small"
              variant="outlined"
              startIcon={<DownloadOutlinedIcon />}
              sx={muFooterBtnOutlined}
              onClick={() => downloadExamPaperImportTemplate()}
            >
              Tải mẫu Excel đề thi
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

        {result && result.sections.length > 0 ? (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 1 }}>
              <Chip size="small" label={`${result.sections.length} phần`} />
              <Chip
                size="small"
                variant="outlined"
                label={`${result.totalQuestions} câu`}
              />
              {result.examTitle ? (
                <Chip
                  size="small"
                  variant="outlined"
                  label={`Đề: ${result.examTitle}`}
                />
              ) : null}
            </Box>
            <List
              dense
              sx={{
                border: "1px solid #ECEAE3",
                borderRadius: "8px",
                maxHeight: 280,
                overflowY: "auto",
              }}
            >
              {result.sections.map((section, index) => (
                <ListItem
                  key={section.importKey}
                  divider={index < result.sections.length - 1}
                >
                  <ListItemText
                    primary={
                      <Typography sx={{ fontSize: 12, fontWeight: 600 }}>
                        {index + 1}.{" "}
                        {section.title?.trim() ||
                          section.instruction?.trim()?.slice(0, 48) ||
                          "Phần mới"}
                      </Typography>
                    }
                    secondary={
                      <Box
                        sx={{
                          mt: 0.5,
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 0.5,
                        }}
                      >
                        <Chip
                          size="small"
                          label={sectionTypeLabel(section.questionType)}
                          sx={{ height: 20, fontSize: 10 }}
                        />
                        <Chip
                          size="small"
                          variant="outlined"
                          label={`${section.questionCount} câu`}
                          sx={{ height: 20, fontSize: 10 }}
                        />
                        {section.instruction?.trim() ? (
                          <Typography
                            sx={{
                              fontSize: 11,
                              color: "#64748b",
                              fontStyle: "italic",
                            }}
                          >
                            {section.instruction.trim().length > 80
                              ? `${section.instruction.trim().slice(0, 80)}…`
                              : section.instruction.trim()}
                          </Typography>
                        ) : null}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        ) : null}

        {result?.ok ? (
          <Box sx={{ mt: 2 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, mb: 0.5 }}>
              Cách import
            </Typography>
            <RadioGroup
              value={mode}
              onChange={(e) => setMode(e.target.value as ExamPaperImportMode)}
            >
              <FormControlLabel
                value="replace_all"
                control={<Radio size="small" />}
                label={
                  <Typography fontSize={12}>
                    Thay toàn bộ các phần hiện có ({currentSections.length} →{" "}
                    {result.sections.length})
                  </Typography>
                }
              />
              <FormControlLabel
                value="merge"
                control={<Radio size="small" />}
                label={
                  <Typography fontSize={12}>
                    Merge theo section_key / instruction — khớp thì ghi đè câu,
                    không khớp thì thêm phần
                  </Typography>
                }
              />
            </RadioGroup>
            {result.examTitle || result.paperInstruction ? (
              <FormControlLabel
                sx={{ mt: 0.5 }}
                control={
                  <Checkbox
                    size="small"
                    checked={updatePaperMeta}
                    onChange={(e) => setUpdatePaperMeta(e.target.checked)}
                  />
                }
                label={
                  <Typography fontSize={12}>
                    Cập nhật tên đề & hướng dẫn toàn đề từ file
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
        <Button
          sx={muFooterBtnPrimary}
          disabled={!result?.ok}
          onClick={handleConfirm}
        >
          Import {result?.sections.length ?? 0} phần (
          {result?.totalQuestions ?? 0} câu)
        </Button>
      </DialogActions>
    </Dialog>
  );
}

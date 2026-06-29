import TableViewOutlinedIcon from "@mui/icons-material/TableViewOutlined";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import {
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useState } from "react";
import { muBtnSmOutlined } from "../../../pages/admin/manageUserUiStyles";
import type { ExerciseWordExportMode } from "../../../shared/lesson/exerciseWordExport";

type ExerciseAuthoringFooterProps = {
  questionCount: number;
  /** Số câu có thể xuất Word (phase 1: MCQ, T/F, Fill blank) */
  wordExportableCount?: number;
  onImportExcel?: () => void;
  onImportCsv?: () => void;
  /** Sinh từ PDF/Word (dialog cũ) */
  onAiGen?: () => void;
  /** Sinh bài tập tự động từ topic + quota */
  onAiAutoGen?: () => void;
  /** Tải Word — đề hoặc đáp án */
  onExportWord?: (mode: ExerciseWordExportMode) => void;
};

const iconBtnSx = {
  border: "1px solid #D3D1C7",
  borderRadius: "6px",
  bgcolor: "#fff",
  width: 36,
  height: 36,
  color: "#434655",
  "&:hover": { bgcolor: "#f8f9ff", borderColor: "#2563eb", color: "#2563eb" },
  "&.Mui-disabled": { opacity: 0.45 },
};

const aiAutoBtnSx = {
  borderRadius: "6px",
  padding: "3px 12px",
  fontSize: 12,
  fontWeight: 600,
  minHeight: 28,
  textTransform: "none" as const,
  bgcolor: "#2563eb",
  color: "#fff",
  boxShadow: "0 1px 4px rgba(37, 99, 235, 0.3)",
  "&:hover": { bgcolor: "#1d4ed8" },
  "&.Mui-disabled": { opacity: 0.45, bgcolor: "#94a3b8", color: "#fff" },
};

function WordExportMenuItems({
  onSelect,
  onClose,
}: {
  onSelect: (mode: ExerciseWordExportMode) => void;
  onClose: () => void;
}) {
  const pick = (mode: ExerciseWordExportMode) => {
    onSelect(mode);
    onClose();
  };

  return (
    <>
      <MenuItem onClick={() => pick("worksheet")} sx={{ fontSize: 13 }}>
        Tải Word — Đề làm bài
      </MenuItem>
      <MenuItem onClick={() => pick("answer_key")} sx={{ fontSize: 13 }}>
        Tải Word — Đáp án
      </MenuItem>
    </>
  );
}

export function ExerciseAuthoringFooter({
  questionCount,
  wordExportableCount = 0,
  onImportExcel,
  onImportCsv,
  onAiGen,
  onAiAutoGen,
  onExportWord,
}: ExerciseAuthoringFooterProps) {
  const theme = useTheme();
  const isCompact = useMediaQuery(theme.breakpoints.down("sm"));
  const estMinutes = Math.max(1, Math.ceil(questionCount * 0.5));
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);
  const canExportWord = Boolean(onExportWord) && wordExportableCount > 0;

  const openExportMenu = (event: React.MouseEvent<HTMLElement>) => {
    setExportMenuAnchor(event.currentTarget);
  };

  const closeExportMenu = () => setExportMenuAnchor(null);

  const handleExport = (mode: ExerciseWordExportMode) => {
    onExportWord?.(mode);
  };

  const exportTooltip =
    wordExportableCount > 0
      ? "Tải Word (.docx) — đề hoặc đáp án"
      : "Chưa có câu hỗ trợ xuất Word (Nghe gõ, Gõ chính tả…)";

  return (
    <Box
      className="exercise-authoring-footer"
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1,
        px: { xs: 1.25, sm: 2 },
        py: 1.25,
        borderTop: "1px solid #ECEAE3",
        bgcolor: "#EFF4FF",
        borderRadius: "0 0 10px 10px",
      }}
    >
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, alignItems: "center" }}>
        {isCompact ? (
          <>
            <Tooltip title="Import Excel" arrow>
              <span>
                <IconButton
                  size="small"
                  sx={iconBtnSx}
                  onClick={onImportExcel}
                  disabled={!onImportExcel}
                  aria-label="Import Excel"
                >
                  <TableViewOutlinedIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Import CSV" arrow>
              <span>
                <IconButton
                  size="small"
                  sx={iconBtnSx}
                  onClick={onImportCsv}
                  disabled={!onImportCsv}
                  aria-label="Import CSV"
                >
                  <UploadFileOutlinedIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={exportTooltip} arrow>
              <span>
                <IconButton
                  size="small"
                  sx={iconBtnSx}
                  onClick={openExportMenu}
                  disabled={!canExportWord}
                  aria-label="Tải Word"
                >
                  <DescriptionOutlinedIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Sinh từ tài liệu (PDF/Word)" arrow>
              <span>
                <IconButton
                  size="small"
                  className="ai-gen-footer-ai-btn ai-gen-footer-ai-btn--icon"
                  onClick={onAiGen}
                  disabled={!onAiGen}
                  aria-label="Sinh từ tài liệu"
                  sx={{ width: 40, height: 40, borderRadius: "8px" }}
                >
                  <UploadFileOutlinedIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Sinh bài tập tự động bằng AI" arrow>
              <span>
                <IconButton
                  size="small"
                  className="ai-gen-footer-ai-btn ai-gen-footer-ai-btn--icon ai-gen-footer-ai-btn--primary"
                  onClick={onAiAutoGen}
                  disabled={!onAiAutoGen}
                  aria-label="Sinh bài tập tự động bằng AI"
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: "8px",
                    bgcolor: "#2563eb",
                    color: "#fff",
                    "&:hover": { bgcolor: "#1d4ed8" },
                  }}
                >
                  <AutoAwesomeOutlinedIcon sx={{ fontSize: 20 }} />
                </IconButton>
              </span>
            </Tooltip>
          </>
        ) : (
          <>
            <Button
              size="small"
              startIcon={<TableViewOutlinedIcon />}
              sx={muBtnSmOutlined}
              onClick={onImportExcel}
              disabled={!onImportExcel}
            >
              Import Excel
            </Button>
            <Button
              size="small"
              startIcon={<UploadFileOutlinedIcon />}
              sx={muBtnSmOutlined}
              onClick={onImportCsv}
              disabled={!onImportCsv}
            >
              Import CSV
            </Button>
            <Tooltip title={exportTooltip} arrow>
              <span>
                <Button
                  size="small"
                  startIcon={<DescriptionOutlinedIcon />}
                  endIcon={<ArrowDropDownIcon />}
                  sx={muBtnSmOutlined}
                  onClick={openExportMenu}
                  disabled={!canExportWord}
                >
                  Tải Word
                </Button>
              </span>
            </Tooltip>
            <Button
              size="small"
              startIcon={<UploadFileOutlinedIcon />}
              className="ai-gen-footer-ai-btn"
              sx={{
                borderRadius: "6px",
                padding: "3px 12px",
                fontSize: 12,
                fontWeight: 600,
                minHeight: 28,
                textTransform: "none",
              }}
              onClick={onAiGen}
              disabled={!onAiGen}
            >
              Sinh từ tài liệu
            </Button>
            <Button
              size="small"
              startIcon={<AutoAwesomeOutlinedIcon />}
              className="ai-gen-footer-ai-btn ai-gen-footer-ai-btn--primary"
              sx={aiAutoBtnSx}
              onClick={onAiAutoGen}
              disabled={!onAiAutoGen}
            >
              Sinh bài tập tự động bằng AI
            </Button>
          </>
        )}
      </Box>

      <Menu
        anchorEl={exportMenuAnchor}
        open={Boolean(exportMenuAnchor)}
        onClose={closeExportMenu}
        anchorOrigin={{ vertical: "top", horizontal: "left" }}
        transformOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <WordExportMenuItems onSelect={handleExport} onClose={closeExportMenu} />
      </Menu>

      <Box
        sx={{
          textAlign: "right",
          flexShrink: 0,
          ml: "auto",
        }}
      >
        {isCompact ? (
          <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#5F5E5A", whiteSpace: "nowrap" }}>
            {questionCount} câu · ~{estMinutes}p
          </Typography>
        ) : (
          <>
            <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#5F5E5A" }}>
              {questionCount} câu hỏi
            </Typography>
            <Typography sx={{ fontSize: 11, color: "#888780" }}>~{estMinutes} phút làm bài</Typography>
          </>
        )}
      </Box>
    </Box>
  );
}

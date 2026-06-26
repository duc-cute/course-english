import TableViewOutlinedIcon from "@mui/icons-material/TableViewOutlined";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import { Box, Button, Typography } from "@mui/material";
import { muBtnSmOutlined } from "../../../pages/admin/manageUserUiStyles";

type ExerciseAuthoringFooterProps = {
  questionCount: number;
  onImportExcel?: () => void;
  onImportCsv?: () => void;
  onAiGen?: () => void;
};

export function ExerciseAuthoringFooter({
  questionCount,
  onImportExcel,
  onImportCsv,
  onAiGen,
}: ExerciseAuthoringFooterProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1.5,
        px: 2,
        py: 1.25,
        borderTop: "1px solid #ECEAE3",
        bgcolor: "#EFF4FF",
        borderRadius: "0 0 10px 10px",
      }}
    >
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
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
        <Button
          size="small"
          startIcon={<AutoAwesomeOutlinedIcon />}
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
          Sinh câu bằng AI
        </Button>
      </Box>
      <Box sx={{ textAlign: "right" }}>
        <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#5F5E5A" }}>
          {questionCount} câu hỏi
        </Typography>
        <Typography sx={{ fontSize: 11, color: "#888780" }}>
          ~{Math.max(1, Math.ceil(questionCount * 0.5))} phút làm bài
        </Typography>
      </Box>
    </Box>
  );
}

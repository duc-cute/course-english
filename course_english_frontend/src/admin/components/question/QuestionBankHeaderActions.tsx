import AddIcon from "@mui/icons-material/Add";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import { Button } from "@mui/material";
import { muBtnSmOutlined, muBtnSmPrimary } from "../../../pages/admin/manageUserUiStyles";

type QuestionBankHeaderActionsProps = {
  onNewQuestion: () => void;
  onAiGenerate: () => void;
};

export function QuestionBankHeaderActions({ onNewQuestion, onAiGenerate }: QuestionBankHeaderActionsProps) {
  return (
    <div className="qb-header-actions">
      <Button variant="contained" size="small" startIcon={<AddIcon />} sx={muBtnSmPrimary} onClick={onNewQuestion}>
        New Question
      </Button>
      <Button
        variant="outlined"
        size="small"
        startIcon={<AutoAwesomeOutlinedIcon />}
        sx={muBtnSmOutlined}
        onClick={onAiGenerate}
      >
        AI Generate
      </Button>
    </div>
  );
}

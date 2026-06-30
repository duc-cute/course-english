import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import AutoFixHighOutlinedIcon from "@mui/icons-material/AutoFixHighOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { Button, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Tooltip } from "@mui/material";
import { useState } from "react";
import type { QuestionBankAiAction } from "../../../shared/api/questionAi";
import type { QuestionRecord } from "../../../shared/api/question";
import { QUESTION_BANK_EDITABLE_TYPES } from "../../../shared/lesson/questionBankUtils";

type QuestionBankAiActionsMenuProps = {
  record: QuestionRecord;
  onAction: (record: QuestionRecord, action: QuestionBankAiAction) => void;
  variant?: "button" | "icon";
  fullWidth?: boolean;
};

const ITEMS: { action: QuestionBankAiAction; label: string }[] = [
  { action: "SIMILAR", label: "Sinh câu tương tự" },
  { action: "REWRITE", label: "Viết lại (bản sao)" },
  { action: "SIMPLIFY", label: "Đơn giản hóa" },
  { action: "INCREASE_DIFFICULTY", label: "Tăng độ khó" },
];

export function QuestionBankAiActionsMenu({
  record,
  onAction,
  variant = "icon",
  fullWidth = false,
}: QuestionBankAiActionsMenuProps) {
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);

  if (!QUESTION_BANK_EDITABLE_TYPES.includes(record.questionType)) {
    return null;
  }

  const open = Boolean(anchor);

  const trigger =
    variant === "button" ? (
      <Button
        fullWidth={fullWidth}
        sx={{ justifyContent: "space-between" }}
        startIcon={<AutoAwesomeOutlinedIcon />}
        endIcon={<KeyboardArrowDownIcon />}
        onClick={(e) => setAnchor(e.currentTarget)}
      >
        AI chỉnh câu
      </Button>
    ) : (
      <Tooltip title="AI chỉnh câu">
        <IconButton size="small" color="secondary" onClick={(e) => setAnchor(e.currentTarget)}>
          <AutoFixHighOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    );

  return (
    <>
      {trigger}
      <Menu anchorEl={anchor} open={open} onClose={() => setAnchor(null)}>
        {ITEMS.map((item) => (
          <MenuItem
            key={item.action}
            onClick={() => {
              setAnchor(null);
              onAction(record, item.action);
            }}
          >
            <ListItemIcon>
              <AutoAwesomeOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={item.label} />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

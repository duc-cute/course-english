import { Box, Button, Typography } from "@mui/material";
import { muBtnSmOutlined } from "../../../pages/admin/manageUserUiStyles";

type QuestionBankBulkToolbarProps = {
  selectedCount: number;
  busy?: boolean;
  onPublish: () => void;
  onArchive: () => void;
  onDuplicate: () => void;
  onExport: () => void;
  onBulkSimilar?: () => void;
  onDelete: () => void;
  onClear: () => void;
};

export function QuestionBankBulkToolbar({
  selectedCount,
  busy = false,
  onPublish,
  onArchive,
  onDuplicate,
  onExport,
  onBulkSimilar,
  onDelete,
  onClear,
}: QuestionBankBulkToolbarProps) {
  if (selectedCount < 1) {
    return null;
  }

  return (
    <Box
      className="qb-bulk-toolbar"
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 1,
        px: 2,
        py: 1,
        mb: 1,
        borderRadius: 1,
        bgcolor: "action.selected",
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: 600, mr: 1 }}>
        Đã chọn {selectedCount} câu (trang này)
      </Typography>
      <Button size="small" variant="contained" color="success" disabled={busy} onClick={onPublish}>
        Xuất bản
      </Button>
      <Button size="small" variant="outlined" disabled={busy} onClick={onArchive} sx={muBtnSmOutlined}>
        Lưu trữ
      </Button>
      <Button size="small" variant="outlined" disabled={busy} onClick={onDuplicate}>
        Nhân bản
      </Button>
      {onBulkSimilar ? (
        <Button size="small" variant="outlined" color="secondary" disabled={busy} onClick={onBulkSimilar}>
          AI tương tự
        </Button>
      ) : null}
      <Button size="small" variant="outlined" disabled={busy} onClick={onExport}>
        Export JSON
      </Button>
      <Button size="small" variant="outlined" color="error" disabled={busy} onClick={onDelete}>
        Xóa
      </Button>
      <Button size="small" disabled={busy} onClick={onClear} sx={{ ml: "auto" }}>
        Bỏ chọn
      </Button>
    </Box>
  );
}

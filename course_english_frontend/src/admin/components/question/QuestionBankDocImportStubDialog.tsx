import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import {
  muDialogFooter,
  muDialogPaper,
  muFooterBtnOutlined,
} from "../../../pages/admin/manageUserUiStyles";

type QuestionBankDocImportStubDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function QuestionBankDocImportStubDialog({ open, onClose }: QuestionBankDocImportStubDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: muDialogPaper }}>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <DescriptionOutlinedIcon color="primary" fontSize="small" />
        Import Word / PDF
      </DialogTitle>
      <DialogContent>
        <Alert severity="info">
          Import Word/PDF với AI parse + phân loại tự động dự kiến ở Phase 4. Hiện tại vui lòng dùng Import Excel/CSV
          cho MCQ.
        </Alert>
      </DialogContent>
      <DialogActions sx={muDialogFooter}>
        <Button sx={muFooterBtnOutlined} onClick={onClose}>
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
}

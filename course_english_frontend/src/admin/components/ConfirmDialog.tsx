import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Box,
} from "@mui/material";
import WarningRoundedIcon from "@mui/icons-material/WarningRounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import HelpRoundedIcon from "@mui/icons-material/HelpRounded";

type ConfirmDialogProps = {
  open: boolean;
  title?: string;
  content?: string;
  cancelText?: string;
  confirmText?: string;
  confirmColor?: "primary" | "error" | "warning";
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
};

export function ConfirmDialog({
  open,
  title = "Xác nhận",
  content = "Bạn có chắc chắn muốn thực hiện?",
  cancelText = "Hủy",
  confirmText = "Xác nhận",
  confirmColor = "error",
  onClose,
  onConfirm,
  loading = false,
}: ConfirmDialogProps) {
  
  // Choose icon and color based on confirmColor
  let IconComponent = HelpRoundedIcon;
  let iconColor = "#0052cc";
  let iconBg = "#eff6ff";
  let btnBg = "#0052cc";
  let btnHoverBg = "#0047b3";

  if (confirmColor === "error") {
    IconComponent = WarningRoundedIcon;
    iconColor = "#ef4444";
    iconBg = "#fef2f2";
    btnBg = "#dc2626";
    btnHoverBg = "#b91c1c";
  } else if (confirmColor === "warning") {
    IconComponent = WarningRoundedIcon;
    iconColor = "#f59e0b";
    iconBg = "#fffbeb";
    btnBg = "#d97706";
    btnHoverBg = "#b45309";
  }

  return (
    <Dialog 
      open={open} 
      onClose={loading ? undefined : onClose}
      PaperProps={{
        sx: {
          borderRadius: "16px",
          padding: "24px",
          maxWidth: "440px",
          width: "100%",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        }
      }}
      slotProps={{
        backdrop: {
          sx: {
            backdropFilter: "blur(4px)",
            backgroundColor: "rgba(15, 23, 42, 0.3)",
          }
        }
      }}
    >
      <Box sx={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
        <Box 
          sx={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            width: "40px", 
            height: "40px", 
            borderRadius: "50%", 
            backgroundColor: iconBg, 
            color: iconColor,
            flexShrink: 0,
          }}
        >
          <IconComponent sx={{ fontSize: "22px" }} />
        </Box>
        
        <Box sx={{ flex: 1 }}>
          <DialogTitle 
            sx={{ 
              padding: 0, 
              margin: 0, 
              fontSize: "16px", 
              fontWeight: 700, 
              color: "#1e293b",
              lineHeight: 1.4,
            }}
          >
            {title}
          </DialogTitle>
          <DialogContent sx={{ padding: 0, marginTop: "8px" }}>
            <DialogContentText 
              sx={{ 
                fontSize: "14px", 
                color: "#64748b", 
                lineHeight: 1.5,
              }}
            >
              {content}
            </DialogContentText>
          </DialogContent>
        </Box>
      </Box>

      <DialogActions sx={{ padding: 0, marginTop: "24px", gap: "8px" }}>
        <Button 
          onClick={onClose} 
          disabled={loading}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            fontSize: "13px",
            color: "#475569",
            padding: "6px 16px",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            backgroundColor: "#ffffff",
            "&:hover": {
              backgroundColor: "#f8fafc",
              borderColor: "#cbd5e1",
            },
            "&:disabled": {
              opacity: 0.6,
            }
          }}
        >
          {cancelText}
        </Button>
        <Button 
          onClick={onConfirm} 
          disabled={loading}
          variant="contained"
          sx={{
            textTransform: "none",
            fontWeight: 600,
            fontSize: "13px",
            color: "#ffffff",
            padding: "6px 16px",
            borderRadius: "8px",
            backgroundColor: btnBg,
            boxShadow: "none",
            "&:hover": {
              backgroundColor: btnHoverBg,
              boxShadow: "none",
            },
            "&:disabled": {
              opacity: 0.6,
            }
          }}
        >
          {loading ? "Đang xử lý..." : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

import DownloadIcon from "@mui/icons-material/Download";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { Alert, Box, Button, CircularProgress } from "@mui/material";
import { useRef, useState } from "react";
import {
  downloadCatalogImportTemplate,
  downloadErrorReportFromBase64,
  importCatalogExcel,
  type CatalogImportType,
} from "../../shared/api/catalogImport";
import { muBtnSmOutlined, muBtnSmPrimary } from "../../pages/admin/manageUserUiStyles";

type CatalogImportActionsProps = {
  type: CatalogImportType;
  onImported?: () => void;
  /** Gộp nút vào toolbar — không bọc card riêng */
  inline?: boolean;
};

export function CatalogImportActions({ type, onImported, inline = false }: CatalogImportActionsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState<"success" | "error" | "info">("info");

  const handleDownloadTemplate = async () => {
    setLoading(true);
    setMessage("");
    try {
      await downloadCatalogImportTemplate(type);
      if (!inline) {
        setSeverity("success");
        setMessage("Đã tải file mẫu import.");
      }
    } catch (err) {
      setSeverity("error");
      setMessage((err as { message?: string })?.message || "Không thể tải file mẫu.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setLoading(true);
    setMessage("");
    try {
      const result = await importCatalogExcel(type, file);
      const summary = `Import: +${result.inserted}, bỏ qua ${result.skipped}, lỗi ${result.failed}`;
      setSeverity(result.failed > 0 ? "info" : "success");
      setMessage(summary);

      if (result.hasErrorReport && result.errorReportBase64) {
        downloadErrorReportFromBase64(
          result.errorReportFileName || `${type}_import_errors.xlsx`,
          result.errorReportBase64,
        );
      }
      onImported?.();
    } catch (err) {
      setSeverity("error");
      setMessage((err as { message?: string })?.message || "Import thất bại.");
    } finally {
      setLoading(false);
    }
  };

  const buttons = (
    <>
      <Button
        variant="outlined"
        size="small"
        sx={muBtnSmOutlined}
        startIcon={loading ? <CircularProgress size={14} /> : <DownloadIcon sx={{ fontSize: 15 }} />}
        disabled={loading}
        onClick={() => void handleDownloadTemplate()}
      >
        Mẫu import
      </Button>
      <Button
        variant="outlined"
        size="small"
        sx={muBtnSmOutlined}
        startIcon={loading ? <CircularProgress size={14} /> : <UploadFileIcon sx={{ fontSize: 15 }} />}
        disabled={loading}
        onClick={() => fileInputRef.current?.click()}
      >
        Import
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        hidden
        onChange={(e) => void handleFileChange(e)}
      />
    </>
  );

  if (inline) {
    return <>{buttons}</>;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
      <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", alignItems: "center" }}>{buttons}</Box>
      {message ? (
        <Alert severity={severity} sx={{ py: 0, fontSize: 12 }}>
          {message}
        </Alert>
      ) : null}
    </Box>
  );
}

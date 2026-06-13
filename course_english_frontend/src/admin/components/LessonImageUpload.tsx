import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import { useCallback, useRef, useState } from "react";
import { muBtnSmOutlined, muFieldLabel } from "../../pages/admin/manageUserUiStyles";

type LessonImageUploadProps = {
  imageUrl?: string;
  onFileSelected: (file: File) => void | Promise<void>;
  uploading?: boolean;
  caption?: string;
  onCaptionChange?: (caption: string) => void;
  label?: string;
};

export function LessonImageUpload({
  imageUrl,
  onFileSelected,
  uploading = false,
  caption,
  onCaptionChange,
  label = "Ảnh minh họa",
}: LessonImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const pickFile = () => {
    if (!uploading) inputRef.current?.click();
  };

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        return;
      }
      void onFileSelected(file);
    },
    [onFileSelected],
  );

  return (
    <Box>
      <Typography sx={{ ...muFieldLabel, mb: 0.5 }}>{label}</Typography>
      <Box
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={pickFile}
        sx={{
          border: "2px dashed",
          borderColor: dragOver ? "#85B7EB" : "#D3D1C7",
          borderRadius: "8px",
          bgcolor: dragOver ? "#E6F1FB" : "#F9F8F5",
          p: 2,
          textAlign: "center",
          cursor: uploading ? "wait" : "pointer",
          transition: "border-color 0.15s, background 0.15s",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/jpg,image/webp"
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
        {uploading ? (
          <CircularProgress size={28} />
        ) : imageUrl ? (
          <Box
            component="img"
            src={imageUrl}
            alt={caption || "Preview"}
            sx={{ maxWidth: "100%", maxHeight: 220, borderRadius: "6px", objectFit: "contain" }}
          />
        ) : (
          <>
            <CloudUploadOutlinedIcon sx={{ fontSize: 36, color: "#0C447C", mb: 0.5 }} />
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#0C447C" }}>
              Kéo thả ảnh vào đây
            </Typography>
            <Typography sx={{ fontSize: 12, color: "#5F5E5A", mt: 0.5 }}>
              hoặc bấm để chọn file (JPG, PNG)
            </Typography>
          </>
        )}
        <Box sx={{ mt: 1.5 }} onClick={(e) => e.stopPropagation()}>
          <Button size="small" variant="outlined" sx={muBtnSmOutlined} disabled={uploading} onClick={pickFile}>
            Chọn ảnh từ máy
          </Button>
        </Box>
      </Box>
      {onCaptionChange ? (
        <Typography sx={{ fontSize: 11, color: "#888780", mt: 0.75 }}>
          Chú thích ảnh có thể chỉnh ở ô bên dưới sau khi tải lên.
        </Typography>
      ) : null}
    </Box>
  );
}

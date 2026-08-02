import CloseIcon from "@mui/icons-material/Close";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import SendIcon from "@mui/icons-material/Send";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Drawer,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useId, useRef, useState } from "react";
import { apiUploadFile, resolveStorageAssetUrl } from "../../../shared/api/file";
import {
  apiCreateInnovationIdea,
  INNOVATION_IDEA_IMAGE_FOLDER,
  type InnovationIdeaCategory,
  type InnovationIdeaPriority,
} from "../../../shared/api/innovationHub";

type InnovationSubmitDrawerProps = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

type PendingImage = {
  id: string;
  previewUrl: string;
  storagePath: string;
};

const MAX_IMAGES = 3;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/jpg"]);

// Vietnamese label and Emoji mappings matching prototype
const CATEGORIES_VI: Record<InnovationIdeaCategory, { label: string; emoji: string }> = {
  FEATURE: { label: "Đề xuất tính năng", emoji: "💡" },
  BUG: { label: "Báo lỗi", emoji: "💥" },
  UI: { label: "Giao diện", emoji: "🧩" },
  PERFORMANCE: { label: "Hiệu năng", emoji: "⚙️" },
  AI: { label: "AI", emoji: "⚛️" },
  OTHER: { label: "Khác", emoji: "➕" },
};

const CATEGORIES_ORDER: InnovationIdeaCategory[] = [
  "FEATURE",
  "BUG",
  "UI",
  "PERFORMANCE",
  "AI",
  "OTHER",
];

export function InnovationSubmitDrawer({ open, onClose, onSuccess }: InnovationSubmitDrawerProps) {
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<InnovationIdeaCategory>("FEATURE");
  const [priority, setPriority] = useState<InnovationIdeaPriority>("MEDIUM");
  const [images, setImages] = useState<PendingImage[]>([]);

  const revokePreviews = (items: PendingImage[]) => {
    items.forEach((item) => {
      if (item.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(item.previewUrl);
      }
    });
  };

  const reset = () => {
    setImages((prev) => {
      revokePreviews(prev);
      return [];
    });
    setTitle("");
    setDescription("");
    setCategory("FEATURE");
    setPriority("MEDIUM");
    setError("");
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  useEffect(() => {
    if (!open) {
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when drawer closes
  }, [open]);

  const busy = creating || uploading;

  const handleClose = () => {
    if (busy) return;
    onClose();
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList?.length) return;
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      setError(`Tối đa ${MAX_IMAGES} ảnh minh họa.`);
      return;
    }

    const picked = Array.from(fileList).slice(0, remaining);
    setUploading(true);
    setError("");
    try {
      for (const file of picked) {
        if (!ACCEPTED_IMAGE_TYPES.has(file.type) && !/\.(png|jpe?g)$/i.test(file.name)) {
          setError("Chỉ chấp nhận ảnh PNG hoặc JPG.");
          continue;
        }
        if (file.size > MAX_IMAGE_BYTES) {
          setError(`Ảnh "${file.name}" vượt quá 5MB.`);
          continue;
        }
        const uploaded = await apiUploadFile(file, INNOVATION_IDEA_IMAGE_FOLDER);
        const storagePath = `/storage/${INNOVATION_IDEA_IMAGE_FOLDER}/${uploaded.fileName}`;
        const previewUrl = URL.createObjectURL(file);
        setImages((prev) => {
          if (prev.length >= MAX_IMAGES) {
            URL.revokeObjectURL(previewUrl);
            return prev;
          }
          return [
            ...prev,
            {
              id: `${uploaded.fileName}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              previewUrl,
              storagePath,
            },
          ];
        });
      }
    } catch (err) {
      setError((err as { message?: string })?.message || "Không tải được ảnh.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      setError("Vui lòng nhập tiêu đề và mô tả.");
      return;
    }
    if (uploading) return;
    setCreating(true);
    setError("");
    try {
      await apiCreateInnovationIdea({
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        imageUrls: images.map((item) => item.storagePath),
      });
      onSuccess?.();
      onClose();
      reset();
    } catch (err) {
      setError((err as { message?: string })?.message || "Không gửi được góp ý.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={handleClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 460 },
          maxWidth: "100vw",
          borderRadius: { sm: "24px 0 0 24px" },
          boxShadow: "-10px 0 40px rgba(0, 0, 0, 0.08)",
        },
      }}
    >
      <Box sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column" }}>
        {/* Header Section */}
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: "12px",
              bgcolor: "#f5f3ff",
              color: "#6366f1",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <AssignmentOutlinedIcon />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight={800} color="#0f172a">
              Gửi góp ý &amp; cải tiến
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.2, fontSize: "0.82rem" }}>
              Chia sẻ ý tưởng của bạn để Course English tốt hơn mỗi ngày!
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleClose} aria-label="Đóng" sx={{ color: "#94a3b8" }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>

        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}

        {/* Scrollable Form Fields */}
        <Stack spacing={3} sx={{ flex: 1, overflow: "auto", pr: 0.5, py: 1 }}>
          {/* Step 1: Category */}
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  bgcolor: "#6366f1",
                  color: "#fff",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                }}
              >
                1
              </Box>
              <Typography variant="subtitle2" fontWeight={800} color="#1e293b">
                Bạn muốn góp ý về điều gì?
              </Typography>
            </Box>
            
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 1 }}>
              {CATEGORIES_ORDER.map((val) => {
                const active = category === val;
                const opt = CATEGORIES_VI[val];
                return (
                  <Button
                    key={val}
                    onClick={() => setCategory(val)}
                    sx={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 0.5,
                      textTransform: "none",
                      fontWeight: 700,
                      fontSize: "0.78rem",
                      py: 1,
                      px: 0.5,
                      borderRadius: "10px",
                      border: "1px solid",
                      borderColor: active ? "#6366f1" : "#e2e8f0",
                      bgcolor: active ? "#f5f3ff" : "#fff",
                      color: active ? "#4f46e5" : "#475569",
                      boxShadow: active ? "0 4px 12px rgba(99, 102, 241, 0.08)" : "none",
                      transition: "all 0.2s",
                      "&:hover": {
                        bgcolor: active ? "#f5f3ff" : "#f8fafc",
                        borderColor: active ? "#4f46e5" : "#cbd5e1",
                      },
                    }}
                  >
                    <span style={{ fontSize: "1rem" }}>{opt.emoji}</span>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {opt.label}
                    </span>
                  </Button>
                );
              })}
            </Box>
          </Box>

          {/* Step 2: Title */}
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.2 }}>
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  bgcolor: "#6366f1",
                  color: "#fff",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                }}
              >
                2
              </Box>
              <Typography variant="subtitle2" fontWeight={800} color="#1e293b">
                Tiêu đề góp ý
              </Typography>
            </Box>
            <TextField
              placeholder="VD: Thêm chế độ Dark Mode"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              inputProps={{ maxLength: 200 }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "10px",
                  bgcolor: "#fff",
                  fontSize: "0.88rem",
                  "& fieldset": { borderColor: "#e2e8f0" },
                  "&:hover fieldset": { borderColor: "#cbd5e1" },
                  "&.Mui-focused fieldset": { borderColor: "#6366f1", borderWidth: "1px" },
                },
              }}
            />
          </Box>

          {/* Step 3: Description */}
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.2 }}>
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  bgcolor: "#6366f1",
                  color: "#fff",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                }}
              >
                3
              </Box>
              <Typography variant="subtitle2" fontWeight={800} color="#1e293b">
                Mô tả chi tiết
              </Typography>
            </Box>
            <Box sx={{ position: "relative" }}>
              <TextField
                placeholder="Hãy mô tả rõ ràng ý tưởng hoặc vấn đề bạn gặp phải..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
                multiline
                minRows={5}
                inputProps={{ maxLength: 1000 }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                    bgcolor: "#fff",
                    fontSize: "0.88rem",
                    pb: 4,
                    "& fieldset": { borderColor: "#e2e8f0" },
                    "&:hover fieldset": { borderColor: "#cbd5e1" },
                    "&.Mui-focused fieldset": { borderColor: "#6366f1", borderWidth: "1px" },
                  },
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  position: "absolute",
                  bottom: 12,
                  right: 14,
                  color: "text.secondary",
                  fontWeight: 500,
                  pointerEvents: "none",
                }}
              >
                {description.length}/1000
              </Typography>
            </Box>
          </Box>

          {/* Step 4: Priority */}
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  bgcolor: "#6366f1",
                  color: "#fff",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                }}
              >
                4
              </Box>
              <Typography variant="subtitle2" fontWeight={800} color="#1e293b">
                Mức độ ưu tiên
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              {/* Low */}
              <Button
                variant="outlined"
                onClick={() => setPriority("LOW")}
                startIcon={<CheckCircleOutlinedIcon style={{ color: priority === "LOW" ? "#16a34a" : "#94a3b8" }} fontSize="small" />}
                sx={{
                  flex: 1,
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  borderRadius: "10px",
                  border: "1.5px solid",
                  borderColor: priority === "LOW" ? "#6366f1" : "#e2e8f0",
                  bgcolor: priority === "LOW" ? "#f5f3ff" : "#fff",
                  color: priority === "LOW" ? "#4f46e5" : "#64748b",
                  transition: "all 0.2s",
                  "&:hover": {
                    borderColor: priority === "LOW" ? "#4f46e5" : "#cbd5e1",
                    bgcolor: priority === "LOW" ? "#f5f3ff" : "#f8fafc",
                  },
                }}
              >
                Thấp
              </Button>
              {/* Medium */}
              <Button
                variant="outlined"
                onClick={() => setPriority("MEDIUM")}
                startIcon={<LightbulbOutlinedIcon style={{ color: priority === "MEDIUM" ? "#d97706" : "#94a3b8" }} fontSize="small" />}
                sx={{
                  flex: 1,
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  borderRadius: "10px",
                  border: "1.5px solid",
                  borderColor: priority === "MEDIUM" ? "#6366f1" : "#e2e8f0",
                  bgcolor: priority === "MEDIUM" ? "#f5f3ff" : "#fff",
                  color: priority === "MEDIUM" ? "#4f46e5" : "#64748b",
                  transition: "all 0.2s",
                  "&:hover": {
                    borderColor: priority === "MEDIUM" ? "#4f46e5" : "#cbd5e1",
                    bgcolor: priority === "MEDIUM" ? "#f5f3ff" : "#f8fafc",
                  },
                }}
              >
                Trung bình
              </Button>
              {/* High */}
              <Button
                variant="outlined"
                onClick={() => setPriority("HIGH")}
                startIcon={<WarningAmberOutlinedIcon style={{ color: priority === "HIGH" ? "#dc2626" : "#94a3b8" }} fontSize="small" />}
                sx={{
                  flex: 1,
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  borderRadius: "10px",
                  border: "1.5px solid",
                  borderColor: priority === "HIGH" ? "#6366f1" : "#e2e8f0",
                  bgcolor: priority === "HIGH" ? "#f5f3ff" : "#fff",
                  color: priority === "HIGH" ? "#4f46e5" : "#64748b",
                  transition: "all 0.2s",
                  "&:hover": {
                    borderColor: priority === "HIGH" ? "#4f46e5" : "#cbd5e1",
                    bgcolor: priority === "HIGH" ? "#f5f3ff" : "#f8fafc",
                  },
                }}
              >
                Cao
              </Button>
            </Stack>
          </Box>

          {/* Step 5: Image Upload (Optional) */}
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  bgcolor: "#6366f1",
                  color: "#fff",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                }}
              >
                5
              </Box>
              <Typography variant="subtitle2" fontWeight={800} color="#1e293b">
                Ảnh minh họa{" "}
                <span style={{ fontWeight: 500, color: "#64748b" }}>
                  (tùy chọn · {images.length}/{MAX_IMAGES})
                </span>
              </Typography>
            </Box>

            <input
              id={fileInputId}
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,.png,.jpg,.jpeg"
              multiple
              hidden
              disabled={busy || images.length >= MAX_IMAGES}
              onChange={(e) => void handleFilesSelected(e.target.files)}
            />

            {images.length > 0 ? (
              <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 1.5 }}>
                {images.map((img) => (
                  <Box
                    key={img.id}
                    sx={{
                      position: "relative",
                      width: 88,
                      height: 88,
                      borderRadius: "10px",
                      overflow: "hidden",
                      border: "1px solid #e2e8f0",
                      bgcolor: "#f8fafc",
                    }}
                  >
                    <Box
                      component="img"
                      src={img.previewUrl || resolveStorageAssetUrl(img.storagePath)}
                      alt=""
                      sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <IconButton
                      size="small"
                      aria-label="Xóa ảnh"
                      disabled={busy}
                      onClick={() => removeImage(img.id)}
                      sx={{
                        position: "absolute",
                        top: 2,
                        right: 2,
                        width: 24,
                        height: 24,
                        bgcolor: "rgba(15, 23, 42, 0.72)",
                        color: "#fff",
                        "&:hover": { bgcolor: "rgba(15, 23, 42, 0.9)" },
                      }}
                    >
                      <CloseIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Box>
                ))}
              </Stack>
            ) : null}

            {images.length < MAX_IMAGES ? (
              <Box
                component="label"
                htmlFor={fileInputId}
                sx={{
                  border: "1.5px dashed #cbd5e1",
                  borderRadius: "12px",
                  p: 2.5,
                  bgcolor: "#f8fafc",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 2,
                  cursor: busy ? "not-allowed" : "pointer",
                  opacity: busy ? 0.7 : 1,
                  transition: "all 0.2s",
                  "&:hover": busy
                    ? undefined
                    : {
                        borderColor: "#6366f1",
                        bgcolor: "#f3f4ff",
                      },
                }}
              >
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: "8px",
                    bgcolor: "#eef2ff",
                    display: "grid",
                    placeItems: "center",
                    color: "#4f46e5",
                    flexShrink: 0,
                  }}
                >
                  {uploading ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <CloudUploadOutlinedIcon fontSize="small" />
                  )}
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight={700} color="#1e293b" sx={{ fontSize: "0.82rem" }}>
                    {uploading ? "Đang tải ảnh…" : "Nhấp để tải ảnh hoặc kéo thả vào đây"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.72rem" }}>
                    PNG, JPG · tối đa 5MB · tối đa {MAX_IMAGES} ảnh
                  </Typography>
                </Box>
              </Box>
            ) : null}
          </Box>
        </Stack>

        {/* Footer Actions */}
        <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ pt: 2, mt: "auto", borderTop: "1px solid #f1f5f9" }}>
          <Button
            disabled={busy}
            onClick={handleClose}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              color: "#64748b",
              px: 3,
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              bgcolor: "#fff",
              "&:hover": { bgcolor: "#f8fafc", borderColor: "#cbd5e1" },
            }}
          >
            Hủy bỏ
          </Button>
          <Button
            variant="contained"
            disabled={busy}
            onClick={() => void handleSubmit()}
            startIcon={<SendIcon fontSize="small" />}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              px: 3,
              borderRadius: "8px",
              bgcolor: "#6366f1",
              boxShadow: "none",
              "&:hover": { bgcolor: "#4f46e5", boxShadow: "none" },
            }}
          >
            {creating ? "Đang gửi…" : "Gửi góp ý"}
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );
}

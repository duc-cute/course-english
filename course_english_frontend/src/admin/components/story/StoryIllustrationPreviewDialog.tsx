import RefreshIcon from "@mui/icons-material/Refresh";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import {
  apiGetStoryIllustrations,
  apiRegenerateStorySceneImage,
  type StoryIllustrationStatusPayload,
  type StoryRecord,
  type StoryScene,
} from "../../../shared/api/story";
import type { ApiResponse } from "../../../shared/api/types";
import { resolveStorageAssetUrl } from "../../../shared/api/file";

type StoryIllustrationPreviewDialogProps = {
  open: boolean;
  story: StoryRecord | null;
  onClose: () => void;
};

function unwrapIllustration(
  response: ApiResponse<StoryIllustrationStatusPayload>,
): StoryIllustrationStatusPayload | null {
  return response?.result ?? response?.data ?? null;
}

function statusColor(status?: string): "default" | "success" | "warning" | "error" | "info" {
  switch (status) {
    case "READY":
      return "success";
    case "PARTIAL":
    case "GENERATING":
    case "ANALYZED":
      return "warning";
    case "FAILED":
      return "error";
    default:
      return "default";
  }
}

export function StoryIllustrationPreviewDialog({
  open,
  story,
  onClose,
}: StoryIllustrationPreviewDialogProps) {
  const [loading, setLoading] = useState(false);
  const [regenIndex, setRegenIndex] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [payload, setPayload] = useState<StoryIllustrationStatusPayload | null>(null);
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);

  const load = useCallback(async () => {
    if (!story?.id) return;
    setLoading(true);
    setError("");
    try {
      const response = (await apiGetStoryIllustrations(story.id)) as ApiResponse<StoryIllustrationStatusPayload>;
      const data = unwrapIllustration(response);
      setPayload(data);
      const scenes = data?.scenes ?? [];
      if (scenes.length > 0) {
        setActiveSceneIndex(0);
      }
    } catch (err) {
      setPayload(null);
      setError(err instanceof Error ? err.message : "Không tải được illustrations.");
    } finally {
      setLoading(false);
    }
  }, [story?.id]);

  useEffect(() => {
    if (!open || !story?.id) {
      setPayload(null);
      setError("");
      setActiveSceneIndex(0);
      return;
    }
    void load();
  }, [open, story?.id, load]);

  const scenes = [...(payload?.scenes ?? [])].sort((a, b) => a.sceneIndex - b.sceneIndex);
  const active: StoryScene | undefined = scenes[activeSceneIndex] ?? scenes[0];
  const imageSrc = active?.imageUrl ? resolveStorageAssetUrl(active.imageUrl) : "";

  const handleRegenerate = async (sceneIndex: number) => {
    if (!story?.id) return;
    setRegenIndex(sceneIndex);
    setError("");
    try {
      const response = (await apiRegenerateStorySceneImage(
        story.id,
        sceneIndex,
      )) as ApiResponse<StoryIllustrationStatusPayload>;
      const data = unwrapIllustration(response);
      if (data) {
        setPayload(data);
        const idx = (data.scenes ?? []).findIndex((s) => s.sceneIndex === sceneIndex);
        if (idx >= 0) setActiveSceneIndex(idx);
      } else {
        await load();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Regenerate scene thất bại.");
    } finally {
      setRegenIndex(null);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" scroll="paper">
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
        <ImageOutlinedIcon color="primary" />
        Preview ảnh storybook
        {story?.title ? (
          <Typography component="span" color="text.secondary" sx={{ fontWeight: 500 }}>
            — {story.title}
          </Typography>
        ) : null}
        {payload?.illustrationStatus ? (
          <Chip
            size="small"
            label={payload.illustrationStatus}
            color={statusColor(payload.illustrationStatus)}
          />
        ) : null}
      </DialogTitle>

      <DialogContent dividers>
        {error ? (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        ) : null}
        {payload?.errorMessage ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {payload.errorMessage}
          </Alert>
        ) : null}

        {loading ? (
          <Box sx={{ display: "grid", placeItems: "center", minHeight: 240 }}>
            <CircularProgress />
          </Box>
        ) : !scenes.length ? (
          <Alert severity="info">
            Chưa có scenes. Hãy bấm &quot;Phân tích scenes&quot; hoặc &quot;Sinh ảnh truyện&quot; trước.
          </Alert>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {(payload?.characters?.length ?? 0) > 0 ? (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Nhân vật
                </Typography>
                <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                  {payload!.characters!.map((c) => {
                    const ref = c.referenceImageUrl
                      ? resolveStorageAssetUrl(c.referenceImageUrl)
                      : "";
                    return (
                      <Box
                        key={c.name}
                        sx={{
                          width: 96,
                          border: "1px solid",
                          borderColor: "divider",
                          borderRadius: 2,
                          overflow: "hidden",
                          bgcolor: "background.paper",
                        }}
                      >
                        <Box
                          sx={{
                            width: "100%",
                            aspectRatio: "1 / 1",
                            bgcolor: "action.hover",
                            display: "grid",
                            placeItems: "center",
                          }}
                        >
                          {ref ? (
                            <img
                              src={ref}
                              alt={c.name}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              Chưa sheet
                            </Typography>
                          )}
                        </Box>
                        <Typography
                          variant="caption"
                          sx={{ display: "block", p: 0.75, fontWeight: 700, textAlign: "center" }}
                        >
                          {c.name}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            ) : null}

            <Box
              sx={{
                width: "100%",
                aspectRatio: "4 / 3",
                borderRadius: 2,
                overflow: "hidden",
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "action.hover",
                display: "grid",
                placeItems: "center",
              }}
            >
              {imageSrc ? (
                <img
                  src={imageSrc}
                  alt={active?.description || `Scene ${active?.sceneIndex}`}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <Typography color="text.secondary" align="center" sx={{ px: 2 }}>
                  Scene {active?.sceneIndex ?? "—"} chưa có ảnh
                </Typography>
              )}
            </Box>

            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
              {scenes.map((s, idx) => (
                <Button
                  key={s.id ?? s.sceneIndex}
                  size="small"
                  variant={idx === activeSceneIndex ? "contained" : "outlined"}
                  onClick={() => setActiveSceneIndex(idx)}
                >
                  {s.sceneIndex}
                  {s.imageUrl ? "" : " ·"}
                </Button>
              ))}
              {active ? (
                <Button
                  size="small"
                  startIcon={
                    regenIndex === active.sceneIndex ? (
                      <CircularProgress size={14} color="inherit" />
                    ) : (
                      <RefreshIcon fontSize="small" />
                    )
                  }
                  disabled={regenIndex != null}
                  onClick={() => void handleRegenerate(active.sceneIndex)}
                >
                  Sinh lại scene {active.sceneIndex}
                </Button>
              ) : null}
            </Box>

            {active ? (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Scene {active.sceneIndex}
                  {active.location ? ` · ${active.location}` : ""}
                  {active.status ? ` · ${active.status}` : ""}
                </Typography>
                {active.description ? (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {active.description}
                  </Typography>
                ) : null}
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                  Câu {active.sentenceStart}–{active.sentenceEnd}
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {(active.segments?.length
                    ? active.segments
                    : [{ type: "narration", text: active.description || "" }]
                  ).map((seg, i) =>
                    seg.type === "dialogue" ? (
                      <Box
                        key={i}
                        sx={{
                          pl: 1.5,
                          borderLeft: "3px solid",
                          borderColor: "primary.main",
                          bgcolor: "action.hover",
                          borderRadius: "0 8px 8px 0",
                          py: 0.75,
                          pr: 1,
                        }}
                      >
                        {seg.speaker ? (
                          <Typography variant="caption" fontWeight={800} color="primary">
                            {seg.speaker}
                          </Typography>
                        ) : null}
                        <Typography variant="body2">&ldquo;{seg.text}&rdquo;</Typography>
                      </Box>
                    ) : (
                      <Typography key={i} variant="body2">
                        {seg.text}
                      </Typography>
                    ),
                  )}
                </Box>
              </Box>
            ) : null}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={() => void load()} disabled={loading || !story?.id}>
          Tải lại
        </Button>
        <Button onClick={onClose} variant="contained">
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
}

import VolumeUpOutlinedIcon from "@mui/icons-material/VolumeUpOutlined";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";

type VocabularyAudioPreviewProps = {
  audioUkUrl?: string;
  audioUsUrl?: string;
  compact?: boolean;
};

function playUrl(url: string) {
  const audio = new Audio(url);
  void audio.play().catch(() => {
    /* ignore autoplay / missing file */
  });
}

export function VocabularyAudioPreview({
  audioUkUrl,
  audioUsUrl,
  compact = false,
}: VocabularyAudioPreviewProps) {
  const hasUk = Boolean(audioUkUrl?.trim());
  const hasUs = Boolean(audioUsUrl?.trim());

  if (!hasUk && !hasUs) {
    return compact ? null : (
      <Typography sx={{ fontSize: 11, color: "#9A9890" }}>—</Typography>
    );
  }

  return (
    <Box sx={{ display: "flex", gap: 0.25, alignItems: "center" }}>
      {hasUk ? (
        <Tooltip title="Nghe UK">
          <IconButton size="small" onClick={() => playUrl(audioUkUrl!)} aria-label="Phát âm UK">
            <VolumeUpOutlinedIcon sx={{ fontSize: 16 }} />
            {!compact ? (
              <Typography component="span" sx={{ fontSize: 10, ml: 0.25 }}>
                UK
              </Typography>
            ) : null}
          </IconButton>
        </Tooltip>
      ) : null}
      {hasUs ? (
        <Tooltip title="Nghe US">
          <IconButton size="small" onClick={() => playUrl(audioUsUrl!)} aria-label="Phát âm US">
            <VolumeUpOutlinedIcon sx={{ fontSize: 16, color: "#0C447C" }} />
            {!compact ? (
              <Typography component="span" sx={{ fontSize: 10, ml: 0.25 }}>
                US
              </Typography>
            ) : null}
          </IconButton>
        </Tooltip>
      ) : null}
    </Box>
  );
}

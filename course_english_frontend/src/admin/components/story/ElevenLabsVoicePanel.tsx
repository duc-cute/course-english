import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import RefreshIcon from "@mui/icons-material/Refresh";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControlLabel,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useCallback, useState } from "react";
import {
  apiGetElevenLabsVoices,
  type ElevenLabsVoiceItem,
  unwrapElevenLabsVoiceList,
} from "../../../shared/api/story";

type Props = {
  onSelectVoice?: (voice: ElevenLabsVoiceItem) => void;
};

export function ElevenLabsVoicePanel({ onSelectVoice }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [freeOnly, setFreeOnly] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [voices, setVoices] = useState<ElevenLabsVoiceItem[]>([]);
  const [meta, setMeta] = useState({ totalCount: 0, freeApiHintCount: 0 });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiGetElevenLabsVoices({ freeOnly, search: search || undefined });
      const payload = unwrapElevenLabsVoiceList(response);
      setVoices(payload.voices);
      setMeta({
        totalCount: payload.totalCount,
        freeApiHintCount: payload.freeApiHintCount,
      });
    } catch (e) {
      setVoices([]);
      setError(
        e instanceof Error
          ? e.message
          : "Không tải được danh sách voice ElevenLabs — kiểm tra reading_text và ELEVENLABS_API_KEY",
      );
    } finally {
      setLoading(false);
    }
  }, [freeOnly, search]);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next && voices.length === 0 && !loading) {
      void load();
    }
  };

  const copyVoiceId = async (voiceId: string) => {
    try {
      await navigator.clipboard.writeText(voiceId);
      setCopiedId(voiceId);
      window.setTimeout(() => setCopiedId((cur) => (cur === voiceId ? null : cur)), 2000);
    } catch {
      setCopiedId(null);
    }
  };

  return (
    <Box className="el-voice-panel">
      <Box className="el-voice-panel__header">
        <Box>
          <Typography className="el-voice-panel__title">ElevenLabs voices (API v2)</Typography>
          <Typography className="el-voice-panel__subtitle">
            Danh sách từ <code>GET /v2/voices</code> — dùng để làm lại danh mục <code>tts_voice_catalog</code>.
            Cột &quot;Free API&quot; là gợi ý (premade/clone), không đảm bảo 100%.
          </Typography>
        </Box>
        <Button
          size="small"
          variant={open ? "contained" : "outlined"}
          onClick={handleToggle}
          className="el-voice-panel__toggle"
        >
          {open ? "Ẩn danh sách" : "Xem voice ElevenLabs"}
        </Button>
      </Box>

      {open ? (
        <Box className="el-voice-panel__body">
          <Box className="el-voice-panel__toolbar">
            <TextField
              size="small"
              placeholder="Tìm tên voice..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setSearch(searchInput.trim());
              }}
              className="el-voice-panel__search"
            />
            <Button size="small" variant="outlined" onClick={() => setSearch(searchInput.trim())}>
              Tìm
            </Button>
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={freeOnly}
                  onChange={(e) => setFreeOnly(e.target.checked)}
                />
              }
              label="Chỉ gợi ý free API"
            />
            <Button
              size="small"
              variant="outlined"
              startIcon={loading ? <CircularProgress size={14} /> : <RefreshIcon />}
              onClick={() => void load()}
              disabled={loading}
            >
              Tải lại
            </Button>
            {meta.totalCount > 0 ? (
              <Typography variant="caption" color="text.secondary">
                Hiển thị {voices.length} / {meta.totalCount} (free hint: {meta.freeApiHintCount})
              </Typography>
            ) : null}
          </Box>

          {error ? (
            <Alert severity="warning" sx={{ mb: 1 }}>
              {error}
            </Alert>
          ) : null}

          {loading && voices.length === 0 ? (
            <Box className="el-voice-panel__loading">
              <CircularProgress size={28} />
              <Typography variant="body2" color="text.secondary">
                Đang gọi ElevenLabs API...
              </Typography>
            </Box>
          ) : (
            <TableContainer className="el-voice-panel__table-wrap">
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Tên</TableCell>
                    <TableCell>Voice ID</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Giới tính</TableCell>
                    <TableCell>Accent</TableCell>
                    <TableCell>Free API</TableCell>
                    <TableCell align="right">Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {voices.length === 0 && !loading ? (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <Typography variant="body2" color="text.secondary">
                          Không có voice — thử tắt filter free hoặc bấm Tải lại.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : null}
                  {voices.map((voice) => (
                    <TableRow key={voice.voiceId} hover>
                      <TableCell>{voice.name}</TableCell>
                      <TableCell>
                        <Typography variant="caption" component="code" className="el-voice-panel__code">
                          {voice.voiceId}
                        </Typography>
                      </TableCell>
                      <TableCell>{voice.category ?? "—"}</TableCell>
                      <TableCell>{voice.gender ?? "—"}</TableCell>
                      <TableCell>{voice.accent ?? "—"}</TableCell>
                      <TableCell>
                        {voice.freeApiHint ? (
                          <Chip size="small" label="Gợi ý" color="success" variant="outlined" />
                        ) : (
                          <Chip size="small" label="?" color="default" variant="outlined" />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title={copiedId === voice.voiceId ? "Đã copy!" : "Copy voice ID"}>
                          <Button
                            size="small"
                            startIcon={<ContentCopyIcon fontSize="small" />}
                            onClick={() => void copyVoiceId(voice.voiceId)}
                          >
                            Copy
                          </Button>
                        </Tooltip>
                        {onSelectVoice ? (
                          <Button size="small" onClick={() => onSelectVoice(voice)} sx={{ ml: 0.5 }}>
                            Chọn
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      ) : null}
    </Box>
  );
}

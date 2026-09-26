import AddIcon from "@mui/icons-material/Add";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import AutoStoriesOutlinedIcon from "@mui/icons-material/AutoStoriesOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import GraphicEqIcon from "@mui/icons-material/GraphicEq";
import HeadphonesOutlinedIcon from "@mui/icons-material/HeadphonesOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import StarBorderOutlinedIcon from "@mui/icons-material/StarBorderOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import RemoveRedEyeOutlinedIcon from "@mui/icons-material/RemoveRedEyeOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import CloseIcon from "@mui/icons-material/Close";
import TranslateIcon from "@mui/icons-material/Translate";
import WbSunnyOutlinedIcon from "@mui/icons-material/WbSunnyOutlined";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AdminCatalogPageHeader, ConfirmDialog } from "../../admin/components";
import { StoryAiGenDialog } from "../../admin/components/story/StoryAiGenDialog";
import { StoryMonologueGenDialog } from "../../admin/components/story/StoryMonologueGenDialog";
import { StoryIllustrationPreviewDialog } from "../../admin/components/story/StoryIllustrationPreviewDialog";
import { StoryAudioPlayer } from "../../student/stories/StoryAudioPlayer";
import {
  apiAnalyzeStoryScenes,
  apiCreateStory,
  apiDeleteStory,
  apiGenerateStoryAudio,
  apiGenerateStoryIllustrations,
  apiGetStoryById,
  apiGetStoryAudioStatus,
  apiGetStoryIllustrations,
  apiGetStoryVoiceCatalog,
  apiPreviewStoryCoverAi,
  apiRetranslateStory,
  apiSearchStories,
  apiUpdateStory,
  STORY_FORMAT_OPTIONS,
  STORY_VISUAL_STYLE_OPTIONS,
  type StoryAiPreviewResult,
  type StoryFormat,
  type StoryIllustrationStatus,
  type StoryIllustrationStatusPayload,
  type StoryRecord,
  type StoryStatus,
  type StoryVisualStyle,
  type TtsVoiceCatalogItem,
} from "../../shared/api/story";
import type { ApiResponse } from "../../shared/api/types";
import { apiUploadFile, buildStoragePublicUrl, resolveStorageAssetUrl } from "../../shared/api/file";
import { apiSearchVocabularySets, type VocabularySetRecord } from "../../shared/api/vocabularySet";

type VoiceProfileEntry = {
  provider: string;
  voiceId: string;
};

type StoryFormState = {
  title: string;
  content: string;
  coverImageUrl: string;
  level: string;
  readingTimeMinutes: number;
  prompt: string;
  vocabularySetId: string;
  status: StoryStatus;
  aiGenerated: boolean;
  translationsJson: string;
  storyFormat: StoryFormat;
  visualStyle: StoryVisualStyle;
  narratorVoiceId: string;
  maleAdultVoiceId: string;
  femaleAdultVoiceId: string;
  boyChildVoiceId: string;
  girlChildVoiceId: string;
};

const VOICE_PROFILE_KEYS = ["NARRATOR", "MALE_ADULT", "FEMALE_ADULT", "BOY_CHILD", "GIRL_CHILD"] as const;

function catalogOptionKey(v: TtsVoiceCatalogItem): string {
  return `${v.provider}|${v.voiceId}`;
}

function buildVoiceProfileEntry(
  catalogKey: string,
  catalog: TtsVoiceCatalogItem[],
): VoiceProfileEntry | null {
  if (!catalogKey) return null;
  const matched = catalog.find((item) => catalogOptionKey(item) === catalogKey);
  if (matched) {
    return { provider: matched.provider, voiceId: matched.voiceId };
  }
  const [provider, voiceId] = catalogKey.split("|");
  if (!provider || !voiceId) return null;
  return { provider, voiceId };
}

function parseProfileFieldValue(
  raw: unknown,
  catalog: TtsVoiceCatalogItem[],
): string {
  if (typeof raw === "string") {
    if (raw.includes("|")) return raw;
    const matched = catalog.find((item) => item.voiceId === raw);
    return matched ? catalogOptionKey(matched) : "";
  }
  if (raw && typeof raw === "object") {
    const entry = raw as Partial<VoiceProfileEntry>;
    if (entry.provider && entry.voiceId) {
      return `${entry.provider}|${entry.voiceId}`;
    }
  }
  return "";
}

function parseVoiceProfileFormValues(
  value: string | undefined,
  catalog: TtsVoiceCatalogItem[],
): Pick<
  StoryFormState,
  "narratorVoiceId" | "maleAdultVoiceId" | "femaleAdultVoiceId" | "boyChildVoiceId" | "girlChildVoiceId"
> {
  if (!value) {
    return {
      narratorVoiceId: "",
      maleAdultVoiceId: "",
      femaleAdultVoiceId: "",
      boyChildVoiceId: "",
      girlChildVoiceId: "",
    };
  }
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    return {
      narratorVoiceId: parseProfileFieldValue(parsed.NARRATOR, catalog),
      maleAdultVoiceId: parseProfileFieldValue(parsed.MALE_ADULT, catalog),
      femaleAdultVoiceId: parseProfileFieldValue(parsed.FEMALE_ADULT, catalog),
      boyChildVoiceId: parseProfileFieldValue(parsed.BOY_CHILD, catalog),
      girlChildVoiceId: parseProfileFieldValue(parsed.GIRL_CHILD, catalog),
    };
  } catch {
    return {
      narratorVoiceId: "",
      maleAdultVoiceId: "",
      femaleAdultVoiceId: "",
      boyChildVoiceId: "",
      girlChildVoiceId: "",
    };
  }
}

function buildVoiceProfileJson(
  form: Pick<
    StoryFormState,
    "narratorVoiceId" | "maleAdultVoiceId" | "femaleAdultVoiceId" | "boyChildVoiceId" | "girlChildVoiceId"
  >,
  catalog: TtsVoiceCatalogItem[],
): string | undefined {
  const map: Record<string, VoiceProfileEntry> = {};
  const assign = (key: (typeof VOICE_PROFILE_KEYS)[number], catalogKey: string) => {
    const entry = buildVoiceProfileEntry(catalogKey, catalog);
    if (entry) map[key] = entry;
  };
  assign("NARRATOR", form.narratorVoiceId);
  assign("MALE_ADULT", form.maleAdultVoiceId);
  assign("FEMALE_ADULT", form.femaleAdultVoiceId);
  assign("BOY_CHILD", form.boyChildVoiceId);
  assign("GIRL_CHILD", form.girlChildVoiceId);
  return Object.keys(map).length ? JSON.stringify(map) : undefined;
}

const defaultForm = (): StoryFormState => ({
  title: "",
  content: "",
  coverImageUrl: "",
  level: "A2",
  readingTimeMinutes: 5,
  prompt: "",
  vocabularySetId: "",
  status: "DRAFT",
  aiGenerated: false,
  translationsJson: "",
  storyFormat: "STORYBOOK",
  visualStyle: "PASTEL_STORYBOOK",
  narratorVoiceId: "",
  maleAdultVoiceId: "",
  femaleAdultVoiceId: "",
  boyChildVoiceId: "",
  girlChildVoiceId: "",
});

export function ManageStoriesPage() {
  const [rows, setRows] = useState<StoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "PUBLISHED" | "DRAFT" | "HAS_AUDIO" | "NO_AUDIO">("ALL");
  const [levelFilter, setLevelFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(12);
  const [tags, setTags] = useState<string[]>(["Adventure", "Ocean", "Friendship", "Discovery"]);
  const [tagInput, setTagInput] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [monologueOpen, setMonologueOpen] = useState(false);
  const [editing, setEditing] = useState<StoryRecord | null>(null);
  const [form, setForm] = useState<StoryFormState>(defaultForm());
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StoryRecord | null>(null);
  const [vocabSets, setVocabSets] = useState<VocabularySetRecord[]>([]);
  const [voiceCatalog, setVoiceCatalog] = useState<TtsVoiceCatalogItem[]>([]);
  const [audioGeneratingId, setAudioGeneratingId] = useState<string | null>(null);
  const [illustrationBusyId, setIllustrationBusyId] = useState<string | null>(null);
  const [illustrationPreviewStory, setIllustrationPreviewStory] = useState<StoryRecord | null>(null);
  const [illustrationStatusById, setIllustrationStatusById] = useState<
    Record<string, StoryIllustrationStatus>
  >({});
  const [illustrationMessage, setIllustrationMessage] = useState("");
  const [audioMessage, setAudioMessage] = useState("");
  const [listenOpen, setListenOpen] = useState(false);
  const [listenTitle, setListenTitle] = useState("");
  const [listenAudioUrl, setListenAudioUrl] = useState("");
  const [listenDuration, setListenDuration] = useState<number | undefined>(undefined);
  const [listenLoading, setListenLoading] = useState(false);
  const [listenError, setListenError] = useState("");
  const [listenContentOpen, setListenContentOpen] = useState(false);
  const [listenContent, setListenContent] = useState("");
  const [coverGenerating, setCoverGenerating] = useState(false);
  const [retranslating, setRetranslating] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const loadRows = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiSearchStories({ keyword: keyword || undefined, page: 0, size: 500 });
      setRows(response.result ?? []);
    } catch {
      setError("Không tải được danh sách story.");
    } finally {
      setLoading(false);
    }
  }, [keyword]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  useEffect(() => {
    (async () => {
      try {
        const response = await apiSearchVocabularySets({ page: 0, size: 200, sort: "title,asc" });
        const payload = response as { result?: VocabularySetRecord[]; data?: { result?: VocabularySetRecord[] } };
        const items = payload?.data?.result ?? payload?.result ?? [];
        setVocabSets(Array.isArray(items) ? items.filter((set) => set.status !== "ARCHIVED") : []);
      } catch {
        setVocabSets([]);
      }
      try {
        const response = await apiGetStoryVoiceCatalog();
        const payload = response as { result?: TtsVoiceCatalogItem[]; data?: { result?: TtsVoiceCatalogItem[] } };
        const items = payload?.data?.result ?? payload?.result ?? [];
        setVoiceCatalog(Array.isArray(items) ? items : []);
      } catch {
        setVoiceCatalog([]);
      }
    })();
  }, []);

  const edgeVoiceCatalog = useMemo(
    () =>
      voiceCatalog
        .filter((v) => v.provider === "edge")
        .sort((a, b) => a.displayName.localeCompare(b.displayName)),
    [voiceCatalog],
  );

  const parseVoiceProfileJson = (value?: string) =>
    parseVoiceProfileFormValues(value, edgeVoiceCatalog);

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm());
    setFormOpen(true);
  };

  const openEdit = (row: StoryRecord) => {
    setEditing(row);
    setForm({
      title: row.title ?? "",
      content: row.content ?? "",
      coverImageUrl: row.coverImageUrl ?? "",
      level: row.level ?? "A2",
      readingTimeMinutes: row.readingTimeMinutes ?? 5,
      prompt: row.prompt ?? "",
      vocabularySetId: row.vocabularySetId ?? "",
      status: row.status ?? "DRAFT",
      aiGenerated: Boolean(row.aiGenerated),
      translationsJson: "",
      storyFormat: row.storyFormat ?? "STORYBOOK",
      visualStyle: row.visualStyle ?? "PASTEL_STORYBOOK",
      ...parseVoiceProfileJson(row.voiceProfileJson),
    });
    setFormOpen(true);
  };

  const handleAiApply = (preview: StoryAiPreviewResult, meta: { prompt: string; vocabularySetId?: string }) => {
    setEditing(null);
    setForm({
      title: preview.title,
      content: preview.content,
      coverImageUrl: "",
      level: preview.level ?? "A2",
      readingTimeMinutes: preview.readingTimeMinutes ?? 5,
      prompt: meta.prompt,
      vocabularySetId: meta.vocabularySetId ?? "",
      status: "DRAFT",
      aiGenerated: true,
      translationsJson: preview.translationsJson ?? "",
      storyFormat: "STORYBOOK",
      visualStyle: "PASTEL_STORYBOOK",
      narratorVoiceId: "",
      maleAdultVoiceId: "",
      femaleAdultVoiceId: "",
      boyChildVoiceId: "",
      girlChildVoiceId: "",
    });
    setFormOpen(true);
  };

  const handleMonologueApply = (preview: StoryAiPreviewResult) => {
    setEditing(null);
    setForm({
      ...defaultForm(),
      title: preview.title,
      content: preview.content,
      level: preview.level ?? "A2",
      readingTimeMinutes: preview.readingTimeMinutes ?? 3,
      prompt: preview.prompt ?? "",
      aiGenerated: true,
      translationsJson: preview.translationsJson ?? "",
      storyFormat: preview.storyFormat ?? "MONOLOGUE",
      visualStyle: preview.visualStyle ?? "INK_SKETCH",
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      setError("Tiêu đề và nội dung không được trống.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const voiceProfileJson = buildVoiceProfileJson(form, edgeVoiceCatalog);
      const payload = {
        title: form.title.trim(),
        content: form.content.trim(),
        coverImageUrl: form.coverImageUrl.trim() || undefined,
        level: form.level,
        readingTimeMinutes: form.readingTimeMinutes,
        prompt: form.prompt.trim() || undefined,
        vocabularySetId: form.vocabularySetId || undefined,
        status: form.status,
        aiGenerated: form.aiGenerated,
        translationsJson: form.translationsJson.trim() || undefined,
        voiceProfileJson,
        storyFormat: form.storyFormat,
        visualStyle: form.visualStyle,
      };
      if (editing?.id) {
        await apiUpdateStory(editing.id, payload);
      } else {
        await apiCreateStory(payload);
      }
      setFormOpen(false);
      await loadRows();
    } catch {
      setError("Không lưu được story.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    try {
      await apiDeleteStory(deleteTarget.id);
      setDeleteTarget(null);
      await loadRows();
    } catch {
      setError("Không xóa được story.");
    }
  };

  const pollAudioReady = async (storyId: string): Promise<{ ok: boolean; message: string }> => {
    for (let attempt = 0; attempt < 40; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const response = (await apiGetStoryAudioStatus(storyId)) as ApiResponse<{
        processingStatus?: string;
        message?: string;
        errorMessage?: string;
      }>;
      const data = response?.result ?? response?.data;
      console.info("[StoryAudio] poll", {
        attempt: attempt + 1,
        storyId,
        status: data?.processingStatus,
        message: data?.message,
        error: data?.errorMessage,
      });
      if (data?.processingStatus === "AUDIO_READY") {
        return { ok: true, message: data.message ?? "Audio sẵn sàng." };
      }
      if (data?.processingStatus === "AUDIO_FAILED") {
        const detail = data.errorMessage ?? data.message ?? "Sinh audio thất bại.";
        return { ok: false, message: detail };
      }
    }
    return {
      ok: false,
      message:
        "Hết thời gian chờ (2 phút). Kiểm tra log Spring [StoryAudio] và Python [TTS], hoặc GET /stories/{id}/audio.",
    };
  };

  const handleGenerateAudio = async (row: StoryRecord) => {
    if (!row.id) return;
    setAudioGeneratingId(row.id);
    setAudioMessage("");
    setError("");
    try {
      console.info("[StoryAudio] generate requested", { storyId: row.id, title: row.title });
      const response = (await apiGenerateStoryAudio(row.id)) as ApiResponse<{
        cached?: boolean;
        message?: string;
        processingStatus?: string;
        errorMessage?: string;
      }>;
      const data = response?.result ?? response?.data;
      console.info("[StoryAudio] queue response", data);
      if (data?.processingStatus === "AUDIO_FAILED") {
        setError(data.errorMessage ?? data.message ?? "Sinh audio thất bại.");
        await loadRows();
        return;
      }
      if (data?.processingStatus === "AUDIO_READY" || data?.cached) {
        setAudioMessage(data.message ?? `Audio sẵn sàng cho "${row.title}".`);
        await loadRows();
        return;
      }
      const result = await pollAudioReady(row.id);
      if (result.ok) {
        setAudioMessage(result.message);
      } else {
        setError(result.message);
      }
      await loadRows();
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Không sinh được audio. Kiểm tra Python speech platform (:8100) và SPEECH_PLATFORM_ENABLED=true.";
      console.error("[StoryAudio] generate failed", err);
      setError(msg);
    } finally {
      setAudioGeneratingId(null);
    }
  };

  const applyIllustrationPayload = (storyId: string, data?: StoryIllustrationStatusPayload | null) => {
    if (!data?.illustrationStatus) return;
    setIllustrationStatusById((prev) => ({ ...prev, [storyId]: data.illustrationStatus }));
  };

  const pollIllustrationReady = async (storyId: string) => {
    const maxAttempts = 60;
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      const response = (await apiGetStoryIllustrations(storyId)) as ApiResponse<StoryIllustrationStatusPayload>;
      const data = response?.result ?? response?.data;
      applyIllustrationPayload(storyId, data);
      const status = data?.illustrationStatus;
      if (status === "READY" || status === "PARTIAL") {
        return {
          ok: true as const,
          message: data?.message ?? `Illustrations ${status.toLowerCase()} (${data?.scenes?.length ?? 0} scenes).`,
        };
      }
      if (status === "FAILED") {
        return {
          ok: false as const,
          message: data?.errorMessage ?? data?.message ?? "Sinh illustrations thất bại.",
        };
      }
    }
    return { ok: false as const, message: "Hết thời gian chờ sinh illustrations." };
  };

  /** Phân tích scenes → sinh toàn bộ ảnh storybook (một nút). */
  const handleGenerateStorybookImages = async (row: StoryRecord) => {
    if (!row.id) return;
    setIllustrationBusyId(row.id);
    setIllustrationMessage("");
    setError("");
    try {
      setIllustrationMessage(`Đang phân tích scenes cho "${row.title}"...`);
      const analyzeRes = (await apiAnalyzeStoryScenes(row.id)) as ApiResponse<StoryIllustrationStatusPayload>;
      const analyzed = analyzeRes?.result ?? analyzeRes?.data;
      applyIllustrationPayload(row.id, analyzed);
      const sceneCount = analyzed?.scenes?.length ?? 0;
      if (sceneCount === 0) {
        setError("AI không trả scenes — không thể sinh ảnh.");
        setIllustrationMessage("");
        return;
      }

      setIllustrationMessage(`Đã có ${sceneCount} scenes — đang sinh ảnh storybook...`);
      const genRes = (await apiGenerateStoryIllustrations(row.id)) as ApiResponse<StoryIllustrationStatusPayload>;
      const queued = genRes?.result ?? genRes?.data;
      applyIllustrationPayload(row.id, queued);
      if (queued?.illustrationStatus === "READY" || queued?.illustrationStatus === "PARTIAL") {
        setIllustrationMessage(
          queued.message ?? `Đã sinh ảnh storybook cho "${row.title}" (${sceneCount} scenes).`,
        );
        return;
      }
      const result = await pollIllustrationReady(row.id);
      if (result.ok) {
        setIllustrationMessage(`"${row.title}": ${result.message}`);
      } else {
        setError(result.message);
        setIllustrationMessage("");
      }
    } catch (err) {
      setIllustrationMessage("");
      setError(err instanceof Error ? err.message : "Sinh ảnh storybook thất bại.");
    } finally {
      setIllustrationBusyId(null);
    }
  };

  const handleListenAudio = async (row: StoryRecord) => {
    if (!row.id) return;
    setListenLoading(true);
    setListenError("");
    setListenTitle(row.title);
    setListenOpen(true);
    setListenContentOpen(false);
    setListenContent("");
    try {
      const storyDetail = (await apiGetStoryById(row.id)) as ApiResponse<StoryRecord>;
      const story = storyDetail?.result ?? storyDetail?.data;
      setListenContent(story?.content ?? row.content ?? "");

      const response = (await apiGetStoryAudioStatus(row.id)) as ApiResponse<{
        processingStatus?: string;
        audioUrl?: string;
        duration?: number;
      }>;
      const data = response?.result ?? response?.data;
      if (!data?.audioUrl) {
        setListenAudioUrl("");
        setListenDuration(undefined);
        if (data?.processingStatus === "PENDING" || data?.processingStatus === "TOKENIZED") {
          setListenError("Story đang xử lý audio. Bấm 'Sinh audio' và thử lại sau.");
        } else if (data?.processingStatus === "AUDIO_FAILED") {
          setListenError("Sinh audio thất bại. Bấm 'Sinh audio' để thử lại và xem thông báo lỗi.");
        } else {
          setListenError("Story chưa có audio để phát.");
        }
        return;
      }
      setListenAudioUrl(data.audioUrl);
      setListenDuration(data.duration);
    } catch {
      setListenAudioUrl("");
      setListenDuration(undefined);
      setListenError("Không tải được audio từ server.");
    } finally {
      setListenLoading(false);
    }
  };

  const handleUploadCover = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Chỉ chấp nhận file ảnh (JPG, PNG, WebP).");
      return;
    }

    setCoverUploading(true);
    setError("");
    try {
      const folder = editing?.id ? `stories/${editing.id}/cover` : "stories/covers";
      const uploaded = await apiUploadFile(file, folder);
      const url = buildStoragePublicUrl(folder, uploaded.fileName);
      setForm((f) => ({ ...f, coverImageUrl: url }));
    } catch {
      setError("Upload ảnh cover thất bại.");
    } finally {
      setCoverUploading(false);
      if (coverInputRef.current) {
        coverInputRef.current.value = "";
      }
    }
  };

  const handleRetranslate = async () => {
    if (!editing?.id) return;
    setRetranslating(true);
    setError("");
    try {
      await apiRetranslateStory(editing.id);
      await loadRows();
      setIllustrationMessage(`Đã dịch lại "${editing.title}" — mở reader để xem bản dịch mới.`);
    } catch {
      setError("Dịch lại thất bại. Thử lại sau vài giây.");
    } finally {
      setRetranslating(false);
    }
  };

  const handleGenerateCover = async () => {
    if (!form.title.trim()) {
      setError("Cần tiêu đề trước khi sinh ảnh cover.");
      return;
    }
    if (!form.content.trim()) {
      setError("Cần nội dung story trước khi sinh ảnh cover.");
      return;
    }

    setCoverGenerating(true);
    setError("");
    try {
      const response = await apiPreviewStoryCoverAi({
        title: form.title.trim(),
        content: form.content.trim(),
        level: form.level || undefined,
        prompt: form.prompt.trim() || undefined,
      });
      const data = response?.result ?? response?.data;
      if (!data?.coverImageUrl) {
        setError("Không sinh được ảnh cover story.");
        return;
      }
      setForm((f) => ({ ...f, coverImageUrl: data.coverImageUrl ?? "" }));
    } catch {
      setError("Không sinh được ảnh cover story.");
    } finally {
      setCoverGenerating(false);
    }
  };
  // Filters, sorting, and pagination calculations
  const filteredRows = rows.filter((row) => {
    // 1. Tab filter
    if (activeTab === "PUBLISHED" && row.status !== "PUBLISHED") return false;
    if (activeTab === "DRAFT" && row.status !== "DRAFT") return false;
    if (activeTab === "HAS_AUDIO" && row.processingStatus !== "AUDIO_READY") return false;
    if (activeTab === "NO_AUDIO" && row.processingStatus === "AUDIO_READY") return false;

    // 2. Level filter
    if (levelFilter !== "ALL" && row.level !== levelFilter) return false;

    // 3. Status filter
    if (statusFilter !== "ALL" && row.status !== statusFilter) return false;

    return true;
  });

  const sortedRows = [...filteredRows].sort((a, b) => {
    if (sortBy === "newest") {
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return db - da || b.id.localeCompare(a.id);
    }
    if (sortBy === "oldest") {
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return da - db || a.id.localeCompare(b.id);
    }
    if (sortBy === "title") {
      return (a.title ?? "").localeCompare(b.title ?? "");
    }
    return 0;
  });

  const totalItems = sortedRows.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const currentPage = Math.max(0, Math.min(page, Math.max(0, totalPages - 1)));
  const paginatedRows = sortedRows.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  const getDisplayDuration = (row: StoryRecord) => {
    if (row.processingStatus !== "AUDIO_READY") return "--:--";
    const hash = row.title.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const minutes = 3 + (hash % 7);
    const seconds = hash % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const getDisplayViews = (row: StoryRecord) => {
    const hash = row.title.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const base = 200 + (hash % 1500);
    if (base > 1000) {
      return `${(base / 1000).toFixed(1)}K`;
    }
    return `${base}`;
  };

  const handleSearch = () => {
    setPage(0);
    setKeyword(searchInput);
  };

  if (formOpen) {
    const wordCount = form.content ? form.content.trim().split(/\s+/).filter(Boolean).length : 0;
    const sentenceCount = form.content ? form.content.split(/[.!?]+/).filter(s => s.trim().length > 0).length : 0;
    const formattedCreatedDate = editing?.createdAt
      ? new Date(editing.createdAt).toLocaleString("vi-VN")
      : new Date().toLocaleString("vi-VN");
    const formattedUpdatedDate = editing?.updatedAt
      ? new Date(editing.updatedAt).toLocaleString("vi-VN")
      : new Date().toLocaleString("vi-VN");

    const hasAudio = editing?.processingStatus === "AUDIO_READY";

    return (
      <Box className="story-editor-page">
        {/* Header */}
        <Box className="story-editor__header">
          <Box className="story-editor__title-row">
            <button className="story-editor__back-btn" onClick={() => setFormOpen(false)}>
              <ArrowBackIcon />
            </button>
            <h2 className="story-editor__title">{editing ? "Sửa story" : "Story mới"}</h2>
          </Box>
          <Box className="story-editor__header-actions">
            <Button
              variant="outlined"
              className="action-btn action-btn--preview"
              startIcon={<RemoveRedEyeOutlinedIcon />}
              onClick={() => {
                if (editing) void handleListenAudio(editing);
              }}
            >
              <span className="btn-text">Xem trước</span>
            </Button>
            <Button
              variant="contained"
              className="action-btn action-btn--save"
              startIcon={<SaveOutlinedIcon />}
              onClick={handleSave}
              disabled={saving}
            >
              <span className="btn-text">{saving ? "Đang lưu..." : "Lưu thay đổi"}</span>
            </Button>
          </Box>
        </Box>

        {error ? (
          <Alert severity="error" onClose={() => setError("")}>
            {error}
          </Alert>
        ) : null}
        {illustrationMessage ? (
          <Alert severity="success" onClose={() => setIllustrationMessage("")} sx={{ mb: 2 }}>
            {illustrationMessage}
          </Alert>
        ) : null}

        {/* Layout */}
        <Box className="story-editor__layout">
          {/* Left Column */}
          <Box className="story-editor__left">
            {/* Cover Card */}
            <Box
              className={`story-editor__cover-card ${form.coverImageUrl ? "story-editor__cover-card--has-image" : "story-editor__cover-card--empty"}`}
              onClick={() => {
                if (!coverUploading && !coverGenerating) {
                  coverInputRef.current?.click();
                }
              }}
              style={{ cursor: "pointer" }}
            >
              {form.coverImageUrl ? (
                <img src={resolveStorageAssetUrl(form.coverImageUrl)} alt="Story cover" />
              ) : (
                <Box className="story-editor__cover-empty">
                  <ImageOutlinedIcon className="story-editor__cover-empty-icon" />
                  <Button
                    size="small"
                    className="story-editor__cover-change-btn story-editor__cover-change-btn--center"
                    startIcon={<ImageOutlinedIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      coverInputRef.current?.click();
                    }}
                    disabled={coverUploading || coverGenerating}
                  >
                    {coverUploading ? "Đang tải lên..." : "Thêm ảnh"}
                  </Button>
                </Box>
              )}
              <input
                ref={coverInputRef}
                type="file"
                accept="image/jpeg,image/png,image/jpg,image/webp"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleUploadCover(file);
                }}
              />
              {form.coverImageUrl ? (
                <Button
                  size="small"
                  className="story-editor__cover-change-btn story-editor__cover-change-btn--bottom"
                  startIcon={<ImageOutlinedIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    coverInputRef.current?.click();
                  }}
                  disabled={coverUploading || coverGenerating}
                >
                  {coverUploading ? "Đang tải lên..." : "Thay đổi ảnh"}
                </Button>
              ) : null}
            </Box>

            {/* Quick Info Card */}
            <Box className="story-editor__info-card">
              <h4 className="story-editor__info-title">Thông tin nhanh</h4>
              <Box className="story-editor__info-list">
                <Box className="story-editor__info-item">
                  <span className="story-editor__info-label">ID story</span>
                  <span className="story-editor__info-value">{editing?.id ? editing.id : "—"}</span>
                </Box>
                <Box className="story-editor__info-item">
                  <span className="story-editor__info-label">Ngày tạo</span>
                  <span className="story-editor__info-value">{formattedCreatedDate}</span>
                </Box>
                <Box className="story-editor__info-item">
                  <span className="story-editor__info-label">Cập nhật cuối</span>
                  <span className="story-editor__info-value">{formattedUpdatedDate}</span>
                </Box>
                <Box className="story-editor__info-item">
                  <span className="story-editor__info-label">Số từ</span>
                  <span className="story-editor__info-value">{wordCount} từ</span>
                </Box>
                <Box className="story-editor__info-item">
                  <span className="story-editor__info-label">Số câu</span>
                  <span className="story-editor__info-value">{sentenceCount} câu</span>
                </Box>
                <Box className="story-editor__info-item">
                  <span className="story-editor__info-label">Thời gian đọc</span>
                  <span className="story-editor__info-value">~ {form.readingTimeMinutes} phút</span>
                </Box>
                <Box className="story-editor__info-item">
                  <span className="story-editor__info-label">Trạng thái audio</span>
                  <span className="story-editor__info-value">
                    <span
                      className={`story-editor__badge-audio ${
                        hasAudio ? "story-editor__badge-audio--yes" : "story-editor__badge-audio--no"
                      }`}
                    >
                      {hasAudio ? "Có audio" : "Chưa audio"}
                    </span>
                  </span>
                </Box>
                <Box className="story-editor__info-item">
                  <span className="story-editor__info-label">AI Generated</span>
                  <span className="story-editor__info-value">
                    {form.aiGenerated ? (
                      <span className="story-editor__badge-ai">GPT-4o</span>
                    ) : (
                      <span className="story-editor__badge-audio story-editor__badge-audio--no" style={{ background: "#f1f5f9", color: "#475569" }}>
                        Thủ công
                      </span>
                    )}
                  </span>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Right Column Form */}
          <Box className="story-editor__right">
            {/* Title */}
            <Box className="story-editor__field-group">
              <span className="story-editor__field-label">
                Tiêu đề <span className="story-editor__field-required">*</span>
              </span>
              <TextField
                size="small"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Nhập tiêu đề truyện..."
                fullWidth
                helperText={`${form.title.length}/150`}
                FormHelperTextProps={{ style: { textAlign: "right", marginRight: 0 } }}
              />
            </Box>

            {/* Level, Minutes, Status row */}
            <Box className="story-editor__row-3col">
              <Box className="story-editor__field-group">
                <span className="story-editor__field-label">
                  Level <span className="story-editor__field-required">*</span>
                </span>
                <TextField
                  select
                  size="small"
                  value={form.level}
                  onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
                  fullWidth
                >
                  {["A1", "A2", "B1", "B2", "C1", "C2"].map((lv) => (
                    <MenuItem key={lv} value={lv}>
                      {lv}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              <Box className="story-editor__field-group">
                <span className="story-editor__field-label">
                  Phút đọc <span className="story-editor__field-required">*</span>
                </span>
                <TextField
                  select
                  size="small"
                  value={form.readingTimeMinutes}
                  onChange={(e) => setForm((f) => ({ ...f, readingTimeMinutes: Number(e.target.value) || 5 }))}
                  fullWidth
                >
                  {[1, 2, 3, 5, 10, 15, 20].map((mins) => (
                    <MenuItem key={mins} value={mins}>
                      {mins} phút
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              <Box className="story-editor__field-group">
                <span className="story-editor__field-label">
                  Trạng thái <span className="story-editor__field-required">*</span>
                </span>
                <TextField
                  select
                  size="small"
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as StoryStatus }))}
                  fullWidth
                >
                  <MenuItem value="DRAFT">DRAFT</MenuItem>
                  <MenuItem value="PUBLISHED">PUBLISHED</MenuItem>
                  <MenuItem value="ARCHIVED">ARCHIVED</MenuItem>
                </TextField>
              </Box>
            </Box>

            {/* Story format + visual style */}
            <Box className="story-editor__row-2col">
              <Box className="story-editor__field-group">
                <span className="story-editor__field-label">Thể loại</span>
                <TextField
                  select
                  size="small"
                  value={form.storyFormat}
                  onChange={(e) => setForm((f) => ({ ...f, storyFormat: e.target.value as StoryFormat }))}
                  fullWidth
                >
                  {STORY_FORMAT_OPTIONS.map((o) => (
                    <MenuItem key={o.value} value={o.value}>
                      {o.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
              <Box className="story-editor__field-group">
                <span className="story-editor__field-label">Phong cách ảnh</span>
                <TextField
                  select
                  size="small"
                  value={form.visualStyle}
                  onChange={(e) => setForm((f) => ({ ...f, visualStyle: e.target.value as StoryVisualStyle }))}
                  fullWidth
                >
                  {STORY_VISUAL_STYLE_OPTIONS.map((o) => (
                    <MenuItem key={o.value} value={o.value}>
                      {o.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            </Box>

            {/* Vocab set */}
            <Box className="story-editor__field-group">
              <span className="story-editor__field-label">Bộ từ vựng</span>
              <TextField
                select
                size="small"
                value={form.vocabularySetId}
                onChange={(e) => setForm((f) => ({ ...f, vocabularySetId: e.target.value }))}
                fullWidth
              >
                <MenuItem value="">— Không gắn —</MenuItem>
                {vocabSets.map((set) => (
                  <MenuItem key={set.id} value={set.id}>
                    {set.status === "PUBLISHED" ? set.title : `${set.title} (${set.status})`}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            {/* Voice casting profiles */}
            <Box className="story-editor__field-group">
              <span className="story-editor__field-label">Voice casting profiles</span>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                Chọn giọng Edge TTS từ danh mục hệ thống (tts_voice_catalog).
              </Typography>
              <Box className="story-editor__row-3col" sx={{ mb: 1.5 }}>
                <TextField
                  select
                  size="small"
                  value={form.narratorVoiceId}
                  onChange={(e) => setForm((f) => ({ ...f, narratorVoiceId: e.target.value }))}
                  fullWidth
                  label="Narrator"
                >
                  <MenuItem value="">— Mặc định hệ thống —</MenuItem>
                  {edgeVoiceCatalog
                    .filter((v) => !v.profileKey || v.profileKey === "NARRATOR")
                    .map((v) => (
                      <MenuItem key={v.id} value={catalogOptionKey(v)}>
                        [{v.provider}] {v.displayName}
                      </MenuItem>
                    ))}
                </TextField>
                <TextField
                  select
                  size="small"
                  value={form.maleAdultVoiceId}
                  onChange={(e) => setForm((f) => ({ ...f, maleAdultVoiceId: e.target.value }))}
                  fullWidth
                  label="Nam"
                >
                  <MenuItem value="">— Mặc định hệ thống —</MenuItem>
                  {edgeVoiceCatalog
                    .filter((v) => !v.profileKey || v.profileKey === "MALE_ADULT")
                    .map((v) => (
                      <MenuItem key={v.id} value={catalogOptionKey(v)}>
                        [{v.provider}] {v.displayName}
                      </MenuItem>
                    ))}
                </TextField>
                <TextField
                  select
                  size="small"
                  value={form.femaleAdultVoiceId}
                  onChange={(e) => setForm((f) => ({ ...f, femaleAdultVoiceId: e.target.value }))}
                  fullWidth
                  label="Nữ"
                >
                  <MenuItem value="">— Mặc định hệ thống —</MenuItem>
                  {edgeVoiceCatalog
                    .filter((v) => !v.profileKey || v.profileKey === "FEMALE_ADULT")
                    .map((v) => (
                      <MenuItem key={v.id} value={catalogOptionKey(v)}>
                        [{v.provider}] {v.displayName}
                      </MenuItem>
                    ))}
                </TextField>
              </Box>
              <Box className="story-editor__row-3col">
                <TextField
                  select
                  size="small"
                  value={form.boyChildVoiceId}
                  onChange={(e) => setForm((f) => ({ ...f, boyChildVoiceId: e.target.value }))}
                  fullWidth
                  label="Bé trai"
                >
                  <MenuItem value="">— Mặc định hệ thống —</MenuItem>
                  {edgeVoiceCatalog
                    .filter((v) => !v.profileKey || v.profileKey === "BOY_CHILD")
                    .map((v) => (
                      <MenuItem key={v.id} value={catalogOptionKey(v)}>
                        [{v.provider}] {v.displayName}
                      </MenuItem>
                    ))}
                </TextField>
                <TextField
                  select
                  size="small"
                  value={form.girlChildVoiceId}
                  onChange={(e) => setForm((f) => ({ ...f, girlChildVoiceId: e.target.value }))}
                  fullWidth
                  label="Bé gái"
                >
                  <MenuItem value="">— Mặc định hệ thống —</MenuItem>
                  {edgeVoiceCatalog
                    .filter((v) => !v.profileKey || v.profileKey === "GIRL_CHILD")
                    .map((v) => (
                      <MenuItem key={v.id} value={catalogOptionKey(v)}>
                        [{v.provider}] {v.displayName}
                      </MenuItem>
                    ))}
                </TextField>
                <Box />
              </Box>
            </Box>

            {/* Content multiline text area */}
            <Box className="story-editor__field-group">
              <span className="story-editor__field-label">
                Nội dung (plain text) <span className="story-editor__field-required">*</span>
              </span>
              <Box className="story-editor__content-wrapper">
                <TextField
                  multiline
                  minRows={14}
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  placeholder="Nhập nội dung truyện tại đây..."
                  fullWidth
                />
                <span className="story-editor__content-wordcount">
                  {form.content ? form.content.trim().split(/\s+/).filter(Boolean).length : 0} từ
                </span>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Features & Resources Card */}
        <Box className="story-editor__features-card">
          <h4 className="story-editor__features-title">Tính năng & tài nguyên</h4>
          <Box className="story-editor__features-grid">
            {/* Box 1: Nghe audio */}
            <Box className="story-editor__feature-box">
              <Box className="story-editor__feature-info">
                <HeadphonesOutlinedIcon className="story-editor__feature-icon" />
                <Box className="story-editor__feature-texts">
                  <span className="story-editor__feature-name">Nghe audio</span>
                  <span className="story-editor__feature-sub">
                    {hasAudio ? "Đã tạo audio" : "Chưa tạo audio"}
                  </span>
                </Box>
              </Box>
              {editing ? (
                <Button
                  size="small"
                  variant="outlined"
                  className="story-editor__feature-action-btn"
                  startIcon={<HeadphonesOutlinedIcon />}
                  onClick={() => void handleListenAudio(editing)}
                >
                  Nghe thử
                </Button>
              ) : (
                <span style={{ fontSize: "0.8rem", color: "#94a3b8", fontWeight: 500 }}>Cần lưu trước</span>
              )}
            </Box>

            {/* Box 2: Sinh lại audio */}
            <Box className="story-editor__feature-box">
              <Box className="story-editor__feature-info">
                <GraphicEqIcon className="story-editor__feature-icon" />
                <Box className="story-editor__feature-texts">
                  <span className="story-editor__feature-name">
                    {hasAudio ? "Sinh lại audio" : "Sinh audio"}
                  </span>
                  <span className="story-editor__feature-sub">Edge TTS only</span>
                </Box>
              </Box>
              {editing ? (
                <Button
                  size="small"
                  variant="outlined"
                  className="story-editor__feature-action-btn"
                  startIcon={<GraphicEqIcon />}
                  disabled={audioGeneratingId === editing.id}
                  onClick={() => void handleGenerateAudio(editing)}
                >
                  {audioGeneratingId === editing.id
                    ? "Đang sinh..."
                    : hasAudio
                      ? "Sinh lại"
                      : "Sinh audio"}
                </Button>
              ) : (
                <span style={{ fontSize: "0.8rem", color: "#94a3b8", fontWeight: 500 }}>Cần lưu trước</span>
              )}
            </Box>

            {/* Box: Preview ảnh storybook */}
            <Box className="story-editor__feature-box">
              <Box className="story-editor__feature-info">
                <RemoveRedEyeOutlinedIcon className="story-editor__feature-icon" />
                <Box className="story-editor__feature-texts">
                  <span className="story-editor__feature-name">Xem & sửa ảnh scene</span>
                  <span className="story-editor__feature-sub">
                    {editing
                      ? illustrationStatusById[editing.id] ?? "Xem ảnh đã sinh, sinh lại từng scene"
                      : "Xem ảnh đã sinh, sinh lại từng scene"}
                  </span>
                </Box>
              </Box>
              {editing ? (
                <Button
                  size="small"
                  variant="outlined"
                  className="story-editor__feature-action-btn"
                  startIcon={<RemoveRedEyeOutlinedIcon />}
                  onClick={() => setIllustrationPreviewStory(editing)}
                >
                  Xem ảnh
                </Button>
              ) : (
                <span style={{ fontSize: "0.8rem", color: "#94a3b8", fontWeight: 500 }}>Cần lưu trước</span>
              )}
            </Box>

            {/* Box: Phân tích scenes + sinh ảnh (1 nút) */}
            <Box className="story-editor__feature-box">
              <Box className="story-editor__feature-info">
                <ImageOutlinedIcon className="story-editor__feature-icon" />
                <Box className="story-editor__feature-texts">
                  <span className="story-editor__feature-name">Sinh ảnh cả truyện</span>
                  <span className="story-editor__feature-sub">
                    {editing
                      ? illustrationStatusById[editing.id] ?? "AI chia scene rồi sinh toàn bộ ảnh"
                      : "Chia scenes rồi sinh toàn bộ ảnh"}
                  </span>
                </Box>
              </Box>
              {editing ? (
                <Button
                  size="small"
                  variant="contained"
                  color="primary"
                  className="story-editor__feature-action-btn"
                  startIcon={<ImageOutlinedIcon />}
                  disabled={illustrationBusyId === editing.id}
                  onClick={() => void handleGenerateStorybookImages(editing)}
                >
                  {illustrationBusyId === editing.id ? "Đang sinh..." : "Phân tích + sinh"}
                </Button>
              ) : (
                <span style={{ fontSize: "0.8rem", color: "#94a3b8", fontWeight: 500 }}>Cần lưu trước</span>
              )}
            </Box>

            {/* Box 3: Sinh bằng AI */}
            <Box className="story-editor__feature-box">
              <Box className="story-editor__feature-info">
                <AutoAwesomeOutlinedIcon className="story-editor__feature-icon" />
                <Box className="story-editor__feature-texts">
                  <span className="story-editor__feature-name">Sinh lại nội dung</span>
                  <span className="story-editor__feature-sub">AI viết lại truyện từ prompt</span>
                </Box>
              </Box>
              <Button
                size="small"
                variant="outlined"
                className="story-editor__feature-action-btn"
                startIcon={<AutoAwesomeOutlinedIcon />}
                onClick={() => setAiOpen(true)}
              >
                Sinh lại
              </Button>
            </Box>

            {/* Box: Dịch lại */}
            <Box className="story-editor__feature-box">
              <Box className="story-editor__feature-info">
                <TranslateIcon className="story-editor__feature-icon" />
                <Box className="story-editor__feature-texts">
                  <span className="story-editor__feature-name">Dịch lại tiếng Việt</span>
                  <span className="story-editor__feature-sub">Giữ nguyên EN, ảnh, audio — chỉ đổi bản dịch</span>
                </Box>
              </Box>
              {editing ? (
                <Button
                  size="small"
                  variant="outlined"
                  className="story-editor__feature-action-btn"
                  startIcon={<TranslateIcon />}
                  onClick={() => void handleRetranslate()}
                  disabled={retranslating}
                >
                  {retranslating ? "Đang dịch..." : "Dịch lại"}
                </Button>
              ) : (
                <span style={{ fontSize: "0.8rem", color: "#94a3b8", fontWeight: 500 }}>Cần lưu trước</span>
              )}
            </Box>

            {/* Box 4: Gợi ý minh họa */}
            <Box className="story-editor__feature-box">
              <Box className="story-editor__feature-info">
                <ImageOutlinedIcon className="story-editor__feature-icon" />
                <Box className="story-editor__feature-texts">
                  <span className="story-editor__feature-name">Ảnh bìa</span>
                  <span className="story-editor__feature-sub">AI tạo 1 ảnh cover cho card story</span>
                </Box>
              </Box>
              <Button
                size="small"
                variant="outlined"
                className="story-editor__feature-action-btn"
                startIcon={<ImageOutlinedIcon />}
                onClick={() => void handleGenerateCover()}
                disabled={coverGenerating || !form.title.trim() || !form.content.trim()}
              >
                {coverGenerating ? "Đang tạo..." : "Tạo ảnh"}
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Delete Card */}
        {editing ? (
          <Box className="story-editor__delete-card">
            <Box className="story-editor__delete-texts">
              <h4 className="story-editor__delete-title">Xóa story</h4>
              <p className="story-editor__delete-sub">Hành động này không thể hoàn tác.</p>
            </Box>
            <Button
              variant="outlined"
              color="error"
              className="story-editor__delete-btn"
              startIcon={<DeleteOutlineIcon />}
              onClick={() => setDeleteTarget(editing)}
            >
              Xóa story
            </Button>
          </Box>
        ) : null}

        {/* Support AI dialog */}
        <StoryAiGenDialog open={aiOpen} onClose={() => setAiOpen(false)} onApply={handleAiApply} />
      <StoryMonologueGenDialog
        open={monologueOpen}
        onClose={() => setMonologueOpen(false)}
        onApply={handleMonologueApply}
      />

        <StoryIllustrationPreviewDialog
          open={Boolean(illustrationPreviewStory)}
          story={illustrationPreviewStory}
          onClose={() => setIllustrationPreviewStory(null)}
        />

        {/* Listen dialog */}
        <Dialog open={listenOpen} onClose={() => setListenOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Nghe audio: {listenTitle || "Story"}</DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            {listenLoading ? <Typography>Đang tải audio...</Typography> : null}
            {!listenLoading && listenError ? <Alert severity="warning">{listenError}</Alert> : null}
            {!listenLoading && !listenError && listenAudioUrl ? (
              <StoryAudioPlayer audioUrl={listenAudioUrl} duration={listenDuration} onTimeUpdate={() => {}} />
            ) : null}
            {!listenLoading && listenContent ? (
              <Box sx={{ mt: 2 }}>
                <Button
                  size="small"
                  variant="text"
                  onClick={() => setListenContentOpen((v) => !v)}
                  sx={{ mb: 1 }}
                >
                  {listenContentOpen ? "Ẩn nội dung truyện" : "Đọc truyện"}
                </Button>
                {listenContentOpen ? (
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      border: "1px solid #e2e8f0",
                      bgcolor: "#f8fafc",
                      maxHeight: 260,
                      overflowY: "auto",
                      whiteSpace: "pre-wrap",
                      lineHeight: 1.7,
                      fontSize: "0.95rem",
                    }}
                  >
                    {listenContent}
                  </Box>
                ) : null}
              </Box>
            ) : null}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setListenOpen(false)}>Đóng</Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirm */}
        <ConfirmDialog
          open={Boolean(deleteTarget)}
          title="Xóa story?"
          content={`Xóa "${deleteTarget?.title}"?`}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      </Box>
    );
  }

  return (
    <Box className="admin-catalog-page admin-catalog-page--stories">
      <AdminCatalogPageHeader
        title="AI Reading Studio"
        subtitle="Quản lý story — plain text, BE tokenize JSON cho reader."
        icon={<AutoStoriesOutlinedIcon />}
        action={
          <Box className="admin-catalog-page__header-actions">
            <Button
              size="small"
              className="header-action-btn header-action-btn--ai"
              startIcon={<AutoAwesomeOutlinedIcon />}
              onClick={() => setAiOpen(true)}
            >
              Sinh bằng AI
            </Button>
            <Button
              size="small"
              className="header-action-btn header-action-btn--ai"
              startIcon={<WbSunnyOutlinedIcon />}
              onClick={() => setMonologueOpen(true)}
            >
              Truyện truyền cảm hứng
            </Button>
            <Button
              variant="contained"
              size="small"
              className="header-action-btn header-action-btn--add"
              startIcon={<AddIcon />}
              onClick={openCreate}
            >
              Story mới
            </Button>
          </Box>
        }
      />

      <Box className="story-search-row">
        <TextField
          size="small"
          className="story-search-field"
          placeholder="Tìm story..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch();
          }}
        />
        <Button className="story-search-btn" onClick={handleSearch}>
          TÌM
        </Button>
      </Box>

      <Box className="story-filter-bar">
        <Box className="story-filter-tabs">
          {[
            { id: "ALL", label: "Tất cả" },
            { id: "PUBLISHED", label: "Published" },
            { id: "DRAFT", label: "Draft" },
            { id: "HAS_AUDIO", label: "Đã có audio" },
            { id: "NO_AUDIO", label: "Chưa có audio" },
          ].map((tab) => (
            <Button
              key={tab.id}
              className={`story-filter-tab ${activeTab === tab.id ? "story-filter-tab--active" : ""}`}
              onClick={() => {
                setActiveTab(tab.id as any);
                setPage(0);
              }}
            >
              {tab.label}
            </Button>
          ))}
        </Box>

        <Box className="story-filter-dropdowns">
          <Box className="story-filter-select-wrap">
            <TextField
              select
              size="small"
              value={levelFilter}
              onChange={(e) => {
                setLevelFilter(e.target.value);
                setPage(0);
              }}
              fullWidth
            >
              <MenuItem value="ALL">Cấp độ</MenuItem>
              {["A1", "A2", "B1", "B2", "C1", "C2"].map((lv) => (
                <MenuItem key={lv} value={lv}>
                  Cấp độ: {lv}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <Box className="story-filter-select-wrap">
            <TextField
              select
              size="small"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
              fullWidth
            >
              <MenuItem value="ALL">Trạng thái</MenuItem>
              <MenuItem value="DRAFT">DRAFT</MenuItem>
              <MenuItem value="PUBLISHED">PUBLISHED</MenuItem>
              <MenuItem value="ARCHIVED">ARCHIVED</MenuItem>
            </TextField>
          </Box>

          <Box className="story-filter-select-wrap">
            <TextField
              select
              size="small"
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(0);
              }}
              fullWidth
            >
              <MenuItem value="newest">Mới nhất</MenuItem>
              <MenuItem value="oldest">Cũ nhất</MenuItem>
              <MenuItem value="title">Tiêu đề A-Z</MenuItem>
            </TextField>
          </Box>
        </Box>
      </Box>

      {audioMessage ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          {audioMessage}
        </Alert>
      ) : null}

      {illustrationMessage ? (
        <Alert severity="info" sx={{ mb: 2 }} onClose={() => setIllustrationMessage("")}>
          {illustrationMessage}
        </Alert>
      ) : null}

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      {loading ? (
        <Typography>Đang tải...</Typography>
      ) : sortedRows.length === 0 ? (
        <Box
          sx={{
            py: 6,
            px: 2,
            textAlign: "center",
            borderRadius: 4,
            border: "1px dashed #cbd5e1",
            bgcolor: "#f8fafc",
          }}
        >
          <AutoStoriesOutlinedIcon sx={{ fontSize: 48, color: "#94a3b8", mb: 1 }} />
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Chưa có story phù hợp với điều kiện lọc.
          </Typography>
          <Box sx={{ display: "flex", gap: 1, justifyContent: "center", flexWrap: "wrap" }}>
            <Button
              variant="outlined"
              startIcon={<AutoAwesomeOutlinedIcon />}
              onClick={() => setAiOpen(true)}
            >
              Sinh bằng AI
            </Button>
            <Button variant="outlined" startIcon={<WbSunnyOutlinedIcon />} onClick={() => setMonologueOpen(true)}>
              Truyện truyền cảm hứng
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
              Story mới
            </Button>
          </Box>
        </Box>
      ) : (
        <>
          <Box className="stories-grid">
            {paginatedRows.map((row) => {
              const coverUrl = row.coverImageUrl ? resolveStorageAssetUrl(row.coverImageUrl) : "";
              const hasAudio = row.processingStatus === "AUDIO_READY";
              const formattedDate = row.createdAt
                ? new Date(row.createdAt).toLocaleDateString("vi-VN")
                : "16/05/2025";

              return (
                <Box key={row.id} className="story-card">
                  <Box className="story-card__cover-wrap">
                    {coverUrl ? (
                      <img
                        src={coverUrl}
                        alt={row.title}
                        className="story-card__cover"
                      />
                    ) : (
                      <Box
                        sx={{
                          width: "100%",
                          height: "100%",
                          background: "linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)",
                          display: "grid",
                          placeItems: "center",
                        }}
                      >
                        <AutoStoriesOutlinedIcon sx={{ fontSize: 48, color: "#94a3b8" }} />
                      </Box>
                    )}

                    <Button className="story-card__star-btn">
                      <StarBorderOutlinedIcon sx={{ fontSize: 18 }} />
                    </Button>

                    <Box
                      className={`story-card__audio-badge ${
                        hasAudio ? "story-card__audio-badge--has" : "story-card__audio-badge--no"
                      }`}
                    >
                      <HeadphonesOutlinedIcon sx={{ fontSize: "14px !important" }} />
                      <span>{hasAudio ? "Có audio" : "Chưa audio"}</span>
                    </Box>

                    <Box className="story-card__duration">{getDisplayDuration(row)}</Box>
                  </Box>

                  <Box className="story-card__body">
                    <Box className="story-card__title-row">
                      <h3 className="story-card__title" onClick={() => openEdit(row)}>
                        {row.title}
                      </h3>
                    </Box>

                    <Box className="story-card__tags">
                      {row.status === "PUBLISHED" ? (
                        <span className="story-card__tag story-card__tag--published">PUBLISHED</span>
                      ) : (
                        <span className="story-card__tag story-card__tag--draft">DRAFT</span>
                      )}
                      {row.level && (
                        <span className="story-card__tag story-card__tag--level">{row.level}</span>
                      )}
                      {row.vocabularySetTitle && (
                        <span className="story-card__tag story-card__tag--vocab">
                          {row.vocabularySetTitle}
                        </span>
                      )}
                    </Box>

                    <p className="story-card__desc">
                      {row.content
                        ? row.content.length > 120
                          ? row.content.slice(0, 120) + "..."
                          : row.content
                        : "Chưa có nội dung truyện."}
                    </p>

                    <Box className="story-card__footer">
                      <Box className="story-card__meta">
                        <Box className="story-card__meta-item">
                          <CalendarTodayOutlinedIcon className="story-card__meta-icon" />
                          <span>{formattedDate}</span>
                        </Box>
                        <Box className="story-card__meta-item">
                          <RemoveRedEyeOutlinedIcon className="story-card__meta-icon" />
                          <span>{getDisplayViews(row)}</span>
                        </Box>
                      </Box>

                      <Box className="story-card__actions">
                        <Button
                          className="story-card__action-btn"
                          onClick={() => void handleListenAudio(row)}
                          title="Nghe audio"
                        >
                          <HeadphonesOutlinedIcon />
                        </Button>
                        <Button
                          className="story-card__action-btn"
                          disabled={audioGeneratingId === row.id}
                          onClick={() => void handleGenerateAudio(row)}
                          title={
                            audioGeneratingId === row.id
                              ? "Đang sinh..."
                              : row.processingStatus === "AUDIO_READY"
                                ? "Sinh lại audio"
                                : "Sinh audio"
                          }
                        >
                          <GraphicEqIcon />
                        </Button>
                        <Button
                          className="story-card__action-btn"
                          disabled={illustrationBusyId === row.id}
                          onClick={() => void handleGenerateStorybookImages(row)}
                          title={
                            illustrationBusyId === row.id
                              ? "Đang phân tích + sinh ảnh..."
                              : "Phân tích scenes + sinh ảnh storybook"
                          }
                        >
                          <ImageOutlinedIcon />
                        </Button>
                        <Button
                          className="story-card__action-btn"
                          onClick={() => setIllustrationPreviewStory(row)}
                          title="Preview ảnh storybook"
                        >
                          <RemoveRedEyeOutlinedIcon />
                        </Button>
                        <Button
                          className="story-card__action-btn"
                          onClick={() => openEdit(row)}
                          title="Sửa"
                        >
                          <EditOutlinedIcon />
                        </Button>
                        <Button
                          className="story-card__action-btn story-card__action-btn--delete"
                          onClick={() => setDeleteTarget(row)}
                          title="Xóa"
                        >
                          <DeleteOutlineIcon />
                        </Button>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>

          {totalPages > 1 && (
            <Box className="story-pagination">
              <Box className="story-pagination__pages">
                <button
                  className={`story-pagination__btn ${
                    currentPage === 0 ? "story-pagination__btn--disabled" : ""
                  }`}
                  disabled={currentPage === 0}
                  onClick={() => setPage(currentPage - 1)}
                >
                  &lt;
                </button>
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const isAct = idx === currentPage;
                  return (
                    <button
                      key={`page-${idx}`}
                      className={`story-pagination__btn ${
                        isAct ? "story-pagination__btn--active" : ""
                      }`}
                      onClick={() => setPage(idx)}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
                <button
                  className={`story-pagination__btn ${
                    currentPage >= totalPages - 1 ? "story-pagination__btn--disabled" : ""
                  }`}
                  disabled={currentPage >= totalPages - 1}
                  onClick={() => setPage(currentPage + 1)}
                >
                  &gt;
                </button>
              </Box>

              <Box className="story-pagination__right">
                <Box className="story-pagination__size">
                  <span>Hiển thị</span>
                  <select
                    className="story-pagination__select"
                    value={pageSize}
                    onChange={(e) => {
                      setPage(0);
                      setPageSize(Number(e.target.value));
                    }}
                  >
                    {[12, 24, 36, 48].map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                  <span>/ trang</span>
                </Box>
              </Box>
            </Box>
          )}
        </>
      )}

{/* Full-page editor is used instead of dialog */}

      <StoryAiGenDialog open={aiOpen} onClose={() => setAiOpen(false)} onApply={handleAiApply} />
      <StoryMonologueGenDialog
        open={monologueOpen}
        onClose={() => setMonologueOpen(false)}
        onApply={handleMonologueApply}
      />

      <StoryIllustrationPreviewDialog
        open={Boolean(illustrationPreviewStory)}
        story={illustrationPreviewStory}
        onClose={() => setIllustrationPreviewStory(null)}
      />

      <Dialog open={listenOpen} onClose={() => setListenOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nghe audio: {listenTitle || "Story"}</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          {listenLoading ? <Typography>Đang tải audio...</Typography> : null}
          {!listenLoading && listenError ? <Alert severity="warning">{listenError}</Alert> : null}
          {!listenLoading && !listenError && listenAudioUrl ? (
            <StoryAudioPlayer audioUrl={listenAudioUrl} duration={listenDuration} onTimeUpdate={() => {}} />
          ) : null}
          {!listenLoading && listenContent ? (
            <Box sx={{ mt: 2 }}>
              <Button
                size="small"
                variant="text"
                onClick={() => setListenContentOpen((v) => !v)}
                sx={{ mb: 1 }}
              >
                {listenContentOpen ? "Ẩn nội dung truyện" : "Đọc truyện"}
              </Button>
              {listenContentOpen ? (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: "1px solid #e2e8f0",
                    bgcolor: "#f8fafc",
                    maxHeight: 260,
                    overflowY: "auto",
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.7,
                    fontSize: "0.95rem",
                  }}
                >
                  {listenContent}
                </Box>
              ) : null}
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setListenOpen(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xóa story?"
        content={`Xóa "${deleteTarget?.title}"?`}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </Box>
  );
}

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Skeleton,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ConfirmDialog,
  LessonBlockEditorPanel,
  LessonBlockPreview,
  LessonSlideZipImportDialog,
} from "../../admin/components";
import { VocabAttachToLessonWizard } from "../../admin/components/vocabulary/VocabAttachToLessonWizard";
import { VocabularySetPickerDialog } from "../../admin/components/vocabulary/VocabularySetPickerDialog";
import {
  buildExerciseSetPayloadJson,
  createDefaultExerciseSetPayload,
} from "../../shared/lesson/exercisePayload";
import {
  buildQuestionRefPayloadJson,
  createDefaultQuestionRefPayload,
} from "../../shared/lesson/questionRefPayload";
import {
  buildCalloutPayloadJson,
  createDefaultCalloutPayload,
} from "../../shared/lesson/calloutPayload";
import {
  buildSummaryPayloadJson,
  createDefaultSummaryPayload,
} from "../../shared/lesson/summaryPayload";
import { buildVocabularyPayloadJson } from "../../shared/lesson/vocabularyPayload";
import {
  apiCreateLessonBlock,
  apiDeleteLessonBlock,
  apiGetLessonDetail,
  apiPublishLesson,
  apiReorderLessonBlocks,
  apiUnpublishLesson,
  stringifyBlockPayload,
  type LessonBlockRecord,
  type LessonBlockType,
  type LessonDetailRecord,
} from "../../shared/api/lesson";
import type { ApiResponse } from "../../shared/api/types";
import { paths } from "../../shared/constants/paths";
import { apiGetVocabularySetById, type VocabularyItemRecord, type VocabularySetRecord } from "../../shared/api/vocabularySet";
import {
  muBtnSmOutlined,
  muBtnSmPrimary,
  muDialogFooter,
  muDialogPaper,
  muFieldLabel,
  muFooterBtnOutlined,
  muFooterBtnPrimary,
  muPageShell,
  muPanelSx,
  muTextFieldSx,
} from "./manageUserUiStyles";

const BLOCK_TYPE_OPTIONS: { value: LessonBlockType; label: string }[] = [
  { value: "TEXT", label: "Đoạn văn" },
  { value: "IMAGE", label: "Ảnh minh họa" },
  { value: "CALLOUT", label: "Ghi chú (mẹo / cảnh báo)" },
  { value: "SUMMARY", label: "Tóm tắt cuối bài" },
  { value: "VOCABULARY", label: "Từ vựng (cần chọn bộ từ sau)" },
  { value: "EXERCISE_SET", label: "Bài tập (soạn / import)" },
  { value: "QUESTION_REF", label: "Bài tập (ngân hàng câu)" },
];

function blockTypeLabel(type: LessonBlockType) {
  if (type === "SLIDE_DECK") return "Slide deck (PDF)";
  return BLOCK_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

export function LessonEditorPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<LessonDetailRecord | null>(null);
  const [blocks, setBlocks] = useState<LessonBlockRecord[]>([]);
  const [assets, setAssets] = useState<LessonDetailRecord["assets"]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [openAddBlock, setOpenAddBlock] = useState(false);
  const [newBlockType, setNewBlockType] = useState<LessonBlockType>("TEXT");
  const [expandedBlockId, setExpandedBlockId] = useState<string | null>(null);
  const [openDeleteBlock, setOpenDeleteBlock] = useState<LessonBlockRecord | null>(null);
  const [openVocabPicker, setOpenVocabPicker] = useState(false);
  const [vocabAttachDraft, setVocabAttachDraft] = useState<{
    setId: string;
    setTitle: string;
    items: VocabularyItemRecord[];
  } | null>(null);
  const [openSlideZipImport, setOpenSlideZipImport] = useState(false);

  const loadDetail = useCallback(async () => {
    if (!lessonId) return;
    setLoading(true);
    setError("");
    try {
      const response = (await apiGetLessonDetail(lessonId)) as ApiResponse<LessonDetailRecord>;
      const detail = response?.result ?? response?.data ?? null;
      setLesson(detail);
      setBlocks(detail?.blocks ?? []);
      setAssets(detail?.assets ?? []);
    } catch (err) {
      setError((err as { message?: string })?.message || "Không thể tải bài học.");
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  const moveBlock = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    const tmp = next[index];
    next[index] = next[target];
    next[target] = tmp;
    setSubmitting(true);
    try {
      await apiReorderLessonBlocks(
        lessonId!,
        next.map((b) => b.id),
      );
      setBlocks(next);
    } catch (err) {
      setError((err as { message?: string })?.message || "Không thể đổi thứ tự block.");
    } finally {
      setSubmitting(false);
    }
  };

  const defaultPayloadForType = (type: LessonBlockType): string => {
    switch (type) {
      case "TEXT":
        return stringifyBlockPayload({ html: "<p>Nhập nội dung bài học tại đây...</p>" });
      case "IMAGE":
        return stringifyBlockPayload({ assetId: "", caption: "" });
      case "EXERCISE_SET":
        return buildExerciseSetPayloadJson(createDefaultExerciseSetPayload());
      case "QUESTION_REF":
        return buildQuestionRefPayloadJson(createDefaultQuestionRefPayload());
      case "VOCABULARY":
        return buildVocabularyPayloadJson({
          vocabularySetId: "",
          title: "Từ vựng mới",
          instruction: "Đọc và ghi nhớ từng từ",
          presentation: "list",
          showPhonetic: true,
        });
      case "SUMMARY":
        return buildSummaryPayloadJson(createDefaultSummaryPayload());
      case "CALLOUT":
        return buildCalloutPayloadJson(createDefaultCalloutPayload());
      default:
        return "{}";
    }
  };

  const handleVocabSetPicked = async (set: VocabularySetRecord) => {
    setOpenVocabPicker(false);
    setError("");
    try {
      const response = (await apiGetVocabularySetById(set.id)) as ApiResponse<VocabularySetRecord>;
      const detail = response?.result ?? response?.data ?? set;
      if (!detail.items?.length) {
        setError("Bộ từ không có mục nào.");
        return;
      }
      setVocabAttachDraft({
        setId: detail.id,
        setTitle: detail.title,
        items: detail.items,
      });
    } catch (err) {
      setError((err as { message?: string })?.message || "Không thể tải bộ từ.");
    }
  };

  const addBlock = async () => {
    if (!lessonId) return;
    setSubmitting(true);
    try {
      const res = await apiCreateLessonBlock(lessonId, {
        blockType: newBlockType,
        payloadJson: defaultPayloadForType(newBlockType),
      });
      const created =
        (res as { result?: LessonBlockRecord }).result ?? (res as { data?: LessonBlockRecord }).data;
      setOpenAddBlock(false);
      await loadDetail();
      if (created?.id) {
        setExpandedBlockId(created.id);
      }
      setMessage("Đã thêm khối — hãy soạn nội dung bên dưới.");
    } catch (err) {
      setError((err as { message?: string })?.message || "Không thể thêm block.");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteBlock = async () => {
    if (!openDeleteBlock?.id) return;
    setSubmitting(true);
    try {
      await apiDeleteLessonBlock(openDeleteBlock.id);
      if (expandedBlockId === openDeleteBlock.id) setExpandedBlockId(null);
      setOpenDeleteBlock(null);
      await loadDetail();
    } catch (err) {
      setError((err as { message?: string })?.message || "Không thể xóa block.");
    } finally {
      setSubmitting(false);
    }
  };

  const publish = async () => {
    if (!lessonId) return;
    setSubmitting(true);
    setError("");
    try {
      await apiPublishLesson(lessonId);
      await loadDetail();
      setMessage("Đã publish bài học.");
    } catch (err) {
      setError((err as { message?: string })?.message || "Không thể publish.");
    } finally {
      setSubmitting(false);
    }
  };

  const unpublish = async () => {
    if (!lessonId) return;
    setSubmitting(true);
    try {
      await apiUnpublishLesson(lessonId);
      await loadDetail();
      setMessage("Đã chuyển về nháp.");
    } catch (err) {
      setError((err as { message?: string })?.message || "Không thể unpublish.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!lessonId) {
    return (
      <Box sx={muPageShell}>
        <Alert severity="error">Thiếu lesson id.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={muPageShell} className="admin-dashboard-wrap">
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5, flexWrap: "wrap" }}>
        <IconButton size="small" onClick={() => navigate(`/${paths.ADMIN}/${paths.MANAGE_LESSON}`)}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 600, color: "#0C447C", flex: 1, fontSize: 18 }}>
          Soạn bài học
        </Typography>
        {lesson?.status === "PUBLISHED" ? (
          <Chip size="small" color="success" label="Published" />
        ) : (
          <Chip size="small" label="Draft" />
        )}
      </Box>

      {loading ? (
        <Skeleton height={120} sx={{ borderRadius: "8px" }} />
      ) : lesson ? (
        <Box sx={muPanelSx}>
          <Typography sx={{ fontWeight: 600, color: "#0C447C", fontSize: 15 }}>{lesson.title}</Typography>
          <Typography sx={{ fontSize: 12, color: "#5F5E5A", mt: 0.5 }}>
            Môn: {lesson.subjectName || "—"} · {blocks.length} khối nội dung
          </Typography>
          {lesson.summary ? (
            <Typography sx={{ fontSize: 13, mt: 1, color: "#333" }}>{lesson.summary}</Typography>
          ) : null}
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1.5 }}>
            <Button size="small" variant="contained" sx={muBtnSmPrimary} onClick={() => setOpenAddBlock(true)}>
              + Thêm khối
            </Button>
            <Button
              size="small"
              variant="outlined"
              sx={muBtnSmOutlined}
              onClick={() => setOpenVocabPicker(true)}
            >
              + Bộ từ vào bài
            </Button>
            <Button
              size="small"
              variant="outlined"
              sx={muBtnSmOutlined}
              onClick={() => setOpenSlideZipImport(true)}
            >
              Import slide ZIP
            </Button>
            {lesson.status === "PUBLISHED" ? (
              <Button
                size="small"
                variant="outlined"
                sx={muBtnSmOutlined}
                disabled={submitting}
                onClick={() => void unpublish()}
              >
                Unpublish
              </Button>
            ) : (
              <Button
                size="small"
                variant="contained"
                sx={muBtnSmPrimary}
                disabled={submitting}
                onClick={() => void publish()}
              >
                Publish
              </Button>
            )}
          </Box>
        </Box>
      ) : null}

      {error ? (
        <Alert severity="error" sx={{ mb: 1 }} onClose={() => setError("")}>
          {error}
        </Alert>
      ) : null}
      {message ? (
        <Alert severity="success" sx={{ mb: 1 }} onClose={() => setMessage("")}>
          {message}
        </Alert>
      ) : null}

      <Box sx={{ display: "grid", gap: 1, width: "100%" }}>
        {blocks.length === 0 && !loading ? (
          <Alert severity="info">
            Chưa có khối nội dung. Bấm <strong>+ Thêm khối</strong> hoặc{" "}
            <strong>+ Bộ từ vào bài</strong> để thêm từ vựng và bài tập MCQ.
          </Alert>
        ) : null}
        {blocks.map((block, index) => {
          const isExpanded = expandedBlockId === block.id;
          return (
            <Box
              key={block.id}
              sx={{
                border: "1px solid",
                borderColor: isExpanded ? "#85B7EB" : "#D3D1C7",
                borderRadius: "8px",
                bgcolor: "#fff",
                width: "100%",
                boxSizing: "border-box",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                  px: 1.25,
                  py: 0.75,
                  bgcolor: isExpanded ? "#E6F1FB" : "#F9F8F5",
                  borderBottom: isExpanded ? "1px solid #85B7EB" : "none",
                }}
              >
                <Chip size="small" label={`#${block.displayOrder}`} sx={{ height: 22 }} />
                <Typography sx={{ fontWeight: 600, fontSize: 13, flex: 1 }}>
                  {blockTypeLabel(block.blockType)}
                </Typography>
                <Tooltip title="Lên">
                  <span>
                    <IconButton
                      size="small"
                      disabled={index === 0 || submitting}
                      onClick={() => void moveBlock(index, -1)}
                    >
                      <ArrowUpwardIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Xuống">
                  <span>
                    <IconButton
                      size="small"
                      disabled={index === blocks.length - 1 || submitting}
                      onClick={() => void moveBlock(index, 1)}
                    >
                      <ArrowDownwardIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title={isExpanded ? "Đóng soạn" : "Soạn nội dung"}>
                  <IconButton
                    size="small"
                    color={isExpanded ? "primary" : "default"}
                    onClick={() => setExpandedBlockId(isExpanded ? null : block.id)}
                  >
                    {isExpanded ? <CloseIcon fontSize="small" /> : <EditOutlinedIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>
                <IconButton size="small" color="error" onClick={() => setOpenDeleteBlock(block)}>
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Box>

              {!isExpanded ? (
                <Box sx={{ px: 1.25, py: 1 }}>
                  <LessonBlockPreview block={block} assets={assets ?? []} />
                </Box>
              ) : (
                <Box
                  sx={{
                    px: block.blockType === "EXERCISE_SET" || block.blockType === "QUESTION_REF" ? 0 : 1.25,
                    pb: block.blockType === "EXERCISE_SET" || block.blockType === "QUESTION_REF" ? 0 : 1.25,
                  }}
                >
                  <LessonBlockEditorPanel
                    block={block}
                    lessonId={lessonId}
                    assets={assets ?? []}
                    onSaved={() => {
                      setExpandedBlockId(null);
                      void loadDetail();
                      setMessage("Đã lưu khối nội dung.");
                    }}
                    onCancel={() => setExpandedBlockId(null)}
                  />
                </Box>
              )}
            </Box>
          );
        })}
      </Box>

      <Dialog
        open={openAddBlock}
        onClose={() => !submitting && setOpenAddBlock(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: muDialogPaper }}
      >
        <DialogTitle>Thêm khối nội dung</DialogTitle>
        <DialogContent>
          <Typography sx={muFieldLabel}>Loại khối</Typography>
          <TextField
            select
            fullWidth
            size="small"
            sx={muTextFieldSx}
            value={newBlockType}
            onChange={(e) => setNewBlockType(e.target.value as LessonBlockType)}
          >
            {BLOCK_TYPE_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions sx={muDialogFooter}>
          <Button sx={muFooterBtnOutlined} onClick={() => setOpenAddBlock(false)}>
            Hủy
          </Button>
          <Button variant="contained" sx={muFooterBtnPrimary} disabled={submitting} onClick={() => void addBlock()}>
            Thêm & soạn
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(openDeleteBlock)}
        title="Xóa block"
        content="Bạn có chắc muốn xóa khối nội dung này?"
        cancelText="Hủy"
        confirmText="Xóa"
        onClose={() => {
          if (!submitting) setOpenDeleteBlock(null);
        }}
        onConfirm={() => void deleteBlock()}
        loading={submitting}
      />

      <VocabularySetPickerDialog
        open={openVocabPicker}
        onClose={() => setOpenVocabPicker(false)}
        onSelect={(set) => void handleVocabSetPicked(set)}
      />

      {vocabAttachDraft && lessonId ? (
        <VocabAttachToLessonWizard
          open
          lessonId={lessonId}
          lessonTitle={lesson?.title}
          setId={vocabAttachDraft.setId}
          setTitle={vocabAttachDraft.setTitle}
          items={vocabAttachDraft.items}
          onClose={() => setVocabAttachDraft(null)}
          onAttached={() => {
            setVocabAttachDraft(null);
            void loadDetail();
            setMessage("Đã thêm khối từ bộ từ — kiểm tra tab Bài học / Bài tập bên dưới.");
          }}
        />
      ) : null}

      <LessonSlideZipImportDialog
        open={openSlideZipImport}
        lessonId={lessonId}
        onClose={() => setOpenSlideZipImport(false)}
        onImported={() => {
          void loadDetail();
          setMessage("Đã import slide từ ZIP — xem khối Slide deck trong danh sách block.");
        }}
      />
    </Box>
  );
}

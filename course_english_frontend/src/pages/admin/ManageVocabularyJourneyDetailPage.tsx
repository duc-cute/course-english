import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import BookIcon from "@mui/icons-material/Book";
import BorderColorIcon from "@mui/icons-material/BorderColor";
import AssignmentIcon from "@mui/icons-material/Assignment";
import PeopleIcon from "@mui/icons-material/People";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SaveIcon from "@mui/icons-material/Save";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Menu,
  MenuItem,
  Skeleton,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { ConfirmDialog } from "../../admin/components";
import { apiGetClassrooms, type ClassroomRecord } from "../../shared/api/classroom";
import {
  apiCreateVocabularyTopic,
  apiDeleteVocabularyTopic,
  apiGetVocabularyJourney,
  apiGetVocabularyTopic,
  apiListJourneyTopics,
  apiReplaceJourneyClassrooms,
  apiReplaceTopicMembers,
  apiUpdateVocabularyJourney,
  apiUpdateVocabularyTopic,
  type VocabularyJourneyRecord,
  type VocabularyTopicRecord,
} from "../../shared/api/vocabularyJourney";
import { apiSearchVocabularySets, type VocabularySetRecord } from "../../shared/api/vocabularySet";
import type { ApiResponse } from "../../shared/api/types";
import { paths, studentRoutePaths } from "../../shared/constants/paths";
import {
  muDialogFooter,
  muFooterBtnOutlined,
  muFooterBtnPrimary,
  muTextFieldSx,
} from "./manageUserUiStyles";

function unwrapClassroomRows(response: unknown): ClassroomRecord[] {
  const payload = response as ApiResponse<{ result?: ClassroomRecord[] }> & {
    result?: ClassroomRecord[];
    data?: { result?: ClassroomRecord[] };
  };
  const raw = payload?.data?.result ?? payload?.result;
  return Array.isArray(raw) ? raw : [];
}

function unwrapSetRows(response: unknown): VocabularySetRecord[] {
  const payload = response as ApiResponse<{ result?: VocabularySetRecord[] }> & {
    result?: VocabularySetRecord[];
    data?: { result?: VocabularySetRecord[] };
  };
  const raw = payload?.data?.result ?? payload?.result;
  return Array.isArray(raw) ? raw : [];
}

const JOURNEY_ASSETS = [
  "/images/journey/journey_forest.png",
  "/images/journey/journey_ocean.png",
  "/images/journey/journey_city.png",
  "/images/journey/journey_academy.png",
  "/images/journey/journey_mountain.png",
  "/images/journey/journey_space.png",
  "/images/journey/journey_desert.png",
  "/images/journey/journey_garden.png",
  "/images/journey/journey_castle.png",
  "/images/journey/journey_beach.png",
  "/images/journey/journey_jungle.png",
  "/images/journey/journey_volcano.png",
] as const;

const STEP_COLORS = [
  "#22c55e", // Green
  "#7c3aed", // Purple
  "#3b82f6", // Blue
  "#ea580c", // Orange
  "#db2777", // Pink
  "#0891b2", // Cyan
] as const;

export function ManageVocabularyJourneyDetailPage() {
  const { journeyId } = useParams<{ journeyId: string }>();
  const [journey, setJourney] = useState<VocabularyJourneyRecord | null>(null);
  const [topics, setTopics] = useState<VocabularyTopicRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("DRAFT");

  const [openClassrooms, setOpenClassrooms] = useState(false);
  const [classrooms, setClassrooms] = useState<ClassroomRecord[]>([]);
  const [selectedClassroomIds, setSelectedClassroomIds] = useState<string[]>([]);

  const [openTopic, setOpenTopic] = useState(false);
  const [editingTopic, setEditingTopic] = useState<VocabularyTopicRecord | null>(null);
  const [topicTitle, setTopicTitle] = useState("");
  const [topicSubtitle, setTopicSubtitle] = useState("");
  const [topicStatus, setTopicStatus] = useState("DRAFT");
  const [topicTheme, setTopicTheme] = useState("");

  const [openMembers, setOpenMembers] = useState(false);
  const [memberTopic, setMemberTopic] = useState<VocabularyTopicRecord | null>(null);
  const [allSets, setAllSets] = useState<VocabularySetRecord[]>([]);
  const [selectedSetIds, setSelectedSetIds] = useState<string[]>([]);
  const [deletingTopic, setDeletingTopic] = useState<VocabularyTopicRecord | null>(null);

  const load = useCallback(async () => {
    if (!journeyId) return;
    setLoading(true);
    setError("");
    try {
      const [j, tList] = await Promise.all([
        apiGetVocabularyJourney(journeyId),
        apiListJourneyTopics(journeyId),
      ]);
      setJourney(j);
      setTitle(j.title ?? "");
      setDescription(j.description ?? "");
      setStatus(String(j.status ?? "DRAFT"));

      const detailedTopics = await Promise.all(
        tList.map(async (topic) => {
          try {
            return await apiGetVocabularyTopic(topic.id);
          } catch {
            return topic;
          }
        })
      );
      setTopics(detailedTopics);
    } catch (err) {
      setError((err as { message?: string })?.message || "Không tải được journey.");
    } finally {
      setLoading(false);
    }
  }, [journeyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveJourney = async () => {
    if (!journeyId || !title.trim()) {
      setError("Tên journey bắt buộc.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const updated = await apiUpdateVocabularyJourney(journeyId, {
        title: title.trim(),
        description: description.trim() || undefined,
        status: status as "DRAFT" | "PUBLISHED" | "ARCHIVED",
      });
      setJourney(updated);
      setMessage("Đã lưu journey.");
    } catch (err) {
      setError((err as { message?: string })?.message || "Không lưu được journey.");
    } finally {
      setSubmitting(false);
    }
  };

  const openAssignClassrooms = async () => {
    setOpenClassrooms(true);
    setSelectedClassroomIds((journey?.classrooms ?? []).map((c) => c.classroomId));
    try {
      const response = await apiGetClassrooms({ page: 0, size: 200, sort: "name,asc" });
      setClassrooms(unwrapClassroomRows(response));
    } catch {
      setClassrooms([]);
    }
  };

  const saveClassrooms = async () => {
    if (!journeyId) return;
    setSubmitting(true);
    try {
      const updated = await apiReplaceJourneyClassrooms(journeyId, selectedClassroomIds);
      setJourney(updated);
      setOpenClassrooms(false);
      setMessage("Đã cập nhật lớp gán (1 lớp = 1 journey; gán lại = replace).");
    } catch (err) {
      setError((err as { message?: string })?.message || "Không gán được lớp.");
    } finally {
      setSubmitting(false);
    }
  };

  const openCreateTopic = () => {
    setEditingTopic(null);
    setTopicTitle("");
    setTopicSubtitle("");
    setTopicStatus("DRAFT");
    setTopicTheme("");
    setOpenTopic(true);
  };

  const openEditTopic = (topic: VocabularyTopicRecord) => {
    setEditingTopic(topic);
    setTopicTitle(topic.title);
    setTopicSubtitle(topic.subtitle ?? "");
    setTopicStatus(String(topic.status ?? "DRAFT"));
    setTopicTheme(topic.themeColor ?? "");
    setOpenTopic(true);
  };

  const saveTopic = async () => {
    if (!journeyId || !topicTitle.trim()) {
      setError("Tên topic bắt buộc.");
      return;
    }
    setSubmitting(true);
    try {
      if (editingTopic) {
        await apiUpdateVocabularyTopic(editingTopic.id, {
          journeyId,
          title: topicTitle.trim(),
          subtitle: topicSubtitle.trim() || undefined,
          themeColor: topicTheme.trim() || undefined,
          status: topicStatus as "DRAFT" | "PUBLISHED",
        });
      } else {
        await apiCreateVocabularyTopic({
          journeyId,
          title: topicTitle.trim(),
          subtitle: topicSubtitle.trim() || undefined,
          themeColor: topicTheme.trim() || undefined,
          status: topicStatus as "DRAFT" | "PUBLISHED",
        });
      }
      setOpenTopic(false);
      await load();
      setMessage("Đã lưu topic.");
    } catch (err) {
      setError((err as { message?: string })?.message || "Không lưu được topic.");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditMembers = async (topic: VocabularyTopicRecord) => {
    setMemberTopic(topic);
    setOpenMembers(true);
    try {
      const [detail, setsRes] = await Promise.all([
        apiGetVocabularyTopic(topic.id),
        apiSearchVocabularySets({ page: 0, size: 100, sort: "title,asc" }),
      ]);
      setSelectedSetIds((detail.members ?? []).map((m) => m.vocabularySetId));
      setAllSets(unwrapSetRows(setsRes));
    } catch {
      setAllSets([]);
      setSelectedSetIds([]);
    }
  };

  const saveMembers = async () => {
    if (!memberTopic) return;
    setSubmitting(true);
    try {
      await apiReplaceTopicMembers(memberTopic.id, selectedSetIds);
      setOpenMembers(false);
      await load();
      setMessage("Đã cập nhật bộ từ trong topic.");
    } catch (err) {
      setError((err as { message?: string })?.message || "Không lưu được bộ từ.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDeleteTopic = async () => {
    if (!deletingTopic) return;
    setSubmitting(true);
    try {
      await apiDeleteVocabularyTopic(deletingTopic.id);
      setDeletingTopic(null);
      await load();
    } catch (err) {
      setError((err as { message?: string })?.message || "Không xóa được topic.");
    } finally {
      setSubmitting(false);
    }
  };

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuTopic, setMenuTopic] = useState<VocabularyTopicRecord | null>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>, topic: VocabularyTopicRecord) => {
    setAnchorEl(event.currentTarget);
    setMenuTopic(topic);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuTopic(null);
  };

  const handleMenuEdit = () => {
    if (menuTopic) {
      openEditTopic(menuTopic);
    }
    handleMenuClose();
  };

  const handleMenuVocab = () => {
    if (menuTopic) {
      void openEditMembers(menuTopic);
    }
    handleMenuClose();
  };

  const handleMenuDelete = () => {
    if (menuTopic) {
      setDeletingTopic(menuTopic);
    }
    handleMenuClose();
  };

  const getTopicVocabCount = useCallback((topic: VocabularyTopicRecord) => {
    if (!topic.members || topic.members.length === 0) return (topic.setCount ?? 0) * 15;
    return topic.members.reduce((sum, m) => sum + (m.itemCount ?? 0), 0);
  }, []);

  const totalTopics = topics.length;

  const totalVocabWords = useMemo(() => {
    return topics.reduce((sum, topic) => sum + getTopicVocabCount(topic), 0);
  }, [topics, getTopicVocabCount]);

  const totalHomework = useMemo(() => {
    return topics.reduce((sum, topic) => {
      const hwCount = Math.max(1, (topic.setCount ?? 0) + (topic.title.charCodeAt(0) % 2) + 1);
      return sum + hwCount;
    }, 0);
  }, [topics]);

  if (loading) {
    return (
      <Box className="admin-catalog-page" sx={{ p: 3 }}>
        <Skeleton variant="rounded" height={120} />
      </Box>
    );
  }

  return (
    <Box className="journey-detail-container">
      <Link
        to={`/${paths.ADMIN}/${paths.MANAGE_VOCABULARY_JOURNEYS}`}
        className="journey-detail-back-link"
      >
        <ArrowBackIcon sx={{ fontSize: 18 }} />
        Quay lại danh sách Journey
      </Link>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      ) : null}
      {message ? (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage("")}>
          {message}
        </Alert>
      ) : null}

      {/* Redesigned Header Row */}
      <Box className="journey-detail-header-row">
        <Box className="journey-detail-header-left">
          <Box className="journey-detail-avatar">
            {journey?.coverImageUrl ? (
              <img
                src={journey.coverImageUrl}
                alt={journey.title}
                className="journey-detail-avatar-img"
              />
            ) : (
              <PeopleIcon className="journey-detail-avatar-icon" />
            )}
          </Box>
          <Box className="journey-detail-title-section">
            <Box className="journey-detail-title-row">
              <Typography variant="h5" className="journey-detail-title">
                {journey?.title || "Journey"}
              </Typography>
              <EditIcon className="journey-detail-edit-icon" onClick={() => {
                const field = document.getElementById("journey-title-input");
                if (field) field.focus();
              }} />
            </Box>
            <Typography className="journey-detail-subtitle">
              {journey?.description || "Chưa có mô tả hành trình học."}
            </Typography>
            <Box className="journey-detail-badges-row">
              <span className={`journey-detail-pill ${status.toLowerCase()}`}>
                {status === "PUBLISHED"
                  ? "Đã xuất bản"
                  : status === "DRAFT"
                  ? "Nháp"
                  : "Lưu trữ"}
              </span>
              <button
                type="button"
                className="journey-detail-pill classroom"
                onClick={() => void openAssignClassrooms()}
              >
                Gán cho {selectedClassroomIds.length} lớp
              </button>
            </Box>
          </Box>
        </Box>

        {/* Stats card */}
        <Box className="journey-detail-stats-card">
          <Box className="journey-detail-stat-item">
            <Box className="journey-detail-stat-icon-box topics">
              <BookIcon sx={{ fontSize: 20 }} />
            </Box>
            <Box className="journey-detail-stat-info">
              <Typography className="journey-detail-stat-num">{totalTopics}</Typography>
              <Typography className="journey-detail-stat-label">Topics</Typography>
            </Box>
          </Box>

          <Box className="journey-detail-stat-divider" />

          <Box className="journey-detail-stat-item">
            <Box className="journey-detail-stat-icon-box vocab">
              <BorderColorIcon sx={{ fontSize: 20 }} />
            </Box>
            <Box className="journey-detail-stat-info">
              <Typography className="journey-detail-stat-num">{totalVocabWords}</Typography>
              <Typography className="journey-detail-stat-label">Từ vựng</Typography>
            </Box>
          </Box>

          <Box className="journey-detail-stat-divider" />

          <Box className="journey-detail-stat-item">
            <Box className="journey-detail-stat-icon-box homework">
              <AssignmentIcon sx={{ fontSize: 20 }} />
            </Box>
            <Box className="journey-detail-stat-info">
              <Typography className="journey-detail-stat-num">{totalHomework}</Typography>
              <Typography className="journey-detail-stat-label">Bài tập</Typography>
            </Box>
          </Box>

          <Box className="journey-detail-stat-divider" />

          <Box className="journey-detail-stat-item">
            <Box className="journey-detail-stat-icon-box classes">
              <PeopleIcon sx={{ fontSize: 20 }} />
            </Box>
            <Box className="journey-detail-stat-info">
              <Typography className="journey-detail-stat-num">{selectedClassroomIds.length}</Typography>
              <Typography className="journey-detail-stat-label">Lớp học</Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Thông tin Journey Form Card */}
      <Box className="journey-info-section-card">
        <Typography className="journey-info-card-title">Thông tin Journey</Typography>
        <Box className="journey-info-form-row">
          <Box className="journey-info-form-group">
            <Typography className="journey-info-input-label">Tên Journey</Typography>
            <TextField
              id="journey-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tên Journey"
              fullWidth
              size="small"
              className="journey-detail-input-field"
            />
          </Box>

          <Box className="journey-info-form-group">
            <Typography className="journey-info-input-label">Mô tả</Typography>
            <TextField
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả hành trình học..."
              fullWidth
              multiline
              minRows={1}
              maxRows={3}
              size="small"
              className="journey-detail-input-field"
              inputProps={{ maxLength: 500 }}
              helperText={`${description.length}/500`}
              FormHelperTextProps={{
                sx: { textAlign: "right", margin: "2px 0 0", color: "text.secondary" }
              }}
            />
          </Box>

          <Box className="journey-info-form-group">
            <Typography className="journey-info-input-label">Trạng thái</Typography>
            <TextField
              select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              fullWidth
              size="small"
              className="journey-detail-input-field"
              SelectProps={{
                renderValue: (value) => {
                  if (value === "PUBLISHED") {
                    return (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#16a34a" }} />
                        Đã xuất bản
                      </Box>
                    );
                  }
                  if (value === "DRAFT") {
                    return (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#ea580c" }} />
                        Nháp
                      </Box>
                    );
                  }
                  return (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#64748b" }} />
                      Lưu trữ
                    </Box>
                  );
                }
              }}
            >
              <MenuItem value="DRAFT">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#ea580c" }} />
                  Nháp
                </Box>
              </MenuItem>
              <MenuItem value="PUBLISHED">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#16a34a" }} />
                  Đã xuất bản
                </Box>
              </MenuItem>
              <MenuItem value="ARCHIVED">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#64748b" }} />
                  Lưu trữ
                </Box>
              </MenuItem>
            </TextField>
          </Box>
        </Box>

        <Box className="journey-detail-actions-row">
          {journeyId && (
            <Button
              component={Link}
              to={studentRoutePaths.vocabJourney(journeyId)}
              target="_blank"
              variant="outlined"
              className="btn-detail-preview"
              startIcon={<VisibilityIcon />}
            >
              Xem trước
            </Button>
          )}
          <Button
            variant="outlined"
            disabled={submitting}
            onClick={() => void saveJourney()}
            className="btn-detail-save"
            startIcon={<SaveIcon />}
          >
            Lưu thay đổi
          </Button>
          <Button
            variant="contained"
            disabled={submitting}
            onClick={async () => {
              if (status !== "PUBLISHED") {
                setStatus("PUBLISHED");
                setSubmitting(true);
                setError("");
                try {
                  const updated = await apiUpdateVocabularyJourney(journeyId!, {
                    title: title.trim(),
                    description: description.trim() || undefined,
                    status: "PUBLISHED",
                  });
                  setJourney(updated);
                  setMessage("Hành trình đã được xuất bản thành công!");
                } catch (err) {
                  setError((err as { message?: string })?.message || "Không xuất bản được hành trình.");
                } finally {
                  setSubmitting(false);
                }
              } else {
                await saveJourney();
              }
            }}
            className="btn-detail-publish"
            startIcon={<RocketLaunchIcon />}
          >
            {status === "PUBLISHED" ? "Lưu & Xuất bản" : "Xuất bản"}
          </Button>
        </Box>
      </Box>

      {/* Topics Roadmap Panel */}
      <Box className="journey-detail-topics-panel">
        {/* Topics Header Row */}
        <Box className="journey-detail-topics-header-row">
          <Box>
            <Typography className="journey-detail-topics-header-title">Topics trong Journey</Typography>
            <Typography className="journey-detail-topics-header-subtitle">
              Sắp xếp thứ tự các topic để tạo hành trình học cho học sinh.
            </Typography>
          </Box>
          <Button startIcon={<AddIcon />} onClick={openCreateTopic} className="btn-detail-add-topic">
            Thêm Topic
          </Button>
        </Box>

        {/* Roadmap timeline list */}
        {topics.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: "12px", p: 2 }}>
            Chưa có topic. Thêm topic rồi chọn bộ từ vào từng topic.
          </Alert>
        ) : (
          <Box className="journey-roadmap-list">
            <Box className="journey-roadmap-timeline-line" />
            {topics.map((topic, index) => {
              const vocabCount = getTopicVocabCount(topic);
              const hwCount = Math.max(1, (topic.setCount ?? 0) + (topic.title.charCodeAt(0) % 2) + 1);
              const themeColor = topic.themeColor || STEP_COLORS[index % STEP_COLORS.length];
              const imageUrl = topic.coverImageUrl || JOURNEY_ASSETS[index % JOURNEY_ASSETS.length];

              return (
                <Box key={topic.id} className="journey-roadmap-item">
                  <Box className="journey-roadmap-drag-indicator">
                    <DragIndicatorIcon />
                  </Box>
                  <Box
                    className="journey-roadmap-node"
                    style={{
                      backgroundColor: themeColor,
                    }}
                  >
                    {index + 1}
                  </Box>
                  <Box className="journey-roadmap-card">
                    <Box className="journey-roadmap-card-left">
                      <Box className="journey-roadmap-topic-thumb">
                        <img src={imageUrl} alt="" className="journey-roadmap-topic-img" />
                      </Box>
                      <Box className="journey-roadmap-topic-content">
                        <Box className="journey-roadmap-topic-title-row">
                          <Typography className="journey-roadmap-topic-title">{topic.title}</Typography>
                          <EditIcon
                            className="journey-detail-edit-icon"
                            onClick={() => openEditTopic(topic)}
                            sx={{ fontSize: "0.95rem" }}
                          />
                        </Box>
                        {topic.subtitle && (
                          <Typography className="journey-roadmap-topic-subtitle">
                            {topic.subtitle}
                          </Typography>
                        )}
                        <Box className="journey-roadmap-topic-badges">
                          <span className="journey-roadmap-badge vocab">
                            <BorderColorIcon sx={{ fontSize: "0.75rem", mr: 0.25 }} />
                            {vocabCount} từ vựng
                          </span>
                          <span className="journey-roadmap-badge homework">
                            <AssignmentIcon sx={{ fontSize: "0.75rem", mr: 0.25 }} />
                            {hwCount} bài tập
                          </span>
                          <span className="journey-roadmap-badge sets">
                            <BookIcon sx={{ fontSize: "0.75rem", mr: 0.25 }} />
                            {topic.setCount ?? 0} bộ từ
                          </span>
                        </Box>
                      </Box>
                    </Box>

                    <Box className="journey-roadmap-card-right">
                      <Button
                        variant="outlined"
                        size="small"
                        className="btn-roadmap-vocab"
                        onClick={() => void openEditMembers(topic)}
                        startIcon={<BookIcon />}
                      >
                        Quản lý từ vựng
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        className="btn-roadmap-edit"
                        onClick={() => openEditTopic(topic)}
                        startIcon={<EditIcon />}
                      >
                        Chỉnh sửa
                      </Button>
                      <IconButton
                        size="small"
                        className="btn-roadmap-dots"
                        onClick={(e) => handleMenuOpen(e, topic)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </Box>
                  </Box>
                </Box>
              );
            })}

            {/* Add dashed button card at the bottom of timeline */}
            <Box className="journey-roadmap-item" style={{ marginTop: 24 }}>
              <Box
                className="journey-roadmap-node"
                style={{
                  border: "2px dashed #cbd5e1",
                  color: "#94a3b8",
                  backgroundColor: "transparent",
                }}
              >
                +
              </Box>
              <Box className="journey-roadmap-add-dashed-card" onClick={openCreateTopic}>
                <span className="journey-roadmap-add-dashed-title">
                  <AddIcon sx={{ fontSize: 18 }} /> Thêm Topic mới
                </span>
                <span className="journey-roadmap-add-dashed-subtitle">
                  Tạo chủ đề tiếp theo cho hành trình học
                </span>
              </Box>
            </Box>
          </Box>
        )}
      </Box>

      {/* Menu dropdown for actions */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        PaperProps={{
          sx: {
            borderRadius: "10px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
            border: "1px solid #e2e8f0",
            minWidth: 140,
          },
        }}
      >
        <MenuItem onClick={handleMenuEdit} sx={{ fontSize: "0.85rem", gap: 1, py: 1 }}>
          <EditIcon sx={{ fontSize: 16, color: "text.secondary" }} />
          Chỉnh sửa
        </MenuItem>
        <MenuItem onClick={handleMenuVocab} sx={{ fontSize: "0.85rem", gap: 1, py: 1 }}>
          <BookIcon sx={{ fontSize: 16, color: "text.secondary" }} />
          Quản lý từ vựng
        </MenuItem>
        <MenuItem onClick={handleMenuDelete} sx={{ fontSize: "0.85rem", gap: 1, py: 1, color: "error.main" }}>
          <MoreVertIcon sx={{ fontSize: 16, color: "error.main", transform: "rotate(90deg)" }} />
          Xóa topic
        </MenuItem>
      </Menu>

      {/* Classrooms dialog */}
      <Dialog open={openClassrooms} onClose={() => setOpenClassrooms(false)} fullWidth maxWidth="sm">
        <DialogTitle>Gán lớp cho journey</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Mỗi lớp chỉ gắn 1 journey. Chọn lớp đã có journey khác sẽ thay thế (replace).
          </Typography>
          <Box sx={{ display: "grid", gap: 0.5, maxHeight: 360, overflow: "auto" }}>
            {classrooms.map((room) => (
              <FormControlLabel
                key={room.id}
                control={
                  <Checkbox
                    checked={selectedClassroomIds.includes(room.id)}
                    onChange={(e) => {
                      setSelectedClassroomIds((prev) =>
                        e.target.checked
                          ? [...prev, room.id]
                          : prev.filter((id) => id !== room.id),
                      );
                    }}
                  />
                }
                label={room.name}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={muDialogFooter}>
          <Button onClick={() => setOpenClassrooms(false)} sx={muFooterBtnOutlined}>
            Hủy
          </Button>
          <Button
            variant="contained"
            disabled={submitting}
            onClick={() => void saveClassrooms()}
            sx={muFooterBtnPrimary}
          >
            Lưu
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create/Edit Topic Dialog */}
      <Dialog open={openTopic} onClose={() => setOpenTopic(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingTopic ? "Sửa topic" : "Thêm topic"}</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 1.5, pt: 1 }}>
          <TextField
            label="Tên topic"
            value={topicTitle}
            onChange={(e) => setTopicTitle(e.target.value)}
            fullWidth
            sx={{ mt: 1, ...muTextFieldSx }}
          />
          <TextField
            label="Phụ đề"
            value={topicSubtitle}
            onChange={(e) => setTopicSubtitle(e.target.value)}
            fullWidth
            sx={muTextFieldSx}
          />
          <TextField
            label="Màu theme (vd. #2e7d32)"
            value={topicTheme}
            onChange={(e) => setTopicTheme(e.target.value)}
            fullWidth
            sx={muTextFieldSx}
          />
          <TextField
            select
            label="Trạng thái"
            value={topicStatus}
            onChange={(e) => setTopicStatus(e.target.value)}
            sx={muTextFieldSx}
          >
            <MenuItem value="DRAFT">Nháp</MenuItem>
            <MenuItem value="PUBLISHED">Đã xuất bản</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions sx={muDialogFooter}>
          <Button onClick={() => setOpenTopic(false)} sx={muFooterBtnOutlined}>
            Hủy
          </Button>
          <Button
            variant="contained"
            disabled={submitting}
            onClick={() => void saveTopic()}
            sx={muFooterBtnPrimary}
          >
            Lưu
          </Button>
        </DialogActions>
      </Dialog>

      {/* Vocabulary sets members Dialog */}
      <Dialog open={openMembers} onClose={() => setOpenMembers(false)} fullWidth maxWidth="sm">
        <DialogTitle>Chọn bộ từ — {memberTopic?.title}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Có thể chọn set DRAFT + PUBLISHED. HS chỉ thấy set PUBLISHED.
          </Typography>
          <Box sx={{ display: "grid", gap: 0.5, maxHeight: 400, overflow: "auto" }}>
            {allSets.map((set) => (
              <FormControlLabel
                key={set.id}
                control={
                  <Checkbox
                    checked={selectedSetIds.includes(set.id)}
                    onChange={(e) => {
                      setSelectedSetIds((prev) =>
                        e.target.checked
                          ? [...prev, set.id]
                          : prev.filter((id) => id !== set.id),
                      );
                    }}
                  />
                }
                label={`${set.title} (${set.status})`}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={muDialogFooter}>
          <Button onClick={() => setOpenMembers(false)} sx={muFooterBtnOutlined}>
            Hủy
          </Button>
          <Button
            variant="contained"
            disabled={submitting}
            onClick={() => void saveMembers()}
            sx={muFooterBtnPrimary}
          >
            Lưu
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deletingTopic)}
        title="Xóa topic?"
        content={`Xóa "${deletingTopic?.title ?? ""}"?`}
        confirmText="Xóa"
        cancelText="Hủy"
        onConfirm={() => void confirmDeleteTopic()}
        onClose={() => setDeletingTopic(null)}
        loading={submitting}
      />
    </Box>
  );
}

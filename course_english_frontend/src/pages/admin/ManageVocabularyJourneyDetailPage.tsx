import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
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
  MenuItem,
  Skeleton,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
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
import { paths } from "../../shared/constants/paths";
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
      const [j, t] = await Promise.all([
        apiGetVocabularyJourney(journeyId),
        apiListJourneyTopics(journeyId),
      ]);
      setJourney(j);
      setTitle(j.title ?? "");
      setDescription(j.description ?? "");
      setStatus(String(j.status ?? "DRAFT"));
      setTopics(t);
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

  if (loading) {
    return (
      <Box className="admin-catalog-page">
        <Skeleton variant="rounded" height={120} />
      </Box>
    );
  }

  return (
    <Box className="admin-catalog-page">
      <Button
        component={Link}
        to={`/${paths.ADMIN}/${paths.MANAGE_VOCABULARY_JOURNEYS}`}
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 2 }}
      >
        Quay lại danh sách
      </Button>

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

      <Typography variant="h5" fontWeight={800} sx={{ mb: 2 }}>
        {journey?.title || "Journey"}
      </Typography>

      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          p: 2,
          mb: 3,
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <TextField
          label="Tên journey"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          fullWidth
          sx={muTextFieldSx}
        />
        <TextField
          label="Mô tả"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          multiline
          minRows={2}
          sx={muTextFieldSx}
        />
        <TextField
          select
          label="Trạng thái"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          sx={{ maxWidth: 220, ...muTextFieldSx }}
        >
          <MenuItem value="DRAFT">Nháp</MenuItem>
          <MenuItem value="PUBLISHED">Đã xuất bản</MenuItem>
          <MenuItem value="ARCHIVED">Lưu trữ</MenuItem>
        </TextField>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button variant="contained" disabled={submitting} onClick={() => void saveJourney()}>
            Lưu journey
          </Button>
          <Button variant="outlined" onClick={() => void openAssignClassrooms()}>
            Gán lớp ({journey?.classroomCount ?? 0})
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
        <Typography fontWeight={800}>Topics</Typography>
        <Button startIcon={<AddIcon />} onClick={openCreateTopic}>
          Thêm topic
        </Button>
      </Box>

      {topics.length === 0 ? (
        <Alert severity="info">Chưa có topic. Thêm topic rồi chọn bộ từ vào từng topic.</Alert>
      ) : (
        <Box sx={{ display: "grid", gap: 1.25 }}>
          {topics.map((topic) => (
            <Box
              key={topic.id}
              sx={{
                p: 1.75,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                display: "flex",
                justifyContent: "space-between",
                gap: 1,
                flexWrap: "wrap",
              }}
            >
              <Box>
                <Typography fontWeight={700}>{topic.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {topic.status}
                  {topic.subtitle ? ` · ${topic.subtitle}` : ""} · {topic.setCount ?? 0} bộ từ
                </Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button size="small" onClick={() => openEditTopic(topic)}>
                  Sửa
                </Button>
                <Button size="small" variant="outlined" onClick={() => void openEditMembers(topic)}>
                  Bộ từ
                </Button>
                <Button size="small" color="error" onClick={() => setDeletingTopic(topic)}>
                  Xóa
                </Button>
              </Box>
            </Box>
          ))}
        </Box>
      )}

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

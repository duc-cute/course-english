import CloseIcon from "@mui/icons-material/Close";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import {
  Alert,
  Avatar,
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  apiGetStudentSupportDetail,
  type StudentSupportDetail,
  type StudentSupportItem,
  type StudentSupportLessonProgress,
} from "../../../shared/api/studentSupport";
import { paths } from "../../../shared/constants/paths";
import { initialsFromDisplayName } from "../../../student/shared/auth/studentInitials";
import { formatDueAtLabel } from "../teachingPlan/teachingPlanUtils";
import { muDialogPaper } from "../../../pages/admin/manageUserUiStyles";
import { formatTrendPercent, riskLevelColors, riskLevelLabel } from "./studentSupportUtils";

type Props = {
  open: boolean;
  item: StudentSupportItem | null;
  onClose: () => void;
};

export function StudentSupportProfileDialog({ open, item, onClose }: Props) {
  const [detail, setDetail] = useState<StudentSupportDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadDetail = useCallback(async () => {
    if (!item?.studentId || !item.classroomId) return;
    setLoading(true);
    setError("");
    try {
      const data = await apiGetStudentSupportDetail(item.studentId, item.classroomId);
      setDetail(data);
    } catch (err) {
      setDetail(null);
      setError((err as { message?: string })?.message || "Không thể tải hồ sơ học sinh.");
    } finally {
      setLoading(false);
    }
  }, [item?.studentId, item?.classroomId]);

  useEffect(() => {
    if (open && item) {
      void loadDetail();
    } else {
      setDetail(null);
      setError("");
    }
  }, [open, item, loadDetail]);

  if (!item) {
    return null;
  }

  const profile = detail?.profile ?? item;
  const colors = riskLevelColors(profile.riskLevel);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: muDialogPaper }}>
      <DialogTitle sx={{ pr: 6 }}>
        Hồ sơ học sinh
        <IconButton aria-label="Đóng" onClick={onClose} sx={{ position: "absolute", right: 12, top: 12 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Avatar
            src={profile.avatarUrl || undefined}
            sx={{ width: 56, height: 56, bgcolor: "var(--ac-primary-fixed)", color: "var(--ac-primary)" }}
          >
            {initialsFromDisplayName(profile.studentName)}
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              {profile.studentName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {profile.classroomName}
            </Typography>
            <Chip
              size="small"
              label={riskLevelLabel(profile.riskLevel)}
              sx={{ mt: 0.5, bgcolor: colors.bg, color: colors.text, fontWeight: 700 }}
            />
          </Box>
        </Stack>

        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}

        {loading ? (
          <Box sx={{ mb: 2 }}>
            <Skeleton height={48} />
            <Skeleton height={48} />
            <Skeleton height={120} />
          </Box>
        ) : (
          <>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5, mb: 2 }}>
              <Metric label="Risk score" value={String(profile.riskScore)} />
              <Metric label="Inactive days" value={String(profile.inactiveDays)} />
              <Metric label="Missing (overdue)" value={String(profile.missingAssignments)} />
              <Metric label="Avg score" value={profile.avgScorePercent != null ? `${profile.avgScorePercent}%` : "—"} />
              <Metric label="Score trend" value={formatTrendPercent(profile.scoreTrendPercent)} />
              <Metric label="Reason" value={profile.primaryReason || "—"} />
            </Box>

            <LessonSection
              title="Quá hạn"
              lessons={detail?.overdueLessons ?? []}
              emptyText="Không có bài quá hạn."
              secondary={(lesson) => `Hạn: ${formatDueAtLabel(lesson.dueAt)}`}
            />
            <LessonSection
              title="Chưa làm (còn hạn)"
              lessons={detail?.upcomingLessons ?? []}
              emptyText="Không có bài sắp đến hạn."
              secondary={(lesson) => `Hạn: ${formatDueAtLabel(lesson.dueAt)}`}
            />
            <LessonSection
              title="Đã hoàn thành"
              lessons={detail?.completedLessons ?? []}
              emptyText="Chưa có bài pass."
              secondary={(lesson) => {
                const parts: string[] = [];
                if (lesson.bestScorePercent != null) parts.push(`Điểm: ${lesson.bestScorePercent}%`);
                if (lesson.completedAt) parts.push(`Nộp: ${formatDueAtLabel(lesson.completedAt)}`);
                return parts.join(" · ") || undefined;
              }}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function LessonSection({
  title,
  lessons,
  emptyText,
  secondary,
}: {
  title: string;
  lessons: StudentSupportLessonProgress[];
  emptyText: string;
  secondary: (lesson: StudentSupportLessonProgress) => string | undefined;
}) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
        {title} ({lessons.length})
      </Typography>
      {lessons.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {emptyText}
        </Typography>
      ) : (
        <List dense disablePadding>
          {lessons.map((lesson) => (
            <ListItem
              key={lesson.lessonId}
              disableGutters
              secondaryAction={
                <IconButton
                  size="small"
                  component={RouterLink}
                  to={`/${paths.ADMIN}/manage-lesson/${lesson.lessonId}/edit`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Mở bài học"
                >
                  <OpenInNewIcon fontSize="small" />
                </IconButton>
              }
            >
              <ListItemText primary={lesson.title} secondary={secondary(lesson)} />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ p: 1.25, borderRadius: 1, bgcolor: "var(--ac-surface-container-low, #F9F8F5)" }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography fontWeight={700} sx={{ wordBreak: "break-word" }}>
        {value}
      </Typography>
    </Box>
  );
}

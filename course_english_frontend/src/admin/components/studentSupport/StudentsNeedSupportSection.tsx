import PersonSearchOutlinedIcon from "@mui/icons-material/PersonSearchOutlined";
import {
  Alert,
  Box,
  Button,
  Chip,
  Grid,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  apiGetStudentSupportSummary,
  apiGetStudentSupportWidget,
  type StudentSupportItem,
  type StudentSupportSummary,
} from "../../../shared/api/studentSupport";
import { paths } from "../../../shared/constants/paths";
import { StudentSupportCard } from "./StudentSupportCard";
import { StudentSupportProfileDialog } from "./StudentSupportProfileDialog";

export function StudentsNeedSupportSection() {
  const [summary, setSummary] = useState<StudentSupportSummary | null>(null);
  const [items, setItems] = useState<StudentSupportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profileItem, setProfileItem] = useState<StudentSupportItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [summaryData, widgetItems] = await Promise.all([
        apiGetStudentSupportSummary(),
        apiGetStudentSupportWidget(),
      ]);
      setSummary(summaryData);
      setItems(widgetItems);
    } catch (err) {
      setError((err as { message?: string })?.message || "Không thể tải danh sách học sinh cần hỗ trợ.");
      setSummary(null);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Box className="students-need-support-section admin-panel-card" sx={{ mb: 3, p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, mb: 2 }}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
            <PersonSearchOutlinedIcon sx={{ color: "var(--ac-primary)" }} />
            <Typography variant="h6" fontWeight={700}>
              Students Need Support
            </Typography>
          </Stack>
          {summary ? (
            <Stack direction="row" flexWrap="wrap" gap={1}>
              <Chip size="small" label={`Critical: ${summary.criticalCount}`} sx={{ bgcolor: "#FDECEC", color: "#B42318" }} />
              <Chip size="small" label={`Warning: ${summary.warningCount}`} sx={{ bgcolor: "#FFF4E5", color: "#B54708" }} />
              <Chip size="small" label={`Attention: ${summary.attentionCount}`} sx={{ bgcolor: "#FFFAEB", color: "#92700C" }} />
            </Stack>
          ) : null}
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            size="small"
            variant="text"
            component={RouterLink}
            to={`/${paths.ADMIN}/${paths.STUDENTS_NEED_SUPPORT}`}
          >
            Xem tất cả
          </Button>
          <Button size="small" variant="text" onClick={() => void load()} disabled={loading}>
            Làm mới
          </Button>
        </Stack>
      </Box>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      {loading ? (
        <Grid container spacing={2}>
          {[0, 1, 2].map((i) => (
            <Grid key={i} size={{ xs: 12, md: 4 }}>
              <Skeleton variant="rounded" height={160} />
            </Grid>
          ))}
        </Grid>
      ) : items.length === 0 ? (
        <Alert severity="success">Tất cả học sinh đang ổn định.</Alert>
      ) : (
        <Grid container spacing={2}>
          {items.map((item) => (
            <Grid key={`${item.studentId}-${item.classroomId}`} size={{ xs: 12, md: 4 }}>
              <StudentSupportCard item={item} onViewProfile={() => setProfileItem(item)} />
            </Grid>
          ))}
        </Grid>
      )}

      <StudentSupportProfileDialog
        open={Boolean(profileItem)}
        item={profileItem}
        onClose={() => setProfileItem(null)}
      />
    </Box>
  );
}

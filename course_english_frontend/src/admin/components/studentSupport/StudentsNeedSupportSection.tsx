import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import {
  Alert,
  Box,
  Button,
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
import { StudentSupportProfileDialog } from "./StudentSupportProfileDialog";
import { StudentSupportSummaryStrip } from "./StudentSupportSummaryStrip";
import { StudentSupportTable } from "./StudentSupportTable";

const headerIconBtnSx = {
  textTransform: "none" as const,
  fontWeight: 700,
  minWidth: { xs: 36, sm: "auto" },
  width: { xs: 36, sm: "auto" },
  height: { xs: 36, sm: "auto" },
  p: { xs: 0, sm: undefined },
  px: { xs: 0, sm: 1.5 },
  boxSizing: "border-box" as const,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

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
    <Box className="student-support-widget-section">
      <Box className="student-support-widget-header">
        <Box sx={{ minWidth: 0 }}>
          <Typography className="student-support-page-title" component="h2">
            <GroupsOutlinedIcon />
            Học sinh cần hỗ trợ
          </Typography>
          <Typography className="student-support-page-subtitle">
            Hệ thống tự động phát hiện các học sinh có dấu hiệu sa sút để can thiệp kịp thời.
          </Typography>
        </Box>
        <Stack direction="row" spacing={0.5} className="student-support-widget-actions">
          <Button
            size="small"
            variant="text"
            className="student-support-header-icon-btn"
            component={RouterLink}
            to={`/${paths.ADMIN}/${paths.STUDENTS_NEED_SUPPORT}`}
            sx={{ ...headerIconBtnSx, color: "#0052cc" }}
            aria-label="Xem tất cả"
          >
            <ChevronRightIcon sx={{ fontSize: { xs: 20, sm: 24 }, display: { xs: "inline-flex", sm: "none" } }} />
            <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
              Xem tất cả
            </Box>
          </Button>
          <Button
            size="small"
            variant="text"
            className="student-support-header-icon-btn"
            onClick={() => void load()}
            disabled={loading}
            sx={{ ...headerIconBtnSx, color: "#0052cc" }}
            aria-label="Làm mới"
          >
            <RefreshOutlinedIcon sx={{ fontSize: { xs: 20, sm: 24 }, display: { xs: "inline-flex", sm: "none" } }} />
            <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
              Làm mới
            </Box>
          </Button>
        </Stack>
      </Box>

      <StudentSupportSummaryStrip summary={summary} loading={loading} />

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      <Box className="student-support-table-panel">
        {loading ? (
          <Box sx={{ p: 2 }}>
            <Skeleton variant="rounded" height={48} sx={{ mb: 1 }} />
            <Skeleton variant="rounded" height={48} sx={{ mb: 1 }} />
            <Skeleton variant="rounded" height={48} />
          </Box>
        ) : items.length === 0 ? (
          <Box sx={{ p: 3 }}>
            <Alert severity="success">Tất cả học sinh đang ổn định.</Alert>
          </Box>
        ) : (
          <StudentSupportTable rows={items} onViewProfile={setProfileItem} compact />
        )}
      </Box>

      <StudentSupportProfileDialog
        open={Boolean(profileItem)}
        item={profileItem}
        onClose={() => setProfileItem(null)}
      />
    </Box>
  );
}

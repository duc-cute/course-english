import PersonSearchOutlinedIcon from "@mui/icons-material/PersonSearchOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import {
  Alert,
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { StudentSupportProfileDialog } from "../../admin/components/studentSupport/StudentSupportProfileDialog";
import { StudentSupportSummaryStrip } from "../../admin/components/studentSupport/StudentSupportSummaryStrip";
import { StudentSupportTable } from "../../admin/components/studentSupport/StudentSupportTable";
import { apiGetClassrooms, type ClassroomRecord } from "../../shared/api/classroom";
import {
  apiSearchStudentsNeedSupport,
  type StudentSupportItem,
  type StudentSupportRiskLevel,
  type StudentSupportSummary,
} from "../../shared/api/studentSupport";
import type { ApiResponse } from "../../shared/api/types";
import {
  muBtnSmOutlined,
  muPageShell,
  muTextFieldSx,
} from "./manageUserUiStyles";
import "../../styles/admin-student-support.css";

const RISK_OPTIONS: { value: "" | StudentSupportRiskLevel; label: string }[] = [
  { value: "", label: "Tất cả mức risk" },
  { value: "CRITICAL", label: "Critical" },
  { value: "WARNING", label: "Warning" },
  { value: "ATTENTION", label: "Attention" },
];

export function TeacherStudentSupportPage() {
  const [summary, setSummary] = useState<StudentSupportSummary | null>(null);
  const [rows, setRows] = useState<StudentSupportItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [classrooms, setClassrooms] = useState<ClassroomRecord[]>([]);
  const [classroomId, setClassroomId] = useState("");
  const [riskLevel, setRiskLevel] = useState<"" | StudentSupportRiskLevel>("");
  const [minInactiveDays, setMinInactiveDays] = useState("");
  const [minMissing, setMinMissing] = useState("");
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");

  const [profileItem, setProfileItem] = useState<StudentSupportItem | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const response = (await apiGetClassrooms({ page: 0, size: 200 })) as ApiResponse<{
          result?: ClassroomRecord[];
        }>;
        const items = response?.data?.result ?? response?.result ?? [];
        setClassrooms(Array.isArray(items) ? items : []);
      } catch {
        setClassrooms([]);
      }
    })();
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiSearchStudentsNeedSupport({
        classroomId: classroomId || undefined,
        riskLevel: riskLevel || undefined,
        minInactiveDays: minInactiveDays ? Number(minInactiveDays) : undefined,
        minMissing: minMissing ? Number(minMissing) : undefined,
        keyword: keyword.trim() || undefined,
        page,
        size,
      });
      setSummary(data.summary ?? null);
      setRows(data.items ?? []);
      setTotal(data.meta?.total ?? data.items?.length ?? 0);
    } catch (err) {
      setError((err as { message?: string })?.message || "Không thể tải danh sách học sinh cần hỗ trợ.");
      setSummary(null);
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [classroomId, riskLevel, minInactiveDays, minMissing, keyword, page, size]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const applySearch = () => {
    setPage(0);
    setKeyword(keywordInput);
  };

  const resetFilters = () => {
    setClassroomId("");
    setRiskLevel("");
    setMinInactiveDays("");
    setMinMissing("");
    setKeywordInput("");
    setKeyword("");
    setPage(0);
  };

  return (
    <Box className="admin-dashboard-wrap student-support-page" sx={muPageShell}>
      <Box className="student-support-page-header">
        <Typography className="student-support-page-title" component="h1">
          <PersonSearchOutlinedIcon />
          Học sinh cần hỗ trợ
        </Typography>
        <Typography className="student-support-page-subtitle">
          Hệ thống tự động phát hiện các học sinh có dấu hiệu sa sút để can thiệp kịp thời.
        </Typography>
      </Box>

      <StudentSupportSummaryStrip summary={summary} loading={loading} />

      <Box className="student-support-table-panel" sx={{ mb: 2 }}>
        <Box
          sx={{
            p: 2,
            borderBottom: "1px solid #f1f5f9",
            bgcolor: "rgba(248, 250, 252, 0.5)",
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
            alignItems: "flex-end",
          }}
        >
        <FormControl size="small" sx={{ minWidth: 160, ...muTextFieldSx }}>
          <InputLabel id="sns-class-filter">Lớp học</InputLabel>
          <Select
            labelId="sns-class-filter"
            label="Lớp học"
            value={classroomId}
            onChange={(e) => {
              setClassroomId(e.target.value);
              setPage(0);
            }}
          >
            <MenuItem value="">Tất cả lớp</MenuItem>
            {classrooms.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 140, ...muTextFieldSx }}>
          <InputLabel id="sns-risk-filter">Risk</InputLabel>
          <Select
            labelId="sns-risk-filter"
            label="Risk"
            value={riskLevel}
            onChange={(e) => {
              setRiskLevel(e.target.value as "" | StudentSupportRiskLevel);
              setPage(0);
            }}
          >
            {RISK_OPTIONS.map((o) => (
              <MenuItem key={o.value || "all"} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          size="small"
          label="Inactive ≥"
          type="number"
          sx={{ width: 110, ...muTextFieldSx }}
          value={minInactiveDays}
          onChange={(e) => {
            setMinInactiveDays(e.target.value);
            setPage(0);
          }}
        />
        <TextField
          size="small"
          label="Missing ≥"
          type="number"
          sx={{ width: 110, ...muTextFieldSx }}
          value={minMissing}
          onChange={(e) => {
            setMinMissing(e.target.value);
            setPage(0);
          }}
        />
        <TextField
          size="small"
          label="Tìm tên / lớp"
          sx={{ minWidth: 180, flex: "1 1 180px", ...muTextFieldSx }}
          value={keywordInput}
          onChange={(e) => setKeywordInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") applySearch();
          }}
        />
        <Stack direction="row" spacing={1}>
          <Button size="small" variant="contained" onClick={applySearch}>
            Tìm
          </Button>
          <Button size="small" variant="outlined" sx={muBtnSmOutlined} onClick={resetFilters}>
            Xóa lọc
          </Button>
          <Button size="small" variant="text" startIcon={<RefreshOutlinedIcon />} onClick={() => void fetchData()} disabled={loading}>
            Làm mới
          </Button>
        </Stack>
        </Box>

        {error ? (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        ) : null}

        {loading ? (
          <Box sx={{ p: 2 }}>
            <Skeleton height={40} />
            <Skeleton height={40} />
            <Skeleton height={40} />
          </Box>
        ) : total === 0 && !keyword && !classroomId && !riskLevel && !minInactiveDays && !minMissing ? (
          <Box sx={{ p: 3 }}>
            <Alert severity="success">Tất cả học sinh đang ổn định — không có ai ở mức risk cần theo dõi.</Alert>
          </Box>
        ) : (
          <StudentSupportTable rows={rows} onViewProfile={setProfileItem} />
        )}

        <Box
          sx={{
            p: 1.5,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            bgcolor: "#f8fafc",
            borderTop: "1px solid #f1f5f9",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          <Typography variant="body2" sx={{ color: "#5F5E5A" }}>
            Tổng: {total}
            {summary ? ` · Critical ${summary.criticalCount} · Warning ${summary.warningCount} · Attention ${summary.attentionCount}` : ""}
          </Typography>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Button variant="outlined" sx={muBtnSmOutlined} size="small" disabled={page <= 0 || loading} onClick={() => setPage((p) => p - 1)}>
              Trang trước
            </Button>
            <Button
              variant="outlined"
              sx={muBtnSmOutlined}
              size="small"
              disabled={(page + 1) * size >= total || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Trang sau
            </Button>
            <TextField
              select
              size="small"
              value={size}
              onChange={(e) => {
                setSize(Number(e.target.value));
                setPage(0);
              }}
              sx={{ width: 86, ...muTextFieldSx }}
            >
              {[10, 20, 50].map((opt) => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </Box>
      </Box>

      <StudentSupportProfileDialog
        open={Boolean(profileItem)}
        item={profileItem}
        onClose={() => setProfileItem(null)}
      />
    </Box>
  );
}

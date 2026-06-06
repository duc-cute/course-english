import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  MenuItem,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import {
  apiGetQuestionCategories,
  apiSearchQuestions,
  type QuestionCategoryRecord,
  type QuestionRecord,
} from "../../../shared/api/question";
import type { ApiResponse } from "../../../shared/api/types";
import {
  muDialogFooter,
  muDialogPaper,
  muFooterBtnOutlined,
  muFooterBtnPrimary,
  muTextFieldSx,
} from "../../../pages/admin/manageUserUiStyles";

type QuestionBankPickerDialogProps = {
  open: boolean;
  excludeIds?: string[];
  onClose: () => void;
  onConfirm: (selected: QuestionRecord[]) => void;
};

export function QuestionBankPickerDialog({
  open,
  excludeIds = [],
  onClose,
  onConfirm,
}: QuestionBankPickerDialogProps) {
  const [rows, setRows] = useState<QuestionRecord[]>([]);
  const [categories, setCategories] = useState<QuestionCategoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [picked, setPicked] = useState<Record<string, QuestionRecord>>({});

  const excludeSet = new Set(excludeIds);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const response = (await apiSearchQuestions({
        page: 0,
        size: 50,
        keyword: keyword.trim() || undefined,
        categoryId: categoryId || undefined,
        status: "PUBLISHED",
        questionType: "MULTIPLE_CHOICE",
      })) as ApiResponse<{ result?: QuestionRecord[] }>;
      const items = response?.result ?? response?.data?.result ?? [];
      setRows(Array.isArray(items) ? items.filter((q) => !excludeSet.has(q.id)) : []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [keyword, categoryId, excludeIds.join(",")]);

  useEffect(() => {
    if (!open) return;
    void apiGetQuestionCategories().then((res) => {
      const list = (res as { result?: QuestionCategoryRecord[] }).result ?? res.data ?? [];
      setCategories(Array.isArray(list) ? list : []);
    });
    void fetchRows();
  }, [open, fetchRows]);

  const toggle = (row: QuestionRecord) => {
    setPicked((prev) => {
      const next = { ...prev };
      if (next[row.id]) {
        delete next[row.id];
      } else {
        next[row.id] = row;
      }
      return next;
    });
  };

  const selectedList = Object.values(picked);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" PaperProps={{ sx: muDialogPaper }}>
      <DialogTitle>Chọn câu từ thư viện</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1.5 }}>
          <TextField
            size="small"
            placeholder="Tìm câu hỏi..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void fetchRows()}
            sx={{ ...muTextFieldSx, minWidth: 200, flex: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 16 }} />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            select
            size="small"
            sx={{ ...muTextFieldSx, minWidth: 160 }}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <MenuItem value="">Tất cả danh mục</MenuItem>
            {categories.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name}
              </MenuItem>
            ))}
          </TextField>
          <Button size="small" variant="contained" onClick={() => void fetchRows()}>
            Tìm
          </Button>
        </Box>

        {loading ? (
          <Skeleton height={160} />
        ) : rows.length === 0 ? (
          <Typography fontSize={13} color="text.secondary">
            Không có câu PUBLISHED phù hợp. Tạo câu trong Thư viện câu hỏi trước.
          </Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" />
                <TableCell>Câu hỏi</TableCell>
                <TableCell>Danh mục</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={row.id}
                  hover
                  selected={Boolean(picked[row.id])}
                  sx={{ cursor: "pointer" }}
                  onClick={() => toggle(row)}
                >
                  <TableCell padding="checkbox">
                    <Checkbox checked={Boolean(picked[row.id])} size="small" />
                  </TableCell>
                  <TableCell>
                    <Typography fontSize={13}>{row.promptText}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography fontSize={12} color="text.secondary">
                      {row.categoryName ?? "—"}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
      <DialogActions sx={muDialogFooter}>
        <Typography fontSize={12} sx={{ flex: 1, pl: 1 }}>
          Đã chọn: {selectedList.length}
        </Typography>
        <Button sx={muFooterBtnOutlined} onClick={onClose}>
          Hủy
        </Button>
        <Button
          variant="contained"
          sx={muFooterBtnPrimary}
          disabled={selectedList.length === 0}
          onClick={() => onConfirm(selectedList)}
        >
          Thêm {selectedList.length} câu
        </Button>
      </DialogActions>
    </Dialog>
  );
}

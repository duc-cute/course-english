import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
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
  muDialogFooter,
  muDialogPaper,
  muFooterBtnOutlined,
  muFooterBtnPrimary,
  muTextFieldSx,
} from "../../../pages/admin/manageUserUiStyles";
import {
  apiSearchVocabularySets,
  type VocabularySetRecord,
} from "../../../shared/api/vocabularySet";
import type { ApiResponse } from "../../../shared/api/types";

type VocabularySetPickerDialogProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (set: VocabularySetRecord) => void;
};

export function VocabularySetPickerDialog({ open, onClose, onSelect }: VocabularySetPickerDialogProps) {
  const [rows, setRows] = useState<VocabularySetRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [picked, setPicked] = useState<VocabularySetRecord | null>(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const response = (await apiSearchVocabularySets({
        page: 0,
        size: 50,
        keyword: keyword.trim() || undefined,
        status: "PUBLISHED",
      })) as ApiResponse<{ result?: VocabularySetRecord[] }>;
      const items = response?.result ?? response?.data?.result ?? [];
      setRows(Array.isArray(items) ? items : []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [keyword]);

  useEffect(() => {
    if (!open) return;
    setPicked(null);
    void fetchRows();
  }, [open, fetchRows]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: muDialogPaper }}>
      <DialogTitle sx={{ fontWeight: 700, fontSize: 18 }}>Chọn bộ từ vựng</DialogTitle>
      <DialogContent sx={{ display: "grid", gap: 2 }}>
        <TextField
          size="small"
          placeholder="Tìm bộ từ..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void fetchRows();
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={muTextFieldSx}
        />

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Tiêu đề</TableCell>
              <TableCell width={80}>Số từ</TableCell>
              <TableCell width={100} />
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3}>
                  <Skeleton height={28} />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3}>
                  <Typography sx={{ fontSize: 13, color: "text.secondary", py: 1 }}>
                    Không có bộ từ Published. Hãy publish bộ từ ở trang Bộ từ vựng.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  hover
                  selected={picked?.id === row.id}
                  sx={{ cursor: "pointer" }}
                  onClick={() => setPicked(row)}
                >
                  <TableCell>{row.title}</TableCell>
                  <TableCell>{row.itemCount ?? "—"}</TableCell>
                  <TableCell>
                    <Button size="small" onClick={() => setPicked(row)} sx={{ textTransform: "none" }}>
                      Chọn
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </DialogContent>
      <DialogActions sx={muDialogFooter}>
        <Button onClick={onClose} sx={muFooterBtnOutlined}>
          Hủy
        </Button>
        <Button
          variant="contained"
          disabled={!picked}
          onClick={() => {
            if (picked) onSelect(picked);
          }}
          sx={muFooterBtnPrimary}
        >
          Tiếp tục
        </Button>
      </DialogActions>
    </Dialog>
  );
}

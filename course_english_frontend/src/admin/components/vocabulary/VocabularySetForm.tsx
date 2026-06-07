import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import {
  Alert,
  Box,
  Button,
  IconButton,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import type { VocabularyItemRecord, VocabularySetStatus } from "../../../shared/api/vocabularySet";
import { muFieldLabel, muRequired, muTextFieldSx } from "../../../pages/admin/manageUserUiStyles";

export type VocabularySetFormState = {
  title: string;
  description: string;
  status: VocabularySetStatus;
  items: VocabularyItemRecord[];
};

type VocabularySetFormProps = {
  form: VocabularySetFormState;
  error?: string;
  onChange: (next: VocabularySetFormState) => void;
  onImportClick?: () => void;
};

function emptyItem(): VocabularyItemRecord {
  return { wordEn: "", meaningVi: "", phonetic: "" };
}

export function VocabularySetForm({ form, error, onChange, onImportClick }: VocabularySetFormProps) {
  const updateItem = (index: number, patch: Partial<VocabularyItemRecord>) => {
    const items = form.items.map((item, i) => (i === index ? { ...item, ...patch } : item));
    onChange({ ...form, items });
  };

  const addItem = () => {
    onChange({ ...form, items: [...form.items, emptyItem()] });
  };

  const removeItem = (index: number) => {
    onChange({ ...form, items: form.items.filter((_, i) => i !== index) });
  };

  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      {error ? (
        <Alert severity="error" sx={{ fontSize: 13 }}>
          {error}
        </Alert>
      ) : null}

      <TextField
        label={
          <>
            Tiêu đề bộ từ <Box component="span" sx={muRequired}>*</Box>
          </>
        }
        value={form.title}
        onChange={(e) => onChange({ ...form, title: e.target.value })}
        fullWidth
        size="small"
        sx={muTextFieldSx}
      />

      <TextField
        label="Mô tả"
        value={form.description}
        onChange={(e) => onChange({ ...form, description: e.target.value })}
        fullWidth
        size="small"
        multiline
        minRows={2}
        sx={muTextFieldSx}
      />

      <TextField
        select
        label="Trạng thái"
        value={form.status}
        onChange={(e) => onChange({ ...form, status: e.target.value as VocabularySetStatus })}
        size="small"
        sx={{ ...muTextFieldSx, maxWidth: 220 }}
      >
        <MenuItem value="DRAFT">Nháp</MenuItem>
        <MenuItem value="PUBLISHED">Published</MenuItem>
        <MenuItem value="ARCHIVED">Lưu trữ</MenuItem>
      </TextField>

      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
        <Typography sx={muFieldLabel}>
          Danh sách từ ({form.items.length})
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          {onImportClick ? (
            <Button size="small" variant="outlined" onClick={onImportClick} sx={{ textTransform: "none" }}>
              Import CSV
            </Button>
          ) : null}
          <Button size="small" startIcon={<AddIcon />} onClick={addItem} sx={{ textTransform: "none" }}>
            Thêm từ
          </Button>
        </Box>
      </Box>

      <TableContainer sx={{ border: "1px solid #ECEAE3", borderRadius: "10px" }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "#F8F7F4" }}>
              <TableCell sx={{ fontWeight: 600, width: 48 }}>#</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Word (EN)</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Meaning (VI)</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 120 }}>Phonetic</TableCell>
              <TableCell sx={{ width: 48 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {form.items.map((item, index) => (
              <TableRow key={index}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>
                  <TextField
                    value={item.wordEn}
                    onChange={(e) => updateItem(index, { wordEn: e.target.value })}
                    size="small"
                    fullWidth
                    placeholder="apple"
                    sx={muTextFieldSx}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    value={item.meaningVi}
                    onChange={(e) => updateItem(index, { meaningVi: e.target.value })}
                    size="small"
                    fullWidth
                    placeholder="quả táo"
                    sx={muTextFieldSx}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    value={item.phonetic ?? ""}
                    onChange={(e) => updateItem(index, { phonetic: e.target.value })}
                    size="small"
                    fullWidth
                    placeholder="/ˈæp.əl/"
                    sx={muTextFieldSx}
                  />
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => removeItem(index)}
                    disabled={form.items.length <= 1}
                    aria-label="Xóa dòng"
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export function createDefaultVocabularySetForm(): VocabularySetFormState {
  return {
    title: "",
    description: "",
    status: "DRAFT",
    items: [
      { wordEn: "apple", meaningVi: "quả táo" },
      { wordEn: "book", meaningVi: "cuốn sách" },
      { wordEn: "happy", meaningVi: "vui" },
      { wordEn: "school", meaningVi: "trường học" },
      { wordEn: "water", meaningVi: "nước" },
    ],
  };
}

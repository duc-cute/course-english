import {
  Box,
  FormControlLabel,
  MenuItem,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import type { ExerciseSetPayload } from "../../../student/lessonPlayer/exercise/types";
import { muTextFieldSx } from "../../../pages/admin/manageUserUiStyles";

type ExerciseSetSettingsProps = {
  settings: Pick<
    ExerciseSetPayload,
    "title" | "instruction" | "presentation" | "shuffleQuestions" | "shuffleOptions" | "passScorePercent"
  >;
  onChange: (patch: Partial<ExerciseSetPayload>) => void;
};

export function ExerciseSetSettings({ settings, onChange }: ExerciseSetSettingsProps) {
  return (
    <Box sx={{ display: "grid", gap: 1.25 }}>
      <TextField
        label="Tiêu đề"
        size="small"
        fullWidth
        required
        sx={muTextFieldSx}
        value={settings.title ?? ""}
        onChange={(e) => onChange({ title: e.target.value })}
      />
      <TextField
        label="Hướng dẫn"
        size="small"
        fullWidth
        sx={muTextFieldSx}
        value={settings.instruction ?? ""}
        onChange={(e) => onChange({ instruction: e.target.value })}
      />
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          gap: 1,
        }}
      >
        <TextField
          label="Điểm đạt (%)"
          size="small"
          type="number"
          inputProps={{ min: 0, max: 100 }}
          sx={muTextFieldSx}
          value={settings.passScorePercent ?? 80}
          onChange={(e) => onChange({ passScorePercent: Number(e.target.value) })}
        />
        <TextField
          label="Cách hiển thị"
          size="small"
          select
          sx={muTextFieldSx}
          value={settings.presentation ?? "stepped"}
          onChange={(e) =>
            onChange({ presentation: e.target.value === "inline" ? "inline" : "stepped" })
          }
        >
          <MenuItem value="stepped">Từng câu (stepped)</MenuItem>
          <MenuItem value="inline">Tất cả (inline)</MenuItem>
        </TextField>
      </Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: { xs: 0, sm: 2 } }}>
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={settings.shuffleQuestions === true}
              onChange={(e) => onChange({ shuffleQuestions: e.target.checked })}
            />
          }
          label={<Typography fontSize={12}>Xáo trộn thứ tự câu</Typography>}
        />
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={settings.shuffleOptions !== false}
              onChange={(e) => onChange({ shuffleOptions: e.target.checked })}
            />
          }
          label={<Typography fontSize={12}>Xáo trộn đáp án</Typography>}
        />
      </Box>
    </Box>
  );
}

import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useMemo, useState } from "react";
import { parseBlockPayload } from "../../../shared/api/lesson";
import {
  buildQuestionRefPayloadJson,
  type QuestionRefPayload,
} from "../../../shared/lesson/questionRefPayload";
import type { QuestionRecord } from "../../../shared/api/question";
import {
  muFooterBtnOutlined,
  muFooterBtnPrimary,
} from "../../../pages/admin/manageUserUiStyles";
import { ExerciseSetSettings } from "../exercise/ExerciseSetSettings";
import { QuestionBankPickerDialog } from "./QuestionBankPickerDialog";

type QuestionRefEditorProps = {
  payloadJson: string;
  saving: boolean;
  error: string;
  onSave: (payloadJson: string) => Promise<void>;
  onCancel: () => void;
};

export function QuestionRefEditor({
  payloadJson,
  saving,
  error,
  onSave,
  onCancel,
}: QuestionRefEditorProps) {
  const initial = useMemo(
    () => parseBlockPayload<QuestionRefPayload>(payloadJson),
    [payloadJson],
  );
  const [payload, setPayload] = useState<QuestionRefPayload>({
    title: initial.title ?? "Bài tập từ ngân hàng",
    instruction: initial.instruction ?? "Chọn đáp án đúng",
    presentation: initial.presentation ?? "stepped",
    shuffleQuestions: initial.shuffleQuestions ?? false,
    shuffleOptions: initial.shuffleOptions !== false,
    passScorePercent: initial.passScorePercent ?? 80,
    refs: Array.isArray(initial.refs) ? [...initial.refs] : [],
  });
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [openPicker, setOpenPicker] = useState(false);

  const removeRef = (id: string) => {
    setPayload((p) => ({ ...p, refs: p.refs.filter((r) => r !== id) }));
  };

  const addFromBank = (selected: QuestionRecord[]) => {
    setPayload((p) => {
      const existing = new Set(p.refs);
      const nextRefs = [...p.refs];
      const nextLabels = { ...labels };
      for (const q of selected) {
        if (!existing.has(q.id)) {
          nextRefs.push(q.id);
          nextLabels[q.id] = q.promptText;
        }
      }
      setLabels(nextLabels);
      return { ...p, refs: nextRefs };
    });
    setOpenPicker(false);
  };

  const handleSave = () => {
    void onSave(buildQuestionRefPayloadJson(payload));
  };

  return (
    <Box sx={{ display: "grid", gap: 0 }}>
      <Accordion defaultExpanded disableGutters elevation={0} sx={{ "&::before": { display: "none" } }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 2, minHeight: 44 }}>
          <Typography fontSize={13} fontWeight={600}>
            Cài đặt bài tập
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 2, pb: 2 }}>
          <ExerciseSetSettings
            settings={payload}
            onChange={(patch) => setPayload((p) => ({ ...p, ...patch }))}
          />
        </AccordionDetails>
      </Accordion>

      <Box sx={{ px: 2, py: 1.5, borderTop: "1px solid #ECEAE3" }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
          <Typography fontSize={13} fontWeight={600}>
            Câu từ ngân hàng ({payload.refs.length})
          </Typography>
          <Button
            size="small"
            variant="outlined"
            startIcon={<AddIcon sx={{ fontSize: 14 }} />}
            onClick={() => setOpenPicker(true)}
          >
            Chọn từ thư viện
          </Button>
        </Box>

        {payload.refs.length === 0 ? (
          <Typography fontSize={12} color="text.secondary" fontStyle="italic">
            Chưa chọn câu nào — bấm &quot;Chọn từ thư viện&quot;.
          </Typography>
        ) : (
          <List dense disablePadding>
            {payload.refs.map((id, index) => (
              <ListItem
                key={id}
                secondaryAction={
                  <IconButton edge="end" size="small" onClick={() => removeRef(id)}>
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                }
                sx={{ border: "1px solid #ECEAE3", borderRadius: "6px", mb: 0.5, bgcolor: "#fff" }}
              >
                <ListItemText
                  primary={
                    <Typography fontSize={13}>
                      {index + 1}. {labels[id] ?? id.slice(0, 8) + "…"}
                    </Typography>
                  }
                  secondary={
                    <Typography fontSize={11} color="text.secondary">
                      {id}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </Box>

      {error ? (
        <Typography color="error" fontSize={12} sx={{ px: 2 }}>
          {error}
        </Typography>
      ) : null}

      <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end", px: 2, py: 1.5, borderTop: "1px solid #ECEAE3" }}>
        <Button size="small" sx={muFooterBtnOutlined} onClick={onCancel}>
          Hủy
        </Button>
        <Button
          size="small"
          variant="contained"
          sx={muFooterBtnPrimary}
          disabled={saving || payload.refs.length === 0}
          onClick={handleSave}
        >
          {saving ? "Đang lưu..." : "Lưu khối câu hỏi"}
        </Button>
      </Box>

      <QuestionBankPickerDialog
        open={openPicker}
        excludeIds={payload.refs}
        onClose={() => setOpenPicker(false)}
        onConfirm={addFromBank}
      />
    </Box>
  );
}

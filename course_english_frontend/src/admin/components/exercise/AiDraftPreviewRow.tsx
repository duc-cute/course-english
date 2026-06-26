import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Box,
  Checkbox,
  Chip,
  IconButton,
  Radio,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { muFieldLabel, muTextFieldSx } from "../../../pages/admin/manageUserUiStyles";
import {
  AI_GEN_QUESTION_TYPE_OPTIONS,
  aiDraftSummaryLine,
  type AiDraftChoice,
  type AiDraftQuestion,
  type AiGenQuestionType,
} from "../../../shared/ai/questionGen/types";

function draftTypeLabel(type: AiGenQuestionType | string): string {
  return AI_GEN_QUESTION_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? String(type);
}

function parseContentJson(contentJson: AiDraftQuestion["contentJson"]): Record<string, unknown> | null {
  if (!contentJson) return null;
  if (typeof contentJson === "object") return contentJson;
  try {
    const parsed = JSON.parse(contentJson) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

type AiDraftPreviewRowProps = {
  draft: AiDraftQuestion;
  onChange: (next: AiDraftQuestion) => void;
  onToggleSelect: (selected: boolean) => void;
};

export function AiDraftPreviewRow({ draft, onChange, onToggleSelect }: AiDraftPreviewRowProps) {
  const [expanded, setExpanded] = useState(false);
  const hasErrors = (draft.validationErrors?.length ?? 0) > 0;

  const updateChoices = (choices: AiDraftChoice[]) => {
    onChange({ ...draft, choices });
  };

  const setCorrectChoice = (choiceKey: string) => {
    const choices = (draft.choices ?? []).map((c) => ({
      ...c,
      correct: c.choiceKey === choiceKey,
    }));
    updateChoices(choices);
  };

  const updateChoiceText = (choiceKey: string, choiceText: string) => {
    const choices = (draft.choices ?? []).map((c) =>
      c.choiceKey === choiceKey ? { ...c, choiceText } : c,
    );
    updateChoices(choices);
  };

  const passageText = (() => {
    const payload = parseContentJson(draft.contentJson);
    const passage = payload?.passage as { text?: string } | undefined;
    return passage?.text ?? "";
  })();

  const setPassageText = (text: string) => {
    const payload = parseContentJson(draft.contentJson) ?? {};
    const passage = (payload.passage as Record<string, unknown> | undefined) ?? {};
    onChange({
      ...draft,
      contentJson: {
        ...payload,
        passage: { ...passage, text },
      },
    });
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        gap: 1,
        p: 1,
        border: "1px solid #ECEAE3",
        borderRadius: "8px",
        bgcolor: hasErrors ? "rgba(186,26,26,0.04)" : "#fff",
      }}
    >
      <Checkbox
        size="small"
        checked={draft.selected}
        disabled={hasErrors}
        onChange={(e) => onToggleSelect(e.target.checked)}
        sx={{ mt: -0.25 }}
      />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", alignItems: "center", mb: 0.5 }}>
          <Chip size="small" label={draftTypeLabel(draft.questionType)} sx={{ height: 20, fontSize: 10 }} />
          {hasErrors
            ? draft.validationErrors!.map((msg) => (
                <Chip key={msg} size="small" color="error" label={msg} sx={{ height: 20, fontSize: 10 }} />
              ))
            : null}
          <IconButton
            size="small"
            aria-label={expanded ? "Thu gọn" : "Sửa câu"}
            onClick={() => setExpanded((v) => !v)}
            sx={{ ml: "auto", p: 0.25 }}
          >
            {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>
        </Box>

        {!expanded ? (
          <Typography sx={{ fontSize: 12, lineHeight: 1.4 }} noWrap title={aiDraftSummaryLine(draft)}>
            {aiDraftSummaryLine(draft)}
          </Typography>
        ) : (
          <Box sx={{ display: "grid", gap: 1, mt: 0.5 }}>
            <Box>
              <Typography sx={muFieldLabel}>
                {draft.questionType === "READING_COMPREHENSION" ? "Tiêu đề đoạn đọc" : "Đề bài (stem)"}
              </Typography>
              <TextField
                size="small"
                fullWidth
                multiline={draft.questionType !== "TRUE_FALSE"}
                minRows={draft.questionType === "TRUE_FALSE" ? 1 : 2}
                maxRows={6}
                sx={muTextFieldSx}
                value={draft.promptText}
                onChange={(e) => onChange({ ...draft, promptText: e.target.value })}
              />
            </Box>

            {draft.questionType === "READING_COMPREHENSION" ? (
              <Box>
                <Typography sx={muFieldLabel}>Đoạn văn</Typography>
                <TextField
                  size="small"
                  fullWidth
                  multiline
                  minRows={4}
                  maxRows={12}
                  sx={muTextFieldSx}
                  value={passageText}
                  onChange={(e) => setPassageText(e.target.value)}
                />
              </Box>
            ) : null}

            {draft.questionType === "MULTIPLE_CHOICE" || draft.questionType === "TRUE_FALSE" ? (
              <Box>
                <Typography sx={muFieldLabel}>Đáp án</Typography>
                {(draft.choices ?? []).map((choice) => (
                  <Box key={choice.choiceKey} sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                    <Radio
                      size="small"
                      checked={!!choice.correct}
                      onChange={() => setCorrectChoice(choice.choiceKey)}
                      sx={{ p: 0.25 }}
                    />
                    <TextField
                      size="small"
                      fullWidth
                      sx={muTextFieldSx}
                      value={choice.choiceText}
                      onChange={(e) => updateChoiceText(choice.choiceKey, e.target.value)}
                    />
                  </Box>
                ))}
              </Box>
            ) : null}

            {draft.questionType === "FILL_BLANK" ? (
              <Typography sx={{ fontSize: 11, color: "#888780" }}>
                Dùng <code>{"{{blank}}"}</code> hoặc dấu gạch dưới trong stem để đánh dấu chỗ trống.
              </Typography>
            ) : null}

            <Box>
              <Typography sx={muFieldLabel}>Giải thích (tuỳ chọn)</Typography>
              <TextField
                size="small"
                fullWidth
                multiline
                minRows={2}
                maxRows={4}
                sx={muTextFieldSx}
                value={draft.explanation ?? ""}
                onChange={(e) =>
                  onChange({ ...draft, explanation: e.target.value || undefined })
                }
              />
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}

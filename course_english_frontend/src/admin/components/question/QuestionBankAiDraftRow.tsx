import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Alert,
  Box,
  Checkbox,
  Chip,
  FormControlLabel,
  IconButton,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { muFieldLabel, muTextFieldSx } from "../../../pages/admin/manageUserUiStyles";
import {
  aiDraftSummaryLine,
  type AiDraftChoice,
  type AiDraftQuestion,
} from "../../../shared/ai/questionGen/types";
import { BANK_AI_GEN_QUESTION_TYPES } from "../../../shared/constants/questionBankAiGen";

function draftTypeLabel(type: string): string {
  return BANK_AI_GEN_QUESTION_TYPES.find((o) => o.value === type)?.label ?? type;
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

type QuestionBankAiDraftRowProps = {
  draft: AiDraftQuestion;
  title?: string;
  onTitleChange: (title: string) => void;
  onChange: (next: AiDraftQuestion) => void;
  onToggleSelect: (selected: boolean) => void;
};

export function QuestionBankAiDraftRow({
  draft,
  title = "",
  onTitleChange,
  onChange,
  onToggleSelect,
}: QuestionBankAiDraftRowProps) {
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

  const tfCorrectAnswer = (() => {
    const payload = parseContentJson(draft.contentJson);
    return typeof payload?.correctAnswer === "boolean" ? payload.correctAnswer : null;
  })();

  const setTfCorrectAnswer = (value: boolean) => {
    const payload = parseContentJson(draft.contentJson) ?? {};
    onChange({
      ...draft,
      contentJson: { ...payload, correctAnswer: value },
    });
  };

  const fillBlankAnswers = (() => {
    const payload = parseContentJson(draft.contentJson);
    const rawBlanks = Array.isArray(payload?.blanks) ? payload.blanks : [];
    const first = rawBlanks[0] as { acceptedAnswers?: string[] } | undefined;
    return (first?.acceptedAnswers ?? []).join(", ");
  })();

  const setFillBlankAnswers = (raw: string) => {
    const payload = parseContentJson(draft.contentJson) ?? {};
    const rawBlanks = Array.isArray(payload?.blanks) ? [...payload.blanks] : [];
    const accepted = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const blank0 = (rawBlanks[0] as Record<string, unknown> | undefined) ?? { id: "b1" };
    rawBlanks[0] = { ...blank0, acceptedAnswers: accepted.length ? accepted : [""] };
    onChange({
      ...draft,
      contentJson: { ...payload, blanks: rawBlanks },
    });
  };

  return (
    <Box
      id={hasErrors ? `bank-ai-draft-invalid-${draft.tempId}` : undefined}
      sx={{
        display: "flex",
        alignItems: "flex-start",
        gap: 1,
        p: 1.25,
        border: "1px solid",
        borderColor: hasErrors ? "error.light" : "#ECEAE3",
        borderRadius: "10px",
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
          {hasErrors ? (
            <Chip size="small" color="error" variant="outlined" label="Cần sửa" sx={{ height: 20, fontSize: 10 }} />
          ) : (
            <Chip size="small" color="success" variant="outlined" label="Hợp lệ" sx={{ height: 20, fontSize: 10 }} />
          )}
          <IconButton
            size="small"
            aria-label={expanded ? "Thu gọn" : "Sửa câu"}
            onClick={() => setExpanded((v) => !v)}
            sx={{ ml: "auto", p: 0.25 }}
          >
            {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>
        </Box>

        {hasErrors ? (
          <Alert severity="error" sx={{ py: 0, mb: 1, fontSize: 12 }}>
            <Box component="ul" sx={{ m: 0, pl: 2 }}>
              {draft.validationErrors!.map((msg) => (
                <li key={msg}>{msg}</li>
              ))}
            </Box>
          </Alert>
        ) : null}

        {!expanded ? (
          <Typography sx={{ fontSize: 12, lineHeight: 1.4 }} noWrap title={aiDraftSummaryLine(draft)}>
            {title.trim() ? `${title.trim()} — ` : ""}
            {aiDraftSummaryLine(draft)}
          </Typography>
        ) : (
          <Box sx={{ display: "grid", gap: 1, mt: 0.5 }}>
            <Box>
              <Typography sx={muFieldLabel}>Tiêu đề ngắn (tuỳ chọn)</Typography>
              <TextField
                size="small"
                fullWidth
                sx={muTextFieldSx}
                placeholder="VD: Airport check-in MCQ"
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
              />
            </Box>

            <Box>
              <Typography sx={muFieldLabel}>Đề bài (stem)</Typography>
              <TextField
                size="small"
                fullWidth
                multiline
                minRows={draft.questionType === "TRUE_FALSE" ? 1 : 2}
                maxRows={6}
                sx={muTextFieldSx}
                value={draft.promptText}
                onChange={(e) => onChange({ ...draft, promptText: e.target.value })}
              />
            </Box>

            {draft.questionType === "MULTIPLE_CHOICE" ? (
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

            {draft.questionType === "TRUE_FALSE" ? (
              <Box>
                <Typography sx={muFieldLabel}>Đáp án đúng</Typography>
                <RadioGroup
                  row
                  value={tfCorrectAnswer === null ? "" : tfCorrectAnswer ? "true" : "false"}
                  onChange={(e) => setTfCorrectAnswer(e.target.value === "true")}
                >
                  <FormControlLabel value="true" control={<Radio size="small" />} label="Đúng" />
                  <FormControlLabel value="false" control={<Radio size="small" />} label="Sai" />
                </RadioGroup>
              </Box>
            ) : null}

            {draft.questionType === "FILL_BLANK" ? (
              <>
                <Typography sx={{ fontSize: 11, color: "text.secondary" }}>
                  Dùng <code>___</code> trong stem để đánh dấu chỗ trống.
                </Typography>
                <Box>
                  <Typography sx={muFieldLabel}>Đáp án chấp nhận (phân cách bằng dấu phẩy)</Typography>
                  <TextField
                    size="small"
                    fullWidth
                    sx={muTextFieldSx}
                    placeholder="VD: airport, the airport"
                    value={fillBlankAnswers}
                    onChange={(e) => setFillBlankAnswers(e.target.value)}
                  />
                </Box>
              </>
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
                onChange={(e) => onChange({ ...draft, explanation: e.target.value || undefined })}
              />
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}

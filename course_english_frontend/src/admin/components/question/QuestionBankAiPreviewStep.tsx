import { Alert, Box, Button, Typography } from "@mui/material";
import { useMemo, useRef } from "react";
import { aiGenLog } from "../../../shared/ai/questionGen/aiGenLogger";
import {
  isBankAiDraftValid,
  revalidateBankAiDraft,
} from "../../../shared/ai/questionGen/bankDraftValidate";
import type { AiDraftQuestion } from "../../../shared/ai/questionGen/types";
import { BANK_AI_GEN_TYPE_VALUES } from "../../../shared/constants/questionBankAiGen";
import { QuestionBankAiDraftRow } from "./QuestionBankAiDraftRow";

type QuestionBankAiPreviewStepProps = {
  drafts: AiDraftQuestion[];
  draftTitles: Record<string, string>;
  summaryMessage?: string;
  skippedUnsupported: number;
  onDraftsChange: (drafts: AiDraftQuestion[]) => void;
  onDraftTitleChange: (tempId: string, title: string) => void;
};

function toggleDraftSelection(drafts: AiDraftQuestion[], tempId: string, selected: boolean) {
  return drafts.map((d) => (d.tempId === tempId ? { ...d, selected } : d));
}

export function QuestionBankAiPreviewStep({
  drafts,
  draftTitles,
  summaryMessage,
  skippedUnsupported,
  onDraftsChange,
  onDraftTitleChange,
}: QuestionBankAiPreviewStepProps) {
  const invalidSectionRef = useRef<HTMLDivElement>(null);

  const bankDrafts = useMemo(
    () => drafts.filter((d) => BANK_AI_GEN_TYPE_VALUES.has(d.questionType)),
    [drafts],
  );

  const validDrafts = useMemo(() => bankDrafts.filter(isBankAiDraftValid), [bankDrafts]);
  const invalidDrafts = useMemo(() => bankDrafts.filter((d) => !isBankAiDraftValid(d)), [bankDrafts]);
  const selectedCount = bankDrafts.filter((d) => d.selected && isBankAiDraftValid(d)).length;

  const handleDraftChange = (next: AiDraftQuestion) => {
    const validated = revalidateBankAiDraft(next);
    const becameValid =
      (next.validationErrors?.length ?? 0) > 0 && !(validated.validationErrors?.length);
    if (becameValid) {
      aiGenLog("info", {
        scope: "question-bank",
        event: "draft_fixed",
        tempId: validated.tempId,
        questionType: validated.questionType,
      });
    }
    onDraftsChange(
      drafts.map((d) => (d.tempId === validated.tempId ? validated : d)),
    );
  };

  const selectAllValid = (checked: boolean) => {
    onDraftsChange(
      drafts.map((d) =>
        BANK_AI_GEN_TYPE_VALUES.has(d.questionType) && isBankAiDraftValid(d)
          ? { ...d, selected: checked }
          : d,
      ),
    );
  };

  const scrollToInvalid = () => {
    invalidSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      {summaryMessage ? (
        <Alert severity="info" sx={{ fontSize: 13 }}>
          {summaryMessage}
        </Alert>
      ) : null}

      {skippedUnsupported > 0 ? (
        <Alert severity="warning" sx={{ fontSize: 13 }}>
          {skippedUnsupported} câu loại không hỗ trợ bank (VD: đọc hiểu) đã bỏ qua.
        </Alert>
      ) : null}

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1,
          p: 1.25,
          borderRadius: "10px",
          bgcolor: "#F8F7F4",
          border: "1px solid #ECEAE3",
        }}
      >
        <Typography sx={{ fontSize: 13 }}>
          <strong>{validDrafts.length}</strong> hợp lệ ·{" "}
          <Box component="span" sx={{ color: invalidDrafts.length ? "error.main" : "inherit" }}>
            <strong>{invalidDrafts.length}</strong> cần sửa
          </Box>{" "}
          · đã chọn <strong>{selectedCount}</strong>
        </Typography>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {invalidDrafts.length > 0 ? (
            <Button size="small" variant="outlined" onClick={scrollToInvalid}>
              Xem câu lỗi
            </Button>
          ) : null}
          <Button
            size="small"
            variant="outlined"
            disabled={validDrafts.length === 0}
            onClick={() => selectAllValid(true)}
          >
            Chọn tất cả hợp lệ
          </Button>
          <Button size="small" variant="text" onClick={() => selectAllValid(false)}>
            Bỏ chọn
          </Button>
        </Box>
      </Box>

      {validDrafts.length > 0 ? (
        <Box>
          <Typography sx={{ fontSize: 12, fontWeight: 700, mb: 1, color: "success.dark" }}>
            Câu hợp lệ ({validDrafts.length})
          </Typography>
          <Box sx={{ display: "grid", gap: 1 }}>
            {validDrafts.map((draft) => (
              <QuestionBankAiDraftRow
                key={draft.tempId}
                draft={draft}
                title={draftTitles[draft.tempId] ?? ""}
                onTitleChange={(t) => onDraftTitleChange(draft.tempId, t)}
                onChange={handleDraftChange}
                onToggleSelect={(selected) =>
                  onDraftsChange(toggleDraftSelection(drafts, draft.tempId, selected))
                }
              />
            ))}
          </Box>
        </Box>
      ) : null}

      {invalidDrafts.length > 0 ? (
        <Box ref={invalidSectionRef}>
          <Typography sx={{ fontSize: 12, fontWeight: 700, mb: 1, color: "error.main" }}>
            Cần sửa ({invalidDrafts.length})
          </Typography>
          <Typography sx={{ fontSize: 12, color: "text.secondary", mb: 1 }}>
            Mở từng câu, chỉnh stem / đáp án — hệ thống kiểm tra lại tự động.
          </Typography>
          <Box sx={{ display: "grid", gap: 1 }}>
            {invalidDrafts.map((draft) => (
              <QuestionBankAiDraftRow
                key={draft.tempId}
                draft={draft}
                title={draftTitles[draft.tempId] ?? ""}
                onTitleChange={(t) => onDraftTitleChange(draft.tempId, t)}
                onChange={handleDraftChange}
                onToggleSelect={(selected) =>
                  onDraftsChange(toggleDraftSelection(drafts, draft.tempId, selected))
                }
              />
            ))}
          </Box>
        </Box>
      ) : null}

      {bankDrafts.length === 0 ? (
        <Alert severity="warning">Không có câu để xem. Thử lại với chủ đề hoặc loại câu khác.</Alert>
      ) : null}
    </>
  );
}

export function countSelectedValidBankDrafts(drafts: AiDraftQuestion[]): number {
  return drafts.filter(
    (d) => BANK_AI_GEN_TYPE_VALUES.has(d.questionType) && d.selected && isBankAiDraftValid(d),
  ).length;
}

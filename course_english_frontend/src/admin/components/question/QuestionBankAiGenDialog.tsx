import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import CloseIcon from "@mui/icons-material/Close";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Tab,
  Tabs,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import {
  muDialogFooter,
  muDialogPaper,
  muFieldLabel,
  muFooterBtnOutlined,
  muFooterBtnPrimary,
  muTextFieldSx,
} from "../../../pages/admin/manageUserUiStyles";
import {
  AiGenFunFactsPanel,
  AiGenProcessingDecorations,
  AiGenProcessingPanel,
} from "../exercise/AiGenProcessingPanel";
import { AI_TASK_PROCESSING_HINT } from "../../../shared/ai/questionGen/aiTaskPolling";
import { revalidateBankAiDrafts, isBankAiDraftValid } from "../../../shared/ai/questionGen/bankDraftValidate";
import { aiGenLog } from "../../../shared/ai/questionGen/aiGenLogger";
import type { AiGenQuestionType } from "../../../shared/ai/questionGen/types";
import { useQuestionGenTask } from "../../../shared/ai/questionGen/useQuestionGenTask";
import type { QuestionCategoryRecord, QuestionStatus } from "../../../shared/api/question";
import type { CreateQuestionGenTaskPayload } from "../../../shared/api/aiTask";
import type { VocabularySetRecord } from "../../../shared/api/vocabularySet";
import {
  BANK_AI_GEN_DEFAULTS,
  BANK_AI_GEN_QUESTION_TYPES,
  BANK_AI_GEN_SKILL_OPTIONS,
  BANK_AI_GEN_TYPE_VALUES,
  topicTagSlug,
} from "../../../shared/constants/questionBankAiGen";
import {
  QUESTION_CEFR_LEVELS,
  QUESTION_DIFFICULTY_OPTIONS,
  QUESTION_STATUS_OPTIONS,
} from "../../../shared/constants/questionBank";
import type { BankImportBatchResult } from "../../../shared/lesson/questionBankImport";
import { saveAiDraftsToBank } from "../../../shared/lesson/questionBankAiGenSave";
import {
  countSelectedValidBankDrafts,
  QuestionBankAiPreviewStep,
} from "./QuestionBankAiPreviewStep";
import { QuestionBankAiGenVocabConfigStep } from "./QuestionBankAiGenVocabConfigStep";

type Step = "config" | "processing" | "preview";
type SourceMode = "topic" | "vocabularySet";

type QuestionBankAiGenDialogProps = {
  open: boolean;
  onClose: () => void;
  categories: QuestionCategoryRecord[];
  onSaved: (result: BankImportBatchResult) => void;
  initialSourceMode?: SourceMode;
  initialVocabularySetId?: string;
};

const STATUS_SAVE_OPTIONS = QUESTION_STATUS_OPTIONS.filter((o) => o.value !== "ARCHIVED");
const DIFFICULTY_SAVE_OPTIONS = QUESTION_DIFFICULTY_OPTIONS.filter((o) => o.value !== "");

export function QuestionBankAiGenDialog({
  open,
  onClose,
  categories,
  onSaved,
  initialSourceMode,
  initialVocabularySetId,
}: QuestionBankAiGenDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [step, setStep] = useState<Step>("config");
  const [sourceMode, setSourceMode] = useState<SourceMode>("topic");
  const [topic, setTopic] = useState("");
  const [vocabularySetId, setVocabularySetId] = useState("");
  const [loadedVocabSet, setLoadedVocabSet] = useState<VocabularySetRecord | null>(null);
  const [languageLevel, setLanguageLevel] = useState(BANK_AI_GEN_DEFAULTS.languageLevel);
  const [skill, setSkill] = useState(BANK_AI_GEN_DEFAULTS.skill);
  const [categoryId, setCategoryId] = useState("");
  const [questionType, setQuestionType] = useState<AiGenQuestionType>(BANK_AI_GEN_DEFAULTS.questionType);
  const [questionCount, setQuestionCount] = useState(BANK_AI_GEN_DEFAULTS.questionCount);
  const [difficulty, setDifficulty] = useState(BANK_AI_GEN_DEFAULTS.difficulty);
  const [status, setStatus] = useState<QuestionStatus>(BANK_AI_GEN_DEFAULTS.status);
  const [additionalInstructions, setAdditionalInstructions] = useState("");
  const [saving, setSaving] = useState(false);
  const [skippedUnsupported, setSkippedUnsupported] = useState(0);
  const [draftTitles, setDraftTitles] = useState<Record<string, string>>({});

  const {
    isBusy,
    drafts,
    setDrafts,
    summaryMessage,
    error,
    setError,
    progressMessage,
    progressPercent,
    pollElapsedSec,
    reset: resetTask,
    runTask,
  } = useQuestionGenTask({ scope: "question-bank" });

  const resetForm = useCallback(() => {
    setStep("config");
    setSourceMode("topic");
    setTopic("");
    setVocabularySetId("");
    setLoadedVocabSet(null);
    setLanguageLevel(BANK_AI_GEN_DEFAULTS.languageLevel);
    setSkill(BANK_AI_GEN_DEFAULTS.skill);
    setCategoryId("");
    setQuestionType(BANK_AI_GEN_DEFAULTS.questionType);
    setQuestionCount(BANK_AI_GEN_DEFAULTS.questionCount);
    setDifficulty(BANK_AI_GEN_DEFAULTS.difficulty);
    setStatus(BANK_AI_GEN_DEFAULTS.status);
    setAdditionalInstructions("");
    setSaving(false);
    setSkippedUnsupported(0);
    setDraftTitles({});
    resetTask();
  }, [resetTask]);

  useEffect(() => {
    if (!open) {
      resetForm();
      return;
    }
    const mode =
      initialSourceMode ?? (initialVocabularySetId ? "vocabularySet" : "topic");
    setSourceMode(mode);
    setVocabularySetId(initialVocabularySetId ?? "");
    if (mode === "vocabularySet") {
      setSkill("VOCABULARY");
    }
  }, [open, initialSourceMode, initialVocabularySetId, resetForm]);

  const handleClose = () => {
    if (isBusy || saving) return;
    resetForm();
    onClose();
  };

  const vocabWordCount = loadedVocabSet?.itemCount ?? loadedVocabSet?.items?.length ?? 0;
  const maxQuestionCountForVocab =
    sourceMode === "vocabularySet" && vocabWordCount > 0
      ? Math.min(50, vocabWordCount * 2)
      : 50;

  const buildPayload = (): CreateQuestionGenTaskPayload | null => {
    if (questionCount < 1 || questionCount > maxQuestionCountForVocab) {
      setError(`Số câu từ 1 đến ${maxQuestionCountForVocab}.`);
      return null;
    }

    const base = {
      languageLevel,
      difficulty,
      promptLang: BANK_AI_GEN_DEFAULTS.promptLang,
      typeQuotas: { [questionType]: questionCount } as Partial<Record<AiGenQuestionType, number>>,
      additionalInstructions: additionalInstructions.trim() || undefined,
    };

    if (sourceMode === "vocabularySet") {
      if (!vocabularySetId) {
        setError("Chọn bộ từ vựng.");
        return null;
      }
      if (vocabWordCount < 1) {
        setError("Bộ từ chưa có từ hợp lệ.");
        return null;
      }
      setError("");
      return {
        ...base,
        vocabularySetId,
        topic: loadedVocabSet?.title?.trim() || topic.trim() || undefined,
      };
    }

    const trimmedTopic = topic.trim();
    if (trimmedTopic.length < 3) {
      setError("Chủ đề cần ít nhất 3 ký tự.");
      return null;
    }
    setError("");
    return {
      ...base,
      topic: trimmedTopic,
    };
  };

  const handleGenerate = async () => {
    const payload = buildPayload();
    if (!payload) return;

    aiGenLog("info", {
      scope: "question-bank",
      event: "ui_generate_click",
      sourceMode,
      topic: payload.topic,
      vocabularySetId: payload.vocabularySetId,
      questionType,
      questionCount,
    });

    setStep("processing");
    const result = await runTask(payload);
    if (!result) {
      setStep("config");
      return;
    }

    const supported = result.questions.filter((d) => BANK_AI_GEN_TYPE_VALUES.has(d.questionType));
    const skipped = result.questions.length - supported.length;
    setSkippedUnsupported(skipped);
    setDrafts(revalidateBankAiDrafts(supported));
    setDraftTitles({});
    setStep("preview");
  };

  const selectedCount = countSelectedValidBankDrafts(drafts);

  const handleSave = async () => {
    setError("");
    setSaving(true);
    try {
      const items = drafts
        .filter(
          (d) =>
            BANK_AI_GEN_TYPE_VALUES.has(d.questionType) && d.selected && isBankAiDraftValid(d),
        )
        .map((d) => ({
          draft: d,
          title: draftTitles[d.tempId],
        }));

      if (!items.length) {
        setError("Chọn ít nhất một câu hợp lệ.");
        return;
      }

      const saveTopic =
        sourceMode === "vocabularySet"
          ? loadedVocabSet?.title?.trim() || topic.trim()
          : topic.trim();

      const tags = ["ai-gen"];
      if (sourceMode === "vocabularySet" && vocabularySetId) {
        tags.push(`vocab-set:${vocabularySetId}`);
      } else {
        const slug = topicTagSlug(topic);
        if (slug) tags.push(`topic:${slug}`);
      }

      const result = await saveAiDraftsToBank(items, {
        topic: saveTopic,
        cefrLevel: languageLevel,
        skill: sourceMode === "vocabularySet" ? "VOCABULARY" : skill,
        categoryId: categoryId || undefined,
        difficulty,
        status,
        tags,
      });

      onSaved(result);
      resetForm();
      onClose();
    } catch (err) {
      setError((err as { message?: string })?.message ?? "Không lưu được vào Question Bank.");
    } finally {
      setSaving(false);
    }
  };

  const renderSharedConfigFields = () => (
    <>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
        <TextField
          select
          label="CEFR"
          value={languageLevel}
          onChange={(e) => setLanguageLevel(e.target.value)}
          size="small"
          fullWidth
          sx={muTextFieldSx}
        >
          {QUESTION_CEFR_LEVELS.map((level) => (
            <MenuItem key={level} value={level}>
              {level}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Kỹ năng"
          value={skill}
          onChange={(e) => setSkill(e.target.value)}
          size="small"
          fullWidth
          disabled={sourceMode === "vocabularySet"}
          sx={muTextFieldSx}
        >
          {BANK_AI_GEN_SKILL_OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value}>
              {o.label}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      <TextField
        select
        label="Danh mục"
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        size="small"
        fullWidth
        sx={muTextFieldSx}
      >
        <MenuItem value="">— Không chọn —</MenuItem>
        {categories.map((c) => (
          <MenuItem key={c.id} value={c.id}>
            {c.name}
          </MenuItem>
        ))}
      </TextField>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" }, gap: 2 }}>
        <TextField
          select
          label="Loại câu"
          value={questionType}
          onChange={(e) => setQuestionType(e.target.value as AiGenQuestionType)}
          size="small"
          fullWidth
          sx={muTextFieldSx}
        >
          {BANK_AI_GEN_QUESTION_TYPES.map((o) => (
            <MenuItem key={o.value} value={o.value}>
              {o.label}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Số câu"
          type="number"
          value={questionCount}
          onChange={(e) =>
            setQuestionCount(
              Math.max(1, Math.min(maxQuestionCountForVocab, Number(e.target.value) || 1)),
            )
          }
          size="small"
          fullWidth
          inputProps={{ min: 1, max: maxQuestionCountForVocab }}
          helperText={
            sourceMode === "vocabularySet" && vocabWordCount > 0
              ? `Tối đa ${maxQuestionCountForVocab} (2× số từ)`
              : undefined
          }
          sx={muTextFieldSx}
        />

        <TextField
          select
          label="Độ khó"
          value={String(difficulty)}
          onChange={(e) => setDifficulty(Number(e.target.value))}
          size="small"
          fullWidth
          sx={muTextFieldSx}
        >
          {DIFFICULTY_SAVE_OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value}>
              {o.label}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      <TextField
        select
        label="Trạng thái khi lưu"
        value={status}
        onChange={(e) => setStatus(e.target.value as QuestionStatus)}
        size="small"
        fullWidth
        sx={muTextFieldSx}
      >
        {STATUS_SAVE_OPTIONS.map((o) => (
          <MenuItem key={o.value} value={o.value}>
            {o.label}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        label="Ghi chú thêm cho AI"
        value={additionalInstructions}
        onChange={(e) => setAdditionalInstructions(e.target.value)}
        multiline
        minRows={2}
        fullWidth
        size="small"
        placeholder={
          sourceMode === "vocabularySet"
            ? "VD: Ưu tiên câu hỏi ngữ cảnh, dùng example sentences"
            : "VD: Focus on airport check-in, simple sentences"
        }
        sx={muTextFieldSx}
      />
    </>
  );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      fullScreen={isMobile && step === "processing"}
      className={`ai-gen-dialog ai-gen-dialog--question-bank${isMobile ? " ai-gen-dialog--mobile" : ""}`}
      PaperProps={{
        sx: {
          ...muDialogPaper,
          minHeight: !isMobile && (step === "processing" || step === "preview") ? 580 : undefined,
          maxWidth: isMobile ? "100%" : "920px",
          width: isMobile ? "100%" : "920px",
        },
      }}
    >
      <DialogTitle className="ai-gen-dialog__title" sx={{ pr: 6, position: "relative" }}>
        <AutoAwesomeOutlinedIcon className="ai-gen-dialog__title-icon" />
        <span className="ai-gen-dialog__title-text">AI Generate — Question Bank</span>
        <IconButton
          aria-label="Đóng"
          onClick={handleClose}
          disabled={isBusy || saving}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          display: "grid",
          gap: 2,
          minHeight: step === "processing" ? 420 : undefined,
        }}
      >
        {error ? (
          <Alert severity="error" onClose={() => setError("")}>
            {error}
          </Alert>
        ) : null}

        {step === "config" ? (
          <>
            <Tabs
              value={sourceMode}
              onChange={(_e, value: SourceMode) => {
                setSourceMode(value);
                setError("");
                if (value === "vocabularySet") {
                  setSkill("VOCABULARY");
                }
              }}
              variant="fullWidth"
              sx={{ minHeight: 40, borderBottom: 1, borderColor: "divider" }}
            >
              <Tab label="Chủ đề" value="topic" sx={{ minHeight: 40, textTransform: "none" }} />
              <Tab label="Từ bộ từ" value="vocabularySet" sx={{ minHeight: 40, textTransform: "none" }} />
            </Tabs>

            {sourceMode === "topic" ? (
              <>
                <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
                  Nhập chủ đề — AI sinh câu hỏi theo loại đã chọn. Xem trước và chọn câu trước khi lưu vào
                  ngân hàng (<strong>source=AI</strong>).
                </Typography>

                <TextField
                  label={
                    <>
                      Chủ đề <Box component="span" sx={{ color: "error.main" }}>*</Box>
                    </>
                  }
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  multiline
                  minRows={2}
                  fullWidth
                  size="small"
                  placeholder="VD: Travel and airports — A2 vocabulary"
                  sx={muTextFieldSx}
                />
              </>
            ) : (
              <QuestionBankAiGenVocabConfigStep
                selectedSetId={vocabularySetId}
                onSelectedSetIdChange={setVocabularySetId}
                onSetLoaded={setLoadedVocabSet}
              />
            )}

            {renderSharedConfigFields()}
          </>
        ) : null}

        {step === "processing" ? (
          <Box className="ai-gen-processing ai-gen-processing--question-bank">
            <AiGenProcessingDecorations />
            <AiGenProcessingPanel
              active
              progressMessage={progressMessage}
              progressPercent={progressPercent}
              elapsedSec={pollElapsedSec}
            />
            <Typography sx={{ fontSize: 12, color: "text.secondary", textAlign: "center" }}>
              {AI_TASK_PROCESSING_HINT}
            </Typography>
            <AiGenFunFactsPanel active />
          </Box>
        ) : null}

        {step === "preview" ? (
          <Box sx={{ maxHeight: 560, overflow: "auto", display: "grid", gap: 2, pr: 0.5 }}>
            <QuestionBankAiPreviewStep
              drafts={drafts}
              draftTitles={draftTitles}
              summaryMessage={summaryMessage}
              skippedUnsupported={skippedUnsupported}
              onDraftsChange={setDrafts}
              onDraftTitleChange={(tempId, title) =>
                setDraftTitles((prev) => ({ ...prev, [tempId]: title }))
              }
            />
          </Box>
        ) : null}
      </DialogContent>

      <DialogActions sx={muDialogFooter} className="ai-gen-dialog__footer">
        {step === "config" ? (
          <>
            <Button sx={muFooterBtnOutlined} onClick={handleClose}>
              Hủy
            </Button>
            <Button
              variant="contained"
              startIcon={<AutoAwesomeOutlinedIcon />}
              sx={muFooterBtnPrimary}
              onClick={() => void handleGenerate()}
            >
              Sinh câu hỏi
            </Button>
          </>
        ) : null}

        {step === "processing" ? (
          <Typography sx={{ fontSize: 12, color: "text.secondary", px: 1 }}>
            <Box component="span" sx={muFieldLabel}>
              Đang xử lý…
            </Box>{" "}
            {pollElapsedSec > 0 ? `${pollElapsedSec}s` : ""}
          </Typography>
        ) : null}

        {step === "preview" ? (
          <>
            <Button
              sx={muFooterBtnOutlined}
              disabled={saving}
              onClick={() => {
                setStep("config");
                setError("");
              }}
            >
              Quay lại
            </Button>
            <Button
              variant="contained"
              sx={muFooterBtnPrimary}
              disabled={saving || selectedCount < 1}
              onClick={() => void handleSave()}
            >
              {saving ? "Đang lưu…" : `Lưu ${selectedCount} câu vào Question Bank`}
            </Button>
          </>
        ) : null}
      </DialogActions>
    </Dialog>
  );
}

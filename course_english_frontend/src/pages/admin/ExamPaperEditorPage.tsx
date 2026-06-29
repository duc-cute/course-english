import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import TableViewOutlinedIcon from "@mui/icons-material/TableViewOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import {
  Alert,
  CircularProgress,
  Skeleton,
  TextField,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  type ExamPaperImportApplied,
} from "../../admin/components/exam/ExamPaperImportDialog";
import { ExamPaperAiFromDocDialog } from "../../admin/components/exam/ExamPaperAiFromDocDialog";
import { ExamPaperSettings, type ExamPaperSettingsValues } from "../../admin/components/exam/ExamPaperSettings";
import {
  ExamSectionImportDialog,
  type ExamSectionImportAppliedMeta,
  type ExamSectionImportFormat,
} from "../../admin/components/exam/ExamSectionImportDialog";
import { ExamSectionReadingParseDialog } from "../../admin/components/exam/ExamSectionReadingParseDialog";
import {
  ExamSectionListPanel,
  type ExamSectionDraft,
} from "../../admin/components/exam/ExamSectionListPanel";
import { ExerciseSetEditor } from "../../admin/components/exercise/ExerciseSetEditor";
import {
  apiGetExamPaperById,
  apiUpdateExamPaper,
  type ExamPaperRecord,
  type ExamSectionFormPayload,
  type ExamSectionRecord,
} from "../../shared/api/examPaper";
import type { QuestionType } from "../../shared/api/question";
import type { ApiResponse } from "../../shared/api/types";
import { paths } from "../../shared/constants/paths";
import { useFeatureFlags } from "../../shared/featureFlags/useFeatureFlags";
import { buildExerciseSetPayloadJson } from "../../shared/lesson/exercisePayload";
import {
  countExamPaperWordExportable,
  downloadExamPaperWord,
  type ExerciseWordExportMode,
} from "../../shared/lesson/exerciseWordExport";
import {
  createEmptySectionState,
  type ExamSectionTemplate,
} from "../../shared/lesson/examSectionTemplates";
import { parseExerciseSetPayload } from "../../student/lessonPlayer/exercise/parseExerciseSet";

function newClientKey(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `sec-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function mapSectionFromApi(section: ExamSectionRecord): ExamSectionDraft {
  return {
    clientKey: section.id ?? newClientKey(),
    id: section.id,
    title: section.title,
    instruction: section.instruction,
    questionType: section.questionType,
    payloadJson: section.payloadJson,
  };
}

function mergeSectionMetaIntoPayload(
  payloadJson: string,
  title?: string,
  instruction?: string,
): string {
  const parsed = parseExerciseSetPayload(payloadJson);
  return buildExerciseSetPayloadJson({
    ...parsed,
    title: title?.trim() || parsed.title,
    instruction: instruction?.trim() || parsed.instruction,
  });
}

function inferQuestionTypeFromPayload(payloadJson: string): QuestionType | undefined {
  try {
    const parsed = parseExerciseSetPayload(payloadJson);
    const first = parsed.questions[0];
    return first?.type as QuestionType | undefined;
  } catch {
    return undefined;
  }
}

function draftFromTemplate(template?: ExamSectionTemplate): ExamSectionDraft {
  const base = createEmptySectionState(template);
  return { clientKey: newClientKey(), ...base };
}

function countTotalQuestions(sections: ExamSectionDraft[]): number {
  return sections.reduce((sum, s) => {
    try {
      return sum + parseExerciseSetPayload(s.payloadJson).questions.length;
    } catch {
      return sum;
    }
  }, 0);
}

export function ExamPaperEditorPage() {
  const { examPaperId } = useParams<{ examPaperId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sectionSaving, setSectionSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [settings, setSettings] = useState<ExamPaperSettingsValues>({
    title: "",
    status: "DRAFT",
    passScorePercent: 80,
  });
  const [sections, setSections] = useState<ExamSectionDraft[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [sectionImportOpen, setSectionImportOpen] = useState(false);
  const [sectionImportFormat, setSectionImportFormat] = useState<ExamSectionImportFormat>("excel");
  const [readingParseOpen, setReadingParseOpen] = useState(false);
  const [aiFromDocOpen, setAiFromDocOpen] = useState(false);
  const [wordExporting, setWordExporting] = useState(false);
  const { flags } = useFeatureFlags();

  const activeSection = sections[activeIndex] ?? null;
  const totalQuestions = useMemo(() => countTotalQuestions(sections), [sections]);

  const loadPaper = useCallback(async () => {
    if (!examPaperId) return;
    setLoading(true);
    setError("");
    try {
      const response = (await apiGetExamPaperById(examPaperId)) as ApiResponse<ExamPaperRecord>;
      const paper = response?.result ?? response?.data ?? null;
      if (!paper) {
        setError("Không tìm thấy đề thi.");
        return;
      }
      setSettings({
        title: paper.title ?? "",
        instruction: paper.instruction,
        durationMinutes: paper.durationMinutes,
        passScorePercent: paper.passScorePercent ?? 80,
        status: paper.status ?? "DRAFT",
      });
      const mapped = (paper.sections ?? []).map(mapSectionFromApi);
      setSections(mapped);
      setActiveIndex(0);
    } catch (err) {
      setError((err as { message?: string })?.message || "Không thể tải đề thi.");
    } finally {
      setLoading(false);
    }
  }, [examPaperId]);

  useEffect(() => {
    void loadPaper();
  }, [loadPaper]);

  const buildSectionsPayload = useCallback((): ExamSectionFormPayload[] => {
    return sections.map((section, index) => {
      const payloadJson = mergeSectionMetaIntoPayload(
        section.payloadJson,
        section.title,
        section.instruction,
      );
      const questionType = section.questionType ?? inferQuestionTypeFromPayload(payloadJson);
      return {
        id: section.id,
        title: section.title?.trim() || undefined,
        instruction: section.instruction?.trim() || undefined,
        questionType,
        displayOrder: index,
        payloadJson,
      };
    });
  }, [sections]);

  const savePaper = async () => {
    if (!examPaperId) return;
    if (!settings.title?.trim()) {
      setError("Tên đề thi không được để trống.");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await apiUpdateExamPaper(examPaperId, {
        title: settings.title.trim(),
        instruction: settings.instruction?.trim() || undefined,
        durationMinutes: settings.durationMinutes,
        passScorePercent: settings.passScorePercent,
        status: settings.status,
        sections: buildSectionsPayload(),
      });
      setMessage("Đã lưu đề thi.");
      await loadPaper();
    } catch (err) {
      setError((err as { message?: string })?.message || "Không thể lưu đề thi.");
    } finally {
      setSaving(false);
    }
  };

  const updateActiveSection = (patch: Partial<ExamSectionDraft>) => {
    setSections((prev) =>
      prev.map((section, index) => (index === activeIndex ? { ...section, ...patch } : section)),
    );
  };

  const handleSectionPayloadSave = async (payloadJson: string) => {
    setSectionSaving(true);
    try {
      const questionType = inferQuestionTypeFromPayload(payloadJson);
      updateActiveSection({ payloadJson, questionType });
      setMessage("Đã cập nhật câu hỏi phần này (chưa lưu lên server — bấm Lưu đề để ghi).");
    } finally {
      setSectionSaving(false);
    }
  };

  const handleSectionImportApplied = (applied: ExamSectionImportAppliedMeta) => {
    const questionType = inferQuestionTypeFromPayload(applied.payloadJson) ?? "MULTIPLE_CHOICE";
    updateActiveSection({
      payloadJson: applied.payloadJson,
      questionType,
      ...(applied.title !== undefined ? { title: applied.title } : {}),
      ...(applied.instruction !== undefined ? { instruction: applied.instruction } : {}),
    });
    setMessage(
      "Đã import câu hỏi vào phần này (chưa lưu lên server — bấm Lưu đề để ghi).",
    );
  };

  const handleReadingParseApplied = (payloadJson: string) => {
    updateActiveSection({
      payloadJson,
      questionType: "READING_COMPREHENSION",
    });
    setMessage("Đã parse block Reading vào section hiện tại (chưa lưu server — bấm Lưu đề).");
  };

  const handlePaperImportApplied = (applied: ExamPaperImportApplied) => {
    setSections(applied.sections);
    setActiveIndex(0);
    if (applied.updatePaperMeta) {
      setSettings((prev) => ({
        ...prev,
        ...(applied.examTitle ? { title: applied.examTitle } : {}),
        ...(applied.paperInstruction !== undefined
          ? { instruction: applied.paperInstruction }
          : {}),
      }));
    }
    setMessage(
      `Đã import ${applied.sections.length} phần từ file (chưa lưu lên server — bấm Lưu đề để ghi).`,
    );
  };

  const addFromTemplate = (template: ExamSectionTemplate) => {
    const draft = draftFromTemplate(template);
    setSections((prev) => {
      const next = [...prev, draft];
      setActiveIndex(next.length - 1);
      return next;
    });
  };

  const addEmpty = () => {
    const draft = draftFromTemplate();
    setSections((prev) => {
      const next = [...prev, draft];
      setActiveIndex(next.length - 1);
      return next;
    });
  };

  const removeSection = (index: number) => {
    setSections((prev) => {
      const next = prev.filter((_, i) => i !== index);
      setActiveIndex((current) => {
        if (next.length === 0) return 0;
        if (current >= next.length) return next.length - 1;
        if (current > index) return current - 1;
        return current;
      });
      return next;
    });
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= sections.length) return;
    setSections((prev) => {
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return next;
    });
    setActiveIndex((current) => {
      if (current === index) return target;
      if (current === target) return index;
      return current;
    });
  };

  const editorPayloadJson = useMemo(() => {
    if (!activeSection) return "";
    return mergeSectionMetaIntoPayload(
      activeSection.payloadJson,
      activeSection.title,
      activeSection.instruction,
    );
  }, [activeSection]);

  const wordExportSections = useMemo(
    () =>
      sections.map((section) => ({
        title: section.title,
        instruction: section.instruction,
        payload: parseExerciseSetPayload(
          mergeSectionMetaIntoPayload(section.payloadJson, section.title, section.instruction),
        ),
      })),
    [sections],
  );

  const wordExportStats = useMemo(
    () => countExamPaperWordExportable(wordExportSections),
    [wordExportSections],
  );

  const handleExportWord = async (mode: ExerciseWordExportMode) => {
    if (wordExportStats.exportable === 0) {
      setError("Không có câu hỏi nào hỗ trợ xuất Word trong đề này.");
      return;
    }
    setWordExporting(true);
    setError("");
    try {
      const result = await downloadExamPaperWord(
        settings.title,
        settings.instruction,
        wordExportSections,
        mode,
        {
          logoUrl: flags.wordExportLogoUrl,
          watermarkText: flags.wordExportWatermarkText,
        },
      );
      if (!result.ok) {
        setError(result.error ?? "Không thể xuất Word.");
        return;
      }
      const skippedNote =
        result.skippedCount > 0
          ? ` (${result.skippedCount} câu bỏ qua: ${result.skippedTypeLabels.join(", ")})`
          : "";
      setMessage(`Đã tải Word — ${result.exportedCount} câu${skippedNote}.`);
    } catch (err) {
      setError((err as { message?: string })?.message || "Không thể xuất Word.");
    } finally {
      setWordExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="exam-editor-page">
        <div className="exam-editor-loading">
          <Skeleton height={48} sx={{ mb: 2, borderRadius: "12px" }} />
          <Skeleton height={160} sx={{ mb: 2, borderRadius: "16px" }} />
          <Skeleton height={400} sx={{ borderRadius: "16px" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="exam-editor-page">
      <header className="exam-editor-header">
        <div className="exam-editor-breadcrumb">
          <button
            type="button"
            className="exam-editor-breadcrumb__back"
            onClick={() => navigate(`/${paths.ADMIN}/${paths.MANAGE_EXAM_PAPERS}`)}
          >
            <ArrowBackIcon sx={{ fontSize: 16 }} />
            Danh sách đề
          </button>
          <span className="exam-editor-breadcrumb__sep">/</span>
          <span className="exam-editor-breadcrumb__current">Soạn đề thi</span>
        </div>

        <div className="exam-editor-header-actions">
          <button
            type="button"
            className="exam-editor-btn exam-editor-btn--outlined"
            disabled={wordExporting || wordExportStats.exportable === 0}
            onClick={() => void handleExportWord("worksheet")}
          >
            <DescriptionOutlinedIcon />
            {wordExporting ? "Đang xuất..." : "Word — Đề"}
          </button>
          <button
            type="button"
            className="exam-editor-btn exam-editor-btn--outlined"
            disabled={wordExporting || wordExportStats.exportable === 0}
            onClick={() => void handleExportWord("answer_key")}
          >
            Word — Đáp án
          </button>
          <button
            type="button"
            className="exam-editor-btn exam-editor-btn--primary"
            disabled={saving}
            onClick={() => void savePaper()}
          >
            {saving ? (
              <CircularProgress size={14} color="inherit" />
            ) : (
              <SaveOutlinedIcon />
            )}
            {saving ? "Đang lưu..." : "Lưu đề thi"}
          </button>
        </div>
      </header>

      <div className="exam-editor-body">
        <div className="exam-editor-container">
          {error ? (
            <Alert className="exam-editor-alert" severity="error" onClose={() => setError("")}>
              {error}
            </Alert>
          ) : null}
          {message ? (
            <Alert className="exam-editor-alert" severity="success" onClose={() => setMessage("")}>
              {message}
            </Alert>
          ) : null}

          <div className="exam-editor-intro">
            <h2>Thiết lập cấu trúc đề</h2>
            <p>Điền thông tin cơ bản và bắt đầu thêm các phần câu hỏi.</p>
          </div>

          <ExamPaperSettings
            settings={settings}
            onChange={(patch) => setSettings((s) => ({ ...s, ...patch }))}
          />

          <div className="exam-editor-questions-card">
            <div className="exam-editor-questions-header">
              <h3>Nội dung câu hỏi</h3>
              <div className="exam-editor-badges">
                <span className="exam-editor-badge">{sections.length} phần</span>
                <span className="exam-editor-badge">{totalQuestions} câu hỏi</span>
              </div>
            </div>

            <div
              className={`exam-editor-questions-body${
                sections.length > 0 ? " exam-editor-questions-body--split" : ""
              }`}
            >
              {sections.length === 0 ? (
                <div className="exam-editor-empty">
                  <div className="exam-editor-empty__icon">
                    <Inventory2OutlinedIcon />
                  </div>
                  <h4>Đề thi chưa có câu hỏi nào</h4>
                  <p>
                    Bắt đầu bằng cách tạo một phần thi (Section) trống hoặc tự động sinh câu hỏi bằng
                    trí tuệ nhân tạo.
                  </p>
                  <div className="exam-editor-empty__actions">
                    <button
                      type="button"
                      className="exam-editor-btn exam-editor-btn--ghost-dashed"
                      onClick={() => setAiFromDocOpen(true)}
                    >
                      ✨ Sinh bằng AI
                    </button>
                    <button
                      type="button"
                      className="exam-editor-btn exam-editor-btn--accent"
                      onClick={addEmpty}
                    >
                      <AddCircleOutlineIcon sx={{ fontSize: 16 }} />
                      Thêm Section mới
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <ExamSectionListPanel
                    sections={sections}
                    activeIndex={activeIndex}
                    onSelect={setActiveIndex}
                    onAddFromTemplate={addFromTemplate}
                    onAddEmpty={addEmpty}
                    onRemove={removeSection}
                    onMove={moveSection}
                  />

                  <div className="exam-editor-section-editor">
                    {activeSection ? (
                      <>
                        <div className="exam-editor-section-editor__fields">
                          <div className="exam-editor-field">
                            <label className="exam-editor-label">Tiêu đề phần (I, II, III…)</label>
                            <TextField
                              hiddenLabel
                              size="small"
                              fullWidth
                              className="exam-editor-field"
                              value={activeSection.title ?? ""}
                              onChange={(e) => updateActiveSection({ title: e.target.value })}
                              placeholder="II. SYNONYMS"
                            />
                          </div>
                          <div className="exam-editor-field">
                            <label className="exam-editor-label">Hướng dẫn phần</label>
                            <TextField
                              hiddenLabel
                              size="small"
                              fullWidth
                              multiline
                              minRows={2}
                              className="exam-editor-field"
                              value={activeSection.instruction ?? ""}
                              onChange={(e) => updateActiveSection({ instruction: e.target.value })}
                            />
                          </div>
                          <div className="exam-editor-section-editor__toolbar">
                            {(activeSection.questionType ??
                              inferQuestionTypeFromPayload(activeSection.payloadJson)) ===
                            "READING_COMPREHENSION" ? (
                              <button
                                type="button"
                                className="exam-editor-btn exam-editor-btn--outlined"
                                onClick={() => setReadingParseOpen(true)}
                              >
                                <AutoAwesomeOutlinedIcon />
                                AI Reading
                              </button>
                            ) : null}
                            <button
                              type="button"
                              className="exam-editor-btn exam-editor-btn--outlined"
                              onClick={() => {
                                setSectionImportFormat("excel");
                                setSectionImportOpen(true);
                              }}
                            >
                              <TableViewOutlinedIcon />
                              Import Excel
                            </button>
                            <button
                              type="button"
                              className="exam-editor-btn exam-editor-btn--outlined"
                              onClick={() => {
                                setSectionImportFormat("csv");
                                setSectionImportOpen(true);
                              }}
                            >
                              <UploadFileOutlinedIcon />
                              Import CSV
                            </button>
                          </div>
                        </div>
                        <ExerciseSetEditor
                          key={activeSection.clientKey}
                          payloadJson={editorPayloadJson}
                          saving={sectionSaving}
                          onSave={handleSectionPayloadSave}
                          onCancel={() => undefined}
                          hideSettingsAccordion
                          hideCancel
                          hideAuthoringFooter
                          saveLabel="Cập nhật câu hỏi"
                        />
                      </>
                    ) : null}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {activeSection ? (
        <ExamSectionImportDialog
          open={sectionImportOpen}
          format={sectionImportFormat}
          expectedQuestionType={
            activeSection.questionType ?? inferQuestionTypeFromPayload(activeSection.payloadJson)
          }
          sectionTitle={activeSection.title}
          sectionInstruction={activeSection.instruction}
          currentPayloadJson={editorPayloadJson}
          onClose={() => setSectionImportOpen(false)}
          onApplied={handleSectionImportApplied}
        />
      ) : null}

      {activeSection ? (
        <ExamSectionReadingParseDialog
          open={readingParseOpen}
          sectionTitle={activeSection.title}
          sectionInstruction={activeSection.instruction}
          onClose={() => setReadingParseOpen(false)}
          onApplied={handleReadingParseApplied}
        />
      ) : null}

      <ExamPaperAiFromDocDialog
        open={aiFromDocOpen}
        newClientKey={newClientKey}
        onClose={() => setAiFromDocOpen(false)}
        onApplied={handlePaperImportApplied}
      />
    </div>
  );
}

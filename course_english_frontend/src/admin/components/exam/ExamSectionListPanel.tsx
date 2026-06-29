import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { IconButton, MenuItem, TextField, Tooltip, Typography } from "@mui/material";
import type { QuestionType } from "../../../shared/api/question";
import {
  EXAM_SECTION_TEMPLATES,
  type ExamSectionTemplate,
} from "../../../shared/lesson/examSectionTemplates";
import { parseExerciseSetPayload } from "../../../student/lessonPlayer/exercise/parseExerciseSet";
import { useState } from "react";
import { muSelectFilterInputLabelProps } from "../../../pages/admin/manageUserUiStyles";

export type ExamSectionDraft = {
  clientKey: string;
  id?: string;
  title?: string;
  instruction?: string;
  questionType?: QuestionType;
  payloadJson: string;
  /** Khóa ổn định khi merge import cả đề */
  importKey?: string;
};

type ExamSectionListPanelProps = {
  sections: ExamSectionDraft[];
  activeIndex: number;
  onSelect: (index: number) => void;
  onAddFromTemplate: (template: ExamSectionTemplate) => void;
  onAddEmpty: () => void;
  onRemove: (index: number) => void;
  onMove: (index: number, direction: -1 | 1) => void;
};

function sectionQuestionCount(payloadJson: string): number {
  try {
    return parseExerciseSetPayload(payloadJson).questions.length;
  } catch {
    return 0;
  }
}

function typeLabel(type?: QuestionType): string {
  if (!type) return "—";
  const labels: Record<QuestionType, string> = {
    MULTIPLE_CHOICE: "Trắc nghiệm",
    LISTEN_CHOOSE: "Nghe chọn",
    SPELLING: "Gõ chính tả",
    LISTEN_TYPE: "Nghe gõ",
    FILL_BLANK: "Điền khuyết",
    GAP_FILL_MCQ: "Chọn điền khuyết",
    READING_COMPREHENSION: "Đọc hiểu",
    REORDER_SENTENCE: "Sắp xếp câu",
    MATCHING: "Ghép cặp",
    TRUE_FALSE: "Đúng/Sai",
  };
  return labels[type] ?? type;
}

export function ExamSectionListPanel({
  sections,
  activeIndex,
  onSelect,
  onAddFromTemplate,
  onAddEmpty,
  onRemove,
  onMove,
}: ExamSectionListPanelProps) {
  const [templateKey, setTemplateKey] = useState("");

  return (
    <div className="exam-editor-section-panel">
      <div className="exam-editor-section-panel__head">
        <p className="exam-editor-section-panel__head-title">Các phần ({sections.length})</p>
        <TextField
          select
          size="small"
          fullWidth
          className="exam-editor-field"
          value={templateKey}
          label="Thêm từ mẫu"
          InputLabelProps={muSelectFilterInputLabelProps}
          onChange={(e) => {
            const key = e.target.value;
            if (!key) return;
            const template = EXAM_SECTION_TEMPLATES.find((t) => t.key === key);
            if (template) onAddFromTemplate(template);
            setTemplateKey("");
          }}
          SelectProps={{
            displayEmpty: true,
            renderValue: (selected) => {
              if (!selected) {
                return (
                  <Typography component="span" sx={{ fontSize: 13, color: "#94a3b8" }}>
                    Chọn mẫu section…
                  </Typography>
                );
              }
              return EXAM_SECTION_TEMPLATES.find((t) => t.key === selected)?.label ?? selected;
            },
          }}
        >
          {EXAM_SECTION_TEMPLATES.map((t) => (
            <MenuItem key={t.key} value={t.key}>
              {t.label}
            </MenuItem>
          ))}
        </TextField>
        <button
          type="button"
          className="exam-editor-btn exam-editor-btn--accent"
          style={{ width: "100%", marginTop: 12, justifyContent: "center" }}
          onClick={onAddEmpty}
        >
          <AddCircleOutlineIcon />
          Thêm Section mới
        </button>
      </div>

      <ul className="exam-editor-section-list">
        {sections.map((section, index) => {
          const active = index === activeIndex;
          const count = sectionQuestionCount(section.payloadJson);
          return (
            <li key={section.clientKey}>
              <div
                className={`exam-editor-section-item${active ? " exam-editor-section-item--active" : ""}`}
                onClick={() => onSelect(index)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(index);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className="exam-editor-section-item__main">
                  <div className="exam-editor-section-item__title">
                    {section.title?.trim() || `Phần ${index + 1}`}
                  </div>
                  <div className="exam-editor-section-item__meta">
                    <span className="exam-editor-section-chip">{typeLabel(section.questionType)}</span>
                    <span className="exam-editor-section-chip exam-editor-section-chip--outlined">
                      {count} câu
                    </span>
                  </div>
                </div>
                <div className="exam-editor-section-item__actions">
                  <Tooltip title="Lên">
                    <span>
                      <IconButton
                        size="small"
                        disabled={index === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          onMove(index, -1);
                        }}
                      >
                        <ArrowUpwardIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Xuống">
                    <span>
                      <IconButton
                        size="small"
                        disabled={index === sections.length - 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          onMove(index, 1);
                        }}
                      >
                        <ArrowDownwardIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Xóa phần">
                    <IconButton
                      size="small"
                      color="error"
                      disabled={sections.length <= 1}
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(index);
                      }}
                    >
                      <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

import { MenuItem, TextField } from "@mui/material";
import type { ReactNode } from "react";
import type { ExamPaperStatus } from "../../../shared/api/examPaper";

export type ExamPaperSettingsValues = {
  title: string;
  instruction?: string;
  durationMinutes?: number;
  passScorePercent?: number;
  status?: ExamPaperStatus;
};

type ExamPaperSettingsProps = {
  settings: ExamPaperSettingsValues;
  onChange: (patch: Partial<ExamPaperSettingsValues>) => void;
};

function FieldLabel({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <label className="exam-editor-label">
      {children}
      {required ? <span className="exam-editor-required"> *</span> : null}
    </label>
  );
}

export function ExamPaperSettings({ settings, onChange }: ExamPaperSettingsProps) {
  return (
    <div className="exam-editor-settings-grid">
      <div className="exam-editor-card">
        <h3 className="exam-editor-card__title">
          <span className="exam-editor-card__dot exam-editor-card__dot--primary" />
          Thông tin chung
        </h3>
        <div className="exam-editor-fields">
          <div className="exam-editor-field">
            <FieldLabel required>Tên đề thi</FieldLabel>
            <TextField
              hiddenLabel
              size="small"
              fullWidth
              required
              placeholder="Nhập tên đề thi..."
              value={settings.title ?? ""}
              onChange={(e) => onChange({ title: e.target.value })}
            />
          </div>
          <div className="exam-editor-field">
            <FieldLabel>Hướng dẫn toàn đề (Tùy chọn)</FieldLabel>
            <TextField
              hiddenLabel
              size="small"
              fullWidth
              multiline
              minRows={3}
              placeholder="Nhập lời khuyên hoặc hướng dẫn làm bài cho học sinh..."
              value={settings.instruction ?? ""}
              onChange={(e) => onChange({ instruction: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="exam-editor-card">
        <h3 className="exam-editor-card__title">
          <span className="exam-editor-card__dot exam-editor-card__dot--orange" />
          Cài đặt
        </h3>
        <div className="exam-editor-fields">
          <div className="exam-editor-field exam-editor-field-suffix">
            <FieldLabel>Thời gian làm bài</FieldLabel>
            <TextField
              hiddenLabel
              size="small"
              fullWidth
              type="number"
              inputProps={{ min: 1 }}
              placeholder="0"
              value={settings.durationMinutes ?? ""}
              onChange={(e) =>
                onChange({
                  durationMinutes: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            />
            <span className="exam-editor-field-suffix__unit">phút</span>
          </div>
          <div className="exam-editor-field exam-editor-field-suffix">
            <FieldLabel>Điểm đạt (Pass)</FieldLabel>
            <TextField
              hiddenLabel
              size="small"
              fullWidth
              type="number"
              inputProps={{ min: 0, max: 100 }}
              value={settings.passScorePercent ?? 80}
              onChange={(e) => onChange({ passScorePercent: Number(e.target.value) })}
            />
            <span className="exam-editor-field-suffix__unit">%</span>
          </div>
          <div className="exam-editor-field exam-editor-field--select">
            <FieldLabel>Trạng thái xuất bản</FieldLabel>
            <TextField
              hiddenLabel
              size="small"
              select
              fullWidth
              value={settings.status ?? "DRAFT"}
              onChange={(e) => onChange({ status: e.target.value as ExamPaperStatus })}
            >
              <MenuItem value="DRAFT">Bản nháp</MenuItem>
              <MenuItem value="PUBLISHED">Xuất bản</MenuItem>
              <MenuItem value="ARCHIVED">Lưu trữ</MenuItem>
            </TextField>
          </div>
          <p className="exam-editor-hint">
            Mỗi phần bên dưới = một section (I, II, III…) với instruction và cùng một loại câu hỏi.
          </p>
        </div>
      </div>
    </div>
  );
}

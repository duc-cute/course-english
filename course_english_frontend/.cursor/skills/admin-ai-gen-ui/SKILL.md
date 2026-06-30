---
name: admin-ai-gen-ui
description: >-
  Course English admin AI generation UI — gradient AI CTA button, ai-gen-dialog
  shell, processing panel (mascot, progress bar, fun facts). Canonical ref
  admin-ai-gen-question.css, AiGenProcessingPanel, ExerciseAuthoringFooter.
  Use when adding AI gen buttons/dialogs (sinh câu, sinh đề, đề tương tự),
  AI processing popup, or user asks AI button gradient / Lumina AI style.
disable-model-invocation: true
---

# Admin AI Generation UI (Lumina / gradient AI)

## Goal

Style **mọi luồng sinh nội dung bằng AI** trong admin: nút CTA gradient tím–xanh, dialog `ai-gen-dialog`, bước chờ có mascot + fun facts carousel.

**Chỉ đổi UI** — giữ nguyên poll task, API, Formik.

**Canonical reference:**

| Thành phần | File |
| ---------- | ---- |
| CSS chính | `src/styles/admin-ai-gen-question.css` |
| Processing + mascot + fun facts | `src/admin/components/exercise/AiGenProcessingPanel.tsx` |
| Fun facts data | `src/shared/ai/questionGen/aiGenFunFacts.ts` |
| Poll constants | `src/shared/ai/questionGen/aiTaskPolling.ts` |
| Footer nút AI (soạn bài) | `src/admin/components/exercise/ExerciseAuthoringFooter.tsx` |
| Dialog sinh đề file | `src/admin/components/exam/ExamPaperAiFromDocDialog.tsx` |
| Dialog đề tương tự | `src/admin/components/exam/ExamPaperSimilarAiDialog.tsx` |
| Nút AI trên editor đề | `exam-editor-btn--ai` trong `src/styles/admin-exam-paper-editor.css` |

**Không dùng** gradient AI cho nút Lưu / CRUD thường — dùng `exam-editor-btn--primary` (`#0052cc`) theo `admin-exam-editor-ui`.

---

## Design tokens (AI mode)

| Token | Giá trị | Dùng cho |
| ----- | ------- | -------- |
| AI gradient default | `linear-gradient(135deg, #6366f1 0%, #2563eb 55%, #7c3aed 100%)` | Nút CTA AI |
| AI gradient hover | `linear-gradient(135deg, #4f46e5 0%, #1d4ed8 55%, #6d28d9 100%)` | Hover |
| AI shadow | `0 2px 8px rgba(37, 99, 235, 0.3)` | Nút default |
| AI shadow hover | `0 3px 12px rgba(37, 99, 235, 0.4)` | Hover |
| AI text / icon | `#fff` | Chữ + `AutoAwesomeOutlinedIcon` |
| AI accent (dialog title icon) | `#2563eb` | `.ai-gen-dialog__title-icon` |
| Progress bar fill | `#3b82f6 → #6366f1 → #a855f7` | `.ai-gen-processing__bar-fill` |
| Disabled AI btn | gradient `#a5b4fc → #93c5fd`, opacity 0.65 | `.ai-gen-footer-ai-btn.Mui-disabled` |

**Secondary AI action** (sinh từ tài liệu, không phải auto-gen): class `ai-gen-footer-ai-btn` **không** kèm gradient đặc biệt — hoặc outlined xanh nhạt; CTA chính luôn gradient.

---

## Nút AI — 3 pattern

### 1. Footer soạn bài (MUI `Button`)

```tsx
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";

<Button
  size="small"
  startIcon={<AutoAwesomeOutlinedIcon />}
  className="ai-gen-footer-ai-btn"
  sx={{
    borderRadius: "6px",
    padding: "3px 12px",
    fontSize: 12,
    fontWeight: 600,
    minHeight: 28,
    textTransform: "none",
  }}
  onClick={onAiAutoGen}
>
  Sinh bài tập tự động bằng AI
</Button>
```

- Class `ai-gen-footer-ai-btn` trong `admin-ai-gen-question.css` — **gradient là nguồn đúng**.
- **Không** override `bgcolor` solid trong `sx` (tránh che gradient). Ref: `ExerciseAuthoringFooter.tsx`.

### 2. Header / shell editor đề (native `<button>`)

```tsx
<button
  type="button"
  className="exam-editor-btn exam-editor-btn--ai"
  onClick={openAiDialog}
>
  <AutoAwesomeOutlinedIcon />
  Tạo đề tương tự
</button>
```

- Base layout: `exam-editor-btn` (padding 8×16, radius 8px, font 13px/600).
- Modifier: `exam-editor-btn--ai` — **cùng gradient** với `ai-gen-footer-ai-btn`.
- Ref: `ExamPaperEditorPage.tsx`.

### 3. Icon-only compact (footer mobile)

```tsx
<IconButton
  className="ai-gen-footer-ai-btn ai-gen-footer-ai-btn--icon"
  sx={{ width: 40, height: 40, borderRadius: "8px" }}
  aria-label="Sinh bài tập tự động bằng AI"
>
  <AutoAwesomeOutlinedIcon sx={{ fontSize: 20 }} />
</IconButton>
```

---

## Dialog shell

```tsx
<Dialog
  open={open}
  onClose={handleClose}
  maxWidth="lg"
  fullWidth
  fullScreen={isMobile}
  className={`ai-gen-dialog ai-gen-dialog--<variant>${isMobile ? " ai-gen-dialog--mobile" : ""}`}
  PaperProps={{
    sx: {
      ...muDialogPaper,
      minHeight: isMobile ? "100%" : processing ? 580 : undefined,
      maxWidth: isMobile ? "100%" : "920px",
    },
  }}
>
  <DialogTitle className="ai-gen-dialog__title">
    <AutoAwesomeOutlinedIcon className="ai-gen-dialog__title-icon" />
    <span className="ai-gen-dialog__title-text">AI — …</span>
  </DialogTitle>
  <DialogContent dividers sx={{ p: isMobile ? 1.5 : 2.5 }}>
    …
  </DialogContent>
</Dialog>
```

**Variant class** (chọn một):

| Class | Dùng khi |
| ----- | -------- |
| `ai-gen-dialog--exam-paper` | Sinh đề từ Word/PDF |
| `ai-gen-dialog--exam-similar` | Tạo đề tương tự |
| `ai-auto-gen-dialog` | Sinh bài tập auto (topic) |

Processing step: **920px** desktop, **minHeight 580** khi đang chờ — tránh popup bé.

---

## Bước “Đang sinh” (processing)

```tsx
<Box className="ai-gen-processing ai-gen-processing--<variant>" sx={{ position: "relative", minHeight: 360 }}>
  <AiGenProcessingDecorations />
  <AiGenProcessingPanel
    progressMessage={progressMessage}
    progressPercent={progressPercent}
    elapsedSec={pollElapsedSec}
    active={processing}
  />
  <AiGenFunFactsPanel active={processing} />
</Box>
```

- `--variant`: `auto` | `exam-paper` | `exam-similar` — mỗi variant có full-bleed fun facts trong CSS.
- **Không** thêm Typography tiêu đề trùng — `AiGenProcessingPanel` đã có hero “AI đang làm việc cho bạn ✨”.
- Footer hint: `AI_EXAM_PAPER_PROCESSING_HINT` hoặc `AI_TASK_PROCESSING_HINT` từ `aiTaskPolling.ts`.
- Poll exam paper: `AI_EXAM_PAPER_POLL_MAX_MS` (660s), không dùng `AI_TASK_POLL_MAX_MS` (300s).

**Assets:** `/images/mascot.png`, sparkles, AI⁺ badge — trong `AiGenProcessingDecorations`.

---

## Thêm nút AI mới — checklist

- [ ] CTA chính → gradient (`ai-gen-footer-ai-btn` hoặc `exam-editor-btn--ai`)
- [ ] Icon `AutoAwesomeOutlinedIcon`, text trắng
- [ ] Dialog `ai-gen-dialog` + variant class + 920px khi có processing
- [ ] Processing: `AiGenProcessingDecorations` + `AiGenProcessingPanel` + `AiGenFunFactsPanel`
- [ ] CSS processing full-bleed nếu variant mới → copy block từ `exam-paper` / `exam-similar` trong `admin-ai-gen-question.css`
- [ ] Không mix nút Lưu gradient — Lưu giữ `#0052cc` flat

---

## Anti-patterns

| Tránh | Làm |
| ----- | --- |
| `exam-editor-btn--primary` cho “Sinh bằng AI” | `exam-editor-btn--ai` |
| `exam-editor-btn--outlined` cho CTA AI chính | Gradient AI class |
| `maxWidth="sm"` dialog có fun facts | `lg` + `920px` |
| `sx={{ bgcolor: "#2563eb" }}` trên `ai-gen-footer-ai-btn` | Để CSS gradient |
| Tiêu đề + hint trùng trên processing panel | Chỉ `AiGenProcessingPanel` |
| Poll 5 phút cho sinh đề nhiều section | `AI_EXAM_PAPER_POLL_MAX_MS` |

---

## Related

- Editor shell slate / `#0052cc`: `.cursor/skills/admin-exam-editor-ui/SKILL.md`
- Catalog list pages: `.cursor/skills/admin-catalog-soft-ui/SKILL.md`
- Design mockup gốc: `Design/UI_gen_ques/`, `promt.md`

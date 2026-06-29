---
name: admin-exam-editor-ui
description: >-
  Course English admin editor UI — Inter font, slate palette, primary #0052cc,
  sticky header, 2-column settings cards, section list + editor split.
  Canonical ref ExamPaperEditorPage + admin-exam-paper-editor.css + promt.md.
  Use when styling admin editor/authoring pages (đề thi, soạn bài, form dài),
  user likes promt.md mockup, or asks exam-editor / slate / #0052cc style.
disable-model-invocation: true
---

# Admin Exam Editor UI (Slate / Inter)

## Goal

Style **admin editor / authoring** pages (soạn đề, soạn nội dung dài) theo mockup `promt.md`: nền slate nhạt, primary xanh `#0052cc`, font Inter, card bo 16px, header sticky, form label ngoài input.

**Chỉ đổi UI** — giữ nguyên logic save, import, dialog, API.

**Canonical reference:**
- Page: `src/pages/admin/ExamPaperEditorPage.tsx`
- CSS: `src/styles/admin-exam-paper-editor.css` (import trong `index.css`)
- Mockup: `promt.md` (root repo)
- Settings form: `src/admin/components/exam/ExamPaperSettings.tsx`
- Section panel: `src/admin/components/exam/ExamSectionListPanel.tsx`

**Không dùng** cho: trang danh mục CRUD list (`admin-catalog-soft-ui`), EMR compact (`emr-disclosure-ui-style`).

---

## Khi nào dùng style này vs catalog soft

| Style | Trang | Shell | Primary |
| ----- | ----- | ----- | ------- |
| **Exam editor** | Soạn đề, editor dài, wizard form | `exam-editor-page`, sticky header | `#0052cc` flat |
| Catalog soft | Manage* list/search | `admin-catalog-page` | `--ac-primary` |

---

## Design tokens

| Token | Giá trị | Dùng cho |
| ----- | ------- | -------- |
| Font | `Inter`, antialiased | Toàn trang |
| Page bg | `#f8fafc` | `.exam-editor-page` |
| Primary | `#0052cc` | CTA, focus ring, active section |
| Primary hover | `#0047b3` | Nút primary hover |
| Text strong | `#0f172a` / `#1e293b` | H2, tiêu đề card |
| Text body | `#475569` | Label, nút outlined |
| Text muted | `#64748b` / `#94a3b8` | Subtitle, hint, breadcrumb back |
| Border | `#e2e8f0`, `#f1f5f9` | Card, header, divider |
| Accent bg | `#eff6ff` | Section active, nút accent |
| Orange dot | `#f97316` | Card "Cài đặt" |
| Error required | `#ef4444` | `*` bắt buộc |

### Typography scale

| Element | Size | Weight |
| ------- | ---- | ------ |
| Page H2 | 24px | 700 |
| Page subtitle | 13px | 400 |
| Card title | 14px | 700 |
| Field label | 12px | 600 |
| Input text | 14px | 400 |
| Button | 13px | 600 (accent: 700) |
| Badge | 11px | 700 uppercase |
| Hint | 11px | 400 |

### Radius & spacing

| Element | Radius | Padding |
| ------- | ------ | ------- |
| Card | 16px | 24px |
| Input | 12px | 10px 16px |
| Button | 8px (ghost-dashed: 12px) | 8px 16px |
| Container max-width | 1024px (`max-w-5xl`) | body 32px (mobile 16px) |
| Settings grid gap | 24px | 2fr / 1fr ≥900px |

---

## Page layout (bắt buộc)

```tsx
<div className="exam-editor-page">
  <header className="exam-editor-header">
    <div className="exam-editor-breadcrumb">...</div>
    <div className="exam-editor-header-actions">...</div>
  </header>

  <div className="exam-editor-body">
    <div className="exam-editor-container">
      <div className="exam-editor-intro">
        <h2>Tiêu đề trang</h2>
        <p>Mô tả phụ</p>
      </div>

      {/* Settings grid 2 cột */}
      <ExamPaperSettings ... />

      {/* Card nội dung chính */}
      <div className="exam-editor-questions-card">...</div>
    </div>
  </div>
</div>
```

**Negative margin:** `.exam-editor-page { margin: -24px }` để full-bleed trong `admin-layout-main` (padding 24px). Mobile: `-16px`.

**Sticky header:** 64px, nền trắng, `border-bottom: #e2e8f0`.

---

## Breadcrumb

```tsx
<div className="exam-editor-breadcrumb">
  <button type="button" className="exam-editor-breadcrumb__back" onClick={goBack}>
    <ArrowBackIcon sx={{ fontSize: 16 }} />
    Danh sách đề
  </button>
  <span className="exam-editor-breadcrumb__sep">/</span>
  <span className="exam-editor-breadcrumb__current">Soạn đề thi</span>
</div>
```

Back: `#94a3b8` → hover `#0052cc`. Current: bold `#1e293b`.

---

## Buttons

Dùng `<button type="button" className="exam-editor-btn exam-editor-btn--*">` — **không** `muBtnSmOutlined` / `muFooterBtnPrimary` trên shell editor.

| Class | Dùng khi |
| ----- | -------- |
| `exam-editor-btn--primary` | Lưu, hành động chính |
| `exam-editor-btn--outlined` | Word, import phụ, toolbar section |
| `exam-editor-btn--accent` | Thêm section, CTA phụ nổi bật |
| `exam-editor-btn--ghost-dashed` | Empty state, hành động thứ cấp |

Icon MUI: `fontSize: 16` trong nút. Primary có thể dùng `CircularProgress size={14}` khi loading.

**Import dropdown:** MUI `Menu` + `className="exam-editor-import-menu"` — item hover `#eff6ff` / `#0052cc`.

---

## Form fields (MUI TextField)

**Label ngoài input** — không dùng floating MUI label trên editor shell:

```tsx
<div className="exam-editor-field">
  <label className="exam-editor-label">
    Tên đề thi <span className="exam-editor-required">*</span>
  </label>
  <TextField
    hiddenLabel
    size="small"
    fullWidth
    placeholder="Nhập tên đề thi..."
    value={...}
    onChange={...}
  />
</div>
```

**Suffix unit** (phút, %):

```tsx
<div className="exam-editor-field exam-editor-field-suffix">
  <label className="exam-editor-label">Thời gian làm bài</label>
  <TextField hiddenLabel type="number" ... />
  <span className="exam-editor-field-suffix__unit">phút</span>
</div>
```

**Select trạng thái:** thêm `exam-editor-field--select` → nền `#f8fafc`.

MUI override nằm trong CSS scope `.exam-editor-field .MuiOutlinedInput-root` — focus ring `#0052cc`.

---

## Settings cards (grid 2 cột)

```tsx
<div className="exam-editor-settings-grid">
  <div className="exam-editor-card">
    <h3 className="exam-editor-card__title">
      <span className="exam-editor-card__dot exam-editor-card__dot--primary" />
      Thông tin chung
    </h3>
    <div className="exam-editor-fields">...</div>
  </div>
  <div className="exam-editor-card">
    <h3 className="exam-editor-card__title">
      <span className="exam-editor-card__dot exam-editor-card__dot--orange" />
      Cài đặt
    </h3>
    ...
  </div>
</div>
```

Gợi ý: card trái = metadata dài (title, instruction); card phải = số + select ngắn.

---

## Content card + badges + empty state

```tsx
<div className="exam-editor-questions-card">
  <div className="exam-editor-questions-header">
    <h3>Nội dung câu hỏi</h3>
    <div className="exam-editor-badges">
      <span className="exam-editor-badge">{n} phần</span>
      <span className="exam-editor-badge">{m} câu hỏi</span>
    </div>
  </div>
  <div className={`exam-editor-questions-body${hasContent ? " exam-editor-questions-body--split" : ""}`}>
    {empty ? <EmptyState /> : <SplitPanel />}
  </div>
</div>
```

**Empty state** classes: `exam-editor-empty`, `__icon`, `__actions` — icon tròn `#eff6ff`, viền dashed `#e2e8f0`.

**Split panel (≥900px):** section list 280px trái + editor phải — `exam-editor-section-panel` + `exam-editor-section-editor`.

---

## Section list panel

| Class | Mục đích |
| ----- | -------- |
| `exam-editor-section-panel` | Sidebar danh sách phần |
| `exam-editor-section-item` | Row; `--active` = nền xanh + border-left 3px |
| `exam-editor-section-chip` | Loại câu / số câu |
| `exam-editor-section-editor` | Pane soạn bên phải |

Active item: title `#0052cc` bold. Hover row: `#f8fafc`.

---

## Alert

```tsx
<Alert className="exam-editor-alert" severity="error" onClose={...}>
```

Bo 12px, message 13px.

---

## CSS mới cho feature editor

1. **Ưu tiên** thêm class vào `admin-exam-paper-editor.css` nếu dùng chung editor shell.
2. Hoặc tạo `src/styles/admin-<feature>-editor.css` — **prefix** `exam-editor-*` hoặc feature-specific nhưng **cùng token** ở trên.
3. Import trong `index.css` sau `admin-exam-paper-editor.css`.
4. **Không** mix `muTextFieldSx` / `#0C447C` / `#ECEAE3` trên shell editor mới.

---

## Checklist trang editor mới

- [ ] Root `exam-editor-page` + negative margin
- [ ] Sticky `exam-editor-header` + breadcrumb + actions
- [ ] `exam-editor-intro` H2 + subtitle 13px
- [ ] Settings `exam-editor-settings-grid` 2 card
- [ ] Form: label ngoài + `hiddenLabel` TextField
- [ ] Nút `exam-editor-btn--*` (không EMR gradient)
- [ ] Content card + badges hoặc empty state
- [ ] Alert `exam-editor-alert`
- [ ] `npx tsc --noEmit`

---

## Anti-patterns

| Tránh | Làm |
| ----- | --- |
| `muPageShell` + `muBtnSmOutlined` trên editor shell | Class `exam-editor-*` |
| MUI floating label trên form editor | Label `.exam-editor-label` + `hiddenLabel` |
| `#0C447C`, gradient EMR | `#0052cc` flat |
| `border-radius: 10px`, `#ECEAE3` card cũ | 16px card, `#e2e8f0` border |
| `admin-catalog-page` shell trên trang soạn | `exam-editor-page` |
| Copy inline `sx` lặp token | Dùng CSS class có sẵn |

---

## Related

- List/catalog pages: `.cursor/skills/admin-catalog-soft-ui/SKILL.md`
- EMR compact forms: `.cursor/skills/emr-disclosure-ui-style/SKILL.md`
- Mockup HTML: `promt.md`
- Admin layout shell: `src/styles/admin-layout.css` (`#0052cc` sidebar active)

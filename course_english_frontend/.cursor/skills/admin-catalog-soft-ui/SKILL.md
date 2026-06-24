---
name: admin-catalog-soft-ui
description: >-
  Academic Core admin catalog UI — soft toolbar (mảnh, phẳng), page header icon+subtitle,
  filter card, table card. Canonical ref ManageEnrollmentPage + admin-catalog-soft.css.
  Use when styling admin CRUD/list pages (ManageClassroom, ManageUser, enrollment),
  toolbarVariant soft, or user asks admin catalog UI / soft buttons / UI_base mockup.
disable-model-invocation: true
---

# Admin Catalog Soft UI (Academic Core)

## Goal

Style **admin danh mục / CRUD list** pages with the **soft** look: mảnh, không gradient/pill nặng, token `--ac-*` từ `src/styles/index.css`. **Chỉ đổi UI** — giữ nguyên logic search, pagination, CRUD, import.

**Canonical reference:** `src/pages/admin/ManageEnrollmentPage.tsx`  
**Shared CSS:** `src/styles/admin-catalog-soft.css` (đã import trong `index.css`)  
**Header component:** `AdminCatalogPageHeader` từ `src/admin/components`

**Không dùng** cho: EMR Boarding clinical (`emr-disclosure-ui-style`), student area.

---

## Khi nào dùng soft vs default

| Variant | Toolbar | Dùng khi |
| ------- | ------- | -------- |
| `default` | `muBtnSmPrimary` gradient, `muToolbarCard` compact | Trang cũ EMR compact, chưa migrate |
| **`soft`** | Primary phẳng, search nền xanh nhạt, import ghost | Trang admin mới / user thích mockup UI_base |

---

## Quick apply (5 bước)

### 1. Page shell + header

```tsx
import { AdminCatalogPageHeader } from "../../admin/components";

<Box className="admin-catalog-page">
  <AdminCatalogPageHeader
    title="Tiêu đề trang"
    subtitle="Mô tả một dòng"   {/* ReactNode — có thể chứa Link */}
    icon={<SomeOutlinedIcon />}
  />
```

Hoặc HTML thuần (tương đương): `admin-catalog-page__header`, `__title-row`, `__title-icon`, `__title`, `__subtitle`.

### 2. Toolbar trong filter card

```tsx
<Box className="admin-catalog-page__filter-card admin-catalog-page__toolbar-wrap">
  <AdminCatalogToolbar
    searchPlaceholder="..."
    searchInput={searchInput}
    onSearchInputChange={setSearchInput}
    onSearch={() => { setPage(0); setSearchText(searchInput); }}
    onReset={() => { setSearchInput(""); setSearchText(""); setPage(0); }}
    addLabel="Thêm ..."
    onAdd={openCreate}
    importType="classrooms"   {/* optional */}
    toolbarVariant="soft"     {/* bắt buộc cho soft UI */}
    onImported={() => void fetchData()}
  />
</Box>
```

`toolbarVariant="soft"` tự bật:
- Class `admin-catalog-toolbar--soft` trên root toolbar
- `importAppearance="ghost"` cho Mẫu import / Import (nếu không override)

### 3. Bảng trong table card

Bọc list/table:

```tsx
<Box className="admin-catalog-page__table-card">
  {/* header row + data rows */}
  <Box className="admin-catalog-page__table-footer">...</Box>
</Box>
```

Empty state: `className="admin-catalog-page__empty"`.

Grid list (không MUI Table): `catalog-table-head`, `catalog-table-row`, `catalog-table-muted`, `catalog-table-actions` — giữ `gridTemplateColumns` trong `sx`.

Select filter có `MenuItem value=""`: `SelectProps={muSelectAllowEmpty}` + `InputLabelProps={muSelectFilterInputLabelProps}` (tránh label chồng giá trị).

Footer: `admin-catalog-page__table-footer`, `admin-catalog-page__table-footer-total`, `admin-catalog-page__table-footer-controls`.

Trang filter tùy chỉnh (vd. activity-logs): bọc `admin-catalog-toolbar admin-catalog-toolbar--soft` + class nút/ô tìm giống `ActivityLogsPage.tsx`.

### 4. CSS page-specific (nếu cần)

Tạo `src/styles/admin-<feature>.css` chỉ cho badge/cột đặc thù. **Không copy** soft toolbar — dùng `admin-catalog-soft.css`.

Import trong `index.css` sau `admin-catalog-soft.css`.

### 5. Dialog / form

Giữ `muDialogPaper`, `muFooterBtnPrimary`, `muTextFieldSx` từ `manageUserUiStyles.ts` — popup vẫn EMR compact, chỉ shell trang là soft.

---

## Component API

### `AdminCatalogToolbar`

| Prop | Giá trị | Ghi chú |
| ---- | ------- | ------- |
| `toolbarVariant` | `"soft"` \| `"default"` | Mặc định `default` |
| `importAppearance` | `"ghost"` \| `"default"` | Soft tự ghost; override nếu cần |
| `importType` | `CatalogImportType` | Bỏ qua nếu không import |

Class hooks (soft — **không set tay**, component tự gán):
- `admin-catalog-toolbar__search`
- `admin-catalog-toolbar__btn--primary` (Tìm)
- `admin-catalog-toolbar__btn--outlined` (Làm mới)
- `admin-catalog-toolbar__btn--add` (CTA phải, `margin-left: auto`)

### `CatalogImportActions`

`appearance="ghost"`: `variant="text"`, class `catalog-import-btn--ghost`.

---

## Design tokens (soft toolbar)

| Element | Quy tắc |
| ------- | ------- |
| Search | Nền `--ac-surface-container-low`, viền ẩn, `border-radius: 8px`, cao ~34px |
| Tìm / Thêm | `--ac-primary` phẳng, **không** gradient, `box-shadow: none`, cao 32px |
| Làm mới | Viền `--ac-outline-variant`, hover nền xanh nhạt |
| Import | Ghost: icon xám + chữ, hover primary |
| Bo góc | **8px** — tránh pill / radius quá lớn |
| CTA Thêm | `margin-left: auto` + gạch dọc mảnh trước nút (`.admin-catalog-toolbar__divider--before-add`) |

Palette: `--ac-primary`, `--ac-primary-fixed`, `--ac-surface-container-low`, `--ac-outline-variant`, `--ac-on-surface-variant` (`index.css`).

---

## Table styling patterns (tùy chọn)

Từ enrollment — copy vào page CSS nếu cần:

| Class | Mục đích |
| ----- | -------- |
| `*-class-badge` | Pill xanh nhạt cho tên lớp |
| `*-status` + `*-status__dot` | Dot + ACTIVE/INACTIVE |
| `*-table-actions` | IconButton edit/delete 32px, bo 8px |

Grid list: `display: grid` + `min-width` trên card để scroll ngang.

---

## Checklist migrate trang mới

- [ ] `admin-catalog-page` shell + header icon/subtitle
- [ ] `AdminCatalogToolbar` + `toolbarVariant="soft"`
- [ ] Filter card: `admin-catalog-page__filter-card admin-catalog-page__toolbar-wrap`
- [ ] Table: `admin-catalog-page__table-card` + footer
- [ ] **Không** đổi `fetchData`, pagination, dialog logic
- [ ] Page CSS chỉ cho cột/badge riêng
- [ ] `npx tsc --noEmit`

---

## Anti-patterns

| Tránh | Làm |
| ----- | --- |
| `muBtnSmPrimary` gradient trên trang soft | `toolbarVariant="soft"` |
| `muPageShell` + title Typography cũ | Header `admin-catalog-page__*` |
| Copy toàn bộ CSS enrollment sang trang khác | Import `admin-catalog-soft.css` |
| Thêm filter/stats mới khi user chỉ yêu cầu style | Giữ chức năng cũ |
| Pill radius 9999 trên nút toolbar | `border-radius: 8px` |

---

## Trang đã migrate soft UI

`ManageEnrollmentPage`, `ManageClassroomPage`, `ManageSubjectPage`, `ManageRolePage`, `ManageUserPage`, `ManageLessonPage`, `ManageQuestionsPage`, `ManageVocabularySetsPage`, `ManageVocabularyWordsPage`, `ManageSystemConfigPage`, `ActivityLogsPage`.

---

## Related

- EMR compact catalog (cũ): `manageUserUiStyles.ts`, skill `emr-disclosure-ui-style` (hospital-client-app)
- CRUD scaffold: `.cursor/skills/admin-catalog-crud-fast/SKILL.md`
- Mockup: `Design/UI_base/`

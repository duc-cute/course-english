---
name: admin-catalog-crud-fast
description: Scaffold CRUD pages for admin catalog entities in cell-architecture-studio, including paths, sidebar menu, route wiring, API service functions, list/search/pagination UI, create-update dialog, and delete confirmation. Use when user asks to add a new "danh mục" or admin CRUD screen quickly.
disable-model-invocation: true
---

# Admin Catalog CRUD Fast

## Goal

Implement a new admin catalog module quickly with consistent structure:
- path constant
- sidebar menu item
- admin route
- API CRUD functions
- page with list/search/pagination + create/update + delete confirm

Target project: `cell-architecture-studio`.

## Apply when

Use this skill when user says things like:
- "thêm danh mục ..."
- "tạo màn quản lý ... trong admin"
- "làm CRUD cho ... giống manage user/role"

## Standard file map

For entity `X` (example: Role), add/update:

1) `src/shared/constants/paths.ts`
- Add `MANAGE_X: "manage-x"`

2) `src/layouts/admin/AdminSidebar.tsx`
- Add menu item under admin section with label `Quản lý X`
- Route: ``/${paths.ADMIN}/${paths.MANAGE_X}``

3) `src/app/routes.tsx`
- Import `ManageXPage`
- Add child route under admin:
  - `path: paths.MANAGE_X`
  - `element: <ManageXPage />`

4) `src/shared/api/x.ts`
- Add:
  - `apiGetXs(params?)`
  - `apiGetXById(id)`
  - `apiCreateX(data)`
  - `apiUpdateX(id, data)`
  - `apiDeleteX(id)`
- Reuse existing `unwrapResponse` pattern.

5) `src/pages/admin/ManageXPage.tsx`
- Build page with:
  - header title
  - search box + search/reset actions
  - list/table
  - pagination controls
  - add button
  - edit/delete actions per row
  - create/update dialog
  - delete confirm dialog (`ConfirmDialog`)

## UI/behavior baseline

Follow current admin style from existing pages (`ManageUserPage`, `ManageRolePage`):
- MUI components, compact spacing
- `loading` + `error` states
- reset page to 0 when changing search/page size
- optimistic refresh after create/update/delete by re-fetching list
- when deleting the last row of current page and `page > 0`, go to previous page

## Mandatory style alignment (new rule)

For every new CRUD implementation, enforce UI style consistency with:
- `cell-architecture-studio/.cursor/skills/emr-disclosure-ui-style/SKILL.md`

Execution rule:
1. Before coding UI for a new CRUD page, read `emr-disclosure-ui-style/SKILL.md`.
2. Reuse its color palette/tokens/layout principles where applicable to admin screens.
3. Avoid ad-hoc colors/spacing that conflict with that style guide.
4. If there is a conflict between existing admin page style and the disclosure style guide, prefer a compatible merge (keep admin UX structure, but align visual tokens and consistency).

## Minimal implementation template

```ts
// state
const [items, setItems] = useState<XRecord[]>([]);
const [page, setPage] = useState(0);
const [size, setSize] = useState(10);
const [total, setTotal] = useState(0);
const [searchInput, setSearchInput] = useState("");
const [searchText, setSearchText] = useState("");
const [loading, setLoading] = useState(false);
const [submitting, setSubmitting] = useState(false);
const [error, setError] = useState("");

const fetchItems = useCallback(async () => {
  setLoading(true);
  setError("");
  try {
    const params: Record<string, unknown> = { page, size, sort: "id,desc" };
    if (searchText.trim()) params.keyword = searchText.trim();
    const response = await apiGetXs(params);
    const rows = response?.data?.result ?? response?.result ?? [];
    const totalRows = response?.meta?.total ?? response?.data?.meta?.total ?? 0;
    setItems(Array.isArray(rows) ? rows : []);
    setTotal(Number.isFinite(totalRows) ? Number(totalRows) : 0);
  } catch (err) {
    setError((err as { message?: string })?.message || "Không thể tải danh sách.");
    setItems([]);
    setTotal(0);
  } finally {
    setLoading(false);
  }
}, [page, size, searchText]);
```

## Endpoint compatibility rule

If backend endpoint is uncertain (`/x` vs `/xs`, update path or payload shape):
1. Start with existing backend conventions in repo.
2. If API fails, adjust path and body mapping in `src/shared/api/x.ts`.
3. Keep UI unchanged unless API contract forces changes.

## Mandatory DB rule (all new tables)

For backend schema design/migrations, EVERY new business table must include:
- `created_at`
- `updated_at`
- `voided`

Recommended SQL snippet:

```sql
created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
voided BOOLEAN NOT NULL DEFAULT FALSE
```

Enforcement:
- Use soft delete (`voided = true`) instead of hard delete for business entities.
- Default query path must filter `voided = false`.
- If a new table misses these 3 fields, treat implementation as incomplete.

## Excel import (catalog screens)

Each catalog page should expose:
- **Tải mẫu import** → `GET /api/v1/catalog-import/{type}/template`
- **Import Excel** → `POST /api/v1/catalog-import/{type}` (`multipart/form-data`, field `file`)

`type` values: `users`, `roles`, `classrooms`, `subjects`, `enrollments`.

Rules:
- Trùng mã trong DB hoặc trong file → **bỏ qua** (ghi vào file báo cáo).
- Dòng lỗi validation → ghi file Excel báo cáo (`errorReportBase64` trong response JSON); FE tự tải file.

Reuse FE component: `CatalogImportActions` + `shared/api/catalogImport.ts`.

## Validation checklist (must run)

After edits:
1. Run `ReadLints` on changed files and fix introduced errors.
2. Ensure menu appears and route opens page.
3. Test 5 core flows manually:
   - list
   - search/reset
   - create
   - update
   - delete

## Guardrails

- Do not modify unrelated modules.
- Keep naming consistent: `ManageXPage`, `apiGetXs`, `MANAGE_X`.
- Prefer reusing shared components (`ConfirmDialog`, existing admin components).
- Do not commit unless user explicitly asks.

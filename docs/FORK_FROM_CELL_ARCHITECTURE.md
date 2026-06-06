# Checklist fork — Cell Architecture → Course English

Dùng khi copy code vào `course_english_backend` và `course_english_frontend`.

---

## Bước 1 — Copy thư mục

```text
cell_architecture/cell-architecture-backend/     →  course_english/course_english_backend/
cell_architecture/cell-architecture-studio/        →  course_english/course_english_frontend/
```

Không copy:

- `node_modules/`, `target/`, `.git/` (repo riêng)
- `design/`, `docs/mau-bai-hoc-*.xlsx`, `docs/~$*`
- `cell-architecture-studio/docs/scripts/` (nếu chỉ phục vụ audit sinh học)

---

## Bước 2 — Backend đổi tên & cấu hình

| Việc | Từ | Sang |
|------|-----|------|
| Java package | `com.cellarchitecture.api` | `com.courseenglish.api` |
| Artifact / name | `cell-architecture-backend` | `course-english-backend` |
| DB name | (cũ) | `course_english` (mới) |
| Storage path | (cũ) | thư mục upload riêng |

**Giữ nguyên logic:** User, Role, Permission, Classroom, Subject, Enrollment, Lesson*, FileService, LessonController.

**Sửa enum `LessonBlockTypeEnum`:**

```java
// Bỏ: CELL_VIEWER, CELL_STEP
// Giữ: TEXT, IMAGE, VIDEO
// Thêm (P0 stub hoặc P1): AUDIO, CALLOUT, SUMMARY, QUIZ
// Bỏ hoặc migrate: QUESTION_REF → QUIZ + Question entity (P2)
```

**Migration DB:** schema mới hoặc Flyway/Liquibase từ baseline đã strip CELL types.

---

## Bước 3 — Frontend xóa (sau copy)

Xóa hẳn các path sau:

```text
src/features/biology/
src/pages/public/biology/
src/components/three/
src/components/CellScene.tsx          # nếu trùng với biology
src/data/biology/
src/data/cells.ts
src/data/schema/cell.ts
src/student/components/LessonReader3DPanel.tsx
src/student/components/CellViewerEmbed.tsx
src/student/lesson3dContext.ts
src/styles/student-bio-theme.css      # thay bằng student-english-theme.css
```

**`package.json` — gỡ dependencies:**

```json
"@react-three/drei"
"@react-three/fiber"
"three"
```

---

## Bước 4 — Frontend sửa

### Routes (`src/app/routes.tsx`)

- [ ] Bỏ `PublicLayout` + `biology/cells` routes (hoặc thay landing marketing sau).
- [ ] Default `/` → redirect `paths.STUDENT` hoặc `/login`.
- [ ] Giữ `ADMIN`, `STUDENT`, lesson reader routes.

### Constants (`src/shared/constants/paths.ts`)

- [ ] Đổi prefix app (ví dụ `/course-english` nếu cần).
- [ ] Xóa `BIOLOGY_CELLS`.

### Types (`src/shared/api/lesson.ts`)

- [ ] `LessonBlockType` — bỏ `CELL_VIEWER` | `CELL_STEP`.
- [ ] Thêm `AUDIO`, `CALLOUT`, `SUMMARY`, `QUIZ` khi backend sẵn sàng.

### Components bắt buộc sửa

| File | Việc |
|------|------|
| `LessonBlockReader.tsx` | Xóa nhánh CELL_*; thêm AUDIO (P1) |
| `LessonBlockEditorPanel.tsx` | Xóa cell picker, steps editor |
| `LessonBlockPreview.tsx` | Đồng bộ với reader |
| `LessonReaderPage.tsx` | Xóa 3D panel, layout 2 cột (TOC + content) |
| `StudentSidebar.tsx` | Đổi label/icon, bỏ link biology |
| `AdminSidebar.tsx` | Branding Course English |
| `LoginPage.tsx` | Logo / copy |

### CSS

- [ ] Tạo `src/styles/student-english-theme.css` (token mới).
- [ ] Import thay `student-bio-theme.css` trong student layout.
- [ ] `lesson-reader.css` — bỏ class gắn 3D panel (`.lesson-reader-with-3d`…).

---

## Bước 5 — File env & chạy thử

**`course_english_frontend/.env.example`:**

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

**Verify P0:**

```bash
cd course_english_backend && mvnw -q -DskipTests package
cd course_english_frontend && npm install && npm run build
```

---

## Bước 6 — Không copy / làm mới từ đầu (P2+)

Tạo mới trong Course English (không có sẵn bên Cell):

```text
Backend:
  domain/Question.java, Quiz.java, QuizAttempt.java
  controller/QuestionController.java, QuizController.java
  service/* tương ứng

Frontend:
  src/shared/api/question.ts, quiz.ts
  src/pages/admin/ManageQuestionPage.tsx, ManageQuizPage.tsx
  src/pages/student/QuizPlayerPage.tsx, QuizListPage.tsx
```

---

## Mapping nhanh: Admin menu

| Cell Studio | Course English |
|-------------|----------------|
| Quản lý bài học (Lesson) | Giữ — "Bài học" |
| Môn (Subject) | Giữ — "Chủ đề / Unit" |
| Lớp (Classroom) | Giữ — "Khóa / Lớp" |
| (không có) | Câu hỏi (P2) |
| (không có) | Quiz (P2) |
| Biology gallery | Xóa |

---

## Ghi chú cherry-pick

Khi sửa bug ở layer dùng chung (axios unwrap, auth token, lesson search API), cân nhắc port ngược sang `cell_architecture` nếu cùng pattern — ghi commit message rõ `fix(shared): ...`.

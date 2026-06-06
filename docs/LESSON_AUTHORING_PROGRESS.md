# Tiến độ Lesson Authoring

> Cập nhật: **2025-06-06**  
> Tham chiếu kiến trúc: [`promt.md`](../promt.md)  
> Làm **lần lượt** — không nhảy phase.

---

## Tổng quan 4 phương thức

| # | Phương thức | Mô tả ngắn | Trạng thái |
|---|-------------|------------|------------|
| **1** | **Manual Builder** | GV soạn câu hỏi bằng form trong Admin | ✅ **XONG** |
| **2** | **Import Builder** | Upload CSV/Excel → tạo `EXERCISE_SET` | ✅ **XONG** (CSV + Excel) |
| 3 | Question Bank | Ngân hàng câu hỏi + `QUESTION_REF` | 🟡 **Đang làm** (core xong, còn import + seed) |
| 4 | Vocab Set + Generator | Bộ từ → auto sinh activities | 📋 Chưa bắt đầu |

---

## Nền tảng đã có (không cần làm lại)

- [x] `Lesson` → `LessonBlock[]` + `payload_json`
- [x] Block types: TEXT, IMAGE, EXERCISE_SET (+ enum khác chưa editor)
- [x] Admin: soạn TEXT, IMAGE
- [x] Admin: EXERCISE_SET qua **raw JSON** (tạm — sẽ thay bằng form)
- [x] Student: tab Bài học / Bài tập
- [x] Student: `ExercisePlayer` MCQ stepped
- [x] Script CLI: `csv_to_exercise_sql.py` → SQL thủ công
- [x] Seed demo: `seed_lesson_vocab_demo.sql`

### Gap còn lại (sửa song song hoặc sau)

- [ ] CALLOUT, SUMMARY, VIDEO, AUDIO — editor + reader
- [ ] `shuffleQuestions`, `shuffleOptions`, `passScorePercent` trong player
- [ ] MATCHING question UI (student)
- [ ] Progress/attempt API (localStorage only)
- [ ] Publish validation (BE)

---

## Phase 1A — Manual Builder (Method 1) ✅

**Mục tiêu:** GV tạo/sửa `EXERCISE_SET` bằng form, không cần sửa JSON.

### Deliverable

Admin mở khối **Bài tập** → form có:
- Tiêu đề block, hướng dẫn
- Danh sách câu MCQ: thêm / sửa / xóa / sắp xếp
- Mỗi câu: prompt (EN), 4 đáp án, đáp án đúng, giải thích (tuỳ chọn)
- Tuỳ chọn: shuffle câu, shuffle đáp án, điểm đạt %
- Lưu → `payload_json` đúng schema `ExerciseSetPayload`

### Checklist implement

#### 1. Shared types & utils (FE)

- [x] `src/shared/lesson/exercisePayload.ts` — `createEmptyMcqQuestion`, `validateExerciseSetPayload`, `buildExerciseSetPayloadJson`
- [x] `createEmptyMcqQuestion()` — id tự sinh
- [x] `validateExerciseSetPayload()` — báo lỗi tiếng Việt trước khi lưu

#### 2. Form UI (Admin)

- [x] `src/admin/components/exercise/ExerciseSetEditor.tsx` — form chính
- [x] `src/admin/components/exercise/McqQuestionForm.tsx` — 1 câu MCQ
- [x] `src/admin/components/exercise/ExerciseSetSettings.tsx` — title, instruction, shuffle, passScore
- [x] Gắn vào `LessonBlockEditorPanel.tsx` — thay TextField JSON

#### 3. Preview (Admin)

- [x] `LessonBlockPreview.tsx` — số câu MCQ + ví dụ câu đầu

#### 4. Tạo block mới

- [x] `LessonEditorPage.tsx` — dùng `createDefaultExerciseSetPayload()`

#### 5. Kiểm thử E2E

- [ ] Admin: tạo lesson → thêm EXERCISE_SET → thêm 3 câu MCQ → Lưu
- [ ] Publish lesson
- [ ] Student: tab Bài tập → làm hết 3 câu → điểm đúng

### File liên quan

| Vai trò | Đường dẫn |
|---------|-----------|
| Editor hiện tại (JSON) | `course_english_frontend/src/admin/components/LessonBlockEditorPanel.tsx` |
| Payload schema | `course_english_frontend/src/student/lessonPlayer/exercise/types.ts` |
| Parse payload | `course_english_frontend/src/student/lessonPlayer/exercise/parseExerciseSet.ts` |
| Trang soạn lesson | `course_english_frontend/src/pages/admin/LessonEditorPage.tsx` |
| Player HS | `course_english_frontend/src/student/lessonPlayer/exercise/ExercisePlayer.tsx` |

### Tiêu chí xong Phase 1A

- GV **không** cần mở JSON editor để thêm/sửa MCQ
- Payload lưu ra API giống seed `seed_lesson_vocab_demo.sql`
- HS làm bài bình thường trên tab Bài tập

---

## Phase 1B — Import Builder (Method 2) ✅

**Mục tiêu:** Upload CSV trong Admin → preview → tạo hoặc ghi đè `EXERCISE_SET`.

> **Bắt đầu sau khi Phase 1A xong** (dùng chung schema + validation).

### Deliverable

Trong Lesson Editor (hoặc dialog Import):
1. Chọn file CSV (UTF-8)
2. Preview bảng: lesson_title, prompt, choices, correct
3. Chọn: **Tạo khối mới** hoặc **Ghi đè khối đang chọn**
4. Lưu block qua API hiện có

### Format CSV (giữ tương thích script cũ)

File mẫu: `course_english_backend/docs/import/vocab_daily_words_questions.csv`

| Cột | Bắt buộc | Ghi chú |
|-----|----------|---------|
| `lesson_title` | Có | Dòng đầu — khớp lesson đang soạn (hoặc bỏ qua nếu import vào lesson hiện tại) |
| `block_title` | Không | Mặc định "Bài tập" |
| `instruction` | Không | Mặc định "Chọn đáp án đúng" |
| `question_id` | Có | q1, q2, … |
| `prompt_en` | Có | Từ/câu hỏi tiếng Anh |
| `choice_a` … `choice_d` | Có | 4 đáp án |
| `correct_choice_id` | Có | a \| b \| c \| d |
| `explanation` | Không | Giải thích sau khi chấm |

### Checklist implement

#### 1. Parser FE (không cần BE ngay)

- [x] `src/shared/lesson/csvImport.ts` — `parseMcqCsvFile` / `parseMcqCsvText`
- [x] Parse thủ công UTF-8 + BOM, tương thích script Python

#### 2. UI Import

- [x] `src/admin/components/exercise/ExerciseCsvImportDialog.tsx`
- [x] Nút **Import CSV** trong footer `ExerciseSetEditor`
- [x] Preview bảng + lỗi từng dòng
- [x] Chế độ **Ghi đè** / **Thêm vào cuối**

#### 3. (Tuỳ chọn Phase 1B+) API Import

- [ ] `POST /api/v1/lessons/{id}/blocks/import-exercise` — nhận multipart CSV
- [ ] Port logic từ `csv_to_exercise_sql.py` sang Java service
- [x] Script CLI vẫn hoạt động (backward compatible)

#### 4. Kiểm thử E2E

- [ ] Sửa `vocab_daily_words_questions.csv` trong Excel → export UTF-8
- [ ] Import vào lesson → 5 câu MCQ
- [ ] HS làm bài trên tab Bài tập

### File tham chiếu

| Vai trò | Đường dẫn |
|---------|-----------|
| Script CSV → SQL | `course_english_backend/scripts/csv_to_exercise_sql.py` |
| CSV mẫu | `course_english_backend/docs/import/vocab_daily_words_questions.csv` |
| SQL attach | `course_english_backend/import_exercise_block_attach.sql` |

### Tiêu chí xong Phase 1B

- GV import CSV **trong trình duyệt**, không cần chạy Python/MySQL
- Script CLI vẫn hoạt động (backward compatible)

---

## Phase 2 — Question Bank (Method 3) 📋 TIẾP THEO

> **Mục tiêu:** Câu hỏi lưu tập trung — sửa 1 chỗ → mọi lesson dùng ref đều cập nhật.

### 2.1 Database (BE) — tuần 1

> Thiết kế chi tiết: **[QUESTION_BANK_DB_DESIGN.md](./QUESTION_BANK_DB_DESIGN.md)**

```text
question_categories (id, name, slug, parent_id)
questions           (id, category_id, question_type, prompt_text, explanation, status, content_json, …)
question_choices    (id, question_id, choice_key, choice_text, is_correct, display_order)
QUESTION_REF payload → refs[] (UUID[]) trong lesson_blocks.payload_json — không bảng junction MVP
```

- [x] Thiết kế schema + tài liệu
- [x] Migration SQL `002_question_bank.sql`
- [x] JPA entities + repository
- [x] `QuestionService` CRUD + soft delete

### 2.2 API (BE) — tuần 1–2

| Endpoint | Mô tả |
|----------|--------|
| `POST /questions/search` | List + filter category, type, search |
| `GET /questions/categories` | Danh mục (Vocabulary, Grammar, …) |
| `GET /questions/{id}` | Chi tiết + choices |
| `POST /questions` | Tạo MCQ |
| `PUT /questions/{id}` | Sửa |
| `DELETE /questions/{id}` | Xóa mềm |
| `POST /questions/import` | Import CSV/Excel → bank (tái dùng parser FE logic port sang Java) |

- [x] CRUD API `/questions` (MCQ + validate)
- [x] Resolve `QUESTION_REF` trong `GET /lessons/{id}/detail` → `resolvedQuestionsJson`

### 2.3 Admin UI — tuần 2–3

- [x] Trang **Thư viện câu hỏi** (`/admin/questions`)
- [x] Filter: danh mục + trạng thái + keyword
- [x] Form soạn MCQ (tái dùng `McqQuestionCanvas`)
- [ ] Import CSV/Excel vào bank (không gắn lesson)

### 2.4 Lesson Editor — tuần 3

- [x] Block type `QUESTION_REF` trong "+ Thêm khối"
- [x] Picker: chọn câu từ bank → lưu `refs[]` trong payload
- [x] `flattenExerciseBlocks` hỗ trợ `QUESTION_REF` + `resolvedQuestionsJson`

### 2.5 Kiểm thử E2E

- [ ] Tạo 10 câu trong bank → gắn 5 câu vào lesson A, 3 câu vào lesson B (có overlap)
- [ ] Sửa 1 câu trong bank → cả 2 lesson hiển thị đáp án mới sau F5
- [ ] HS làm bài tab Bài tập bình thường

### Thứ tự implement đề xuất (session)

```
1. BE migration + Question CRUD API
2. Admin Question Library page
3. QUESTION_REF picker trong ExerciseSetEditor / LessonEditor
4. Resolve refs ở lesson detail + flattenExerciseBlocks
```

---

## Phase 3 — Vocab Set + Generator (Method 4) 📋

Chưa bắt đầu. Xem [`promt.md`](../promt.md) § Method 4.

- [ ] DB: `vocabulary_sets`, `vocabulary_items`
- [ ] Import CSV Word | Meaning
- [ ] `VocabActivityGenerator` (MCQ, Flashcard, Match…)
- [ ] Block `VOCABULARY_SET` / `GENERATED_ACTIVITY`

---

## Nhật ký làm việc

| Ngày | Việc | Ghi chú |
|------|------|---------|
| 2025-06-06 | Lập kế hoạch kiến trúc 4 methods | So sánh promt.md vs codebase |
| 2025-06-06 | Tạo file tiến độ này | **Bắt đầu Phase 1A — Manual** |
| 2025-06-06 | Phase 1A code xong | Form EXERCISE_SET thay JSON editor |
| 2025-06-06 | Layout 2-panel | Theo `Design/add_lesson/` — list trái + canvas phải |
| 2025-06-06 | Drag-drop list câu | `@dnd-kit` thay nút ↑↓ |
| 2025-06-06 | Phase 1B Import CSV | Dialog preview + ghi đè/merge |
| 2025-06-06 | Import Excel + mẫu | `xlsx`, tải `mau_import_bai_tap_mcq.xlsx` (5 câu mẫu) |
| 2025-06-06 | Phase 2.1 DB + BE CRUD | Migration `002`, entities, `/api/v1/questions` |
| 2025-06-06 | Resolve QUESTION_REF + Admin UI | `resolvedQuestionsJson`, `/admin/questions`, picker lesson |
| 2025-06-06 | Fix sửa câu bank | `replaceChoices` — xóa hẳn choices cũ khi update (tránh UK trùng) |

---

## Bước tiếp theo (session kế)

**Phase 2 — còn lại:**

1. `seed_question_bank_demo.sql` — câu mẫu + lesson `QUESTION_REF` demo
2. Import CSV/Excel vào **bank** (Admin, không gắn lesson)
3. E2E: sửa câu trong bank → 2 lesson dùng ref đều đổi sau F5
4. (Tuỳ chọn) `POST /questions/import` API

Phase 1 ✅ · Phase 2 core ✅ (DB, CRUD, `/admin/questions`, `QUESTION_REF`, player resolve).

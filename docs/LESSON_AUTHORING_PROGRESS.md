# Tiến độ Lesson Authoring

> Cập nhật: **2026-06-08**  
> Tham chiếu kiến trúc: [`promt.md`](../promt.md)  
> Làm **lần lượt** — không nhảy phase.

---

## Tổng quan 4 phương thức

| # | Phương thức | Mô tả ngắn | Trạng thái |
|---|-------------|------------|------------|
| **1** | **Manual Builder** | GV soạn câu hỏi bằng form trong Admin | ✅ **XONG** |
| **2** | **Import Builder** | Upload CSV/Excel → tạo `EXERCISE_SET` | ✅ **XONG** (CSV + Excel) |
| 3 | Question Bank | Ngân hàng câu hỏi + `QUESTION_REF` | ✅ **XONG** (import FE; API import tuỳ chọn sau) |
| 4 | Vocab Set + Generator | Bộ từ → auto sinh activities | ✅ **XONG** (3.1–3.4 + flashcard + MATCHING gen) |

---

## Nền tảng đã có (không cần làm lại)

- [x] `Lesson` → `LessonBlock[]` + `payload_json`
- [x] Block types: TEXT, IMAGE, EXERCISE_SET, QUESTION_REF (+ enum khác chưa editor)
- [x] Admin: soạn TEXT, IMAGE, EXERCISE_SET (form), QUESTION_REF (picker bank)
- [x] Admin: **Thư viện câu hỏi** `/admin/questions` — CRUD + import CSV/Excel
- [x] Student: tab Bài học / Bài tập
- [x] Student: `ExercisePlayer` MCQ stepped (`EXERCISE_SET` + `QUESTION_REF` resolve)
- [x] Student: màn **kết quả bài tập** + **xem lại bài làm** (theo `Design/noti_result_lesson/`)
- [x] Student: màn kết quả — **3 nút CTA mobile** (tile Xem lại/Làm lại + primary full-width)
- [x] Student: shuffle câu/đáp án, `passScorePercent`, giải thích từng câu, session `localStorage` (F5 giữ tiến độ)
- [x] Script CLI: `csv_to_exercise_sql.py` → SQL thủ công
- [x] Seed demo: `seed_lesson_vocab_demo.sql`, `seed_question_bank_demo.sql`

### Gap còn lại (sửa song song hoặc sau)

- [x] CALLOUT, SUMMARY — editor + reader tab Bài học
- [ ] VIDEO, AUDIO — editor + reader (cần asset pipeline)
- [x] `shuffleQuestions`, `shuffleOptions`, `passScorePercent` trong player
- [x] MATCHING question UI (student) + Admin editor ghép cặp
- [x] MATCHING generator từ bộ từ (`vocabActivityGenerator`)
- [x] VOCABULARY flashcard (`presentation: flashcard`)
- [x] **Practice attempt API** — POST + GET latest/best/summary (`005_lesson_practice_attempts.sql`)
- [x] Reading progress server (`lesson_reading_progress`) — `006_lesson_reading_progress.sql`, xem `LESSON_READING_PROGRESS.md`
- [x] **Publish validation (BE)** — chặn publish lesson thiếu block / bank trống (`LessonPublishValidator`)
- [x] **URL slug học sinh** — `/student/lessons/{slug}` + migration `007_lesson_slug.sql`
- [x] **Badge tiến độ HS** — chip Đã đọc / Đã đạt + banner "Lần trước" trên danh sách bài

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

## Phase 2 — Question Bank (Method 3) ✅

> **Mục tiêu:** Câu hỏi lưu tập trung — sửa 1 chỗ → mọi lesson dùng ref đều cập nhật.  
> **Trạng thái:** Core **xong**. Còn E2E manual + polish tuỳ chọn (xem cuối section).

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
| `POST /questions/import` | Import CSV/Excel → bank (batch BE) — **tuỳ chọn** |

- [x] CRUD API `/questions` (MCQ + validate)
- [x] Resolve `QUESTION_REF` trong `GET /lessons/{id}/detail` → `resolvedQuestionsJson`

### 2.3 Admin UI — tuần 2–3

- [x] Trang **Thư viện câu hỏi** (`/admin/questions`)
- [x] Filter: danh mục + trạng thái + keyword
- [x] Form soạn MCQ (tái dùng `McqQuestionCanvas`)
- [x] Import CSV/Excel vào bank (Admin `/admin/questions`, không gắn lesson)

### 2.4 Lesson Editor — tuần 3

- [x] Block type `QUESTION_REF` trong "+ Thêm khối"
- [x] Picker: chọn câu từ bank → lưu `refs[]` trong payload
- [x] `flattenExerciseBlocks` hỗ trợ `QUESTION_REF` + `resolvedQuestionsJson`

### 2.5 Kiểm thử E2E

- [x] Seed: `seed_question_bank_demo.sql` — 5 câu + Lesson A/B QUESTION_REF overlap
- [ ] Chạy seed → HS làm Lesson A & B tab Bài tập
- [ ] Sửa câu `apple` trong bank → F5 cả 2 lesson hiển thị đáp án mới
- [ ] Import CSV vào bank → picker lesson thấy câu PUBLISHED

### File deliverable Phase 2

| Vai trò | Đường dẫn |
|---------|-----------|
| Migration DB | `course_english_backend/migrations/002_question_bank.sql` |
| Thiết kế DB | `docs/QUESTION_BANK_DB_DESIGN.md` |
| Seed demo overlap | `course_english_backend/seed_question_bank_demo.sql` |
| API CRUD | `QuestionController.java`, `QuestionServiceImpl.java` |
| Resolve refs | `QuestionRefResolverService.java` |
| Admin library | `pages/admin/ManageQuestionsPage.tsx` |
| Import bank | `QuestionBankImportDialog.tsx`, `questionBankImport.ts` |
| QUESTION_REF editor | `QuestionRefEditor.tsx`, `QuestionBankPickerDialog.tsx` |
| Player flatten | `flattenExerciseBlocks.ts`, `parseQuestionRef.ts` |

### Polish Phase 2 (tuỳ chọn — không chặn Phase 3)

- [ ] `POST /questions/import` API batch (hiện import FE gọi `POST /questions` lặp)
- [ ] Drag-drop sắp xếp `refs[]` trong `QuestionRefEditor`
- [ ] Hiển thị preview câu (prompt) trong list refs sau reload (fetch bank)

### Thứ tự implement (đã xong)

```
1. BE migration + Question CRUD API          ✅
2. Admin Question Library page               ✅
3. QUESTION_REF picker trong LessonEditor    ✅
4. Resolve refs ở lesson detail + player     ✅
5. Import bank CSV/Excel + seed demo         ✅
```

---

## Phase 2.6 — Student Exercise Player polish ✅

> **Mục tiêu:** Hoàn thiện luồng làm bài → kết quả → xem lại → điều hướng bài tiếp.  
> Tham chiếu UI: [`Design/noti_result_lesson/`](../Design/noti_result_lesson/) (`code.html` chưa đạt · `code2.html` đạt).

### Deliverable

Sau khi làm hết câu, học sinh thấy:
- Layout 2 cột: **sidebar thống kê** (vòng tròn đúng/sai, điểm %, thời gian) + **khu chúc mừng / động viên**
- Nút **Xem lại bài làm** — danh sách từng câu, đáp án đã chọn, đáp án đúng, giải thích
- Nút **Làm lại** — xóa session, shuffle lại (nếu bật)
- Nút **Bài tiếp theo** — `findNextPublishedLesson` (fallback tab Bài học hoặc danh sách)
- **Quay lại danh sách** — gọn trong sidebar (không trùng toolbar trang)

### Checklist implement

#### 1. Luồng player

- [x] Phase stepped: `answer` → `feedback` (KIỂM TRA / GIẢI THÍCH / LÀM TIẾP) → `done` → `review`
- [x] `prepareExercisePlan` — shuffle câu theo block, shuffle đáp án, `passScorePercent` có trọng số
- [x] Highlight đáp án đúng/sai sau KIỂM TRA (`MultipleChoiceQuestion`)

#### 2. Session (localStorage)

- [x] `exerciseSessionStorage.ts` — `questionIdsOrder`, `choiceOrders`, `answers` (+ `selectedChoiceId`), `startedAt`, `elapsedMs`
- [x] F5 giữ thứ tự câu/đáp án và trạng thái hoàn thành

#### 3. Màn kết quả

- [x] `ExerciseResultScreen.tsx` — UI đạt/chưa đạt, mascot, thống kê, CTA
- [x] `ExerciseReviewScreen.tsx` — xem lại toàn bộ câu
- [x] `exerciseResultUtils.ts` — format thời gian, ghi chú `QUESTION_REF`
- [x] `lesson-player.css` — layout result/review, ẩn hero + tab khi xem kết quả (`LessonReaderPage`)

#### 4. Kiểm thử E2E (manual)

- [ ] Làm bài 8 câu → XEM KẾT QUẢ → sidebar đúng số đúng/sai/%
- [ ] Xem lại bài làm → từng câu hiển thị lựa chọn + giải thích
- [ ] Bài tiếp theo → mở lesson kế (`displayOrder` cùng môn)
- [ ] F5 trên màn kết quả → vẫn ở màn kết quả

### File deliverable Phase 2.6

| Vai trò | Đường dẫn |
|---------|-----------|
| Player chính | `exercise/ExercisePlayer.tsx` |
| Màn kết quả | `exercise/ExerciseResultScreen.tsx` |
| Xem lại | `exercise/ExerciseReviewScreen.tsx` |
| Chuẩn bị câu/shuffle | `exercise/prepareExerciseItems.ts`, `exercise/exerciseShuffle.ts` |
| Session | `exerciseSessionStorage.ts` |
| Trang đọc lesson | `pages/student/LessonReaderPage.tsx` |
| CSS | `styles/lesson-player.css` |
| Mock UI | `Design/noti_result_lesson/code.html`, `code2.html` |

### Tiêu chí xong Phase 2.6

- HS hoàn thành bài tập có **phản hồi trực quan** (không chỉ card icon đơn giản)
- Có thể **ôn lại** từng câu sau khi nộp
- **Bài tiếp theo** hoạt động giống footer Up Next ở tab Bài học
- Không cần API mới (session vẫn `localStorage`)

---

## Phase 3 — Vocab Set + Generator (Method 4) ✅

> **Mục tiêu:** GV chỉ nhập **bộ từ** (Word | Meaning) → hệ thống **tự sinh** activities (MCQ, flashcard, match…).  
> Tham chiếu: [`promt.md`](../promt.md) § Method 4 · [`VOCABULARY_SET_DB_DESIGN.md`](./VOCABULARY_SET_DB_DESIGN.md)

### 3.1 Database (BE) ✅

```text
vocabulary_sets    (id, title, subject_id?, description, status, …)
vocabulary_items   (id, set_id, word_en, meaning_vi, phonetic?, display_order, …)
```

- [x] Thiết kế schema + tài liệu `VOCABULARY_SET_DB_DESIGN.md`
- [x] Migration `003_vocabulary_sets.sql`
- [x] Entities + CRUD API `/vocabulary-sets`

### 3.2 Import & Admin UI ✅ (MVP)

- [x] Import CSV `word_en, meaning_vi` — `vocabImport.ts`
- [x] Trang Admin **Bộ từ vựng** (`/admin/vocabulary-sets`)
- [x] Form thêm/sửa từ, preview danh sách

### 3.3 Activity Generator (core) ✅ (MCQ MVP)

- [x] `vocabActivityGenerator.ts` — EN → VI MCQ (distractor từ cùng bộ)
- [x] `generateMatchingFromVocabItems()` — ghép cặp (chia 8 cặp/câu nếu bộ lớn)
- [x] Nút **Sinh MCQ** → preview/copy JSON `EXERCISE_SET`
- [x] Wizard **+ Bộ từ vào bài** — VOCABULARY + MCQ + MATCHING (tick riêng)

### 3.4 Gắn vào Lesson ✅

- [x] Block `VOCABULARY` — ref `vocabularySetId`, BE resolve `resolvedVocabularyJson`
- [x] Migration `004_vocabulary_block.sql` — `block_type VARCHAR(64)` (fix ENUM)
- [x] Admin `VocabularyBlockEditor` — picker bộ từ, toggle **Danh sách / Flashcard**
- [x] HS tab Bài học — `VocabularyBlock` list + `VocabularyFlashcard` (tap lật thẻ, Trước/Sau)
- [x] UX flashcard: bỏ nút Lật thẻ, bỏ nhãn Tiếng Anh/Việt

### File deliverable Phase 3 (MVP)

| Vai trò | Đường dẫn |
|---------|-----------|
| Migration | `migrations/003_vocabulary_sets.sql` |
| Seed demo | `seed_vocabulary_set_demo.sql` |
| BE API | `VocabularySetController.java`, `VocabularySetServiceImpl.java` |
| Admin page | `ManageVocabularySetsPage.tsx` |
| Generator | `vocabActivityGenerator.ts` (MCQ + MATCHING) |
| VOCABULARY block | `VocabularyBlock.tsx`, `VocabularyFlashcard.tsx`, `vocabularyPayload.ts` |
| BE resolve | `VocabularyBlockResolverService.java`, `migrations/004_vocabulary_block.sql` |
| Wizard gắn lesson | `VocabAttachToLessonWizard.tsx` |
| Import | `vocabImport.ts`, `VocabularyImportDialog.tsx` |

### Thứ tự implement (session)

```
1. DB migration + VocabularySet CRUD API          ✅
2. Admin trang quản lý bộ từ + import CSV       ✅
3. Generator MVP: sinh MCQ → copy JSON          ✅
4. Block lesson + student player                  ✅
```

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
| 2025-06-07 | Phase 2 hoàn tất | Import bank CSV/Excel + `seed_question_bank_demo.sql` |
| 2025-06-07 | Phase 3 MVP | Vocab sets CRUD + Admin + MCQ generator |
| 2025-06-07 | Phase 2.6 Student player | Shuffle, passScore, giải thích, session F5 |
| 2025-06-07 | Màn kết quả bài tập | `ExerciseResultScreen` + `ExerciseReviewScreen` theo mock `noti_result_lesson` |
| 2025-06-07 | Polish UI kết quả | Bỏ nav trùng, bỏ thanh thưởng, **Bài tiếp theo** → `findNextPublishedLesson` |
| 2026-06-06 | Commit lớn P1+P2 | VOCABULARY block, MATCHING player+editor, session restore fix, Continue Learning `lastTab` |
| 2026-06-06 | Ưu tiên A | Flashcard HS, MATCHING generator, wizard MCQ+MATCHING, admin presentation picker |
| 2026-06-06 | UX polish | Flashcard gọn; màn kết quả — 3 nút mobile tile layout |
| 2026-06-06 | Ưu tiên B MVP | `lesson_practice_attempts` API + FE POST on submit + doc test cases |

---

## Bước tiếp theo (session kế — ưu tiên)

### Ưu tiên B — Progress server ✅ (practice attempt MVP)

1. [x] BE: bảng `lesson_practice_attempts` + `answers_snapshot_json`
2. [x] API POST + GET latest/best/summary
3. [x] FE: POST khi nộp bài (`ExercisePlayer`), chống duplicate F5
4. [x] Reading progress sync (`lesson_reading_progress`)
5. [x] Badge ✓ danh sách bài + banner "Lần trước: X%" (`StudentLessonListPage`, `ContinueLearningCard`, `PracticeAttemptBanner`)

> Chi tiết + **test cases**: [`docs/LESSON_PRACTICE_ATTEMPT.md`](./LESSON_PRACTICE_ATTEMPT.md)

### Ưu tiên B.1 — Cứng hóa MVP ✅ (2026-06-08)

1. [x] **Publish validation** — `LessonPublishValidator` gọi trước `POST /lessons/{id}/publish`
   - Bài phải có ≥ 1 khối
   - `QUESTION_REF`: `refs[]` không rỗng, mọi câu PUBLISHED trong bank
   - `EXERCISE_SET`: ≥ 1 câu MCQ/MATCHING hợp lệ
   - `VOCABULARY`: bộ từ tồn tại, PUBLISHED, có mục từ
2. [x] **URL slug** — migration `007`, API `by-slug/{slug}/detail`, FE `studentLessonPath()`
3. [x] **Badge tiến độ** — chip Đọc X% / Đã đọc / Đã đạt + banner lần trước trên list

### Ưu tiên C — Block types đọc bài ✅ (CALLOUT + SUMMARY, 2026-06-08)

**Mục tiêu:** Tab Bài học phong phú hơn TEXT/IMAGE/VOCABULARY.

#### Payload

| Block | JSON |
|-------|------|
| `SUMMARY` | `{ "title?", "items": string[] }` |
| `CALLOUT` | `{ "variant": "tip"\|"warning"\|"definition", "title?", "html" }` |

#### Checklist

- [x] `summaryPayload.ts`, `calloutPayload.ts` — parse/build/validate
- [x] Admin: `SummaryBlockEditor`, `CalloutBlockEditor` + menu "+ Thêm khối"
- [x] Admin preview (`LessonBlockPreview`)
- [x] HS: `SummaryBlock`, `CalloutBlock` + CSS (`lesson-reader.css`)
- [x] TOC / ước lượng đọc (`lessonReaderUtils`)
- [x] Publish validation: SUMMARY ≥ 1 item, CALLOUT có html

#### File deliverable

| Vai trò | Đường dẫn |
|---------|-----------|
| Payload | `shared/lesson/summaryPayload.ts`, `calloutPayload.ts` |
| Admin editor | `admin/components/SummaryBlockEditor.tsx`, `CalloutBlockEditor.tsx` |
| HS reader | `student/lessonPlayer/study/SummaryBlock.tsx`, `CalloutBlock.tsx` |

### Ưu tiên D — Block types còn thiếu

- [ ] VIDEO, AUDIO — cần asset pipeline (upload + player)

### E2E manual (nên chạy trước khi làm B)

| # | Kịch bản | Trạng thái |
|---|----------|------------|
| 1 | Chạy `005_lesson_practice_attempts.sql` | ⬜ |
| 2 | HS nộp bài → POST 201, DB 1 row + snapshot | ⬜ |
| 3 | Làm lại → 2 rows; F5 result → không POST trùng | ⬜ |
| 4 | Chạy `003` + `004` migration nếu DB cũ còn ENUM `block_type` | ⬜ |
| 2 | Admin: bộ từ 5+ mục → **+ Bộ từ vào bài** (VOCABULARY + MCQ + MATCHING) → Publish | ⬜ |
| 3 | HS tab Bài học: flashcard lật thẻ, Trước/Sau | ⬜ |
| 4 | HS tab Bài tập: MCQ + ghép cặp, kết quả, Xem lại, Bài tiếp theo | ⬜ |
| 5 | Sửa `meaning_vi` trong Admin → F5 HS thấy cập nhật (live resolve) | ⬜ |
| 6 | Continue Learning card → mở đúng tab `?tab=practice` | ⬜ |
| 7 | Bank overlap seed: sửa câu `apple` → 2 lesson cập nhật | ⬜ |

### Polish tuỳ chọn (không chặn)

- [ ] Thời gian làm bài chính xác hơn khi restore session đang làm dở
- [ ] Mascot asset local (thay URL Google tạm)
- [ ] Audio phát âm từ vựng (`audio_asset_id`)
- [ ] `POST /questions/import` API batch (bank)
- [x] Publish validation (BE) — `LessonPublishValidator.java`

### Lệnh DB nhanh (demo)

```bash
mysql -u … -p … < course_english_backend/migrations/003_vocabulary_sets.sql
mysql -u … -p … < course_english_backend/migrations/004_vocabulary_block.sql
mysql -u … -p … < course_english_backend/seed_vocabulary_set_demo.sql
```

### Workflow GV chuẩn (Method 4)

```
/admin/vocabulary-sets → Publish bộ từ
→ Lesson Editor → + Bộ từ vào bài → tick VOCABULARY + MCQ (+ MATCHING)
→ Sửa khối từ vựng: chọn Flashcard nếu cần
→ Publish lesson
→ HS: tab Bài học (flashcard/list) · tab Bài tập (MCQ/MATCHING)
```

---

| 2026-06-08 | Cứng hóa MVP | Publish validation, lesson slug URL, badge tiến độ HS |
| 2026-06-08 | CALLOUT + SUMMARY | Editor admin, reader HS, publish validation |

---

**Tóm tắt:** Phase 1 ✅ · Phase 2 ✅ · Phase 2.6 ✅ · Phase 3 ✅ · Progress server ✅ · Cứng hóa MVP ✅ · CALLOUT/SUMMARY ✅ · **Tiếp theo: VIDEO/AUDIO · E2E manual · Enrollment filter**

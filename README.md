# Course English

LMS học tiếng Anh Grade 1–9: **Lesson = chuỗi Learning Blocks** (đọc/nghe + bài tập tương tác). Fork từ [cell_architecture](../cell_architecture).

## Cấu trúc repo

| Thư mục | Mô tả |
|---------|--------|
| `course_english_backend/` | Spring Boot API — port **7070** |
| `course_english_frontend/` | React + Vite — admin + student |
| `docs/` | Kế hoạch fork |
| `promt.md` | Kiến trúc block đích (Duolingo/Quizlet-style) |

## Trạng thái

### P0 — xong

- [x] Copy code từ Cell Studio, package `com.courseenglish.api`
- [x] DB `course_english`, storage riêng
- [x] Auth, Classroom / Subject / Lesson CRUD
- [x] `LessonBlock` + `payload_json`, editor/reader TEXT + IMAGE
- [x] Student `/student`, progress local (scroll)

### P1 — đang làm (Lesson Player MVP)

Ưu tiên theo [REVIEW.html §13.10](./course_english_frontend/docs/REVIEW.html#lesson-impl-plan):

| Phase | Deliverable | Trạng thái |
|-------|-------------|------------|
| **0** | `EXERCISE_SET` enum + `blockTypes.ts` + schema payload | ✓ |
| **1** | BE `lesson_block_progress` + attempt API | ⏳ |
| **2** | FE tab **Bài học / Bài tập** (`LessonReaderPage`) | ✓ |
| **3** | `ExercisePlayer` + MCQ stepped (0/N, KIỂM TRA) | ✓ |
| **4** | Admin editor `EXERCISE_SET` | ⏳ |
| **5** | Syllabus sidebar Unit + enrollment filter | ⏳ |

Song song (sau Player MVP): AUDIO/CALLOUT/SUMMARY đầy đủ.

### P2 — sau P1

- Question bank + Quiz player độc lập
- Assignment, Dashboard GV

## Chạy local

**1. MySQL** — DB `course_english` (`createDatabaseIfNotExist=true` trong `.env` BE).

**2. Backend**

```bash
cd course_english_backend
copy .env.example .env
.\gradlew.bat bootRun
```

**3. Frontend**

```bash
cd course_english_frontend
copy .env.example .env
npm install
npm run dev
```

- App: http://localhost:5173 → `/student`
- API: http://localhost:7070/api/v1 (FE: `VITE_API_URL=http://localhost:7070/api/v1`)

**4. Seed / import bài tập**

```bash
# Lần đầu: user + lớp + môn
mysql -u root -p course_english < course_english_backend/seed_lms_demo.sql

# Cách A — tạo lesson + block (UUID cố định)
mysql -u root -p course_english < course_english_backend/seed_lesson_vocab_demo.sql

# (Nếu lỗi 1265 block_type — ENUM cũ) chạy migration một lần:
mysql -u root -p course_english < course_english_backend/migrations/001_block_type_varchar.sql
# Hoặc khi thêm VOCABULARY / block type mới:
mysql -u root -p course_english < course_english_backend/migrations/004_vocabulary_block.sql

# Cách B — lesson đã tạo trên Admin (0 khối): gắn EXERCISE_SET theo tên bài
mysql -u root -p course_english < course_english_backend/import_exercise_block_attach.sql

# Cách C — Excel/CSV: sửa file rồi sinh SQL
# Mở course_english_backend/docs/import/vocab_daily_words_questions.csv trong Excel
python course_english_backend/scripts/csv_to_exercise_sql.py course_english_backend/docs/import/vocab_daily_words_questions.csv > import_generated.sql
mysql -u root -p course_english < import_generated.sql
```

Sau import: **F5** màn Soạn bài học → thấy **1 khối · Bài tập**. HS: tab **Bài tập** trên `/student/lessons/:id?tab=practice`.

Tài khoản demo: `hs01@demo.local` / `123456`

## Mô hình Lesson (tóm tắt)

```text
Unit (Subject) → nhiều Lesson (vocab, grammar, …)
  └── LessonBlock[]
        ├── Tab "Bài học": TEXT, VIDEO, VOCABULARY, SUMMARY, …
        └── Tab "Bài tập": EXERCISE_SET (questions[]), QUIZ, …
```

- 18 câu MCQ = **1 block** `EXERCISE_SET`, không 18 row block.
- Chi tiết: `promt.md`, REVIEW mục 13.6–13.10.

## Tài liệu

- **[LESSON_AUTHORING_PROGRESS.md](./docs/LESSON_AUTHORING_PROGRESS.md)** — tiến độ 4 phương thức soạn lesson (đang làm: Manual → Import)
- **[REVIEW.html](./course_english_frontend/public/docs/REVIEW.html)** — product review + checklist (Admin → Review tài liệu)
- [ENGLISH_LEARNING_CLONE_PLAN.md](./docs/ENGLISH_LEARNING_CLONE_PLAN.md)
- [FORK_FROM_CELL_ARCHITECTURE.md](./docs/FORK_FROM_CELL_ARCHITECTURE.md)

## Cấu trúc FE (Lesson Player — đích)

```text
src/shared/lesson/blockTypes.ts       ← STUDY vs PRACTICE, filter tab
src/student/lessonPlayer/
  exercise/types.ts                   ← EXERCISE_SET payload + question types
  exercise/parseExerciseSet.ts
  LessonPlayerPage.tsx                ← Phase 2 (mở rộng LessonReaderPage)
  ExercisePlayer.tsx                  ← Phase 3
  questions/MultipleChoiceQuestion.tsx
```

## Bước tiếp theo

Theo [LESSON_AUTHORING_PROGRESS.md](./docs/LESSON_AUTHORING_PROGRESS.md):

1. ~~Phase 1A/1B~~ — Manual + Import CSV/Excel ✅
2. **Phase 2** — Question Bank + `QUESTION_REF` (xem [LESSON_AUTHORING_PROGRESS.md](./docs/LESSON_AUTHORING_PROGRESS.md))
3. Phase 3 — Vocab Set + Activity Generator

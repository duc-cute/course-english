# Vocabulary Set — Database Design

> Method 4 trong [`promt.md`](../promt.md): GV nhập **bộ từ** → generator sinh activities.  
> **Schema hiện tại (library 3 bảng + Dictionary):** [`VOCABULARY_LIBRARY_DICTIONARY_PROGRESS.md`](./VOCABULARY_LIBRARY_DICTIONARY_PROGRESS.md)

## Mục tiêu

- Lưu **knowledge asset** (word + meaning) trong thư viện trung tâm, tách khỏi Question Bank.
- Bộ từ chỉ **tham chiếu** từ thư viện qua `vocabulary_set_members`.
- Generator (FE MVP) đọc `items[]` → sinh `ExerciseSetPayload` MCQ.
- Block `VOCABULARY` (tab Bài học): live resolve qua JOIN `members` + `words`.

## ER (library)

```text
vocabulary_words (1) ──< vocabulary_set_members (N) >── vocabulary_sets (1)
                                                              │
                                                              └── subject_id? → subjects
```

> Bảng legacy `vocabulary_items` đã gỡ ở migration `009` (sau khi chạy `008` migrate data).

## Bảng

### `vocabulary_sets`

| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| `id` | CHAR(36) PK | UUID |
| `title` | VARCHAR(255) | Tiêu đề bộ từ |
| `description` | TEXT | Tuỳ chọn |
| `subject_id` | CHAR(36) FK | Liên kết môn học (tuỳ chọn) |
| `status` | VARCHAR(20) | `DRAFT` \| `PUBLISHED` \| `ARCHIVED` |
| audit + `voided` | | Soft delete |

### `vocabulary_words` (thư viện trung tâm)

| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| `id` | CHAR(36) PK | |
| `word_key` | VARCHAR(255) UNIQUE | `lower(trim(word_en))` |
| `word_en` | VARCHAR(255) | Từ tiếng Anh |
| `meaning_vi` | TEXT | Nghĩa tiếng Việt |
| `phonetic` | VARCHAR(128) | IPA (enrich từ Dictionary) |
| `audio_uk_url`, `audio_us_url` | VARCHAR(512) | URL phát âm |
| `part_of_speech` | VARCHAR(64) | Tuỳ chọn |
| `enriched_at`, `enrich_source` | | Cache dictionary lookup |
| audit + `voided` | | |

### `vocabulary_set_members` (thành viên bộ từ)

| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| `id` | CHAR(36) PK | |
| `set_id` | CHAR(36) FK | → `vocabulary_sets` |
| `word_id` | CHAR(36) FK | → `vocabulary_words` |
| `display_order` | INT | Thứ tự hiển thị |
| audit + `voided` | | UNIQUE(`set_id`, `word_id`) |

## API

| Method | Path | Mô tả |
|--------|------|--------|
| POST | `/api/v1/vocabulary-sets/search` | List + filter |
| GET | `/api/v1/vocabulary-sets/{id}` | Chi tiết + items (resolve từ members) |
| POST | `/api/v1/vocabulary-sets` | Tạo (items → find-or-create word + members) |
| PUT | `/api/v1/vocabulary-sets/{id}` | Sửa (replace members) |
| DELETE | `/api/v1/vocabulary-sets/{id}` | Xóa mềm |
| POST | `/api/v1/vocabulary-sets/{id}/enrich-all` | Enrich IPA + audio cho từ trong bộ |
| POST | `/api/v1/vocabulary-words/search` | Tìm thư viện từ |
| POST | `/api/v1/vocabulary-words` | Tạo từ + enrich |
| GET | `/api/v1/vocabulary-words/lookup` | Preview dictionary |

## Quan hệ Question Bank

- **Tách module** — vocab là nguồn, bank là output tuỳ chọn.
- Generator MVP: `vocabActivityGenerator.ts` → JSON `EXERCISE_SET` (snapshot).
- Phase sau: sinh câu AI vào bank — xem [`QUESTION_BANK_AI_GEN_PLAN.md`](./QUESTION_BANK_AI_GEN_PLAN.md) Phase AI-3 (`vocabularySetId` + `question-generation`).

## Import CSV

```csv
word_en,meaning_vi,phonetic
apple,quả táo,/ˈæp.əl/
```

## Files

| Vai trò | Path |
|---------|------|
| Migration sets | `course_english_backend/migrations/003_vocabulary_sets.sql` |
| Migration library | `course_english_backend/migrations/008_vocabulary_library.sql` |
| Drop legacy | `course_english_backend/migrations/009_drop_vocabulary_items.sql` |
| Seed | `course_english_backend/seed_vocabulary_set_demo.sql` |
| BE service | `VocabularySetServiceImpl.java`, `VocabularyWordServiceImpl.java` |
| Admin UI | `/admin/vocabulary-sets`, `/admin/vocabulary-words` |
| Generator | `shared/lesson/vocabActivityGenerator.ts` |

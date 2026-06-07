# Vocabulary Set — Database Design (Phase 3)

> Method 4 trong [`promt.md`](../promt.md): GV nhập **bộ từ** → generator sinh activities.

## Mục tiêu

- Lưu **knowledge asset** (word + meaning), tách khỏi Question Bank.
- Generator (FE MVP) đọc `items[]` → sinh `ExerciseSetPayload` MCQ.
- Sau này: block `VOCABULARY` (tab Bài học), live resolve, push vào bank.

## ER (MVP)

```text
vocabulary_sets (1) ──< vocabulary_items (N)
       │
       └── subject_id? → subjects
```

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

### `vocabulary_items`

| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| `id` | CHAR(36) PK | |
| `set_id` | CHAR(36) FK | CASCADE logic qua service |
| `word_en` | VARCHAR(255) | Từ tiếng Anh |
| `meaning_vi` | TEXT | Nghĩa tiếng Việt |
| `phonetic` | VARCHAR(128) | Tuỳ chọn |
| `image_asset_id` | CHAR(36) | Phase sau |
| `audio_asset_id` | CHAR(36) | Phase sau |
| `display_order` | INT | Thứ tự hiển thị |
| audit + `voided` | | |

## API

| Method | Path | Mô tả |
|--------|------|--------|
| POST | `/api/v1/vocabulary-sets/search` | List + filter |
| GET | `/api/v1/vocabulary-sets/{id}` | Chi tiết + items |
| POST | `/api/v1/vocabulary-sets` | Tạo (items trong body) |
| PUT | `/api/v1/vocabulary-sets/{id}` | Sửa (replace items) |
| DELETE | `/api/v1/vocabulary-sets/{id}` | Xóa mềm |

## Quan hệ Question Bank

- **Tách module** — vocab là nguồn, bank là output tuỳ chọn.
- Generator MVP: `vocabActivityGenerator.ts` → JSON `EXERCISE_SET` (snapshot).
- Phase sau: `POST /vocabulary-sets/{id}/generate-questions` bulk vào bank.

## Import CSV

```csv
word_en,meaning_vi,phonetic
apple,quả táo,/ˈæp.əl/
```

## Files

| Vai trò | Path |
|---------|------|
| Migration | `course_english_backend/migrations/003_vocabulary_sets.sql` |
| Seed | `course_english_backend/seed_vocabulary_set_demo.sql` |
| BE service | `VocabularySetServiceImpl.java` |
| Admin UI | `/admin/vocabulary-sets` |
| Generator | `shared/lesson/vocabActivityGenerator.ts` |

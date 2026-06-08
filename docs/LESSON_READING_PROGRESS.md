# Lesson Reading Progress — API & đồng bộ tiến độ đọc

> Phase B3 — đồng bộ tab **Bài học** (`scrollPercent`, `lastBlockId`, `lastTab`) lên server.  
> Bổ sung cho practice attempts (`lesson_practice_attempts`).

## Migration

```bash
mysql -u root -p course_english < course_english_backend/migrations/006_lesson_reading_progress.sql
```

Bảng `lesson_reading_progress`: **một dòng / user / lesson** (UNIQUE `user_id`, `lesson_id`).

| Cột | Mô tả |
|-----|--------|
| `last_block_id` | Block đang đọc (tab study) |
| `scroll_percent` | 0–100 |
| `last_tab` | `study` \| `practice` |
| `lesson_title`, `subject_name` | Hiển thị Tiếp tục học |
| `updated_at` | So sánh merge với local |

## API

Base: `/api/v1/lesson-reading-progress` — cần JWT (claim `duccute.id` hoặc email).

### PUT `/{lessonId}`

Upsert tiến độ.

```json
{
  "lastBlockId": "uuid-block",
  "scrollPercent": 42,
  "lastTab": "study",
  "lessonTitle": "Daily routine",
  "subjectName": "English 6"
}
```

### GET `/{lessonId}`

Tiến độ một bài. `204` nếu chưa có.

### GET `/continue`

Bài có `updated_at` mới nhất của user — dùng card **Tiếp tục học**.

## Frontend

| File | Vai trò |
|------|---------|
| `shared/api/lessonReadingProgress.ts` | Gọi API |
| `student/lessonProgressStorage.ts` | Local cache (giữ nguyên) |
| `student/lessonProgressSync.ts` | `syncLessonProgress`, `resolveContinueLearning`, `hydrateLessonProgressForLesson` |
| `LessonReaderPage.tsx` | Ghi local + debounced PUT (~800ms) khi scroll/tab |
| `StudentHomePage`, `StudentLessonListPage` | `resolveContinueLearning()` — **bản mới hơn** (server vs local) thắng |

Khách chưa đăng nhập: chỉ localStorage (hành vi cũ).

## Test thủ công

| ID | Bước | Kỳ vọng |
|----|------|---------|
| R1 | Đăng nhập HS, mở bài, scroll ~50%, đợi 1s | `PUT` thành công; DB có `scroll_percent` ≈ 50 |
| R2 | F5 trang bài | Banner “đọc dở” + vị trí scroll (local hoặc server) |
| R3 | Xóa localStorage, vào Trang chủ | Card **Tiếp tục học** từ `GET /continue` |
| R4 | Máy A scroll 30%, máy B scroll 80% (cùng account) | Máy mở sau hiện 80% (merge theo `updatedAt`) |
| R5 | Chuyển tab Bài tập | `last_tab` = `practice` trên server |

## File backend

- `LessonReadingProgress.java`
- `LessonReadingProgressRepository.java`
- `LessonReadingProgressServiceImpl.java`
- `LessonReadingProgressController.java`

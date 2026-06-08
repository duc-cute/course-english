# Lesson Practice Attempt — lưu điểm bài tập

> Cập nhật: **2026-06-06**  
> Mục tiêu: mỗi lần HS **nộp bài tập** (XEM KẾT QUẢ) → **1 attempt mới** trên server, kèm `answers_snapshot`.

---

## Tóm tắt

| Khía cạnh | Quyết định |
|-----------|------------|
| Granularity | 1 attempt / lần nộp / user / lesson (gom mọi khối practice) |
| Lịch sử | **Insert mới** mỗi lần làm — không ghi đè |
| Snapshot | Lưu `answers_snapshot_json` (JSON đáp án HS chọn) |
| Session đang làm | Vẫn `localStorage` (`exerciseSessionStorage`) |
| Chấm điểm MVP | Tin client — BE lưu số liệu FE gửi |

---

## Schema

```sql
lesson_practice_attempts (
  id, user_id, lesson_id,
  correct_count, total_count, score_percent, passed,
  pass_score_percent, elapsed_ms,
  block_ids_json,          -- ["uuid-block-1", ...]
  answers_snapshot_json,   -- { "q1": { "correct": true, "selectedChoiceId": "a" }, ... }
  completed_at,
  created_at, updated_at, voided
)
```

Migration: `course_english_backend/migrations/005_lesson_practice_attempts.sql`

---

## API

Base: `/api/v1/lesson-practice-attempts` — **yêu cầu Bearer token**.

| Method | Path | Mô tả |
|--------|------|--------|
| `POST` | `/` | Tạo attempt mới |
| `GET` | `/lessons/{lessonId}/latest` | Attempt gần nhất (204 nếu chưa có) |
| `GET` | `/lessons/{lessonId}/best` | Điểm % cao nhất (204 nếu chưa có) |
| `GET` | `/lessons/{lessonId}` | Danh sách attempt (mới → cũ) |
| `POST` | `/summary` | Batch latest + best cho nhiều lesson (body: `lessonIds[]`) |

### POST body (snapshot có cấu trúc)

```json
{
  "lessonId": "uuid-lesson",
  "correctCount": 6,
  "totalCount": 7,
  "scorePercent": 86,
  "passed": true,
  "passScorePercent": 80,
  "elapsedMs": 125000,
  "blockIds": ["uuid-block-exercise"],
  "answersSnapshot": {
    "answers": {
      "q1": { "correct": true, "selectedChoiceId": "a" },
      "q2": { "correct": false, "selectedChoiceId": "c" },
      "vocab-matching-1": {
        "correct": true,
        "matchingSelections": { "hello": "xin chào", "bye": "tạm biệt" }
      }
    },
    "questionIdsOrder": ["q2", "q1", "vocab-matching-1"],
    "choiceOrders": { "q1": ["c", "a", "b", "d"] }
  }
}
```

Legacy snapshot (flat, không có order) vẫn parse được — xem lại dùng thứ tự lesson mặc định.

### Response (201)

Trả về `ResLessonPracticeAttemptDTO` (cùng field + `id`, `completedAt`).

---

## Luồng FE

```
Làm bài (stepped) → localStorage mỗi câu
Câu cuối → XEM KẾT QUẢ → POST attempt (1 lần)
  → success: session.serverAttemptSynced = true
F5 màn kết quả → không POST lại (lock + serverAttemptSynced)
Làm lại → clear session → attempt mới khi nộp lần 2
```

File:
- `shared/api/lessonPracticeAttempt.ts`
- `ExercisePlayer.tsx` — `submitPracticeAttempt()` trong `handleNext`
- `exerciseSessionStorage.ts` — `serverAttemptSynced`

---

## Test cases

### BE — API

| # | Case | Steps | Expected |
|---|------|-------|----------|
| T1 | Tạo attempt hợp lệ | POST với token HS, lesson publish, 7/7 đúng | 201, 1 row DB, `passed=1` |
| T2 | Mỗi lần làm = row mới | POST 2 lần cùng lesson | 2 rows, `completed_at` khác nhau |
| T3 | Chưa login | POST không Authorization | 401 |
| T4 | Lesson không tồn tại | POST lessonId random | 400/404 message |
| T5 | `correctCount > totalCount` | POST invalid | 400 |
| T6 | GET latest sau T1 | GET `/lessons/{id}/latest` | 200, score 100% |
| T7 | GET latest chưa làm | GET lesson chưa attempt | 204 No Content |
| T8 | GET best | Lần 1: 60%, lần 2: 90% | best = 90% |
| T9 | GET list | Sau 3 lần làm | Array length = 3, sort mới → cũ |
| T10 | Snapshot lưu đủ | POST có matching + MCQ | `answers_snapshot_json` parse được |

### FE — UI

| # | Case | Steps | Expected |
|---|------|-------|----------|
| F1 | Nộp bài lần đầu | Làm hết → XEM KẾT QUẢ | Network: POST 201; DB có 1 row |
| F2 | F5 màn kết quả | F5 trên result | Không POST thêm |
| F3 | Làm lại | Làm lại → nộp lần 2 | POST lần 2; DB 2 rows |
| F4 | Mất mạng khi nộp | DevTools offline → nộp | Màn kết quả vẫn hiện; retry được nếu F5 + chưa synced* |
| F5 | Tab Bài tập restore | F5 giữa chừng đang làm | Không POST; tiếp tục local session |

\* MVP: nếu POST fail, `serverAttemptSynced` false — F5 result có thể thử POST lại nếu bổ sung retry sau.

### E2E thủ công (khuyến nghị)

**Chuẩn bị**
```bash
mysql -u root -p course_english < course_english_backend/migrations/005_lesson_practice_attempts.sql
# BE + FE đang chạy; HS đã login (student demo seed)
```

**Kịch bản A — MCQ pass**
1. Mở lesson có EXERCISE_SET (≥3 câu), tab **Bài tập**
2. Làm đúng đủ để ≥ 80%
3. Bấm **XEM KẾT QUẢ**
4. DevTools → Network: `POST .../lesson-practice-attempts` → 201
5. MySQL:
   ```sql
   SELECT id, correct_count, total_count, score_percent, passed,
          JSON_LENGTH(answers_snapshot_json) AS answer_keys
   FROM lesson_practice_attempts
   WHERE voided = 0
   ORDER BY completed_at DESC LIMIT 3;
   ```
6. `answer_keys` = số câu đã làm

**Kịch bản B — Làm lại = attempt mới**
1. Trên màn kết quả → **Làm lại**
2. Cố ý sai vài câu → nộp
3. Query DB → **2 rows** cùng `user_id` + `lesson_id`

**Kịch bản C — F5 không duplicate**
1. Nộp xong → F5
2. Network không có POST mới
3. `localStorage` key `course-english.exercise.v1.{lessonId}` có `"serverAttemptSynced":true`

**Kịch bản D — GET latest (curl)**
```bash
# Lấy token sau login HS
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:7070/api/v1/lesson-practice-attempts/lessons/{LESSON_ID}/latest
```

**Kịch bản E — MATCHING snapshot**
1. Lesson có khối ghép cặp từ wizard vocab
2. Nộp bài
3. DB `answers_snapshot_json` chứa key `vocab-matching-*` và `matchingSelections`

---

## Chưa làm (phase sau)

- [x] `lesson_reading_progress` — sync scroll/tab Bài học (`LESSON_READING_PROGRESS.md`)
- [ ] Badge ✓ trên danh sách bài (GET best)
- [ ] Xem lại từ server khi xóa localStorage
- [ ] BE re-score / anti-cheat
- [ ] Dashboard GV

---

## File liên quan

| Vai trò | Path |
|---------|------|
| Migration | `migrations/005_lesson_practice_attempts.sql` |
| Entity | `domain/LessonPracticeAttempt.java` |
| Service | `LessonPracticeAttemptServiceImpl.java` |
| Controller | `LessonPracticeAttemptController.java` |
| FE API | `shared/api/lessonPracticeAttempt.ts` |
| Player hook | `ExercisePlayer.tsx` |

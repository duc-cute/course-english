# Progress — Giao diện & chức năng Học sinh

> Cập nhật: **13/06/2026**  
> Repo: `course_english_frontend` + `course_english_backend`  
> Tham chiếu thiết kế: `Design/stitch_quest_english_learning_platform/` (Vibrant Scholar)  
> Theme đang chạy: **Vibrant Scholar** (`styles/student/vibrant-theme.css`, `--vq-*`)

---

## Tổng quan nhanh

| Nhóm | Tiến độ ước lượng | Ghi chú |
|------|-------------------|---------|
| Shell & điều hướng | **85%** | App shell + bottom nav; Profile ✅; Leaderboard placeholder |
| Trang chủ & danh sách bài | **90%** | Home bento + enrollment filter + path |
| Lesson Player (đọc bài) | **85%** | Vq reskin, chrome progress, mascot tip |
| Bài tập (Exercise) | **90%** | 8/8 loại câu; retry câu sai; Vq result/review |
| Từ vựng | **75%** | Vocab center list + flashcard practice |
| Gamification (FE) | **40%** | XP/streak/badge client-side ✅ S8a; chưa BE |
| Lớp học / phân quyền nội dung | **70%** | Lọc lesson/vocab theo enrollment ✅ S6/S7 |
| Leaderboard | **5%** | Placeholder — cần S8b BE |
| Bài tập GV / nộp bài (Assignment) | **0%** | Chưa có màn student |

**Tổng thể chức năng học bài cốt lõi:** ~**85%**  
**Tổng thể giao diện Vibrant Scholar (student zone):** ~**75%**

---

## Màn hình & route hiện có

| Route | Trang | Trạng thái |
|-------|-------|------------|
| `/student` | Trang chủ | ✅ Bento + XP/streak thật (S8a) |
| `/student/lessons` | Danh sách bài publish | ✅ Search + enrollment filter (S6) |
| `/student/lessons/:slug` | Lesson Player | ✅ Study + Practice (S4/S5) |
| `/student/path` | Lộ trình học (map) | ✅ S3 |
| `/student/vocab` | Trung tâm từ vựng | ✅ S7 |
| `/student/vocab/:setId` | Flashcard practice | ✅ S7 |
| `/student/profile` | Hồ sơ học sinh | ✅ S8a MVP |
| `/student/leaderboard` | Bảng xếp hạng | ❌ Placeholder — S8b |
| `/student/usage-guide` | Hướng dẫn sử dụng | ✅ |

**Layout:** `StudentAppLayout` (sidebar + bottom nav) · `StudentPlayerLayout` (lesson player, không app nav).

---

## Sprint đã hoàn thành (S0–S8a)

| Sprint | Phạm vi | Trạng thái |
|--------|---------|------------|
| S0 | Shell 2 mode, route adapters | ✅ |
| S1 | UI kit Vq, login → `/student` | ✅ |
| S2 | Home dashboard bento | ✅ |
| S3 | Lesson list reskin + learning path | ✅ |
| S4 | Lesson player Vq reskin | ✅ |
| S5 | TRUE_FALSE player, retry câu sai, result/review Vq | ✅ |
| S6 | Enrollment filter (BE + FE) | ✅ |
| S7 | Vocab center MVP | ✅ |
| **S8a** | **Profile MVP — stats + badges + history (FE-only)** | ✅ |
| S8b | Leaderboard + gamification BE | 📋 Kế hoạch (xem bên dưới) |

---

## S8a — Profile MVP (đã làm)

### Route & code

| File | Vai trò |
|------|---------|
| `student/profile/ProfilePage.tsx` | Trang chính 3 tab |
| `student/profile/useStudentStats.ts` | Load lessons enrolled + practice summary |
| `student/profile/studentStats.ts` | Tính XP, streak, số liệu |
| `student/profile/badges.ts` | 6 huy hiệu client-side |
| `student/profile/usePracticeHistory.ts` | 15 attempt gần nhất |
| `styles/student/profile.css` | Styles profile |

### Tính năng

| Tính năng | Trạng thái |
|-----------|------------|
| Header: avatar, tên, email (JWT), lớp ghi danh | ✅ |
| XP + streak tuần (derive FE) | ✅ |
| Tab **Tổng quan**: 4 metric + streak + CTA bài học | ✅ |
| Tab **Huy hiệu**: 6 badge unlock theo rule | ✅ |
| Tab **Lịch sử**: 15 lần làm bài gần nhất | ✅ |
| Đăng xuất | ✅ |
| Home hero XP thật (không còn `—`) | ✅ |
| Home badges preview → unlock thật | ✅ |

### Công thức XP (tạm, FE-only)

```
XP = (bài tập pass × 50) + (bài đọc xong ≥98% × 20) + (tổng lần làm bài × 5)
```

### Huy hiệu (client-side)

| ID | Điều kiện mở |
|----|--------------|
| `first_lesson` | Bắt đầu ≥1 bài (scroll >2%) |
| `on_fire` | Học ≥3 ngày trong tuần |
| `quiz_master` | Pass ≥5 bài tập |
| `perfect` | Đạt 100% một bài tập |
| `bookworm` | Đọc xong ≥3 bài |
| `dedicated` | Tổng ≥10 lần làm bài |

### Giới hạn S8a

- XP/streak/badge **không lưu server** — đổi thiết bị hoặc xóa localStorage có thể lệch streak
- Leaderboard vẫn placeholder
- Không sửa avatar / đổi mật khẩu trong profile

---

## S8b — Leaderboard + Gamification BE (chưa làm — hướng triển khai)

> Làm khi cần xếp hạng lớp thật hoặc sync XP cross-device.

### Phase 1 — API aggregate (không cần bảng mới)

| Endpoint | Mô tả |
|----------|--------|
| `GET /api/v1/students/me/stats` | XP, streak, badge flags — aggregate từ `lesson_reading_progress` + `lesson_practice_attempt` |
| `GET /api/v1/classrooms/{id}/leaderboard?period=week` | Top N HS cùng enrollment ACTIVE, sort theo XP tuần |

**Query gợi ý leaderboard:**

```sql
-- Pseudocode: sum best pass score / XP per user trong classroom
SELECT u.id, u.display_name, SUM(computed_xp) AS xp
FROM lesson_practice_attempt a
JOIN enrollment e ON e.student_id = a.user_id AND e.status = 'ACTIVE'
JOIN lesson l ON l.id = a.lesson_id
JOIN subject s ON s.id = l.subject_id AND s.classroom_id = :classroomId
WHERE a.completed_at >= :weekStart AND a.voided = false
GROUP BY u.id
ORDER BY xp DESC
LIMIT 20
```

**FE:** thay `StudentLeaderboardPage` placeholder bằng `LeaderboardPage` — filter lớp (reuse `EnrollmentClassroomFilter`), highlight hàng của mình.

### Phase 2 — Persistence gamification (tùy chọn)

| Bảng | Mục đích |
|------|----------|
| `student_stats` | `user_id`, `total_xp`, `current_streak`, `last_active_date` |
| `student_badge` | `user_id`, `badge_id`, `unlocked_at` |
| `leaderboard_snapshot` | Cache tuần (cron) nếu lớp lớn |

**Rule XP server (đồng bộ với S8a):**

- Pass bài tập: +50
- Đọc xong bài (≥98%): +20
- Mỗi lần làm bài: +5
- Streak bonus: +10/ngày liên tiếp (cap tuần)

**SystemConfig toggles:**

- `GAMIFICATION_XP_ENABLED` — bật/tắt hiển thị XP
- `LEADERBOARD_ENABLED` — bật/tắt tab xếp hạng (elementary có thể tắt)

### Phase 3 — Wire Home + Profile

- Home/Profile gọi `GET /students/me/stats` thay vì `computeStudentStats` local
- Badge unlock từ server (hoặc hybrid: server + client preview)
- Streak merge: `max(local, server)` trong transition period

### Acceptance criteria S8b

- [ ] HS thấy top 10 lớp + vị trí của mình
- [ ] XP trên Home khớp Profile sau reload / thiết bị khác
- [ ] Admin có thể tắt leaderboard qua SystemConfig
- [ ] Chỉ HS enrollment ACTIVE trong lớp mới xuất hiện trên bảng

---

## Chức năng chi tiết (snapshot)

### Trang chủ

| Tính năng | Trạng thái |
|-----------|------------|
| Hero mascot + speech bubble | ✅ |
| XP / streak (derive enrolled lessons) | ✅ S8a |
| Tiếp tục học, daily goals, streak tuần | ✅ |
| Huy hiệu preview → Profile | ✅ S8a |
| Quick links | ✅ |

### Danh sách bài & lộ trình

| Tính năng | Trạng thái |
|-----------|------------|
| Lọc theo lớp enrollment | ✅ S6 |
| Path nodes zigzag + lock tuần tự | ✅ S3 |
| Practice summary trên card | ✅ |

### Exercise

| Loại câu | Player |
|----------|--------|
| MCQ, Matching, Fill blank, Listen choose, Spelling, Listen type, Reorder sentence, **TRUE_FALSE** | ✅ S5 |

| Tính năng | Trạng thái |
|-----------|------------|
| Luyện lại câu sai | ✅ S5 |
| Vq result/review screen | ✅ S5 |
| Lưu attempt server | ✅ |

### Tiến độ & API

| Endpoint | Dùng ở |
|----------|---------|
| `POST /lessons/search` (`enrolledOnly`, `classroomId`) | List, path, stats |
| `POST /enrollments/search` (`mine: true`) | Filter lớp |
| `POST /vocabulary-sets/search` | Vocab center |
| `POST /lesson-practice-attempts/summary` | List, profile stats |
| `GET /lesson-practice-attempts/lessons/:id` | Profile history |

---

## Cấu trúc code chính

```
src/
├── pages/student/              # Route adapters (re-export)
├── student/
│   ├── shell/                  # App vs player chrome
│   ├── ui/                     # Vq primitives
│   ├── home/                   # Home dashboard
│   ├── lessons/                # List + path + enrollment
│   ├── vocab/                  # Vocab center
│   ├── profile/                # S8a Profile + stats + badges
│   ├── lessonPlayer/           # Reader + exercise
│   └── lessonProgressStorage.ts
└── styles/student/
    ├── vibrant-theme.css
    ├── home.css, lessons.css, vocab.css, profile.css
    └── lesson-player-vq.css
```

---

## Việc tiếp theo đề xuất

### Ngắn hạn

- [ ] **S8b** — API leaderboard + `/students/me/stats` (xem hướng trên)
- [ ] Gate lesson/vocab detail API theo enrollment (slug vẫn truy cập được nếu biết URL)
- [ ] Leaderboard placeholder → trang “sắp có” có link Profile stats

### Trung hạn

- [ ] Assignment & Submission (roadmap v1)
- [ ] Glossary popup, ghi chú cá nhân

---

## Tài liệu liên quan

| File | Nội dung |
|------|----------|
| `docs/STUDENT_FE_STRUCTURE.md` | Cấu trúc FE student zone |
| `docs/REVIEW.html` | Review sản phẩm — tab Student UI |
| `Design/stitch_quest_english_learning_platform/` | Mock UI |

---

## Changelog file này

| Ngày | Ghi chú |
|------|---------|
| 13/06/2026 | Khởi tạo — snapshot codebase |
| 13/06/2026 | S0–S4: shell, home, lessons/path, lesson player Vq |
| 13/06/2026 | S5: TRUE_FALSE, retry câu sai, exercise Vq reskin |
| 13/06/2026 | S6: enrollment filter BE + FE |
| 13/06/2026 | S7: vocab center MVP |
| 13/06/2026 | **S8a: Profile MVP — stats, badges, history, Home XP/badges** |
| 13/06/2026 | **Ghi hướng S8b** — leaderboard + gamification BE |

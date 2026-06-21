# Kế hoạch Students Need Support — HS cần hỗ trợ

> Cập nhật: **21/06/2026** (SNS-0 → SNS-4 hoàn thành)  
> Tham chiếu UI: `Design/UI_profile_gv/code.html` (Section 3), `promt.md`  
> Repo: `course_english_backend` + `course_english_frontend`  
> Liên quan: `TEACHER_TEACHING_PLAN.md` (Today's Teaching Plan — đã xong)

---

## Trạng thái triển khai (tổng quan)

| Phase | Mô tả | Trạng thái |
|-------|--------|------------|
| **SNS-0** | `lessons.due_at` — hạn nộp bài | ✅ Xong |
| **SNS-1** | Risk engine + API | ✅ Xong |
| **SNS-2** | Widget dashboard (3 cards) | ✅ Xong |
| **SNS-3** | Trang full + filter + sidebar | ✅ Xong |
| **SNS-4** | Popup hồ sơ + detail API | ✅ Xong |
| **SNS-5** | Snapshot, email digest, tối ưu | ⏳ Chưa làm |

**MVP Students Need Support: ~95%** — dùng được end-to-end (GV set hạn → risk → widget → bảng → popup chi tiết).

### Đã ship

| Lớp | File / endpoint chính |
|-----|---------------------|
| DB | `migrations/020_lesson_due_at.sql` |
| BE | `StudentSupportRiskServiceImpl`, `StudentSupportController` |
| BE API | `GET /api/v1/teacher/students-need-support/summary` |
| BE API | `GET /api/v1/teacher/students-need-support` (search + filter + page) |
| BE API | `GET /api/v1/teacher/students-need-support/widget` |
| BE API | `GET /api/v1/teacher/students-need-support/{studentId}/detail?classroomId=` |
| FE API | `shared/api/studentSupport.ts` |
| FE | `StudentsNeedSupportSection` — widget trên `AdminDashboardPage` |
| FE | `TeacherStudentSupportPage` — `/admin/students-need-support` |
| FE | `StudentSupportProfileDialog` — 3 nhóm bài + link mở lesson |
| FE | Sidebar *Học sinh cần hỗ trợ* |

### Chưa làm / defer

| Hạng mục | Ghi chú |
|----------|---------|
| Unit test scoring BE | SNS-1 AC — manual test |
| `admin-student-support.css` riêng | Dùng MUI + `admin-panel-card` hiện có |
| Badge “Có hạn” trên danh sách lesson | SNS-0 optional |
| Sort query param trên API list | Sort cố định `riskScore desc` trong service |
| SNS-5 snapshot / email digest | Phase sau |

### Migration cần chạy

```bash
mysql -u root -p course_english < course_english_backend/migrations/020_lesson_due_at.sql
```

### Test nhanh

- Login GV: `giaovien1@demo.local` / `123456`
- Set **Hạn nộp** quá hạn cho bài PUBLISHED → HS chưa pass xuất hiện trong widget/bảng
- Dashboard `/admin` → widget **Students Need Support** → **Xem tất cả**
- `/admin/students-need-support` → lọc + **View Profile**

---

## Mục tiêu sản phẩm

Giúp giáo viên **trong 5 giây** biết học sinh nào đang có nguy cơ tụt lại và **vì sao** — để can thiệp sớm (nhắn tin, xem tiến độ, gọi phụ huynh…).

| Đây là | Không phải |
|--------|------------|
| Danh sách HS cần chú ý theo rule rõ ràng | Dashboard analytics / biểu đồ |
| Bảng/card quét nhanh + lý do + hành động | Leaderboard / xếp hạng lớp |
| Công cụ can thiệp cho GV | Báo cáo quản trị toàn trường |

**Tách biệt** với các block prototype khác:

| Block prototype | Module | Ghi chú |
|-----------------|--------|---------|
| **Students Need Support** | Tài liệu này | Risk score từ hành vi học |
| Attention Required | `teacher_tasks` (sau) | Task tổng hợp: chấm bài, setup… |
| Pending Grading | Grading workflow (sau) | Bài HS nộp chờ GV chấm |

---

## Hai tầng UI (prototype vs promt)

### Tầng 1 — Widget dashboard (`code.html` §3)

- Tiêu đề **Students Need Support** + link **Xem tất cả**
- **3 card** HS risk cao nhất (avatar, tên, badge lý do chính)
- Nút **View Profile** (không có Message — đã chốt)
- Ví dụ badge: *No activity: 5 days* · *Score dropped: -15%* · *3 Missing assignments*

### Tầng 2 — Trang đầy đủ (`promt.md`)

- **Summary cards**: Critical / Warning / Attention (đếm HS)
- **Bảng** cột: Student · Risk · Inactive Days · Missing · Avg Score · Trend · Reason · Actions
- **Filter**: Lớp · Risk level · Inactive · Missing · Tìm tên

**Thứ tự làm:** Widget trước (giá trị nhanh trên dashboard) → Trang full + filter sau.

---

## Baseline dữ liệu hiện có

| Có trong DB/API | Dùng cho risk |
|-----------------|---------------|
| `classrooms` + `teacher_id` | Phạm vi GV |
| `enrollments` (ACTIVE) | Danh sách HS theo lớp |
| `subjects.classroom_id` → `lessons` | Bài thuộc lớp |
| `lessons.status = PUBLISHED` | Bài “đã giao” |
| `lesson_practice_attempts` (score, passed, completed_at) | Điểm, hoàn thành bài tập |
| `lesson_reading_progress` (updated_at, scroll_percent) | Hoạt động đọc bài |
| `lessons.due_at` (**SNS-0**) | Hạn nộp — xác định thiếu bài rõ ràng |

| Chưa có / sẽ thêm | Ảnh hưởng |
|-------------------|-----------|
| Chat / Message GV↔HS | **Không làm** — bỏ nút Message |
| Trang admin “hồ sơ HS” riêng | View Profile = **popup/modal** tiến độ |
| Snapshot risk | Phase SNS-5 — compute on read trước |

### Quan hệ dữ liệu (risk scope)

```
Teacher
  └── classrooms[]
        └── subjects[]
              └── lessons[] (PUBLISHED)
        └── enrollments[] (ACTIVE)
              └── student (User)
                    ├── lesson_reading_progress
                    └── lesson_practice_attempts
```

Chỉ tính HS **đang ACTIVE** trong lớp mà `classroom.teacher_id` = GV đăng nhập (admin xem tất cả tùy policy sau).

---

## Risk Score — quy tắc (`promt.md`)

Điểm cộng dồn (cap tối đa gợi ý **100**):

| Tín hiệu | Điều kiện | Điểm |
|----------|-----------|------|
| Không hoạt động | Không có activity **> 7 ngày** (strict `>`) | +50 |
| Thiếu bài | ≥1 bài **OVERDUE** (`due_at` qua, chưa `passed`) | +30 |
| Điểm thấp | Trung bình điểm bài tập < **60%** | +25 |
| Tụt điểm | Xu hướng giảm ≥ **15%** so với 3 bài gần trước | +20 |

**Mức risk:**

| Level | Điều kiện | Màu UI |
|-------|-----------|--------|
| `CRITICAL` | score ≥ 70 | 🔴 |
| `WARNING` | score ≥ 40 | 🟠 |
| `ATTENTION` | score ≥ 20 | 🟡 |
| — | score < 20 | Không hiện trong danh sách “cần hỗ trợ” |

### Định nghĩa kỹ thuật v1 (đã implement)

**Last activity (`inactiveDays`)**

```text
lastActivityAt = MAX(
  lesson_reading_progress.updated_at,
  lesson_practice_attempts.completed_at
) trên mọi lesson thuộc lớp của GV

inactiveDays = daysBetween(lastActivityAt, now)
Nếu chưa có activity nào → inactiveDays = daysSince(enrollment.joinedAt)
```

**Missing assignments (`missingCount`)** — dùng **`lessons.due_at`**

```text
eligible = lesson PUBLISHED + due_at IS NOT NULL + thuộc lớp HS đang học

OVERDUE (thiếu / quá hạn):
  due_at < now AND chưa có lesson_practice_attempt với passed = true

UPCOMING (chưa làm, còn hạn):
  due_at >= now AND chưa passed
  → không tính vào missingCount / risk +30
  → hiện trong popup View Profile (bài sắp đến hạn)

missingCount = COUNT(OVERDUE)
```

**Risk rule:** chỉ **OVERDUE** mới +30. Bài chưa đến hạn không phạt risk.

**GV set hạn:** khi publish lesson hoặc sửa lesson — field `due_at` (datetime, TZ VN). Nullable = không coi là bài có deadline (không vào missing).

**Average score (`avgScorePercent`)**

```text
Với mỗi lesson có attempt: lấy best score_percent
avgScore = trung bình các best score (lesson không có attempt → không tính vào mẫu, hoặc tính 0 — chọn: không tính)
```

**Score trend (`scoreTrendPercent`)**

```text
Sắp xếp lesson theo thời gian attempt gần nhất
recentAvg = TB 3 bài có điểm gần nhất
previousAvg = TB 3 bài ngay trước đó
trend = recentAvg - previousAvg (âm = tụt)
Rule +20 nếu trend <= -15
```

**Reason label (hiển thị 1 dòng)**

Ưu tiên lý do có điểm cao nhất, ghép tối đa 2:

- *Inactive + Missing Homework*
- *Low Performance*
- *Score dropped: -15%*

---

## API contract (đã implement)

Base: `/api/v1/teacher/students-need-support`

### `GET /summary`

Dùng cho summary cards + widget header.

```json
{
  "criticalCount": 5,
  "warningCount": 8,
  "attentionCount": 12,
  "totalAtRisk": 25
}
```

### `GET /` (list / search)

Query: `classroomId`, `riskLevel`, `minInactiveDays`, `minMissing`, `keyword`, `page`, `size`  
*(Sort cố định `riskScore desc` trong service — param `sort` chưa expose)*

```json
{
  "summary": { "criticalCount": 5, "warningCount": 8, "attentionCount": 12 },
  "items": [
    {
      "studentId": "uuid",
      "studentName": "Nguyen Van A",
      "avatarUrl": "…",
      "classroomId": "uuid",
      "classroomName": "Class 10A1",
      "riskLevel": "CRITICAL",
      "riskScore": 80,
      "inactiveDays": 10,
      "missingAssignments": 3,
      "overdueLessons": [
        { "lessonId": "uuid", "title": "Unit 2", "dueAt": "2026-06-15T23:59:00Z" }
      ],
      "avgScorePercent": 45,
      "scoreTrendPercent": -30,
      "primaryReason": "Inactive + Missing Homework",
      "reasonCodes": ["INACTIVE_7D", "MISSING_ASSIGNMENTS", "LOW_AVG_SCORE"]
    }
  ],
  "meta": { "page": 0, "size": 20, "total": 25 }
}
```

### `GET /widget`

Top **3** HS risk cao nhất (cùng shape item, không phân trang).

### `GET /{studentId}/detail`

Query bắt buộc: `classroomId`

```json
{
  "profile": { "...": "cùng shape ResStudentSupportItemDTO" },
  "overdueLessons": [
    { "lessonId": "uuid", "title": "Unit 2", "slug": "unit-2", "dueAt": "…", "bestScorePercent": 40, "passed": false }
  ],
  "upcomingLessons": [ "..." ],
  "completedLessons": [ "..." ]
}
```

**Phân quyền:** GV chỉ HS lớp mình; `ADMIN_ROLE` xem tất cả lớp.

**Performance v1:** compute on read trong service; cache request 60s (optional). Phase 3: snapshot table.

---

## UI — Component map

```
src/
├── admin/components/studentSupport/
│   ├── StudentsNeedSupportSection.tsx   # Widget dashboard (3 cards)
│   ├── StudentSupportCard.tsx
│   ├── StudentSupportProfileDialog.tsx  # Popup View Profile
│   ├── StudentSupportSummaryStrip.tsx   # Critical / Warning / Attention
│   ├── StudentSupportTable.tsx
│   └── studentSupportUtils.ts           # badge color, format trend
├── pages/admin/
│   └── TeacherStudentSupportPage.tsx    # /admin/students-need-support
└── shared/api/
    └── studentSupport.ts
```

**Actions v1:**

| Nút | Hành vi | Ghi chú |
|-----|---------|---------|
| View Profile | Mở **Dialog/Modal** (MUI `Dialog`) — tiến độ HS, danh sách bài thiếu/chưa làm | Không drawer |
| ~~Message~~ | **Không có** | Bỏ khỏi UI prototype |

---

## Use cases

### UC-SNS-01 — Xem widget trên dashboard

1. GV mở `/admin`
2. Section **Students Need Support** load `GET /widget`
3. Thấy tối đa 3 HS + badge lý do
4. **Xem tất cả** → trang full

### UC-SNS-02 — Xem danh sách đầy đủ + lọc

1. Vào `/admin/students-need-support`
2. Summary cards + bảng
3. Lọc theo lớp / mức risk / tìm tên
4. Sort mặc định: riskScore giảm dần

### UC-SNS-03 — Xem hồ sơ HS (popup)

1. Bấm **View Profile** trên card hoặc bảng
2. **Dialog** full-width medium: tên, avatar, lớp, risk, inactive days
3. Tab hoặc section:
   - **Quá hạn** — danh sách lesson `due_at < now`, chưa pass (title, due, điểm best nếu có)
   - **Chưa làm (còn hạn)** — `due_at >= now`, chưa pass
   - **Đã hoàn thành** — passed attempts gần đây
4. Đóng popup → quay lại danh sách

### ~~UC-SNS-04 — Nhắn HS~~

Đã bỏ — không có Message trong v1.

---

## Roadmap theo phase

### Phase SNS-0 — `lessons.due_at` (BE + FE lesson editor) ✅

**Mục tiêu:** GV gán hạn nộp khi publish/sửa bài — nền cho missing chính xác.

| Hạng mục | Deliverable | Trạng thái |
|----------|-------------|------------|
| DB | `migrations/020_lesson_due_at.sql` | ✅ |
| BE | `Lesson.dueAt`, create/update | ✅ |
| FE | Field **Hạn nộp** — `ManageLessonPage` + `LessonEditorPage` | ✅ |
| FE | Cột Hạn nộp trên danh sách lesson | ✅ |
| FE | Badge “Có hạn” trên danh sách lesson | ⏳ Optional — chưa |

**AC:**

- [x] GV set `due_at` khi publish/sửa lesson
- [x] Lesson không `due_at` → không tính missing
- [x] HS quá `due_at` chưa pass → OVERDUE trong risk

---

### Phase SNS-1 — Risk engine + API (BE) ✅

**Mục tiêu:** Tính risk đúng rule, API summary + list + widget.

| Hạng mục | Deliverable | Trạng thái |
|----------|-------------|------------|
| BE | `StudentSupportRiskServiceImpl` | ✅ |
| BE | `StudentSupportController` — summary, list, widget | ✅ |
| BE | `StudentSupportRiskLevelEnum` | ✅ |
| BE | Unit test scoring | ⏳ Chưa |

**AC:**

- [x] HS có bài OVERDUE → +30, `missingCount` đúng
- [x] inactive / avg / trend theo rule `promt.md`
- [x] GV chỉ thấy HS lớp mình; ADMIN xem all
- [x] HS score <20 không trong list

---

### Phase SNS-2 — Widget dashboard (FE) ✅

| Hạng mục | Deliverable | Trạng thái |
|----------|-------------|------------|
| FE | `StudentsNeedSupportSection` — 3 cards | ✅ |
| FE | Badge lý do, avatar, **Xem tất cả** | ✅ |
| FE | View Profile → Dialog (metrics + overdue từ list) | ✅ |
| FE | `admin-student-support.css` | ⏳ Dùng style chung |

**AC:**

- [x] Dashboard hiện ≤3 HS risk cao nhất
- [x] Empty: “Tất cả học sinh đang ổn định.”
- [x] Xem tất cả → `/admin/students-need-support`

---

### Phase SNS-3 — Trang full + filter (FE) ✅

| Hạng mục | Deliverable | Trạng thái |
|----------|-------------|------------|
| FE | Route `/admin/students-need-support` + sidebar | ✅ |
| FE | `StudentSupportSummaryStrip` | ✅ |
| FE | `StudentSupportTable` + pagination | ✅ |
| FE | Filter: lớp, risk, inactive, missing, keyword | ✅ |
| FE | Sort đa cột trên UI | ⏳ BE sort cố định riskScore desc |

**AC:**

- [x] Lọc lớp + risk level
- [x] Tìm tên HS / lớp
- [x] Summary khớp bộ lọc (từ API search response)

---

### Phase SNS-4 — Popup hồ sơ đầy đủ (FE + BE detail API) ✅

| Hạng mục | Deliverable | Trạng thái |
|----------|-------------|------------|
| BE | `GET /{studentId}/detail` — overdue / upcoming / completed | ✅ |
| FE | `StudentSupportProfileDialog` — 3 nhóm bài, điểm, link lesson editor | ✅ |

**AC:**

- [x] Popup load detail API khi mở
- [x] Quá hạn / còn hạn / đã hoàn thành
- [x] Link mở bài (tab mới lesson editor)

---

### Phase SNS-5 — Tối ưu & mở rộng (sau)

| Hạng mục | Ghi chú |
|----------|---------|
| Bảng `student_support_snapshots` | Job nightly, dashboard nhanh |
| Gia hạn per-student | Bảng `assignment_extensions` (sau, nếu cần) |
| Email GV digest tuần | “5 HS critical cần xem” |
| In-app Message | Chỉ khi có module chat |
| Tích hợp Attention Required | Không trùng Pending Grading |

---

## Quyết định đã chốt (21/06/2026)

| # | Quyết định |
|---|------------|
| 1 | **Missing** = lesson `PUBLISHED` + có `due_at` + **quá hạn** (`due_at < now`) + chưa `passed`. Bài còn hạn chưa làm → hiện trong popup, **không** tính missing/risk. |
| 2 | **Message** — **không làm**; bỏ nút khỏi widget và bảng. |
| 3 | **View Profile** — **Popup/Dialog** (không drawer), mở từ card hoặc cột Actions. |
| 4 | **SNS-0 trước SNS-1** — cần `due_at` trên `lessons` trước khi chạy risk engine. |

### ~~Quyết định cần chốt~~ (đã chốt ở trên)

---

## Effort tổng (ước lượng vs thực tế)

| Phase | BE | FE | Trạng thái |
|-------|----|----|------------|
| SNS-0 | 1d | 1d | ✅ |
| SNS-1 | 3–4d | — | ✅ (thiếu unit test) |
| SNS-2 | — | 2d | ✅ |
| SNS-3 | — | 2–3d | ✅ |
| SNS-4 | 1d | 2d | ✅ |
| SNS-5 | TBD | TBD | ⏳ |

**MVP đã ship:** SNS-0 → SNS-4.

---

## Liên kết prototype

- Dashboard widget: `Design/UI_profile_gv/code.html` lines 282–341
- Functional spec: `promt.md`
- Design tokens: `Design/UI_profile_gv/DESIGN.md` (dùng `--ac-error`, `--ac-tertiary` cho badge)

---

## Tóm tắt một dòng

> **Tính risk từ dữ liệu học có sẵn (enrollment + lesson + attempt + reading) → API → widget 3 HS trên dashboard → trang bảng đầy đủ — không analytics, không leaderboard.**

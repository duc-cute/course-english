# Kế hoạch Today's Teaching Plan — Lịch dạy giáo viên

> Cập nhật: **21/06/2026**  
> Tham chiếu: `Design/UI_profile_gv/code.html` (Section 1), `Design/UI_profile_gv/DESIGN.md`  
> Repo: `course_english_backend` + `course_english_frontend`  
> Phạm vi tài liệu này: **Today's Teaching Plan** (timeline lịch dạy trong ngày).  
> **Ngoài phạm vi (làm sau):** Attention Required · Quick Prep · Pending Grading · bảng `teacher_tasks`.

---

## Mục tiêu sản phẩm

Giáo viên mở Teacher Workspace và **biết ngay hôm nay dạy lớp nào, lúc mấy giờ, vào link nào, mở bài gì** — không cần vào từng màn quản lý lớp/bài học.

| Hành vi mong muốn | Cơ chế |
|-------------------|--------|
| Chuẩn bị buổi dạy sắp tới | Timeline theo giờ, highlight buổi kế tiếp |
| Vào lớp online nhanh | Nút **Join Meet** (mở link meet) |
| Mở nội dung bài dạy | Nút **Open Lesson** (lesson editor hoặc preview) |
| Lên lịch / sửa lịch | CRUD buổi học (`class_sessions`) |
| HS biết giờ học | Cùng dữ liệu `class_sessions`, view phía học sinh (phase sau) |

---

## Baseline hiện tại

| Có | Chưa |
|----|------|
| `Classroom` (name, code, teacher_id) | Không entity lịch / buổi học |
| `Lesson` (title, slug, status, subject) | Không API teaching plan |
| `Enrollment` (HS trong lớp) | Admin dashboard mock stats, không timeline |
| Prototype UI timeline (`code.html` § Today's Teaching Plan) | Chưa implement React |

**Quyết định thuật ngữ:**

- **Class Session (buổi học)** — một slot thời gian GV dạy (hoặc office hours) cho một lớp.
- **Teaching Plan (kế hoạch dạy)** — danh sách session trong một ngày; **không phải bảng DB riêng**, là view query.
- **Lịch học / lịch dạy** — **cùng một bảng** `class_sessions`; HS và GV chỉ khác filter (enrollment vs teacher_id).

---

## Phạm vi tính năng (v1 → v3)

### Trong phạm vi

- Bảng DB `class_sessions`
- API CRUD + query theo ngày / tuần / GV
- Widget **Today's Teaching Plan** trên Teacher Dashboard
- Màn **Schedule** (sidebar prototype) — danh sách + tạo/sửa/xóa buổi học
- Header summary: số lớp hôm nay, buổi kế tiếp còn bao nhiêu phút

### Ngoài phạm vi (ghi nhận, làm sau)

| Khối prototype | Lý do defer |
|----------------|-------------|
| Attention Required | Cần bảng `teacher_tasks` + rule sinh task tự động |
| Quick Prep | Todo thủ công GV — cùng module task |
| Pending Grading | Gắn `LessonPracticeAttempt` + workflow chấm |
| Recurrence phức tạp (RRULE) | Phase 3 |
| Sync Google Calendar / Zoom | Phase 3 |

---

## Data model — `class_sessions`

### Entity

Kế thừa `BaseObject` (id UUID, createdAt, updatedAt, voided).

| Cột | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| `classroom_id` | UUID | ✓ | FK → `classrooms.id` |
| `teacher_id` | UUID | ✓ | FK → user GV (denormalize để query dashboard) |
| `lesson_id` | UUID | — | Bài dạy trong buổi này; null = chưa gán |
| `title` | VARCHAR(255) | ✓ | VD: *Creative Writing*, *Homework Review* |
| `session_type` | ENUM | ✓ | Xem bảng enum bên dưới |
| `start_at` | TIMESTAMPTZ | ✓ | Giờ bắt đầu (lưu UTC) |
| `end_at` | TIMESTAMPTZ | ✓ | Giờ kết thúc; phải > `start_at` |
| `meet_link` | TEXT | — | URL Zoom/Meet/Google Meet |
| `location_label` | VARCHAR(128) | — | VD: *Zoom Room A* (hiển thị khi không cần mở link) |
| `status` | ENUM | ✓ | Mặc định `SCHEDULED` |
| `notes` | TEXT | — | Ghi chú nội bộ GV |
| `recurrence_group_id` | UUID | — | Phase 2: nhóm các occurrence lặp tuần |
| `recurrence_rule` | VARCHAR(64) | — | Phase 2: VD `WEEKLY;MO,WE;19:00` |

### Enum

**`SessionTypeEnum`**

| Value | Label UI | Ghi chú |
|-------|----------|---------|
| `LIVE_CLASS` | Lớp trực tuyến | Mặc định |
| `OFFICE_HOURS` | Office hours | VD: Homework Review Session |
| `EXAM` | Kiểm tra | Phase 2 |
| `OTHER` | Khác | |

**`SessionStatusEnum`**

| Value | Ý nghĩa |
|-------|---------|
| `SCHEDULED` | Đã lên lịch, chưa diễn ra |
| `IN_PROGRESS` | Đang trong khung giờ (có thể set tay hoặc derive) |
| `COMPLETED` | Đã qua `end_at` |
| `CANCELLED` | Hủy — không hiện timeline mặc định |

### Quan hệ

```
User (teacher) ──< ClassSession >── Classroom
                      │
                      └──> Lesson (optional)
```

**Active Students** trên UI = `COUNT(enrollment)` WHERE `classroom_id` AND `voided = false` — không lưu trên session.

### Index gợi ý

- `(teacher_id, start_at)` — dashboard today
- `(classroom_id, start_at)` — lịch theo lớp
- `(start_at, end_at)` — kiểm tra trùng lịch GV

---

## Quy tắc nghiệp vụ

### Thời gian

- Timezone hiển thị: **`Asia/Ho_Chi_Minh`**
- Lưu DB: **UTC** (`Instant` / `TIMESTAMPTZ`)
- **“Hôm nay”** = 00:00–23:59:59 theo timezone user (mặc định VN)

### Trạng thái UI (`uiState`) — server derive hoặc FE tính

| uiState | Điều kiện | Style prototype |
|---------|-----------|-----------------|
| `LIVE` | `now ∈ [start_at, end_at]` và status ≠ CANCELLED | Dot xanh primary, opacity 100% |
| `UPCOMING` | `now < start_at` | Dot xám, opacity 70%, nút Wait |
| `PAST` | `now > end_at` hoặc status COMPLETED | Mờ, ẩn CTA chính |
| `NEEDS_SETUP` | `UPCOMING`/`LIVE` và `meet_link` null và session_type = LIVE_CLASS | Nút **Setup** thay Join Meet |

### Nút hành động trên timeline

| Nút | Điều kiện enable | Hành vi |
|-----|------------------|---------|
| **Join Meet** | `meet_link` có giá trị; uiState LIVE hoặc UPCOMING trong buffer 15 phút trước giờ | `window.open(meet_link)` |
| **Open Lesson** | `lesson_id` not null | Navigate lesson editor `/admin/manage-lesson/:id/edit` hoặc preview |
| **Wait** | uiState UPCOMING, ngoài buffer Join | Disabled / outline only |
| **Setup** | `meet_link` null, session sắp diễn ra (< 24h) | Mở form sửa session (nhập link) |

**Buffer Join Meet (v1):** cho phép join từ **15 phút trước** `start_at` đến **hết** `end_at`.

### Validation khi tạo/sửa

1. `end_at > start_at`
2. `classroom.teacher_id` phải trùng user đang login (hoặc admin)
3. **Trùng lịch GV:** không cho overlap `(start_at, end_at)` với session khác cùng `teacher_id`, status ≠ CANCELLED, voided = false
4. `lesson_id` nếu có: lesson thuộc subject/môn hợp lệ với lớp (phase 2 — v1 có thể bỏ qua)

### Header summary (cùng API today)

| Field | Cách tính |
|-------|-----------|
| `classesToday` | Số session DISTINCT `classroom_id` trong ngày, status ≠ CANCELLED |
| `sessionsToday` | Tổng số session trong ngày |
| `nextSessionInMinutes` | `start_at` của session UPCOMING gần nhất − now; null nếu không còn |
| `nextSessionLabel` | VD: *Class 10A1: Creative Writing* |

> Prototype có *18 tasks pending* — **không implement** trong phase này; có thể ẩn hoặc hiển thị placeholder `—`.

---

## UI — Widget Today's Teaching Plan

Tham chiếu: `Design/UI_profile_gv/code.html` lines 190–241.

### Layout

- Card full width trong grid dashboard (col-span 8 trên desktop)
- Header: icon calendar + **Today's Teaching Plan** + ngày (VD: *Thứ Ba, 24/10*)
- Body: timeline dọc, sort `start_at` ASC

### Mỗi dòng timeline

| Thành phần | Nguồn dữ liệu |
|------------|---------------|
| Giờ | `start_at` – `end_at` (format HH:mm) |
| Tiêu đề | `{classroom.name}: {title}` |
| Subtitle | `Active Students: {count}` • `{location_label \|\| 'Link TBD'}` |
| Actions | Join Meet / Open Lesson / Wait / Setup |

### Empty state

- Không có session hôm nay → *"Hôm nay bạn chưa có buổi dạy nào"* + CTA **Schedule Class**

### Loading / error

- Skeleton 2–3 dòng timeline
- Lỗi API → banner + nút Retry

---

## Thao tác người dùng (User flows)

### UC-TP-01 — Xem kế hoạch dạy hôm nay

**Actor:** Giáo viên  
**Tiền điều kiện:** Đã đăng nhập, role teacher/admin

| Bước | Hành động | Hệ thống |
|------|-----------|----------|
| 1 | Mở `/admin` (Teacher Dashboard) | Gọi `GET /teacher/teaching-plan/today` |
| 2 | — | Render timeline + header summary |
| 3 | (Tuỳ chọn) Chọn ngày khác trên calendar mini | Gọi `GET /teacher/teaching-plan?date=YYYY-MM-DD` |

**Kết quả:** GV thấy danh sách buổi dạy trong ngày, buổi LIVE được highlight.

---

### UC-TP-02 — Join buổi học trực tuyến

**Actor:** Giáo viên

| Bước | Hành động | Hệ thống |
|------|-----------|----------|
| 1 | Trên timeline, bấm **Join Meet** | Kiểm tra buffer thời gian + meet_link |
| 2 | — | Mở tab mới `meet_link` |
| 3 | (Tuỳ chọn) Session chuyển IN_PROGRESS nếu đang SCHEDULED | PATCH status (phase 2, optional) |

**Ngoại lệ:**

- Không có link → hiện **Setup**, không hiện Join Meet
- Ngoài buffer → nút Wait (disabled), tooltip *"Còn X phút nữa mới vào lớp"*

---

### UC-TP-03 — Mở bài học gắn buổi dạy

**Actor:** Giáo viên

| Bước | Hành động | Hệ thống |
|------|-----------|----------|
| 1 | Bấm **Open Lesson** | Navigate `/admin/manage-lesson/{lessonId}/edit` |
| 2 | — | Lesson editor mở đúng bài |

**Ngoại lệ:** Chưa gán lesson → ẩn nút hoặc **Gán bài** mở popup chọn lesson (phase 2).

---

### UC-TP-04 — Tạo buổi dạy mới (Schedule Class)

**Actor:** Giáo viên  
**Entry point:** Header **Schedule Class** · Sidebar **Create New Class** (khác — tạo lớp) · FAB · Empty state

| Bước | Hành động | Hệ thống |
|------|-----------|----------|
| 1 | Bấm **Schedule Class** | Mở form/modal |
| 2 | Chọn lớp (dropdown classrooms của GV) | Load `GET /classrooms/search?teacherId=...` |
| 3 | Nhập title, loại buổi, start/end, meet link, location | Validate client |
| 4 | (Tuỳ chọn) Chọn lesson | Autocomplete lessons |
| 5 | Bấm **Lưu** | `POST /class-sessions` |
| 6 | — | Refresh timeline; toast thành công |

**Validation hiển thị:**

- Trùng lịch → *"Bạn đã có buổi dạy trùng khung giờ này"*
- End trước start → lỗi field

---

### UC-TP-05 — Sửa buổi dạy (Setup / Edit)

**Actor:** Giáo viên  
**Entry point:** Nút **Setup** · Màn Schedule · Click dòng timeline (phase 2)

| Bước | Hành động | Hệ thống |
|------|-----------|----------|
| 1 | Bấm **Setup** hoặc **Sửa** | Mở form prefill session |
| 2 | Cập nhật meet_link, giờ, lesson, notes | — |
| 3 | Bấm **Lưu** | `PUT /class-sessions/{id}` |
| 4 | — | Timeline cập nhật; Setup → Join Meet nếu đã có link |

---

### UC-TP-06 — Hủy buổi dạy

**Actor:** Giáo viên

| Bước | Hành động | Hệ thống |
|------|-----------|----------|
| 1 | Trong form sửa, bấm **Hủy buổi học** | Confirm dialog |
| 2 | Xác nhận | `PATCH /class-sessions/{id}/cancel` hoặc PUT status=CANCELLED |
| 3 | — | Session biến mất khỏi timeline mặc định |

---

### UC-TP-07 — Xem lịch tuần (Schedule page)

**Actor:** Giáo viên  
**Phase:** 2

| Bước | Hành động | Hệ thống |
|------|-----------|----------|
| 1 | Sidebar → **Schedule** | `GET /teacher/teaching-plan?from=&to=` (7 ngày) |
| 2 | Xem dạng list hoặc week grid | Render sessions theo ngày |
| 3 | Click slot → sửa (UC-TP-05) | — |

---

### UC-TP-08 — Học sinh xem lịch lớp (phase 3)

**Actor:** Học sinh  
**Entry point:** Student home hoặc trang lớp

| Bước | Hành động | Hệ thống |
|------|-----------|----------|
| 1 | Mở lịch lớp | `GET /student/class-sessions?classroomId=` |
| 2 | — | Chỉ session SCHEDULED/IN_PROGRESS, cùng `class_sessions` |

---

## API contract (draft)

Base path đề xuất: `/api/class-sessions` hoặc `/api/teacher/teaching-plan`.

### `GET /teacher/teaching-plan/today`

Response:

```json
{
  "date": "2026-06-21",
  "timezone": "Asia/Ho_Chi_Minh",
  "summary": {
    "classesToday": 3,
    "sessionsToday": 3,
    "nextSessionInMinutes": 45,
    "nextSessionTitle": "Class 10A1: Creative Writing"
  },
  "sessions": [
    {
      "id": "uuid",
      "classroomId": "uuid",
      "classroomName": "Class 10A1",
      "classroomCode": "10A1",
      "title": "Creative Writing",
      "sessionType": "LIVE_CLASS",
      "startAt": "2026-06-21T12:00:00Z",
      "endAt": "2026-06-21T12:50:00Z",
      "meetLink": "https://zoom.us/j/...",
      "locationLabel": "Zoom Room A",
      "lessonId": "uuid",
      "lessonTitle": "Unit 4 - Writing",
      "activeStudentCount": 24,
      "status": "SCHEDULED",
      "uiState": "UPCOMING",
      "canJoinMeet": false,
      "canOpenLesson": true
    }
  ]
}
```

### `GET /teacher/teaching-plan?date=YYYY-MM-DD`

Cùng shape, một ngày chỉ định.

### `GET /teacher/teaching-plan/range?from=&to=`

Danh sách sessions trong khoảng (Schedule page).

### `POST /class-sessions`

Body:

```json
{
  "classroomId": "uuid",
  "title": "Creative Writing",
  "sessionType": "LIVE_CLASS",
  "startAt": "2026-06-21T12:00:00Z",
  "endAt": "2026-06-21T12:50:00Z",
  "meetLink": "https://...",
  "locationLabel": "Zoom Room A",
  "lessonId": "uuid",
  "notes": ""
}
```

### `PUT /class-sessions/{id}`

Cập nhật partial/full cùng schema.

### `PATCH /class-sessions/{id}/cancel`

Set `status = CANCELLED`.

### `DELETE /class-sessions/{id}`

Soft delete (`voided = true`) — ưu tiên hơn hard delete.

### Phân quyền

| Role | Quyền |
|------|-------|
| Teacher | CRUD session của lớp mình (`classroom.teacher_id`) |
| Admin | CRUD mọi session |
| Student | Chỉ GET sessions lớp đã enroll (phase 3) |

---

## Roadmap theo phase

### Phase 1 — MVP (Today's Teaching Plan)

**Mục tiêu:** GV xem timeline hôm nay + tạo/sửa/hủy buổi one-off.

| Hạng mục | Deliverable |
|----------|-------------|
| DB | Migration `class_sessions` + enum |
| BE | Entity, repository, service, controller; overlap validation |
| BE | `GET today`, `GET by date`, POST, PUT, cancel |
| FE | Component `TeachingPlanSection` trên Admin Dashboard |
| FE | Modal form Schedule Class (tạo mới) |
| FE | Join Meet / Open Lesson / Setup / Wait theo rule |
| FE | Empty state + loading |

**Không làm:** recurrence, Schedule page riêng, student view, task widgets.

**Tiêu chí hoàn thành (AC):**

- [ ] GV tạo session gắn lớp + giờ + link meet
- [ ] Dashboard hiển thị đúng session hôm nay, sort theo giờ
- [ ] Join Meet mở link đúng trong buffer 15 phút
- [ ] Open Lesson vào editor đúng `lesson_id`
- [ ] Trùng lịch GV bị chặn khi lưu
- [ ] Session CANCELLED không hiện timeline

**Effort ước lượng:** BE 3–4 ngày · FE 2–3 ngày · QA 1 ngày

---

### Phase 2 — Schedule management

**Mục tiêu:** Quản lý lịch đầy đủ, lặp tuần cơ bản.

| Hạng mục | Deliverable | Trạng thái |
|----------|-------------|------------|
| FE | Trang `/admin/schedule` (sidebar Lịch dạy) — week list | ✅ Phase 2a |
| FE | Prev/next/today, filter lớp + loại buổi | ✅ |
| FE | Sửa / hủy buổi từ timeline | ✅ |
| FE | Thêm buổi theo ngày (prefill giờ) | ✅ |
| BE | `GET range`, filter theo classroom | ✅ range · filter client |
| BE | Recurrence: tạo N occurrence từ template tuần | ✅ Phase 2c |
| FE | Form lặp tuần + scope sửa/hủy chuỗi | ✅ Phase 2c |
| FE | Week grid view | ✅ Phase 2b |
| FE | Gán lesson từ timeline (popup chọn lesson) | ✅ Phase 2d |
| FE | Header dashboard: chọn ngày ← → | ⏳ optional |

**AC:**

- [ ] GV xem lịch 7 ngày
- [ ] Tạo lịch lặp tuần sinh đủ session 4–8 tuần
- [ ] Sửa meet link từ Setup không cần vào Schedule page

---

### Phase 3 — Mở rộng

**Mục tiêu:** HS thấy lịch, thông báo, tích hợp ngoài.

| Hạng mục | Deliverable |
|----------|-------------|
| BE + FE | Student class schedule view |
| BE | Email nhắc GV trước giờ dạy (queue + worker 5 phút) | ✅ Phase 3a |
| BE | Notification trước giờ học 15 phút (reuse notification WS) | ⏳ optional |
| BE | Email reminder (optional) | ✅ Phase 3a (GV) |
| Integrations | Export iCal; Google Calendar (optional) |
| Dashboard | Tích hợp `teacher_tasks` khi module task sẵn sàng |

---

## Cấu trúc FE đề xuất

```
src/
├── pages/admin/
│   ├── AdminDashboardPage.tsx      # embed TeachingPlanSection
│   └── TeacherSchedulePage.tsx     # Phase 2
├── admin/components/teachingPlan/
│   ├── TeachingPlanSection.tsx     # Widget timeline hôm nay
│   ├── TeachingPlanTimelineItem.tsx
│   ├── ClassSessionFormModal.tsx   # Create / Edit
│   └── teachingPlanUtils.ts        # uiState, format time, canJoinMeet
└── shared/api/
    └── classSession.ts             # API client
```

**Design tokens:** dùng `academicCore.ts` / CSS vars đã có (`--ac-primary`, `--ac-secondary`, …) khớp `DESIGN.md`.

---

## Cấu trúc BE đề xuất

```
com.courseenglish.api/
├── domain/
│   └── ClassSession.java
├── util/constant/
│   ├── SessionTypeEnum.java
│   └── SessionStatusEnum.java
├── repository/
│   └── ClassSessionRepository.java
├── service/
│   ├── ClassSessionService.java
│   └── impl/ClassSessionServiceImpl.java
├── controller/
│   └── ClassSessionController.java
└── domain/request|response/
    ├── ReqClassSessionDTO.java
    └── ResTeachingPlanTodayDTO.java
```

---

## Rủi ro & giảm thiểu

| Rủi ro | Giảm thiểu |
|--------|------------|
| GV nhập sai timezone | Luôn hiển thị giờ VN; date picker rõ ràng |
| Overlap validation phức tạp | Query interval overlap đơn giản phase 1 |
| Lesson chưa gán nhiều buổi | Setup flow phase 2; v1 vẫn cho tạo session không lesson |
| Admin dashboard vs Teacher workspace | Phase 1 embed widget vào `AdminDashboardPage`; sau tách layout teacher nếu cần |

---

## Checklist trước khi code Phase 1

- [x] Review enum `session_type`, `status` với team
- [ ] Confirm route: widget trên `/admin` hay trang `/admin/teacher-home` riêng
- [ ] Confirm Open Lesson → editor hay preview read-only
- [ ] Migration chạy trên dev DB — `migrations/018_class_sessions.sql`
- [ ] Seed demo — `seed_class_sessions_demo.sql`

---

## Trạng thái triển khai BE (Phase 1)

| Hạng mục | Trạng thái |
|----------|------------|
| Migration `018_class_sessions.sql` | ✅ |
| Entity + enum + repository | ✅ |
| `ClassSessionService` + overlap validation | ✅ |
| `GET /api/v1/teacher/teaching-plan/today` | ✅ |
| `GET /api/v1/teacher/teaching-plan?date=` | ✅ |
| `GET /api/v1/teacher/teaching-plan/range?from=&to=` | ✅ |
| CRUD `/api/v1/class-sessions` | ✅ |
| FE widget | ✅ `TeachingPlanSection` trên Admin Dashboard |

---

## Tài liệu liên quan (làm sau)

- `teacher_tasks` + Attention Required / Pending Grading / Quick Prep — spec riêng khi có hướng
- Student schedule — mở rộng từ Phase 3 UC-TP-08
- Prototype đầy đủ: `Design/UI_profile_gv/code.html`

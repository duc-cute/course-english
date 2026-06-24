# Kế hoạch Today's Teaching Plan — Lịch dạy giáo viên

> Cập nhật: **21/06/2026** (bổ sung Phase 4–5: Online Class & Meet workflow)  
> Tham chiếu: `Design/UI_profile_gv/code.html` (Section 1), `Design/UI_profile_gv/DESIGN.md`, **`promt.md`** (Meet workflow)  
> Repo: `course_english_backend` + `course_english_frontend`  
> Phạm vi tài liệu này: **Today's Teaching Plan** (timeline lịch dạy trong ngày) + **Online Class workflow**.  
> **Ngoài phạm vi (làm sau):** Attention Required · Quick Prep · Pending Grading · bảng `teacher_tasks`.

---

## Mục tiêu sản phẩm

Giáo viên mở Teacher Workspace và **biết ngay hôm nay dạy lớp nào, lúc mấy giờ, vào link nào, mở bài gì** — không cần vào từng màn quản lý lớp/bài học.

| Hành vi mong muốn | Cơ chế |
|-------------------|--------|
| Chuẩn bị buổi dạy sắp tới | Timeline theo giờ, highlight buổi kế tiếp |
| Bắt đầu lớp online | Nút **Start Online Class** → `meet.new` → GV paste URL → lưu |
| Vào lớp online (sau khi có link) | Nút **Join Meet** / **Vào lớp** trong khung giờ |
| Link cố định (Zoom room) | Tuỳ chọn **Dùng link có sẵn** khi lên lịch — bỏ qua `meet.new` |
| Mở nội dung bài dạy | Nút **Open Lesson** (lesson editor hoặc preview) |
| Lên lịch / sửa lịch | CRUD buổi học (`class_sessions`) |
| HS biết giờ học + vào lớp | Cùng `class_sessions` + WS `MEETING_STARTED` (Phase 5) |

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
| `meet_link` | TEXT | — | URL Meet/Zoom **thật**; null khi tạo lịch (mặc định LIVE_CLASS) |
| `started_at` | TIMESTAMPTZ | — | Phase 4: lúc GV bấm **Start Online Class** |
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

### Trạng thái UI — hai lớp (Phase 4+)

> Chi tiết: `promt.md`. **Thay thế** rule Phase 1 (Join T−15 + lưu link sẵn làm mặc định).

#### `scheduledState` (derive theo giờ — server hoặc FE)

| scheduledState | Điều kiện |
|----------------|-----------|
| `UPCOMING` | `now < start_at` |
| `IN_WINDOW` | `start_at ≤ now < end_at` |
| `PAST` | `now ≥ end_at` hoặc status `COMPLETED` |

#### `meetingState` (theo link + hành động GV)

| meetingState | Điều kiện |
|--------------|-----------|
| `NOT_STARTED` | `meet_link` null **hoặc** chưa có `started_at` (LIVE_CLASS) |
| `LIVE` | GV đã lưu `meet_link` hợp lệ (và `started_at` với flow Start) |
| `ENDED` | `PAST` — không Join |

#### Hiển thị timeline (gộp cho UI)

| uiState hiển thị | Điều kiện | Style |
|-----------------|-----------|-------|
| `LIVE` | `IN_WINDOW` + `meetingState=LIVE` | Dot xanh, **Vào lớp** enable |
| `WAITING_TEACHER` | `IN_WINDOW` + `NOT_STARTED` + `LIVE_CLASS` | Dot vàng, HS/GV chờ Start |
| `UPCOMING` | `UPCOMING` | Dot xám, opacity 70% |
| `PAST` | `PAST` | Mờ, ẩn CTA chính |
| `NEEDS_START` | `IN_WINDOW` hoặc `UPCOMING` (< 24h) + `LIVE_CLASS` + chưa link | Nút **Bắt đầu lớp online** |

### Nút hành động trên timeline (Phase 4+)

| Nút | Điều kiện | Hành vi |
|-----|-----------|---------|
| **Bắt đầu lớp online** | `LIVE_CLASS`, `meet_link` null, trong/ sắp tới buổi | `POST start-online-class` → mở `https://meet.new` → dialog paste URL |
| **Vào lớp** | `canJoinMeet` = `IN_WINDOW` + có `meet_link` hợp lệ | `window.open(meet_link)` |
| **Dùng link có sẵn** | Form tạo/sửa — checkbox tuỳ chọn | Nhập URL ngay; bỏ flow `meet.new` |
| **Open Lesson** | `lesson_id` not null | Navigate lesson editor |
| **Chờ giờ** | `UPCOMING`, ngoài `IN_WINDOW` | Disabled |

**Đã bỏ (Phase 4):** buffer Join **15 phút trước** `start_at` khi chưa có link GV.

**Validate URL:** `meet.google.com/*`, `*.zoom.us/*`; **từ chối** `meet.new`.

**Cảnh báo form:** nếu `end_at - start_at > 60 phút` → banner *Meet free ~60 phút/phiên*.

### Ngoại lệ theo `session_type`

| Loại | Meet workflow |
|------|----------------|
| `LIVE_CLASS` | Start → paste → WS (mặc định) hoặc link có sẵn |
| `OFFICE_HOURS` | Không bắt Start; link tuỳ chọn; không WS HS |
| `EXAM` / `OTHER` | Giống OFFICE_HOURS phase 4 |

### Trạng thái UI (Phase 1–3 — legacy, sẽ thay)

| uiState | Điều kiện | Ghi chú |
|---------|-----------|---------|
| `LIVE` | `now ∈ [start_at, end_at]` | Chỉ theo giờ |
| `NEEDS_SETUP` | thiếu `meet_link` | Thay bằng **Bắt đầu lớp online** ở Phase 4 |

### Nút hành động (Phase 1–3 — legacy)

| Nút | Ghi chú |
|-----|---------|
| **Join Meet** T−15 | ⏳ Thay bằng rule Phase 4 ở trên |
| **Setup** nhập link | ⏳ Gộp vào dialog paste / **Dùng link có sẵn** |

### Validation khi tạo/sửa

1. `end_at > start_at`
2. `classroom.teacher_id` phải trùng user đang login (hoặc admin)
3. **Trùng lịch GV:** không cho overlap `(start_at, end_at)` với session khác cùng `teacher_id`, status ≠ CANCELLED, voided = false
4. `lesson_id` nếu có: lesson thuộc subject/môn hợp lệ với lớp (phase 2 — v1 có thể bỏ qua)
5. **Phase 4:** `meet_link` nếu có — pattern Meet/Zoom; từ chối `meet.new`
6. **Phase 4:** `end_at - start_at > 60 phút` → warning (không block)

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

### UC-TP-02 — Bắt đầu & vào buổi học trực tuyến (Phase 4+)

**Actor:** Giáo viên  
**Tham chiếu:** `promt.md`

#### Luồng A — Mặc định (`LIVE_CLASS`, chưa có link)

| Bước | Hành động | Hệ thống |
|------|-----------|----------|
| 1 | Trong khung giờ (hoặc sắp tới), bấm **Bắt đầu lớp online** | `POST .../start-online-class`, ghi `started_at` |
| 2 | — | Mở tab `https://meet.new` |
| 3 | GV tạo phòng, copy URL | Dialog paste vẫn mở trên app |
| 4 | Dán URL → **Lưu & báo học sinh** | `PATCH .../meeting-link`, validate URL |
| 5 | — | `meetingState=LIVE`; Phase 5: WS `MEETING_STARTED` |
| 6 | Bấm **Vào lớp** | `window.open(meet_link)` |

#### Luồng B — Link có sẵn (Zoom / Meet cố định)

| Bước | Hành động | Hệ thống |
|------|-----------|----------|
| 1 | Khi tạo/sửa lịch, bật **Dùng link có sẵn**, nhập URL | Lưu `meet_link`; không cần `meet.new` |
| 2 | Trong khung giờ, bấm **Vào lớp** | `window.open(meet_link)` |

**Ngoại lệ:**

- URL sai / `meet.new` → lỗi validate
- `OFFICE_HOURS` → không bắt Start; link tuỳ chọn
- GV quên paste → HS *「Chờ giáo viên bắt đầu lớp」*; dialog paste vẫn hiện
- Buổi > 60 phút → cảnh báo (không chặn lưu)
- Hủy buổi → UC-TP-06

#### UC-TP-02 legacy (Phase 1–3 — hiện tại)

| Bước | Hành động | Hệ thống |
|------|-----------|----------|
| 1 | Bấm **Join Meet** / **Thiết lập** nhập link trước | Buffer T−15, `canJoinMeet` theo giờ + link |

> Phase 4 thay thế luồng legacy cho `LIVE_CLASS`.

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
| 3 | Nhập title, loại buổi, start/end; **không bắt buộc** meet link (LIVE_CLASS) | Validate client; cảnh báo nếu > 60 phút |
| 3b | (Tuỳ chọn) Bật **Dùng link có sẵn** → nhập URL | Validate pattern Meet/Zoom |
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

### UC-TP-08 — Học sinh xem lịch & Join Meet (Phase 5)

**Actor:** Học sinh  
**Entry point:** Student home hoặc trang lớp

| Bước | Hành động | Hệ thống |
|------|-----------|----------|
| 1 | Mở lịch lớp | `GET /student/class-sessions?classroomId=` |
| 2 | Trước khi GV Start | `WAITING_TEACHER` — nút disabled, *「Chờ giáo viên bắt đầu lớp」* |
| 3 | Nhận WS `MEETING_STARTED` hoặc refresh | `LIVE` — **Join Meet** enable |
| 4 | Bấm Join Meet | `window.open(meet_link)` trong `IN_WINDOW` |

**Ngoại lệ:** `OFFICE_HOURS` — không hiện Join nếu không có link; không WS.

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
      "meetLink": null,
      "startedAt": null,
      "locationLabel": "Zoom Room A",
      "lessonId": "uuid",
      "lessonTitle": "Unit 4 - Writing",
      "activeStudentCount": 24,
      "status": "SCHEDULED",
      "uiState": "UPCOMING",
      "scheduledState": "UPCOMING",
      "meetingState": "NOT_STARTED",
      "canJoinMeet": false,
      "canStartOnlineClass": false,
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

### `POST /class-sessions/{id}/start-online-class` (Phase 4)

Ghi `started_at = now`; idempotent nếu đã start. Chỉ GV sở hữu session. `LIVE_CLASS` only.

### `PATCH /class-sessions/{id}/meeting-link` (Phase 4)

Body: `{ "meetLink": "https://meet.google.com/..." }`

- Validate URL (Meet/Zoom; reject `meet.new`)
- Set `meet_link`; trigger WS `MEETING_STARTED` (Phase 5)
- Response: session DTO với `meetingState=LIVE`, `canJoinMeet`

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

### Tổng quan

| Phase | Tên | Trạng thái |
|-------|-----|------------|
| **1** | Today's Teaching Plan MVP | ✅ |
| **2** | Schedule, recurrence, week grid | ✅ ~95% |
| **3** | Email nhắc GV | ✅ 3a |
| **4** | Online Class workflow (GV) — Start, paste, link có sẵn | ⏳ 4a ✅ · 4b ✅ · 4c ⏳ |
| **5** | Online Class (HS) — lịch, WS, Join Meet | ⏳ Chưa làm |

Thứ tự implement đề xuất: **4a → 4b → 4c → 5a → 5b → 5c (optional)**.

---

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

### Phase 3 — Mở rộng (email, HS, tích hợp)

**Mục tiêu:** Nhắc GV, nền tảng cho HS; **Meet workflow đầy đủ → Phase 4–5**.

| Hạng mục | Deliverable | Trạng thái |
|----------|-------------|------------|
| BE | Email nhắc GV trước giờ dạy (queue + worker 5 phút) | ✅ Phase 3a |
| BE | `session_reminders` migration | ✅ `019_session_reminders.sql` |
| BE + FE | Student class schedule view (read-only) | ⏳ → Phase 5b |
| BE | Notification / WS trước giờ học | ⏳ → Phase 5a |
| BE | Email reminder — **không** embed meet link | ⏳ Phase 4c |
| Integrations | Export iCal; Google Calendar (optional) | ⏳ |
| Dashboard | Tích hợp `teacher_tasks` khi module task sẵn sàng | ⏳ |

---

### Phase 4 — Online Class workflow (Giáo viên)

**Mục tiêu:** GV Start lớp đúng giờ, paste Meet, không lưu `meet.new`; hỗ trợ link cố định & ngoại lệ `OFFICE_HOURS`.  
**Tham chiếu:** `promt.md`

#### Phase 4a — Backend

| Hạng mục | Deliverable |
|----------|-------------|
| DB | Migration `started_at` trên `class_sessions` |
| BE | `POST .../start-online-class`, `PATCH .../meeting-link` |
| BE | Validate URL Meet/Zoom; reject `meet.new` |
| BE | `canJoinMeet` = `IN_WINDOW` + có link (bỏ T−15 nếu chưa link) |
| BE | DTO: `scheduledState`, `meetingState`, `canStartOnlineClass` |
| BE | Link có sẵn: `meet_link` + `usePreSavedLink` flag trên create/update (hoặc derive: có link lúc tạo, `started_at` null) |

**AC 4a:**

- [ ] Start ghi `started_at`; save link set `meet_link`
- [ ] `canJoinMeet` false khi `IN_WINDOW` nhưng chưa có link
- [ ] URL `meet.new` bị từ chối
- [ ] `OFFICE_HOURS` không yêu cầu `started_at`

**Effort:** BE 2–3 ngày

#### Phase 4b — Frontend GV

| Hạng mục | Deliverable |
|----------|-------------|
| FE | Nút **Bắt đầu lớp online** thay **Thiết lập** / Join sớm |
| FE | Dialog paste URL + **Dán từ clipboard** + giữ mở sau `meet.new` |
| FE | Form: checkbox **Dùng link có sẵn**; `meet_link` optional mặc định |
| FE | Cảnh báo buổi > 60 phút |
| FE | Timeline + `/admin/schedule`: trạng thái `WAITING_TEACHER` / **Vào lớp** |
| FE | Sửa link khi đang LIVE |

**AC 4b:**

- [ ] GV hoàn tất luồng Start → meet.new → paste → Vào lớp
- [ ] GV dùng link Zoom cố định không cần Start
- [ ] `OFFICE_HOURS` không hiện Start Online Class

**Effort:** FE 2–3 ngày

#### Phase 4c — Email reminder

| Hạng mục | Deliverable |
|----------|-------------|
| BE | Template email: bỏ `meet_link`; deep-link `/admin` hoặc `/admin/schedule` |
| BE | Copy: *「Bắt đầu lớp trên Course English」* |

**AC 4c:**

- [ ] Email 15 phút trước giờ không chứa URL Meet/Zoom

**Effort:** 0.5 ngày

---

### Phase 5 — Online Class (Học sinh)

**Mục tiêu:** HS thấy lịch, chờ GV, Join khi LIVE.

#### Phase 5a — WebSocket & API HS

| Hạng mục | Deliverable |
|----------|-------------|
| BE | `GET /student/class-sessions` (enrollment filter) |
| BE | WS event `MEETING_STARTED` → userIds trong lớp |
| BE | Payload: `sessionId`, `classroomId`, `meetLink`, `title`, `startAt` |

**AC 5a:**

- [ ] HS enroll nhận WS trong vòng vài giây sau GV lưu link
- [ ] HS không enroll không nhận event

**Effort:** BE 2 ngày

#### Phase 5b — Frontend HS

| Hạng mục | Deliverable |
|----------|-------------|
| FE | Widget/card lịch lớp trên Student home |
| FE | Trạng thái: Chờ GV / LIVE / Đã qua |
| FE | **Join Meet** theo `canJoinMeet` |
| FE | Subscribe WS; cập nhật UI không refresh |
| FE | **Open Lesson Material** nếu có `lesson_id` |

**AC 5b:**

- [ ] HS Join chỉ sau khi GV lưu link
- [ ] HS thấy LIVE ngay khi WS tới

**Effort:** FE 2–3 ngày

#### Phase 5c — Nhắc HS (optional)

| Hạng mục | Deliverable |
|----------|-------------|
| BE | In-app notification *「Buổi học sắp bắt đầu」* (không kèm meet link) |
| BE | Nhắc GV nếu `IN_WINDOW` + chưa link > 5 phút |

**Effort:** 1–2 ngày

---

### Tổng effort Phase 4–5

| Phase | Ước lượng |
|-------|-----------|
| 4a + 4b + 4c | ~5–7 ngày |
| 5a + 5b | ~4–5 ngày |
| 5c optional | ~1–2 ngày |

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
│   ├── StartOnlineClassDialog.tsx  # Phase 4: paste Meet URL
│   └── teachingPlanUtils.ts        # scheduledState, meetingState, canJoinMeet
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
| **Meet free ~60 phút** | Buổi mặc định 50 phút; cảnh báo >60 phút; Start đúng giờ (Phase 4) |
| **GV quên paste link** | Dialog giữ mở; HS chờ; nhắc GV Phase 5c |
| **Link tạo quá sớm** | Không lưu link lúc lên lịch (trừ *Dùng link có sẵn*) |
| **HS vào phòng trống** | `canJoinMeet` chỉ khi GV đã lưu URL |

---

## Checklist trước khi code Phase 1

- [x] Review enum `session_type`, `status` với team
- [ ] Confirm route: widget trên `/admin` hay trang `/admin/teacher-home` riêng
- [ ] Confirm Open Lesson → editor hay preview read-only
- [ ] Migration chạy trên dev DB — `migrations/018_class_sessions.sql`
- [ ] Seed demo — `seed_class_sessions_demo.sql`

---

## Trạng thái triển khai BE (Phase 1–3)

| Hạng mục | Trạng thái |
|----------|------------|
| Migration `018_class_sessions.sql` | ✅ |
| Entity + enum + repository | ✅ |
| `ClassSessionService` + overlap validation | ✅ |
| `GET /api/v1/teacher/teaching-plan/today` | ✅ |
| `GET /api/v1/teacher/teaching-plan?date=` | ✅ |
| `GET /api/v1/teacher/teaching-plan/range?from=&to=` | ✅ |
| CRUD `/api/v1/class-sessions` | ✅ |
| Recurrence + week grid + assign lesson | ✅ Phase 2 |
| Email reminder GV (`019_session_reminders`) | ✅ Phase 3a |
| FE widget | ✅ `TeachingPlanSection` trên Admin Dashboard |

### Delta cần làm (Phase 4–5)

| Hiện tại (legacy) | Sau Phase 4–5 |
|-------------------|---------------|
| Nhập `meet_link` khi tạo lịch | Mặc định null; Start → paste |
| `canJoinMeet` T−15 + có link | `IN_WINDOW` + GV đã lưu link ✅ BE 4a |
| Nút **Thiết lập** / **Vào lớp** | **Bắt đầu lớp online** + dialog paste (FE 4b) |
| Không `started_at` | Migration `021` + API start ✅ |
| Không WS cho HS | `MEETING_STARTED` (5a) |
| Email có thể gửi meet link | Chỉ deep-link app (4c) |
| Chưa có student schedule | Phase 5b |

### Trạng thái Phase 4a (BE)

| Hạng mục | Trạng thái |
|----------|------------|
| Migration `021_class_session_started_at.sql` | ✅ |
| Entity `started_at` | ✅ |
| `POST /api/v1/class-sessions/{id}/start-online-class` | ✅ |
| `PATCH /api/v1/class-sessions/{id}/meeting-link` | ✅ |
| `MeetLinkValidator` (Meet/Zoom; reject meet.new) | ✅ |
| DTO: `scheduledState`, `meetingState`, `canStartOnlineClass`, `startedAt` | ✅ |
| `canJoinMeet` rule mới | ✅ |
| Unit test `MeetLinkValidatorTest` | ✅ |

### Trạng thái Phase 4b (FE GV)

| Hạng mục | Trạng thái |
|----------|------------|
| API client `apiStartOnlineClass`, `apiSaveMeetingLink` | ✅ |
| `StartOnlineClassDialog` + `useOnlineClassFlow` | ✅ |
| Timeline: **Bắt đầu lớp online** / **Dán link Meet** / **Vào lớp** | ✅ |
| Form: **Dùng link có sẵn**, cảnh báo >60 phút | ✅ |
| Week grid badges (Chưa start / Chờ link / Live) | ✅ |

---

## Tài liệu liên quan

- **`promt.md`** — Online Class & Google Meet workflow (product spec)
- `teacher_tasks` + Attention Required / Pending Grading / Quick Prep — spec riêng khi có hướng
- Prototype đầy đủ: `Design/UI_profile_gv/code.html`

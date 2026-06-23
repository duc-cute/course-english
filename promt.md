# Course English - Online Class & Google Meet Workflow

You are designing the Teaching Planner and Online Class workflow for an English Learning Platform called "Course English".

IMPORTANT BUSINESS RULES:

We do NOT integrate with the Google Meet API.

We do NOT automatically create Google Meet rooms.

We do NOT store "meet.new" as a meeting URL.

We only store the actual Google Meet URL after the teacher creates a room.

---

## Overall Workflow

### Step 1

Teacher creates a teaching schedule.

Example:

* Class: 10A1
* Lesson: Unit 2 Vocabulary
* Date: June 25, 2026
* Time: 19:00 - 20:00

At this stage:

meetingUrl = null

status = UPCOMING

No student can join any meeting.

---

### Step 2

When class time arrives, the teacher opens the schedule.

The system displays a large button:

[ Start Online Class ]

---

### Step 3

Teacher clicks:

[ Start Online Class ]

The system opens:

https://meet.new

in a new browser tab.

The teacher creates the Google Meet room manually.

---

### Step 4

Google Meet generates a room URL.

Example:

https://meet.google.com/abc-defg-hij

The teacher copies the generated URL.

---

### Step 5

The teacher returns to Course English.

A dialog is displayed:

Meeting URL

[ Paste Google Meet URL Here ]

[ Save Meeting Link ]

The teacher pastes the generated Meet URL.

---

### Step 6

The system saves:

meetingUrl

meetingCreated = true

status = LIVE

---

### Step 7

After saving:

The system broadcasts the meeting information to all students in that class using WebSocket.

Example event:

MEETING_STARTED

Students immediately see:

🔴 LIVE NOW

[ Join Meet ]

---

### Student Experience

Before teacher starts the meeting:

Status:

UPCOMING

Button:

Disabled

"Waiting for teacher to start the class"

---

After teacher saves the Meet URL:

Status:

LIVE

Button:

[ Join Meet ]

When clicked:

window.open(meetingUrl)

Students join the same Google Meet room.

---

### Schedule Status

UPCOMING

Class has not started.

LIVE

Teacher started the class and shared a meeting URL.

FINISHED

Class ended.

CANCELLED

Class cancelled.

---

## UI Requirements

Teacher Dashboard:

* Upcoming Classes
* Start Online Class button
* Meeting URL input dialog
* Join Meet button
* Open Lesson button

Student Dashboard:

* Upcoming Classes
* Class Status
* Join Meet button
* Open Lesson Material button

---

## Design Goal

The workflow must be simple enough for teachers with minimal technical knowledge.

Teachers should only need to:

1. Click Start Online Class
2. Create a Google Meet room
3. Copy the URL
4. Paste the URL
5. Save

Students should only need to:

1. Open dashboard
2. Click Join Meet

No Google API integration is required.

---

## Hai lớp trạng thái (bắt buộc)

Không gộp “đúng giờ lịch” với “GV đã mở lớp online”.

| Lớp | Field / enum | Ý nghĩa |
|-----|--------------|---------|
| **scheduledState** (derive theo giờ) | `UPCOMING` · `IN_WINDOW` · `PAST` | So sánh `now` với `start_at` / `end_at` |
| **meetingState** (theo hành động GV) | `NOT_STARTED` · `LIVE` · `ENDED` | `NOT_STARTED` = chưa có `meetingUrl` hoặc chưa Start; `LIVE` = GV đã lưu URL; `ENDED` = sau `end_at` hoặc GV kết thúc |

**Quy tắc Join Meet (GV và HS):**

```
canJoinMeet = scheduledState === IN_WINDOW
           && meetingState === LIVE
           && meetingUrl hợp lệ
```

**Không** cho Join từ T−15 phút nếu GV chưa Start (tránh vào phòng trống / lãng phí phiên Meet).

---

## Ngoại lệ nghiệp vụ

### 1. Link cố định (Zoom / Meet room cố định)

Một số GV dùng **cùng một URL** mọi tuần (VD: Zoom Personal Room).

- Trong form lịch: tuỳ chọn **「Dùng link có sẵn」** — nhập `meetingUrl` khi tạo/sửa buổi.
- Khi đã có URL sẵn: **không** bắt flow `meet.new`; nút chính là **「Vào lớp」** trong khung giờ.
- Cảnh báo UI: *“Meet free thường ~60 phút/phiên — buổi dài hơn có thể bị ngắt giữa chừng.”*
- Khuyến nghị thời lượng buổi: **≤ 55 phút** (form mặc định end = start + 50 phút).

### 2. `OFFICE_HOURS` / `OTHER`

- **Không** bắt buộc flow Start Online Class.
- GV có thể để trống link hoặc nhập link tĩnh; không broadcast `MEETING_STARTED` cho HS.
- Chỉ **`LIVE_CLASS`** dùng workflow Start → paste → báo HS.

### 3. GV quên paste URL sau khi bấm Start

- Dialog paste **giữ mở** sau khi mở `meet.new` (GV quay tab là thấy ngay).
- Nút **「Dán từ clipboard」** (`navigator.clipboard`).
- HS vẫn thấy: *「Chờ giáo viên bắt đầu lớp」* — Join disabled.
- (Phase sau) Nhắc in-app GV nếu `IN_WINDOW` + `NOT_STARTED` quá 5 phút.

### 4. GV paste sai URL

- Validate client + server: pattern `meet.google.com/*` hoặc `*.zoom.us/*` (mở rộng sau).
- **Không** chấp nhận `https://meet.new`.
- Cho **sửa link** trong dialog / form sửa buổi khi đang `LIVE`.

### 5. Hủy buổi

- `status = CANCELLED` — ẩn khỏi timeline; HS không thấy Join.
- Nếu đã có `meetingUrl`: xoá hoặc giữ lịch sử tuỳ audit (v1: giữ, không hiển thị).

### 6. Email nhắc giờ dạy

- Email **không** chứa link Meet/Zoom.
- Chỉ link deep-link vào app: *「Xem lịch / Bắt đầu lớp」*.
- Meet chỉ mở qua nút in-app sau khi GV đã lưu URL.

---

## API bổ sung (draft)

| Method | Path | Mô tả |
|--------|------|-------|
| `POST` | `/class-sessions/{id}/start-online-class` | Ghi `started_at`, mở flow paste (idempotent nếu đã LIVE) |
| `PATCH` | `/class-sessions/{id}/meeting-link` | Body `{ meetingUrl }` — validate URL, set `meetingState=LIVE`, trigger WS |

Field DB đề xuất trên `class_sessions`:

- `started_at` TIMESTAMPTZ — lúc GV bấm Start Online Class
- `meet_link` — như hiện tại (`meetingUrl`)
- `meeting_created` — optional; có thể derive `meet_link IS NOT NULL AND started_at IS NOT NULL`

---

## Phase triển khai (tham chiếu `TEACHER_TEACHING_PLAN.md`)

| Phase | Phạm vi |
|-------|---------|
| **4a** | BE: `started_at`, API start + save link, validate URL, `canJoinMeet` mới |
| **4b** | FE GV: Start Online Class, dialog paste, Dùng link có sẵn, cảnh báo >60 phút |
| **4c** | Email reminder: bỏ meet link, deep-link app |
| **5a** | BE + WS: event `MEETING_STARTED` tới HS trong lớp |
| **5b** | FE HS: lịch lớp, trạng thái Chờ GV / LIVE, Join Meet |

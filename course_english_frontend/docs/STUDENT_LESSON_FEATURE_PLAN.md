# Kế hoạch chức năng — Lesson & trải nghiệm học sinh

Tham chiếu thiết kế: `design/stitch_cell_studio_product_audit` (Bio-Immersive Glass).  
UI Phase 1 đã áp dụng token teal/glass, mục lục, typography đọc, card danh sách.

---

## Trạng thái hiện tại (baseline)

| Hạng mục | Có | Chưa |
|----------|-----|------|
| Danh sách bài publish + search | ✓ | Filter môn, sort, thumbnail |
| Đọc bài + mục lục + scroll spy | ✓ | Progress lưu server |
| Block TEXT / IMAGE / CELL_VIEWER / CELL_STEP | ✓ | VIDEO, QUIZ |
| Tab Bài tập — MCQ stepped + kết quả + xem lại | ✓ | MATCHING, attempt API server |
| 3D | Panel Co-pilot (≥1440px) + sheet mobile | Hotspot sync payload |
| Tiến độ | % scroll + localStorage (bài tập: session local) | % block server |
| Tiếp tục học / Up Next | ✓ (local + cùng môn; CTA từ màn kết quả bài tập) | Gợi ý theo lớp |

---

## Phase A — Frontend only (không đổi API)

**Mục tiêu:** Trải nghiệm gần mock audit, tận dụng data lesson hiện có.

### A1. Layout reader 3 cột (ưu tiên cao) — ✅ Done

- [x] **3D Co-pilot panel** (~380px) cố định phải khi bài có `CELL_VIEWER` / `CELL_STEP`
  - Desktop ≥1440px: Nav app | TOC | Content 720px | 3D panel
  - 1024–1439px: ẩn panel, nút “Mở 3D” + bottom sheet
  - Mobile: fullscreen overlay 3D
- [x] Nhúng `CellScene` qua `CellViewerEmbed` (không rời trang desktop)
- [x] Đồng bộ `defaultOrganelle` theo block đang active trên viewport

**File dự kiến:** `LessonReaderPage.tsx`, `LessonReader3DPanel.tsx`, `lesson-reader.css`

### A2. Tiến độ & tiếp tục học — ✅ Done

- [x] `localStorage` key `cell-studio.lessonProgress.v1`
  - `{ lessonId, lastBlockId, scrollPercent, updatedAt }`
- [x] Card **“Tiếp tục học”** trên `StudentHomePage` / `StudentLessonListPage`
- [x] Banner “Bạn đang đọc dở” trên `LessonReaderPage` với nút nhảy tới block

### A3. Điều hướng bài — ✅ Done

- [x] **Up Next:** `findNextPublishedLesson` — cùng `subjectId`, `displayOrder`
- [x] Footer glass card `LessonReaderUpNext`
- [x] **Bài tiếp theo** từ màn kết quả bài tập (`ExerciseResultScreen`)

### A5. Bài tập (Exercise) — ✅ Done (MCQ MVP)

- [x] `ExercisePlayer` — stepped MCQ, shuffle, `passScorePercent`, giải thích
- [x] `ExerciseResultScreen` — thống kê + chúc mừng/động viên (mock `Design/noti_result_lesson/`)
- [x] `ExerciseReviewScreen` — xem lại đáp án từng câu
- [x] Session `localStorage` — giữ tiến độ / kết quả khi F5
- [ ] MATCHING · attempt lưu server

### A4. Trải nghiệm đọc — ✅ Done (trừ hotspot payload)

- [x] Chế độ **Focus** (ẩn sidebar app + header)
- [x] Print stylesheet (`@media print`)
- [ ] Hotspot legend cho IMAGE (chờ payload Phase B2)

**Ước lượng:** 1–2 sprint frontend.

---

## Phase B — Mở rộng model lesson (backend + admin)

**Mục tiêu:** Nội dung rich như mock (quiz, tóm tắt, video).

### B1. Block types mới

| Type | Payload (gợi ý) | UI học sinh |
|------|------------------|-------------|
| `QUIZ` | `question`, `options[]`, `correctIndex`, `explanation` | Quick Check (orange accent) |
| `SUMMARY` | `items: string[]` | Key Takeaways (teal banner) |
| `CALLOUT` | `variant: tip|warning|definition`, `html` | Callout glass |
| `VIDEO` | `assetId` hoặc `url` | Player embed |

**Backend:**

- [ ] Enum `LessonBlockTypeEnum` + migration
- [ ] Validation payload trong `LessonBlockService`
- [ ] Editor admin: form theo type (`LessonBlockEditorPanel`)

### B2. Liên kết 3D ↔ nội dung

- [ ] Payload optional `linkedOrganelleIds: string[]` trên TEXT/IMAGE
- [ ] Click chip → `postMessage` / context tới 3D panel

### B3. API tiến độ (tùy chọn sớm)

- [ ] `POST /api/lesson-progress` — `userId`, `lessonId`, `blockId`, `percent`
- [ ] `GET` cho dashboard GV (sau)

**Ước lượng:** 2–3 sprint full-stack.

---

## Phase C — Engagement & lớp học

**Mục tiêu:** Gắn enrollment, glossary, gamification nhẹ.

- [ ] Chỉ hiển thị bài thuộc lớp/môn đã ghi danh (`Enrollment` + `Subject`)
- [ ] **Glossary** — tab/header link; popup định nghĩa từ khóa trong HTML
- [ ] Ghi chú cá nhân theo block (local → server)
- [ ] Mini ôn tập sau khi hoàn thành 100% (từ QUIZ blocks)
- [ ] Streak / hoàn thành tuần (optional, cần analytics)

**Phụ thuộc:** phân quyền học sinh, enrollment API ổn định.

---

## Thứ tự triển khai đề xuất

```text
[Done] UI Bio-Glass (theme, TOC, reader, list, home)
  ↓
A1 3D split panel
  ↓
A2 Continue + block progress local
  ↓
A3 Up Next
  ↓
B1 QUIZ + SUMMARY blocks
  ↓
B2 Hotspot sync
  ↓
B3 Progress API
  ↓
C  Enrollment filter + glossary
```

---

## Rủi ro & quyết định kỹ thuật

1. **Viewport hẹp:** Sidebar 240px + TOC 240px + 3D 400px → chỉ bật 3 cột từ 1440px; dưới đó dùng bottom sheet.
2. **HTML XSS:** sanitize trước khi thêm QUIZ/interactive trong TEXT (`DOMPurify`).
3. **Hai theme:** Admin giữ Academic Core; Student dùng `--bio-*` — không trộn token.
4. **Gallery route:** 3D panel có thể reuse route `/biology-cells/:id` với query `?embed=1`.

---

## Acceptance criteria (Phase A hoàn tất)

- [x] Học sinh đọc bài có 3D mà không rời trang (desktop ≥1440px).
- [x] Quay lại app thấy “Tiếp tục học” đúng bài/block.
- [x] Cuối bài có CTA bài tiếp theo cùng môn (nếu có).
- [x] Mục lục + % tiến độ khớp vị trí scroll.

---

## Tài liệu liên quan

- Design tokens: `design/stitch_cell_studio_product_audit/DESIGN.md`
- Mock HTML: `design/stitch_cell_studio_product_audit/code.html`
- CSS student: `src/styles/student-bio-theme.css`, `lesson-reader.css`, `student-lessons.css`

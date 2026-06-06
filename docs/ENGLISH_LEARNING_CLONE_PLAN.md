# Kế hoạch — Course English (clone từ Cell Architecture)

Dự án học tiếng Anh: **học** (bài đọc/nghe/ngữ pháp), **làm bài** (worksheet, assignment), **quiz** (ngân hàng câu + bài kiểm tra).

Nguồn fork: `cell_architecture` (`cell-architecture-studio` + `cell-architecture-backend`).  
Repo mới: `course_english` (`course_english_frontend` + `course_english_backend`).

---

## 1. Giữ lại từ project cũ

### 1.1 Backend — giữ gần nguyên

| Hạng mục | Ghi chú |
|----------|---------|
| Auth JWT, `User`, `Role`, `Permission` | Login, phân quyền admin/student |
| `Classroom`, `Subject`, `Enrollment` | Course → Unit/Subject → roster |
| `Lesson`, `LessonBlock`, `LessonAsset` | CMS block-based |
| Block types | `TEXT`, `IMAGE`, `VIDEO` (+ mở rộng bên dưới) |
| `FileService`, storage public URL | Ảnh, audio, file đính kèm |
| `Skill` | Đổi nghĩa: Grammar, Listening, Vocabulary… (schema chỉ `name`) |
| Patterns | Search pagination, DTO, `CatalogSearchSpecs`, service layer |

### 1.2 Frontend — giữ & rebrand

| Module (gốc) | Dùng cho English |
|----------------|------------------|
| `shared/api/*`, `axios`, `RequireAuth` | Hạ tầng API |
| `layouts/admin/*`, catalog toolbar, `AppTable` | Shell quản trị |
| Admin pages: user, role, classroom, subject, enrollment, lesson | Vận hành lớp |
| `LessonEditorPage`, rich text, image upload | Soạn bài |
| Student: `LessonReaderPage`, TOC, scroll spy, Focus, print | Đọc passage |
| `lessonProgressStorage`, Continue learning, Up Next | Tiếp tục học |
| Cấu trúc `student-layout` (sidebar, cards) | Đổi CSS token, giữ layout |

### 1.3 Quy trình kỹ thuật

- Tách theme **Admin** vs **Student** (không trộn token).
- Sanitize HTML (`DOMPurify`) trước khi render TEXT / quiz trong lesson.
- DB và schema **riêng** — không dùng chung DB với Cell Studio.

---

## 2. Không port / xóa khi fork (P0)

| Thành phần (gốc) | Lý do |
|-------------------|--------|
| `features/biology/**`, `pages/public/biology` | 3D tế bào |
| `components/three`, `CellScene`, `@react-three/*`, `three` | Không cần cho English |
| Block `CELL_VIEWER`, `CELL_STEP` | Domain sinh học |
| `LessonReader3DPanel`, `CellViewerEmbed`, `lesson3dContext` | Reader 3 cột + 3D |
| `data/cells`, `data/biology` | Static catalog tế bào |
| `student-bio-theme.css`, route `/biology/cells` | Branding sinh học |
| Editor admin: chọn cell / organelle steps | `LessonBlockEditorPanel` phần CELL_* |
| Asset `MODEL_3D` (optional) | Chỉ phục vụ 3D |
| Import Excel mẫu sinh học | Nội dung domain cũ |

---

## 3. Phát triển mới (Course English)

### 3.1 Mô hình sản phẩm

```text
Classroom (khóa / lớp)
  └── Subject (unit / chủ đề)
        ├── Lessons          ← reuse Lesson (đọc, nghe, grammar)
        ├── Vocabulary sets  ← mới (P3)
        ├── Quizzes          ← mới (P2)
        └── Assignments      ← mới (P3)
```

### 3.2 Block types (target enum)

| Type | Payload (gợi ý) | UI học sinh |
|------|-------------------|-------------|
| `TEXT` | `html` | Nội dung đọc / grammar |
| `IMAGE` | `assetId`, `caption` | Minh họa |
| `VIDEO` | `assetId` hoặc `url` | Video bài giảng |
| `AUDIO` | `assetId`, `transcript?`, `playbackRate?` | Nghe + transcript |
| `CALLOUT` | `variant`, `html` | Tip / warning / definition |
| `SUMMARY` | `items: string[]` | Key takeaways |
| `QUIZ` | `questionId` hoặc inline MCQ | Quick check trong bài |

**Bỏ:** `CELL_VIEWER`, `CELL_STEP`.  
**Thay `QUESTION_REF`:** trỏ tới entity `Question` (P2), không chỉ ref string.

### 3.3 Domain mới — Quiz (P2)

```text
QuestionBank (theo Subject / Skill)
  └── Question
        type: MCQ | MULTI_SELECT | FILL_BLANK | MATCHING | TRUE_FALSE | ORDERING
        stem, options[], correctAnswer, explanation
        audioUrl / imageAssetId (listening)

Quiz
  title, subjectId, timeLimitSec, shuffle, passScore

QuizAttempt
  userId, quizId, startedAt, submittedAt, score, answersJson
```

- **Inline:** block `QUIZ` trong lesson (1–2 câu).
- **Full page:** `QuizPlayerPage` — timer, nộp bài, review đáp án.

### 3.4 Domain mới — Làm bài (P3)

| Loại | Mô tả |
|------|--------|
| Worksheet | Nhiều câu, không giới hạn thời gian |
| Assignment | GV giao, hạn nộp, SUBMITTED / GRADED |
| Vocabulary | Từ + nghĩa + audio; SRS ôn tập (optional) |

### 3.5 API tiến độ (P1)

- `POST /api/lesson-progress` — `userId`, `lessonId`, `blockId`, `percent`
- `GET` — resume + dashboard GV (sau)

---

## 4. Phase triển khai

### P0 — Fork & nền (1 sprint) — ✅ Done

**Mục tiêu:** Repo chạy được, không còn biology/Three.js.

- [x] Copy backend → `course_english_backend`, đổi package `com.courseenglish.api`
- [x] Copy frontend → `course_english_frontend`, đổi `name` package.json
- [x] DB mới + `application.properties` (URL, storage path)
- [x] Xóa biology routes, deps Three.js
- [x] Enum block: bỏ `CELL_*`, thêm stub `AUDIO` (backend + types FE)
- [x] Theme student mới (`--eng-*`), home → `/student`
- [x] README + `.env.example`

**Acceptance:** Login admin, CRUD lesson TEXT+IMAGE, student đọc bài publish, không lỗi build.

---

### P1 — Học (2–3 sprint)

**Mục tiêu:** Trải nghiệm đọc/nghe ổn, gắn lớp.

- [ ] Block `AUDIO` + player (speed, transcript optional)
- [ ] Block `CALLOUT`, `SUMMARY`
- [ ] Filter bài theo `Enrollment` + `Subject`
- [ ] Progress API (server) + đồng bộ với localStorage
- [ ] Glossary / highlight từ trong HTML (popup định nghĩa)
- [ ] Admin editor form theo từng block type

**Acceptance:** Học sinh chỉ thấy bài thuộc lớp đã ghi danh; tiếp tục học khớp server sau login.

---

### P2 — Quiz (3–4 sprint)

**Mục tiêu:** Ngân hàng câu + làm bài + chấm điểm.

- [ ] Entity `Question`, `Quiz`, `QuizAttempt` + API CRUD/search
- [ ] Admin: quản lý câu hỏi, gắn quiz
- [ ] `QuizPlayerPage` — timer, shuffle, submit, review
- [ ] Block `QUIZ` trong lesson reader
- [ ] Chấm MCQ / TRUE_FALSE tự động; FILL_BLANK normalize (trim, lowercase, synonyms)

**Acceptance:** GV tạo quiz 10 câu; HS làm và thấy điểm + giải thích sau nộp.

---

### P3 — Assignment & từ vựng (2–3 sprint)

- [ ] `Assignment` + nộp bài (text / file)
- [ ] `Vocabulary` set theo subject
- [ ] Dashboard GV: điểm quiz, bài chưa nộp

---

### P4 — Engagement (optional)

- [ ] Streak / % hoàn thành tuần
- [ ] Mini ôn sau 100% lesson (từ QUIZ blocks)
- [ ] Thống kê lớp nâng cao

---

## 5. Thứ tự triển khai

```text
P0  Fork + strip biology + theme
  ↓
P1  Reader + AUDIO + enrollment + progress API
  ↓
P2  Question + Quiz + QUIZ block
  ↓
P3  Assignment + vocabulary + GV dashboard
  ↓
P4  Gamification
```

---

## 6. So sánh Cell Studio vs Course English

| Khía cạnh | Cell Studio | Course English |
|-----------|-------------|----------------|
| UX đặc thù | 3D Co-pilot, organelle | Audio, transcript, quiz player |
| Block đặc thù | `CELL_VIEWER`, `CELL_STEP` | `AUDIO`, `QUIZ` |
| Quiz | Plan / `QUESTION_REF` chưa UI | Entity + attempt đầy đủ |
| Dependency FE | Three.js | Không Three; audio player nhẹ |
| Theme student | Bio glass teal | Theme riêng (đọc dài, quiz accent) |

---

## 7. Rủi ro & quyết định

1. **Quiz inline vs quiz độc lập:** một model `Question`, hai UI (block vs full page).
2. **Fill-blank:** bảng `acceptedAnswers[]` hoặc rule normalize — tránh chỉ so khớp chuỗi cứng.
3. **Listening:** dùng `FileService` + CDN/path storage giống ảnh.
4. **Drift 2 repo:** bugfix ở layer generic (auth, lesson CRUD) — ghi note để cherry-pick nếu cần.

---

## 8. Acceptance tổng (MVP sau P2)

- [ ] Admin: lớp, môn, ghi danh, soạn lesson (TEXT, IMAGE, AUDIO, QUIZ block).
- [ ] Student: danh sách bài, đọc + nghe, tiếp tục học, Up Next cùng môn.
- [ ] Student: làm quiz độc lập, có điểm và xem lại đáp án.
- [ ] Không dependency Three.js / biology trong build production.

---

## Tài liệu liên quan

- [FORK_FROM_CELL_ARCHITECTURE.md](./FORK_FROM_CELL_ARCHITECTURE.md) — checklist copy/xóa/đổi tên
- Gốc: `cell_architecture/cell-architecture-studio/docs/STUDENT_LESSON_FEATURE_PLAN.md`

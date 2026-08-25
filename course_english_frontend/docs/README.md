# Course English — Danh mục chức năng

> Cập nhật: **20/08/2026**  
> LMS học tiếng Anh **Grade 1–9** · Lesson = **Learning Blocks** (Duolingo/Quizlet-style)  
> Checklist chi tiết + tick tiến độ: **[REVIEW.html](./REVIEW.html)** (hoặc `/admin/review-doc` trong app)

---

## Tổng quan

| Thành phần | Stack | Port / URL |
|------------|-------|------------|
| Backend | Spring Boot, MySQL | `7070` → `/api/v1` |
| Frontend | React 19, Vite, MUI admin | `5173` → `/student`, `/admin` |
| TTS (Story) | Python FastAPI `reading_text/` | `8100` |

**Vai trò:** Admin · Teacher · Student

**Mô hình nội dung:**

```text
Classroom (lớp) → Subject (Unit) → Lesson → LessonBlock[] (block_type + payload_json)
```

---

## 1. Xác thực & phân quyền

| Chức năng | Route / ghi chú | Trạng thái |
|-----------|-----------------|------------|
| Đăng nhập JWT + refresh | `/login` | ✅ |
| Đăng ký | `/register` | ✅ |
| Quên / đặt lại mật khẩu | `/forgot-password`, `/reset-password` | ✅ |
| CRUD Role & Permission | `/admin/roles` | ✅ |

---

## 2. Quản lý khóa học (Course Management)

| Chức năng | Admin route | Trạng thái |
|-----------|-------------|------------|
| CRUD Lớp (`Classroom`) | `/admin/classrooms` | ✅ |
| CRUD Môn / Unit (`Subject`) | `/admin/subjects` | ✅ |
| CRUD Ghi danh (`Enrollment`) | `/admin/enrollments` | ✅ |
| CRUD Bài học + Publish | `/admin/lessons`, `/admin/manage-lesson/:id/edit` | ✅ |
| Lọc bài theo enrollment (HS) | List / path / vocab | ✅ |
| URL slug bài học HS | `/student/lessons/:slug` | ✅ |

---

## 3. Lesson Player & nội dung bài học

### 3.1 Học sinh

| Chức năng | Route | Trạng thái |
|-----------|-------|------------|
| Tab **Bài học / Bài tập** | `/student/lessons/:slug?tab=study\|practice` | ✅ |
| Đọc block: TEXT, IMAGE, VOCABULARY, CALLOUT, SUMMARY, SLIDE_DECK | Study tab | ✅ |
| TOC + scroll spy + focus mode + in bài | Lesson Player | ✅ |
| Tiếp tục học (local + server) | Home + API `lesson_reading_progress` | ✅ |
| Lộ trình theo Unit | `/student/path` | ✅ |

### 3.2 Bài tập (`ExercisePlayer`) — 10 loại câu

| Loại câu | Trạng thái |
|----------|------------|
| MULTIPLE_CHOICE, TRUE_FALSE, MATCHING | ✅ |
| FILL_BLANK, GAP_FILL_MCQ, READING_COMPREHENSION | ✅ |
| LISTEN_CHOOSE, LISTEN_TYPE, SPELLING, REORDER_SENTENCE | ✅ |

**Tính năng player:** shuffle câu/đáp án · `passScorePercent` · giải thích từng câu · luyện lại câu sai · màn kết quả + xem lại · **«Từ cần ôn tập»** (`sessionReviewWords`) · lưu attempt server · session localStorage (F5).

### 3.3 Soạn bài (Admin / Teacher)

| Phương thức | Mô tả | Trạng thái |
|-------------|-------|------------|
| **Manual Builder** | Form soạn `EXERCISE_SET` (MCQ, settings…) | ✅ |
| **Import CSV/Excel** | Upload → preview → gắn block | ✅ |
| **Question Bank** | Block `QUESTION_REF` — picker ngân hàng câu | ✅ |
| **Vocab Generator** | Sinh MATCHING/MCQ từ bộ từ | ✅ |
| Rich text, IMAGE, CALLOUT, SUMMARY, VOCABULARY flashcard | Lesson Editor | ✅ |
| Publish validation (BE) | Chặn publish thiếu block / bank trống | ✅ |
| VIDEO / AUDIO block (editor + reader) | — | ⏳ |

Chi tiết: [`docs/LESSON_AUTHORING_PROGRESS.md`](../../docs/LESSON_AUTHORING_PROGRESS.md)

---

## 4. Question Bank

| Phase | Chức năng | Trạng thái |
|-------|-----------|------------|
| 1 | Dashboard, stats, search/filter/sort | ✅ |
| 2 | Metadata, preview drawer, form MCQ/TF/Fill | ✅ |
| 3 | Bulk actions, explain, similar, rewrite, bulk AI | ✅ |
| AI-1/2/3 | Sinh câu từ topic / vocab set → bank DRAFT | ✅ |
| AI-2b GAP/READING trong bank (vòng đời đầy đủ) | — | ⏳ |

Route: `/admin/manage-questions`

---

## 5. ExamPaper — Soạn đề thi

| Phase | Chức năng | Trạng thái |
|-------|-----------|------------|
| 1–3 | CRUD đề, section, import Excel, export Word | ✅ |
| 6 | AI sinh đề từ PDF/DOCX (outline → gen parallel) | ✅ |
| 6.12 | Sinh đề tương tự từ đề nguồn | ✅ code |
| 4–5 | HS làm đề + timer, gán lớp, chặn làm lại | ⏳ |

Routes: `/admin/exam-papers`, `/admin/exam-papers/:id/edit`

---

## 6. Vocabulary Set

### 6.1 Thư viện & Admin

| Chức năng | Trạng thái |
|-----------|------------|
| Thư viện từ trung tâm + Dictionary enrich (IPA, audio UK/US) | ✅ |
| CRUD bộ từ + từ — card grid | ✅ |
| AI sinh bộ từ (text + POS + example + cover image) | ✅ |
| AI sinh câu từ bộ từ → Question Bank (AI-3) | ✅ |

Routes: `/admin/vocabulary-sets`, `/admin/vocabulary-words`

### 6.2 Học sinh — Journey & Luyện tập

| Chức năng | Route | Trạng thái |
|-----------|-------|------------|
| Tab **Hôm nay học gì** (bộ từ GV gán lớp) | `/student/vocab` | ✅ |
| Tab **Khám phá** — Learning Journey theo topic | `/student/vocab` | ✅ |
| Path topic (PC ngang / mobile dọc) | `/student/vocab/journeys/:id` | ✅ |
| Danh sách bộ từ trong topic | `/student/vocab/topics/:id` | ✅ |
| Learn list + **Luyện tập mixed** (nhiều dạng câu) | `/student/vocab/:setId?mode=practice` | ✅ |
| Lưu điểm vocab practice | API `vocab_practice_attempts` (migration 041) | ✅ |
| Admin Journey/Topic + gán journey → lớp | `/admin/vocabulary-journeys` | ✅ |

Chi tiết: [`docs/STUDENT_VOCAB_LEARNING_PLAN.md`](../../docs/STUDENT_VOCAB_LEARNING_PLAN.md)

---

## 7. AI Reading Studio (Story)

| Phase | Chức năng | Trạng thái |
|-------|-----------|------------|
| 1 | CRUD story, AI preview, tokenizer, reader, click từ, notebook | ✅ |
| 2 | Python TTS (ElevenLabs → Edge fallback), sinh audio admin | ✅ |
| 2.1 | Voice catalog, chọn profile NARRATOR | ✅ |
| 2.2 | **Karaoke premium UX** — animate từ, crossfade, comfort scroll | ✅ |
| 2.3 | Multi-speaker (AI speech manifest) | ⏳ |
| E2E | Manual test pipeline audio :8100 | ⏳ |

Routes HS: `/student/stories`, `/student/stories/:slug`, `/student/stories/notebook`  
Route Admin: `/admin/stories`

---

## 8. LinguistAI (GV / Admin)

| Chức năng | Trạng thái |
|-----------|------------|
| Chat SSE, lưu hội thoại, quota ngày | ✅ |
| Upload PDF/DOCX → sinh câu → preview → thêm vào EXERCISE_SET | ✅ |
| Tối ưu sinh câu: schema gọn + parallel batch | ✅ |
| Import câu từ chat vào Question Bank | ⏳ |

Routes: `/admin/ai-assistant`, FAB drawer toàn app admin

---

## 9. Dashboard & hỗ trợ giáo viên

| Chức năng | Route / vị trí | Trạng thái |
|-----------|----------------|------------|
| **Students Need Support** — risk score, bảng HS cần hỗ trợ | `/admin/students-need-support` + widget Dashboard | ✅ |
| **Teaching plan** hôm nay — lịch + link online class | Dashboard + `/admin/schedule` | ✅ |
| **Weather card** + AI tip dạy học | Dashboard | ✅ |
| **Community Voice** — carousel góp ý nổi bật | Dashboard widget | ✅ |
| Activity logs (AI tasks…) | `/admin/activity-logs` | ✅ |
| Cấu hình hệ thống | `/admin/system-config` | ✅ |

---

## 10. Innovation Hub (Community Voice)

| Chức năng | Trạng thái |
|-----------|------------|
| List + filter (category, status, mine, sort) | ✅ |
| Gửi ý tưởng (Drawer) + upload 1–3 ảnh | ✅ |
| Vote toggle, comment, detail | ✅ |
| Đổi status (admin) + timeline | ✅ |
| Hub cho học sinh | ⏳ |

Routes: `/admin/innovation-hub`, `/admin/innovation-hub/:ideaId`  
Chi tiết: [`docs/INNOVATION_HUB_PROGRESS.md`](../../docs/INNOVATION_HUB_PROGRESS.md)

---

## 11. Thông báo & hạ tầng

| Chức năng | Trạng thái |
|-----------|------------|
| In-app chuông + WebSocket realtime | ✅ |
| Email khi publish lesson (`@Async`) | ✅ |
| **RabbitMQ Lab** — trang học topology (simulator) | ✅ UI |
| RabbitMQ worker production (Spring AMQP) | ⏳ |
| Redis cache | ⏳ |

Route lab: `/admin/rabbitmq-lab` · Doc: [`docs/RABBITMQ_LAB.md`](../../docs/RABBITMQ_LAB.md)

---

## 12. Giao diện học sinh (Vibrant Scholar)

| Nhóm | Tiến độ ~ | Ghi chú |
|------|-----------|---------|
| Shell + bottom nav | 85% | `StudentAppLayout` / `StudentPlayerLayout` |
| Home bento + Continue | 90% | XP/streak FE-only |
| Lesson Player | 85% | Vq theme, sync server |
| Exercise | 92% | 10 loại câu + review words |
| Từ vựng (S9) | 88% | Journey + Assigned + mixed practice |
| Story + karaoke | 85% | Chờ E2E audio |
| Profile (S8a) | — | Stats, badges, history (FE-only) |
| Leaderboard | 5% | Placeholder — S8b BE |

Route gốc: `/student` · Demo: `hs01@demo.local` / `123456`

---

## 13. Chưa làm / V2 / V3

| Module | Mô tả |
|--------|--------|
| **Assignment** | Homework, due date, nộp bài, chấm GV |
| **ExamPaper HS** | Làm đề có timer, gán lớp, 1 lần |
| **Gamification BE** | XP/streak/badge/leaderboard lưu server (S8b) |
| **VIDEO/AUDIO** | Block editor + reader đầy đủ |
| **Syllabus sidebar** | Unit → lessons trong Lesson Player |
| **RabbitMQ + Redis** | Scale notification & cache |
| **Parent portal** | V3 |
| **AI Coach HS** | V3 |

---

## Sitemap nhanh

```text
/student
  /                          Home
  /lessons, /lessons/:slug   Danh sách + Lesson Player
  /path                      Lộ trình Unit
  /vocab                     Assigned + Khám phá
  /vocab/journeys/:id         Journey path
  /vocab/topics/:id          Bộ từ trong topic
  /vocab/:setId              Learn + practice
  /stories, /stories/:slug   Đọc truyện + karaoke
  /profile, /leaderboard

/admin
  /dashboard                 Weather + teaching plan + widgets
  /lessons, /manage-questions, /exam-papers
  /vocabulary-*, /vocabulary-journeys
  /stories, /innovation-hub, /ai-assistant
  /students-need-support, /schedule, /rabbitmq-lab
  /review-doc                  ← REVIEW.html
```

---

## Tài liệu liên quan

| File | Nội dung |
|------|----------|
| [REVIEW.html](./REVIEW.html) | Product review đầy đủ + checklist tick |
| [../README.md](../README.md) | Chạy FE, build |
| [../../README.md](../../README.md) | Chạy toàn repo, seed DB |
| [LESSON_AUTHORING_PROGRESS.md](../../docs/LESSON_AUTHORING_PROGRESS.md) | 4 cách soạn lesson |
| [STUDENT_VOCAB_LEARNING_PLAN.md](../../docs/STUDENT_VOCAB_LEARNING_PLAN.md) | Vocab Journey HS |
| [INNOVATION_HUB_PROGRESS.md](../../docs/INNOVATION_HUB_PROGRESS.md) | Innovation Hub |
| [STORY_READING_STUDIO_PLAN.md](../../docs/STORY_READING_STUDIO_PLAN.md) | AI Reading Studio |
| [promt.md](../../promt.md) | Kiến trúc block đích |

---

## Chạy nhanh

```bash
# Backend
cd course_english_backend && copy .env.example .env && .\gradlew.bat bootRun

# Frontend
cd course_english_frontend && copy .env.example .env && npm install && npm run dev
```

- App: http://localhost:5173  
- API: http://localhost:7070/api/v1  
- Review doc: http://localhost:5173/admin/review-doc

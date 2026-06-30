# Question Bank Progress (4 Phases)

Mục tiêu: nâng cấp `Question Bank` từ CRUD MCQ thành **trung tâm tái sử dụng câu hỏi** cho toàn bộ platform (lesson/vocab/doc/exam/AI).

Tài liệu tham chiếu: `promt.md`, FE page hiện tại: `course_english_frontend/src/pages/admin/ManageQuestionsPage.tsx`.

> **Lưu ý:** Tài liệu này chỉ là **kế hoạch** (chưa triển khai).  
> **Plan chi tiết Phase 1–2:** [`QUESTION_BANK_PHASE_1_2_PLAN.md`](./QUESTION_BANK_PHASE_1_2_PLAN.md)  
> **Plan AI Generate:** [`QUESTION_BANK_AI_GEN_PLAN.md`](./QUESTION_BANK_AI_GEN_PLAN.md)  
> **Plan triển khai AI-3:** [`QUESTION_BANK_AI_3_PLAN.md`](./QUESTION_BANK_AI_3_PLAN.md)  
> **Plan Phase 3:** [`QUESTION_BANK_PHASE_3_PLAN.md`](./QUESTION_BANK_PHASE_3_PLAN.md)  
> **Plan triển khai AI-1:** [`QUESTION_BANK_AI_1_PLAN.md`](./QUESTION_BANK_AI_1_PLAN.md)  
> Tiến độ ExamPaper: `docs/EXAM_PAPER_PLAN.md` · Schema DB: `docs/QUESTION_BANK_DB_DESIGN.md`

---

## Phase 1 — UI/UX Dashboard + Nền tảng tìm kiếm/lọc (làm trước)

> Chi tiết: [`QUESTION_BANK_PHASE_1_2_PLAN.md`](./QUESTION_BANK_PHASE_1_2_PLAN.md)  
> **Cập nhật:** 2026-06-30 — Phase 1 code xong, chờ manual test

### Outcomes
- Trang “Question Bank” có bố cục dashboard hiện đại (header actions + stats + search/filter).
- Chuẩn hoá query/search state, chuẩn bị chỗ “Sort by”, “Source”, “Created by”.
- Không phá luồng CRUD hiện tại.

### Frontend (FE)
- [x] **Top header**: Title + subtitle + actions
  - [x] `New Question`
  - [x] `AI Generate` (stub dialog)
  - [x] ~~Import Excel/CSV/Word~~ — **bỏ** (nguồn chính: lưu đề + AI gen)
- [x] **Statistics cards** (6 card)
  - [x] Total Questions
  - [x] Published / Draft
  - [x] MCQ / True-False counts
  - [x] AI Generated (0 tạm — Phase 2)
- [x] **Search area**: search box lớn + filter bar
  - [x] Filters: `questionType`, `status`, `category`, `difficulty`
  - [x] Sort: `Newest`, `Recently Edited`
- [x] **Table**
  - [x] Cột `questionType`, `difficulty`, `updatedAt`
  - [x] Preview disabled (Phase 2)
  - [x] Edit/Delete giữ

### Backend (BE)
- [x] `GET /api/v1/questions/stats`
- [x] `ReqSearchQuestionDTO.difficulty` + filter spec
- [x] `ResQuestionDTO.createdBy` / `updatedBy`
- [ ] Unit test stats

### Acceptance Criteria
- [x] Code: CRUD MCQ + import không đổi flow
- [ ] Manual test: search + filter + sort + stats

---

## Phase 2 — Mở rộng Metadata + Preview Drawer + Chuẩn hoá data model (làm trước)

> **Cập nhật:** 2026-06-30 — Phase 2 code xong, cần chạy migration `031_question_bank_metadata.sql` + manual test

### Outcomes
- Mỗi question là “educational object”: có metadata rõ ràng.
- Teacher có thể preview ngay trong drawer, không cần mở form edit.
- Bắt đầu hỗ trợ nhiều question types (tối thiểu 2–4 type đầu).

### Data Model (BE + FE contract)
- [x] `title`, `questionType`, `difficulty`, `cefrLevel`, `skill`, `topic`, `tags[]`, `source`, `createdBy`, `status`
- [x] `isAIGenerated` (column + stats)
- [ ] `usageCount`, `correctRate`, `avgTime` (Phase 4)

### Frontend (FE)
- [x] **Table row metadata**: type, difficulty, CEFR, skill, AI badge
- [x] **Preview drawer** (`QuestionBankPreviewDrawer`)
- [x] **Question types v1**: MCQ, TRUE_FALSE, FILL_BLANK
- [x] **Form editor** multi-type (`QuestionBankForm` + canvas per type)
- [x] Filters: CEFR, skill, topic, source

### Backend (BE)
- [x] Migration `031_question_bank_metadata.sql`
- [x] DTO + search filters metadata
- [x] Validate TF / FillBlank
- [x] `toExerciseQuestionMap` TF + FillBlank
- [x] **Lưu đề → bank** (`ExamPaperQuestionBankSyncService`, `source=EXAM`)
  - [ ] **AI Generate → bank** — plan: [`QUESTION_BANK_AI_GEN_PLAN.md`](./QUESTION_BANK_AI_GEN_PLAN.md)
  - [x] AI-1: topic → bank
  - [x] AI-2: preview invalid + sửa nhanh + title — [`QUESTION_BANK_AI_2_PLAN.md`](./QUESTION_BANK_AI_2_PLAN.md)
  - [ ] **AI-2b:** GAP_FILL_MCQ + bank editor — làm sau
  - [x] AI-3: bộ từ vựng → bank — [`QUESTION_BANK_AI_3_PLAN.md`](./QUESTION_BANK_AI_3_PLAN.md)
  - ~~Upload doc trên bank~~ — bỏ, dùng Exam AI

### Acceptance Criteria
- [x] Code: tạo/sửa/preview MCQ + TF + FillBlank
- [ ] Manual test E2E + QUESTION_REF lesson resolve

---

## Phase 3 — AI Actions + Bulk Actions (đang làm)

> Chi tiết + quyết định: [`QUESTION_BANK_PHASE_3_PLAN.md`](./QUESTION_BANK_PHASE_3_PLAN.md)

### 3a — Bulk status (✅)
- [x] `POST /api/v1/questions/bulk` (PUBLISH / ARCHIVE / DRAFT / DELETE)
- [x] FE checkbox + toolbar Publish / Archive / Delete
- [ ] Manual test bulk + lesson QUESTION_REF warning

### 3b — Duplicate + Export (✅)
- [x] `DUPLICATE` trên bulk + tag `dup-from:{id}`
- [x] `POST /api/v1/questions/export` + tải JSON
- [ ] Manual test duplicate MCQ/TF/Fill + export file

### 3c — Explain Answer VI (✅)
- [x] `POST /api/v1/questions/{id}/ai/explain` (sync, prompt tiếng Việt)
- [x] `QuestionBankExplainDialog` + nút Preview / table
- [ ] Manual test chất lượng giải thích VI trên MCQ / TF / Fill

### 3d–3f — ⏳ xem plan

---

## Phase 3 (cũ — checklist tổng) — AI Actions + Bulk Actions

### Outcomes
- Mỗi question có AI actions (rewrite/simplify/increase difficulty/generate similar…).
- Bulk actions (publish/archive/export/duplicate/bulk AI).

### Frontend (FE)
- [ ] Context menu / dropdown “AI actions” trên từng row + trong drawer
  - [ ] Generate Similar
  - [ ] Rewrite
  - [ ] Simplify
  - [ ] Increase Difficulty
  - [x] Explain Answer (generate) — Phase 3c, mặc định VI
  - [ ] Translate (optional)
- [ ] Bulk selection + bulk toolbar
  - [ ] Bulk Publish / Archive / Delete / Duplicate / Export
  - [ ] Bulk Generate Similar
- [ ] Hiển thị tiến độ task AI (polling, trạng thái, retry)

### Backend (BE)
- [ ] AI task queue cho question actions (reuse cơ chế `AiTask*` nếu đã có)
- [ ] Endpoint tạo task + poll status + get result
- [ ] Lưu audit: aiAction, model, prompt, cost/time (nếu cần)

### Acceptance Criteria
- [ ] AI action chạy async, UI báo tiến độ, kết quả được apply/preview.
- [ ] Bulk publish/archive hoạt động đúng, có confirm.

---

## Phase 4 — Semantic Search + Import nâng cao + Duplicate Detection + Analytics (làm sau)

### Outcomes
- Smart/semantic search (không cần exact keyword).
- Import Word/PDF: auto parse + categorize + detect duplicate.
- Analytics dashboard per question.

### Frontend (FE)
- [ ] Search hỗ trợ “natural language” + gợi ý filter
- [ ] Import Word/PDF UI + review screen
  - [ ] hiển thị list câu parse được
  - [ ] gắn type/metadata tự động + chỉnh tay trước khi lưu
- [ ] Duplicate review:
  - [ ] Duplicate score (%)
  - [ ] Actions: Keep / Merge / Skip
- [ ] Analytics UI:
  - [ ] usageCount, correctRate, wrongRate, avgTime, lastUsed
  - [ ] sort theo metrics

### Backend (BE)
- [ ] Semantic search:
  - [ ] embedding index (pgvector / elastic / external) hoặc hybrid search
  - [ ] fallback: full-text search + synonyms
- [ ] Duplicate detection:
  - [ ] similarity scoring (embedding cosine + heuristics)
  - [ ] merge strategy (giữ stats/refs)
- [ ] Import pipeline:
  - [ ] parse doc → normalize → classify type → map metadata → store
- [ ] Analytics data source:
  - [ ] log attempts/exam results → aggregate per question

### Acceptance Criteria
- [ ] Semantic search trả kết quả liên quan tốt hơn keyword-only.
- [ ] Import Word/PDF có duplicate detection và luồng review.
- [ ] Metrics hiển thị và có thể sort.

---

## Notes / Dependencies

- FE hiện tại đang hardcode `questionType: "MULTIPLE_CHOICE"` trong search params → Phase 1 nên bỏ hardcode và dùng filter.
- Một số hạng mục Phase 3–4 phụ thuộc BE (AI tasks, embeddings, attempt logs). Nếu BE chưa sẵn sàng, FE có thể làm UI/flow trước và stub API.


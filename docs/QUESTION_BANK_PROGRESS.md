# Question Bank Progress (4 Phases)

Mục tiêu: nâng cấp `Question Bank` từ CRUD MCQ thành **trung tâm tái sử dụng câu hỏi** cho toàn bộ platform (lesson/vocab/doc/exam/AI).

Tài liệu tham chiếu: `promt.md`, FE page hiện tại: `course_english_frontend/src/pages/admin/ManageQuestionsPage.tsx`.

---

## Update nhanh (2026-06-30) — Exam AI Similar

Phần này đã triển khai ở luồng `ExamPaperEditor` để tái sử dụng nội dung đề nguồn và sinh đề mới cùng cấu trúc.

### Đã xong
- [x] API tạo task đề tương tự: `POST /api/v1/exam-papers/{id}/ai/similar-generation`
- [x] DTO request mới: `ReqCreateSimilarExamPaperGenTaskDTO` (`newExamTitle`, `newPaperInstruction`, `difficulty`, `promptLang`)
- [x] Service mới `ExamPaperSimilarGenService`: đọc đề nguồn, suy ra `sectionSpecs`, tạo AI task chế độ `SIMILAR`
- [x] Redact đáp án trước khi gửi AI: `ExamPaperReferenceExcerptBuilder` loại các field đúng/sai (`correctChoiceId`, `correctAnswer`, ...)
- [x] FE dialog mới `ExamPaperSimilarAiDialog` + nút `Tạo đề tương tự` trong `ExamPaperEditorPage`
- [x] Polling/progress cho luồng exam dùng ngưỡng riêng `AI_EXAM_PAPER_POLL_MAX_MS` và hint riêng cho processing
- [x] Khi AI DONE: tự map envelope -> tạo `ExamPaper` mới và điều hướng sang editor đề mới

### Cập nhật kỹ thuật liên quan
- [x] Mở rộng `ReqCreateExamPaperGenTaskDTO`: `generationMode`, `sourceExamPaperId`
- [x] Mở rộng `ExamSectionGenSpecDTO`: `referenceExcerpt`, `readingSubQuestionCount`
- [x] `AiExamPaperGenerationService`: hỗ trợ mode `SIMILAR`, timeout toàn task (`app.ai.exam-paper-max-task-sec`), và xử lý count tốt hơn cho Reading/Gap-fill
- [x] Unit test: `ExamPaperReferenceExcerptBuilderTest`

### Còn lại
- [ ] Manual E2E: tạo đề tương tự cho nhiều loại section (MCQ/READING/GAP_FILL), xác nhận không lộ đáp án nguồn
- [ ] QA timeout path (task dài > giới hạn), verify message + activity log
- [ ] Cân nhắc tích hợp lại sang `Question Bank` (Phase 3 AI actions) sau khi ổn định ở Exam Editor

---

## Phase 1 — UI/UX Dashboard + Nền tảng tìm kiếm/lọc (làm trước)

### Outcomes
- Trang “Question Bank” có bố cục dashboard hiện đại (header actions + stats + search/filter).
- Chuẩn hoá query/search state, chuẩn bị chỗ “Sort by”, “Source”, “Created by”.
- Không phá luồng CRUD hiện tại.

### Frontend (FE)
- [ ] **Top header**: Title + subtitle + actions
  - [ ] `New Question`
  - [ ] `AI Generate` (placeholder button + dialog stub nếu BE chưa có)
  - [ ] `Import Excel/CSV` (giữ)
  - [ ] `Import Word/PDF` (UI stub)
- [ ] **Statistics cards** (4–6 card)
  - [ ] Total Questions
  - [ ] Published / Draft / Archived
  - [ ] By type (ít nhất: MCQ)
  - [ ] AI Generated (nếu có field)
- [ ] **Search area**: search box lớn + filter bar gọn
  - [ ] Filters UI: `questionType`, `status`, `category`, (optional: `difficulty`, `skill`, `topic`, `cefr`)
  - [ ] Sort UI: `Newest`, `Recently Edited` (tối thiểu)
- [ ] **Table/Card view** (tối thiểu giữ table)
  - [ ] Thêm cột `questionType` (hiện tại hardcode MULTIPLE_CHOICE)
  - [ ] Thêm badge `AI` (nếu có)
  - [ ] Hành động row: Edit/Delete (giữ)

### Backend (BE)
- [ ] Endpoint thống kê (gợi ý): `GET /api/questions/stats`
  - [ ] Return: total, byStatus, byType, aiGeneratedCount (nếu có)
  - [ ] Nếu chưa có data: trả 0/aggregate cơ bản từ DB.

### Acceptance Criteria
- [ ] Trang load nhanh, không lỗi; CRUD MCQ vẫn hoạt động.
- [ ] Search + filter + sort có hiệu lực (ít nhất status/category/sort createdAt).
- [ ] Stats cards hiển thị đúng theo BE (hoặc fallback hợp lý).

---

## Phase 2 — Mở rộng Metadata + Preview Drawer + Chuẩn hoá data model (làm trước)

### Outcomes
- Mỗi question là “educational object”: có metadata rõ ràng.
- Teacher có thể preview ngay trong drawer, không cần mở form edit.
- Bắt đầu hỗ trợ nhiều question types (tối thiểu 2–4 type đầu).

### Data Model (BE + FE contract)
Tối thiểu cần có trong `QuestionRecord`/DTO:
- [ ] `title` (hoặc derive từ prompt)
- [ ] `questionType`
- [ ] `difficulty` (enum/number)
- [ ] `cefrLevel` (A1–C2)
- [ ] `skill` (vocab/reading/listening/grammar/...)
- [ ] `topic`
- [ ] `tags[]`
- [ ] `source` (MANUAL/IMPORT/AI/LESSON/EXAM/...)
- [ ] `createdBy`, `createdAt`, `updatedAt`
- [ ] `status` (DRAFT/PUBLISHED/ARCHIVED)
- [ ] (optional) `isAIGenerated`
- [ ] (optional) `usageCount`, `correctRate`, `avgTime`

### Frontend (FE)
- [ ] **Table row hiển thị metadata**:
  - [ ] type icon + label
  - [ ] difficulty/cefr/skill/topic/status
  - [ ] usageCount/correctRate (nếu có)
- [ ] **Preview panel (side drawer)**:
  - [ ] question text + choices + correct answer + explanation
  - [ ] metadata + statistics
  - [ ] related questions (placeholder nếu chưa có)
- [ ] **Question types v1** (gợi ý thứ tự):
  - [ ] MCQ (đã có)
  - [ ] True/False
  - [ ] Fill in the blank
  - [ ] Matching
- [ ] **Form editor**:
  - [ ] Tách editor theo type (component per type)
  - [ ] Migrate `QuestionBankForm` để hỗ trợ type mới

### Backend (BE)
- [ ] Mở rộng schema DB/DTO để lưu metadata (migration nếu cần).
- [ ] Search API hỗ trợ filter theo metadata: type/status/cefr/skill/topic/tags/source.
- [ ] Endpoint get-by-id trả đủ detail (choices, answer, explanation, metadata).

### Acceptance Criteria
- [ ] Có thể tạo/sửa/preview ít nhất 2 types (MCQ + 1 type nữa).
- [ ] Drawer preview hoạt động, không ảnh hưởng luồng edit.
- [ ] Filter theo type/status hoạt động ổn định.

---

## Phase 3 — AI Actions + Bulk Actions (làm sau)

### Outcomes
- Mỗi question có AI actions (rewrite/simplify/increase difficulty/generate similar…).
- Bulk actions (publish/archive/export/duplicate/bulk AI).

### Frontend (FE)
- [ ] Context menu / dropdown “AI actions” trên từng row + trong drawer
  - [ ] Generate Similar
  - [ ] Rewrite
  - [ ] Simplify
  - [ ] Increase Difficulty
  - [ ] Explain Answer (generate)
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


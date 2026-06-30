# Question Bank Progress (4 Phases)

Mục tiêu: nâng cấp `Question Bank` từ CRUD MCQ thành **trung tâm tái sử dụng câu hỏi** cho toàn bộ platform (lesson/vocab/doc/exam/AI).

Tài liệu tham chiếu: `promt.md`, FE page hiện tại: `course_english_frontend/src/pages/admin/ManageQuestionsPage.tsx`.

> **Trạng thái tổng:** Phase 1–2 ✅ code · Phase 3 ✅ code · **Arc tạm kết thúc 2026-06-30** (AI-2b deferred, Phase 4 bỏ) · Chờ manual test E2E.  
> **Plan chi tiết Phase 1–2:** [`QUESTION_BANK_PHASE_1_2_PLAN.md`](./QUESTION_BANK_PHASE_1_2_PLAN.md)  
> **Plan AI Generate:** [`QUESTION_BANK_AI_GEN_PLAN.md`](./QUESTION_BANK_AI_GEN_PLAN.md)  
> **Plan triển khai AI-3:** [`QUESTION_BANK_AI_3_PLAN.md`](./QUESTION_BANK_AI_3_PLAN.md)  
> **Plan AI-2b (tiếp theo):** [`QUESTION_BANK_AI_2B_PLAN.md`](./QUESTION_BANK_AI_2B_PLAN.md)  
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
  - [ ] **AI-2b:** GAP_FILL_MCQ + READING — plan: [`QUESTION_BANK_AI_2B_PLAN.md`](./QUESTION_BANK_AI_2B_PLAN.md) ← **tiếp theo**
  - [x] AI-3: bộ từ vựng → bank — [`QUESTION_BANK_AI_3_PLAN.md`](./QUESTION_BANK_AI_3_PLAN.md)
  - ~~Upload doc trên bank~~ — bỏ, dùng Exam AI

### Acceptance Criteria
- [x] Code: tạo/sửa/preview MCQ + TF + FillBlank
- [ ] Manual test E2E + QUESTION_REF lesson resolve

---

## Phase 3 — AI Actions + Bulk Actions ✅ (code xong 2026-06-30)

> Chi tiết + quyết định: [`QUESTION_BANK_PHASE_3_PLAN.md`](./QUESTION_BANK_PHASE_3_PLAN.md)  
> **Ghi chú:** 3f bulk AI chỉ hỗ trợ **SIMILAR** (không bulk rewrite). Audit dùng `AI_GEN_TASK_CREATED` hiện có.

### Tóm tắt đã ship

| Slice | Nội dung |
|-------|----------|
| **3a** | Bulk Publish / Archive / Draft / Delete |
| **3b** | Duplicate + Export JSON |
| **3c** | AI Explain (VI, sync) |
| **3d** | AI Generate Similar → câu mới |
| **3e** | Rewrite / Simplify / Tăng độ khó — **Fork (C)** |
| **3f** | Bulk AI Similar (≤20 câu, 1 task/câu, chung quota) |

### Checklist code

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

### 3d — Generate Similar (✅)
- [x] `POST /api/v1/questions/{id}/ai/similar` → `AiTask`, câu **mới** (1–5)
- [x] `QuestionBankAiActionDialog` + menu AI trên table / preview drawer
- [ ] Manual test: similar MCQ không đụng câu gốc / QUESTION_REF

### 3e — Rewrite Fork C (✅)
- [x] `POST /api/v1/questions/{id}/ai/rewrite` — `REWRITE` | `SIMPLIFY` | `INCREASE_DIFFICULTY`
- [x] Auto `duplicateForFork` → AI trên bản copy → Apply `PUT` fork
- [ ] Manual test: câu gốc + lesson cũ không đổi sau Apply

### 3f — Bulk AI + audit (✅)
- [x] `POST /api/v1/questions/bulk-ai` (SIMILAR, tối đa 20 id)
- [x] Activity log `AI_GEN_TASK_CREATED` kèm `bankAiAction`, `sourceQuestionId`
- [x] Toolbar **AI tương tự** (mỗi câu = 1 task, chung daily quota)
- [ ] Manual test bulk + hết quota

### Deferred (không chặn đóng Phase 3)

- [ ] Bulk **Rewrite** / Simplify (chỉ similar trong 3f)
- [ ] UI theo dõi nhiều task sau bulk-ai (progress tập trung)
- [ ] AI **Translate** explanation/stem (optional)
- [ ] Gợi ý “Thay QUESTION_REF lesson X → fork id” sau Rewrite

### Acceptance Phase 3 (manual — nên chạy trước Phase 4)

- [ ] Bulk publish/archive/delete/duplicate/export
- [ ] Explain VI chất lượng ổn (MCQ / TF / Fill)
- [ ] Similar: câu gốc + lesson `QUESTION_REF` không đổi
- [ ] Rewrite fork: Apply chỉ sửa bản copy; gốc giữ nguyên
- [ ] Bulk similar: đúng số task, quota, message lỗi từng id

---

## Bước tiếp theo (ưu tiên)

> **Cập nhật 2026-06-30:** Arc Question Bank **tạm kết thúc** sau Phase 3. AI-2b **không làm** trong đợt này — xem mục [Tạm dừng](#-tạm-dừng--kết-thúc-arc-question-bank-2026-06-30) bên dưới.

### Ngay — AI-2b (kế hoạch: [`QUESTION_BANK_AI_2B_PLAN.md`](./QUESTION_BANK_AI_2B_PLAN.md)) — ⏸ deferred

1. **2b-1** BE validate + `toExerciseQuestionMap` cho GAP_FILL_MCQ, READING.
2. **2b-2–3** FE converters + form (`GapFillMcqQuestionCanvas`, `ReadingComprehensionQuestionCanvas`) + preview drawer.
3. **2b-4** Bật 2 loại trong AI gen dialog + `bankDraftValidate` + draft row sửa nhanh.
4. **2b-5** (tuỳ chọn) Exam sync bank cho 2 loại + manual E2E lesson `QUESTION_REF`.

**Thứ tự:** ship **GAP_FILL_MCQ** trước → **READING** sau.

### Song song (không chặn 2b)

- Manual test E2E Phase 1–3 (bulk, explain, similar, rewrite fork).
- Migration `031_question_bank_metadata.sql` nếu chưa chạy.

### Defer / không làm

- Phase 4 Question Bank (search, analytics, duplicate detection, import PDF).
- Explain VI cho GAP/READING (sau 2b nếu cần).
- Cảnh báo `QUESTION_REF` khi sửa câu published (sau 2b).

---

## ⏸ Tạm dừng — Kết thúc arc Question Bank (2026-06-30)

### Trạng thái ship

| Phạm vi | Trạng thái |
|---------|------------|
| Phase 1–2 (dashboard, metadata, MCQ/TF/Fill, preview) | ✅ Code |
| AI-1/2/3 (gen topic/vocab → bank) | ✅ Code |
| Phase 3a–3f (bulk, explain, similar, rewrite fork, bulk AI similar) | ✅ Code |
| Manual test E2E Phase 1–3 | ⏳ Chưa đủ |
| AI-2b (GAP_FILL_MCQ + READING trong bank) | ⏸ **Chỉ plan** — [`QUESTION_BANK_AI_2B_PLAN.md`](./QUESTION_BANK_AI_2B_PLAN.md) |
| Phase 4 | ❌ Không làm |

### Vấn đề / rủi ro còn mở (lý do tạm dừng AI-2b)

1. **GAP/READING chưa có vòng đời bank đầy đủ** — AI/exam sinh được nhưng lưu/sửa/lesson `QUESTION_REF` chưa khớp (xem bảng gap trong plan 2b).
2. **Rủi ro format `contentJson`** — nhiều tầng (blanks, subQuestions); một chỗ sai → câu hỏng im lặng trên lesson.
3. **Phase 3 chưa regression test** — mở thêm loại câu trước khi ổn định Similar/Rewrite/Explain dễ khó debug.
4. **Bulk AI (3f) MVP** — chỉ SIMILAR, không dashboard theo dõi nhiều task; quota dễ hết khi bulk nhiều câu.
5. **Không có Phase 4** — không analytics/duplicate/search; bank lớn khó vận hành thủ công.
6. **Migration `031`** — cần xác nhận đã chạy trên môi trường deploy.

### Việc nên làm trước khi mở lại (nếu có)

- [ ] Manual test checklist Acceptance Phase 3
- [ ] Chốt có cần GAP/READING trong bank hay chỉ dùng qua Exam inline
- [ ] Nếu làm 2b: GAP trước, một E2E lesson, rồi READING

---

## Phase 4 — Semantic Search + Analytics + Import (❌ không làm)

> Quyết định product 2026-06-30: **bỏ Phase 4** Question Bank. Giữ placeholder UI (`usageCount` trong preview) nếu có — không triển khai BE.

Chi tiết gốc (tham khảo only): semantic search, import Word/PDF, duplicate detection, analytics dashboard.

---

## Notes / Dependencies

- FE hiện tại đang hardcode `questionType: "MULTIPLE_CHOICE"` trong search params → Phase 1 nên bỏ hardcode và dùng filter.
- Một số hạng mục Phase 3–4 phụ thuộc BE (AI tasks, embeddings, attempt logs). Nếu BE chưa sẵn sàng, FE có thể làm UI/flow trước và stub API.


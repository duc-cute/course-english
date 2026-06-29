# ExamPaper — Module làm đề (tách khỏi Lesson)



> Cập nhật: 2026-06-29  

> Trạng thái tổng thể: **Phase 1–3 done** — **Phase 6 core done** (outline + gen + slice + GAP_FILL_MCQ); còn 6.4–6.6 và polish UX



## Nguyên tắc xuyên suốt



| Giữ nguyên (reuse) | Tách riêng (ExamPaper) |

|--------------------|-------------------------|

| Schema `ExerciseQuestion`, `questions[]` | Entity `ExamPaper` + `ExamSection` |

| `ExercisePlayer` → mode `exam` (Phase 4) | UI soạn đề / gán lớp |

| Question Bank, AI batch theo `QuestionTypeEnum` | Section = 1 loại + instruction |

| Import CSV/Excel (Phase 3) | Metadata: thời gian, điểm, hạn |

| Word export (Phase 3) | Attempt, nộp bài (Phase 5) |



**Không** nhét đề thi vào Lesson. **Không** thêm `sections[]` vào `LessonBlock`.



### Lesson vs Exam



| | Bài tập trong Lesson | Làm đề (ExamPaper) |

|---|----------------------|---------------------|

| Mục đích | Ôn bài, nhớ từ, luyện kỹ năng | Đo kết quả, format đề thi |

| Cấu trúc | Block lẻ: vocab, flashcard, MCQ ngắn | Nhiều phần I, II, III + instruction |

| Thời gian | Không giới hạn | Có thể time limit |

| Làm lại | Thoải mái | Thường 1 lần / có hạn |



### Quy ước section



- 1 section ≈ 1 loại câu hỏi (`QuestionTypeEnum`) + 1 instruction (Synonyms, Reading, …)

- Payload mỗi section = `ExerciseSetPayload` JSON (`title`, `instruction`, `questions[]`)

- **Synonyms vs Antonyms** = hai section `MULTIPLE_CHOICE` khác nhau nhờ **instruction**, không phải type



---



## Schema (Phase 1)



```typescript

ExamPaper {

  id, title, instruction?,

  durationMinutes?, passScorePercent?,

  status: DRAFT | PUBLISHED | ARCHIVED

  subjectId?,           // optional — gắn unit/môn

  sections: ExamSection[]

}



ExamSection {

  id, examPaperId, displayOrder,

  title, instruction,

  questionType?,        // gợi ý loại câu

  payloadJson           // ExerciseSetPayload JSON

}

```



---



## Phase 0 — Spec & quy ước ✅



- [x] Chốt: Lesson = học + luyện; Exam = kiểm tra

- [x] Block = section **không** dùng trong Lesson cho đề thi

- [x] 1 section = 1 loại câu + instruction

- [x] File plan này



---



## Phase 1 — Backend + DB ✅



**Mục tiêu:** CRUD đề thi, lưu JSON sections.



| # | Chức năng | Trạng thái |

|---|-----------|------------|

| 1.1 | Migration `exam_papers`, `exam_sections` | ✅ `migrations/028_exam_papers.sql` |

| 1.2 | Entity + Repository | ✅ |

| 1.3 | API CRUD ExamPaper | ✅ |

| 1.4 | API reorder sections | ✅ |

| 1.5 | Validate payload JSON (questions array) | ✅ `ExamSectionPayloadValidator` |

| 1.6 | Search + filter (keyword, status, subject) | ✅ |



**API:**



- `POST /api/v1/exam-papers/search`

- `GET /api/v1/exam-papers/{id}`

- `POST /api/v1/exam-papers`

- `PUT /api/v1/exam-papers/{id}`

- `DELETE /api/v1/exam-papers/{id}` (soft void)

- `PATCH /api/v1/exam-papers/{id}/sections/reorder`



**Không làm trong Phase 1:** Attempt, gán lớp, HS làm bài.



---



## Phase 2 — GV soạn đề ✅



| # | Chức năng | Trạng thái |

|---|-----------|------------|

| 2.1 | Trang `ManageExamPapersPage` — danh sách đề | ✅ |

| 2.2 | `ExamPaperEditorPage` — metadata đề | ✅ |

| 2.3 | Panel section — thêm / xóa / sắp xếp | ✅ `ExamSectionListPanel` |

| 2.4 | Thêm section từ template (MCQ, Synonyms, Reading…) | ✅ |

| 2.5 | `ExerciseSetEditor` nhúng trong section | ✅ |

| 2.6 | Preview cấu trúc đề | ✅ `ExamPaperPreviewStrip` |

| 2.7 | Menu sidebar "Đề thi / Kiểm tra" | ✅ |



---



## Phase 3 — Import + Export Word ✅ (một phần)



| # | Chức năng | Trạng thái |

|---|-----------|------------|

| 3.1 | Import Excel vào 1 section (MCQ) | ✅ `ExamSectionImportDialog` |

| 3.1b | Import T/F, Fill blank vào section | ⏳ chưa |

| 3.2 | Import cả đề → nhiều section | ✅ `ExamPaperImportDialog` |

| 3.3 | File mẫu Excel | ✅ `mau_import_de_thi.xlsx` |

| 3.4 | Export Word cả đề | ✅ `downloadExamPaperWord` |

| 3.5 | Export đáp án riêng | ✅ |

| 3.6 | Import Word cấu trúc (parse round-trip từ export) | ❌ **Không làm** — dùng AI (Phase 6) |



**Ghi chú Lesson:** Lesson không parse Word cấu trúc. `AiExerciseGenDialog` upload PDF/DOCX → extract text → AI → **một** block bài tập. Exam cần **N section** → Phase 6.



---



## Phase 4 — HS làm đề (5–7 ngày)



| # | Chức năng |

|---|-----------|

| 4.1 | `ExamPlayerPage` — route riêng |

| 4.2 | Flatten sections → câu |

| 4.3 | Instruction câu đầu mỗi section |

| 4.4 | Progress bar tổng |

| 4.5 | Mode exam — không feedback giữa bài |

| 4.6 | Timer |

| 4.7 | Nộp bài + kết quả |



---



## Phase 5 — Gán lớp / Attempt (5–7 ngày)



| # | Chức năng |

|---|-----------|

| 5.1 | `ExamAssignment` — exam + classroom + open/due/close |

| 5.2 | GV gán đề cho lớp |

| 5.3 | HS thấy đề trong lớp |

| 5.4 | `ExamAttempt` — score, answers_json |

| 5.5 | Chặn làm lại (`maxAttempts`) |

| 5.6 | GV xem điểm lớp |



---



## Phase 6 — AI sinh đề từ tài liệu (core ✅, polish 🔄)



### Mục tiêu



GV upload **một** Word/PDF (hoặc dán text) → hệ thống tạo **một đề** với **N section**, mỗi section có instruction riêng. Tái sử dụng engine AI batch của Lesson nhưng **mỗi batch → một ExamSection**.



**Không** mở rộng `AiExerciseGenDialog` / `AiAutoExerciseGenDialog` bằng flag — dialog riêng `ExamPaperAiFromDocDialog`.



### Luồng 2 bước



```

Upload DOCX/PDF

    → extract text (AiDocumentService)

    → Bước 1 OUTLINE (sync): AI → { examTitle, paperInstruction, sections[] }

    → GV chỉnh outline (UI editable)

    → Bước 2 GENERATE (async task): mỗi sectionSpec → 1 batch AI → payloadJson

    → Preview → apply vào ExamPaperEditor (replace / merge)

```



### `sectionSpecs[]` (thay `typeQuotas`)



Hai section MCQ (Synonyms + Antonyms) cần instruction khác nhau — `typeQuotas` không đủ.



```typescript

ExamSectionGenSpec {

  title: string           // "PART II — SYNONYMS"

  instruction: string     // "Choose the word CLOSEST in meaning..."

  questionType: QuestionTypeEnum

  questionCount: number

}

```



### API (Phase 6.1+)



| Endpoint | Mô tả |

|----------|--------|

| `POST /api/v1/exam-papers/ai/outline` | Sync — documentId → outline + warnings |

| `POST /api/v1/ai/tasks/exam-paper-generation` | Async — documentId + sectionSpecs[] → task |

| `POST /api/v1/exam-papers/ai/section-slices` | Sync — documentId + sectionSpecs[] → excerpt preview per section (slice mode, confidence) |

| `GET /api/v1/ai/tasks/{id}` | Poll — `outputJson` dạng `AiExamPaperGenEnvelope` + `progressPercent` |



### Task type



`AiTaskTypeEnum.EXAM_PAPER_GENERATION` — tách khỏi `QUESTION_GENERATION` của Lesson.



### Output envelope



```json

{

  "schemaVersion": 1,

  "examTitle": "...",

  "paperInstruction": "...",

  "sections": [

    {

      "title": "PART I",

      "instruction": "...",

      "questionType": "MULTIPLE_CHOICE",

      "questions": [ ... ]

    }

  ]

}

```



FE convert `questions[]` → `payloadJson` qua `buildExerciseSetPayloadJson`, rồi `applyExamPaperImport`.



### Tiến độ Phase 6



| # | Chức năng | Trạng thái |

|---|-----------|------------|

| 6.1 | Outline service + API (`AiExamPaperOutlineService`) | ✅ |

| 6.2 | Exam paper gen task + parallel per section (`EXAM_PAPER_GENERATION`) | ✅ |

| 6.3 | `ExamPaperAiFromDocDialog` (upload → outline → gen → apply) | ✅ |

| 6.4 | AI gen trong 1 section (editor) | ⏳ |

| 6.5 | Duplicate đề / section | ⏳ |

| 6.6 | Question Bank → section | ⏳ |

| 6.7 | **DOCX table extract** (`DocumentTextExtractor` — body order + tab cells) | ✅ |

| 6.8 | **Tách excerpt theo PART** + preview / chip / override full doc | ✅ |

| 6.9 | **`GAP_FILL_MCQ`** — cloze THPT (PART V/VI, chọn A/B/C/D) — outline + gen + `GapFillMcqQuestionTypeHandler` | ✅ |

| 6.10 | **Progress UI bước sinh** — thanh % tăng dần phía client (`resolveAiGenDisplayPercent` + tick 150ms) | ✅ |



**Cấu hình BE (khi thêm loại câu AI):** `AI_SUPPORTED_GEN_TYPES` trong `.env` phải gồm `GAP_FILL_MCQ` (mặc định trong `application.properties` đã có; restart backend sau khi sửa `.env`).



**Chưa làm (Phase 6 tiếp):**



- Progress / panel khi **Phân tích outline** (API sync, chưa có task poll)

- Outline async task + % thật từ server

- `AiReadingImportService` cho section Reading (phase 6.11)

- Instruction-based slice (file không có `PART I/II`)



### Phase 6.8 — Tách excerpt theo từng PART (đã triển khai)



**Vấn đề:** Mỗi section gen hiện nhận **toàn bộ** `documentExcerpt` (~48k chars). AI phải tự tìm đúng PART trong khối text → dễ lẫn Reading/Cloze, thiếu ngữ cảnh hoặc sinh lại nội dung.



**Mục tiêu:** Khi sinh section `i`, chỉ gửi đoạn text thuộc PART đó (+ buffer nhỏ nếu cần).



**Đã có:** `ExamSectionSliceService`, `POST /exam-papers/ai/section-slices`, FE preview excerpt per section, chip `SLICED` / `FULL`, nút *Dùng toàn bộ đề* / *Tính lại vùng excerpt*, `ExamSectionGenSpecDTO` (`excerptStart/End`, `sliceMode`, `sliceConfidence`, `useFullDocument`).



#### Thiết kế đề xuất



```

extractedText (full)

    → ExamSectionSliceService.slice(excerpt, sectionSpecs[], outlineMeta?)

    → per-section excerpt (hoặc fallback full nếu không cắt được)

    → AiQuestionGenerationService.generateExamSection(slicedExcerpt, ...)

```



#### Bước 1 — Heuristic cắt text (không cần AI thêm)



| Pattern | Ví dụ | Hành vi |

|---------|-------|---------|

| PART header | `PART I`, `Part II`, `PHẦN III` | Ranh giới section |

| Question range | `questions 11 to 20`, `from question 6 to 10` | Gắn với outline `questionCount` |

| Mark instruction | `Mark the letter A, B, C or D` | Bắt đầu block MCQ mới |



- Scan `extractedText` theo dòng → danh sách `(offset, label, instructionSnippet)`.

- Map outline `sectionSpecs[i]` (title/instruction) → khớp PART gần nhất (fuzzy: contains / Levenshtein nhẹ).

- Slice: `[start_i, start_{i+1})` với padding ±200 chars nếu Reading cần đoạn văn liền trước.



**Deliverable:** `ExamSectionSliceService.java` + unit test với fixture text THPT mẫu.



#### Bước 2 — Lưu slice boundaries sau outline



- `ResExamPaperOutlineDTO` thêm optional `sectionCharRanges: [{start,end}]` (tính từ heuristic).

- FE outline step: hiển thị preview “PART II ~ dòng 120–340” (optional, phase sau).

- `ReqCreateExamPaperGenTaskDTO` có thể gửi lại ranges đã chỉnh tay (override).



#### Bước 3 — Wire vào gen



- `AiExamPaperGenerationService.generate`: trước vòng lặp section, gọi slice service.

- `generateExamSection` nhận `sectionExcerpt` thay vì full doc.

- Activity log: ghi `sectionExcerptChars` + `usedFullDocument: false`.



#### Bước 4 — Fallback an toàn



| Tình huống | Fallback |

|------------|----------|

| Không tìm thấy PART header | Gửi full excerpt (như hiện tại) + warning |

| Slice quá ngắn (&lt; 80 chars) | Merge với PART trước/sau hoặc full |

| Chỉ 1 section trong outline | Full excerpt OK |



#### Bước 5 — Reading đặc biệt



- Slice phải gồm **passage + sub-questions + options** (sau fix table extract).

- Nếu passage ở table cột trái, câu hỏi cột phải → tab-separated đã có từ 6.7.

- Tùy chọn: section `READING_COMPREHENSION` dùng `AiReadingImportService.parseReadingBlock` thay vì generic gen (phase 6.9).



#### Tiêu chí hoàn thành (AC)



- [x] Service slice + wire vào `AiExamPaperGenerationService` (log `sectionExcerptChars`).

- [x] FE preview excerpt per section + fallback full doc + warning khi không nhận PART.

- [x] Không regression: file không có PART header vẫn gen được (full doc).

- [x] Unit test slice service (`ExamSectionSliceServiceTest`).

- [ ] PART II Reading chỉ nhận excerpt PART II — cần file THPT có header PART + re-upload sau 6.7.

- [ ] Sau import DOCX THPT mẫu, excerpt Reading có `A.` `B.` `C.` `D.` — phụ thuộc layout Word + table extract.



#### Ước lượng



| Hạng mục | Effort |

|----------|--------|

| `ExamSectionSliceService` + tests | ~0.5–1 ngày |

| DTO + wire gen + log | ~0.5 ngày |

| FE preview slice (optional) | ~0.5 ngày |



---



## Rủi ro & xử lý (Phase 6 — AI từ Word)



| Rủi ro | Hậu quả | Xử lý |

|--------|---------|--------|

| Word scan / layout xấu, extract text lộn xộn | Outline sai, câu lệch nội dung | **6.7** extract table + body order; cảnh báo nếu không có `\t`/ít dòng; gợi ý PDF hoặc dán text |

| Gửi full doc cho mọi section | AI lẫn PART, bịa đáp án | **6.8** slice excerpt theo PART; fallback full + warning nếu không có header |

| PART V/VI cloze nhầm `FILL_BLANK` (gõ chữ) | Sai loại câu THPT | **6.9** `GAP_FILL_MCQ` — outline + gen + handler riêng; `FILL_BLANK` chỉ khi gõ từ |

| Thanh % sinh đề đứng yên giữa các poll | UX kém | **6.10** creep % phía client; server vẫn cập nhật theo section / stream |

| AI gộp nhiều phần MCQ thành 1 section | Mất Synonyms/Antonyms riêng | Prompt outline nhấn **instruction = ranh giới section**; UI outline cho sửa/tách section |

| File không có instruction rõ | Section thiếu hướng dẫn | AI sinh instruction chuẩn theo template catalog; GV chỉnh trên outline |

| Reading comprehension | Nhiều đoạn + câu hỏi | **Một** section `READING_COMPREHENSION`; handler hiện có (passage + sub-questions) |

| Hai section cùng `MULTIPLE_CHOICE` | `typeQuotas` không phân biệt | Dùng `sectionSpecs[]` với instruction riêng; mỗi spec = 1 batch độc lập |

| Nhét logic exam vào Lesson dialog | Phức tạp, regression Lesson | Dialog riêng `ExamPaperAiFromDocDialog`; task type `EXAM_PAPER_GENERATION` |

| Tổng câu vượt quota AI | Task fail / chậm | Giới hạn tổng câu/task (reuse `max-questions-per-task`); validate trước khi tạo task |

| Import Word round-trip từ export | Kỳ vọng parse chính xác 100% | **Không làm** deterministic parse — chỉ export Word; import đề qua Excel hoặc AI |



---



## Timeline gợi ý



```

Tuần 1–2   Phase 0 + 1 + 2        ✅

Tuần 3     Phase 3                ✅ (trừ 3.1b)

Tuần 4     Phase 6 (AI từ doc)    ✅ core (6.1–6.3, 6.7–6.10) — polish 6.4+

Tuần 5–6   Phase 4

Tuần 7–8   Phase 5

```



---



## Sai lầm cần tránh



| Sai | Đúng |

|-----|------|

| Nhét đề thi vào Lesson | Module ExamPaper riêng |

| Instruction trong `QuestionTypeEnum` | Instruction trên section |

| `sections[]` trong Lesson EXERCISE_SET | Section trong ExamPaper |

| AI mix nhiều loại / 1 section đề | 1 section = 1 loại |

| `typeQuotas` cho Synonyms + Antonyms | `sectionSpecs[]` + instruction |

| Refactor import trước khi có Exam entity | Schema trước, import Phase 3 |

| Parse Word export round-trip | AI outline + gen |



---



## Section template catalog (Phase 2+)



| Key | Title | Instruction (EN) | Loại câu |

|-----|-------|------------------|----------|

| MCQ_STANDARD | MULTIPLE CHOICE | Mark the letter A, B, C, or D… | MULTIPLE_CHOICE |

| SYNONYMS | SYNONYMS | Choose the word CLOSEST in meaning… | MULTIPLE_CHOICE |

| ANTONYMS | ANTONYMS | Choose the word OPPOSITE in meaning… | MULTIPLE_CHOICE |

| READING | READING COMPREHENSION | Read the passage and answer… | READING_COMPREHENSION |

| FILL_BLANK | FILL IN THE BLANK | Fill in each blank with ONE word… | FILL_BLANK |

| GAP_FILL_MCQ | CLOZE (choose A/B/C/D) | Mark the letter A, B, C or D to indicate the correct answer… | GAP_FILL_MCQ |

| TRUE_FALSE | TRUE / FALSE | Mark T for True, F for False… | TRUE_FALSE |



---



## Liên kết tài liệu



- `docs/LESSON_AUTHORING_PROGRESS.md` — Lesson / EXERCISE_SET (luyện tập)

- `course_english_frontend/docs/AI_QUESTION_GEN_TECHNICAL.md` — AI batch theo loại câu

- `course_english_frontend/docs/REVIEW.html` — Assignment V2 roadmap



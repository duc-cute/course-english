# Question Bank — Plan triển khai AI-3 (Bộ từ vựng → Bank)

> Cập nhật: **2026-06-30**  
> Trạng thái: **Đã triển khai** ✅ (2026-06-30)  
> Tiền đề: **AI-1** ✅ · **AI-2** ✅ (preview reuse)  
> Tổng quan: [`QUESTION_BANK_AI_GEN_PLAN.md`](./QUESTION_BANK_AI_GEN_PLAN.md) · Vocab: [`VOCABULARY_AI_PROGRESS.md`](./VOCABULARY_AI_PROGRESS.md)

---

## 1. Mục tiêu

Sinh câu hỏi bằng **LLM** (`question-generation`) từ **bộ từ vựng đã lưu** → preview (AI-2) → lưu **Question Bank** (`source=AI`, tag `vocab-set:{id}`).

**Không** dùng `VocabGenerateMcqDialog` / `vocabActivityGenerator` (rule → lesson).

### Pipeline

```text
vocabulary_sets (words)
        ↓
POST question-generation { vocabularySetId, typeQuotas, … }
        ↓
QuestionBankAiGenDialog (tab Bộ từ) — preview AI-2
        ↓
saveAiDraftsToBank + tags vocab-set:{id}
```

---

## 2. Điểm vào UI (3 cửa)

| # | Nguồn | Hành vi |
|---|--------|---------|
| A | **Question Bank** → AI Generate → tab **「Từ bộ từ」** | Search/select set → gen |
| B | **Manage Vocabulary Sets** → menu **「Sinh câu AI → Question Bank」** | Mở dialog pre-fill `vocabularySetId` |
| C | Sau **lưu bộ từ** từ `VocabularyAiGenDialog` | CTA trong form success / snackbar → mở dialog tab Bộ từ |

Cả 3 dùng **cùng** `QuestionBankAiGenDialog` với props:

```typescript
type QuestionBankAiGenDialogProps = {
  open: boolean;
  onClose: () => void;
  categories: QuestionCategoryRecord[];
  onSaved: (result: BankImportBatchResult) => void;
  /** AI-3 */
  initialSourceMode?: "topic" | "vocabularySet";
  initialVocabularySetId?: string;
};
```

---

## 3. Backend — mở rộng (bắt buộc)

FE-only (nhét word list vào `additionalInstructions`) **không** đủ cho bộ 30–50 từ (token, prompt không chuẩn). Cần BE.

### 3.1 DTO

`ReqCreateQuestionGenTaskDTO.java`:

```java
/** Optional — sinh câu từ bộ từ vựng đã lưu. */
private UUID vocabularySetId;
```

Validation khi tạo task:

- `vocabularySetId` **xor** `topic` **xor** `documentId` (ưu tiên: vocab > topic > doc)
- Set tồn tại, không voided, có ≥1 member
- `itemCount` ≥ 1 (cảnh báo FE nếu < 4)

### 3.2 Service mới (gợi ý)

`VocabularySetAiContextService.java`:

| Method | Mô tả |
|--------|--------|
| `requireSetForAiGen(UUID setId)` | Load `ResVocabularySetDTO` + items |
| `buildVocabularySetDocumentText(ResVocabularySetDTO set)` | Format synthetic text |
| `createVocabularySetDocument(userId, set)` | Persist `AiDocument` READY |

Format text (ví dụ):

```text
VOCABULARY SET FOR AI QUESTION GENERATION

Set title: Travel A2
Set ID: {uuid}
Word count: 20

| # | English | Vietnamese | POS | Example |
|---|---------|------------|-----|---------|
| 1 | boarding pass | thẻ lên máy bay | noun | Show your boarding pass. |
...

Rules for the generator:
- Prioritize vocabulary from this list.
- You may use word forms (plural, past tense) but test the listed words.
- Distractors should be plausible and distinct.
```

Gọi từ `AiTaskCommandService.createQuestionGenerationTask`:

```java
if (request.getVocabularySetId() != null) {
  ResVocabularySetDTO set = vocabularySetAiContextService.requireSetForAiGen(...);
  document = vocabularySetAiContextService.createVocabularySetDocument(userId, set);
  request.setTopic(set.getTitle()); // metadata + prompt context
  topicMode = true; // hoặc vocabMode flag riêng
}
```

### 3.3 Prompt assembler

`AiQuestionPromptAssembler.buildUserPrompt`:

- Nếu excerpt bắt đầu `VOCABULARY SET FOR AI` → `sourceLabel = "Vocabulary set"` + block rules ngắn:
  - Chỉ dùng / ưu tiên từ trong bảng
  - Đa dạng ngữ cảnh, không chỉ “word → meaning” một kiểu

### 3.4 Worker / log

`AiTaskProcessingService`:

- `documentSource = "vocabulary-set"` khi input có `vocabularySetId`
- ActivityLog: `vocabularySetId`, `wordCount`

`inputJson` task lưu `vocabularySetId` để audit.

### 3.5 API không đổi URL

Vẫn `POST /api/v1/ai/tasks/question-generation` — chỉ thêm field.

---

## 4. Frontend

### 4.1 API types

`CreateQuestionGenTaskPayload` (`aiTask.ts`):

```typescript
vocabularySetId?: string;
```

### 4.2 Tab Bộ từ — config

`QuestionBankAiGenVocabConfigStep.tsx` (tách hoặc branch trong dialog):

| Field | Nguồn |
|-------|--------|
| Bộ từ * | Autocomplete search `POST /vocabulary-sets/search` (keyword, status PUBLISHED/DRAFT) |
| Preview chips | 5–10 từ đầu sau `GET /vocabulary-sets/{id}` |
| CEFR / skill | Pre-fill: skill=`VOCABULARY`; CEFR từ subject hoặc default A2 |
| topic (ẩn) | `set.title` — gửi kèm BE |
| Loại câu / số câu / độ khó | Giống tab Chủ đề |

Validation:

- Phải chọn bộ có ≥1 từ
- Cảnh báo (không block) nếu < 4 từ: “MCQ nhiễu có thể kém”
- `questionCount ≤ min(50, wordCount * 2)`

Payload:

```json
{
  "vocabularySetId": "uuid",
  "topic": "Travel A2",
  "languageLevel": "A2",
  "typeQuotas": { "MULTIPLE_CHOICE": 15 },
  "difficulty": 2,
  "additionalInstructions": "Use example sentences where possible"
}
```

### 4.3 Lưu bank

Mở rộng `saveAiDraftsToBank` meta / tags:

```typescript
tags: ["ai-gen", `vocab-set:${setId}`, ...(topicSlug ? [`topic:${topicSlug}`] : [])],
topic: set.title,
skill: "VOCABULARY",
```

### 4.4 Manage Vocabulary Sets

`VocabularySetCard.tsx`:

- Menu mới (tách rule-based MCQ):

```text
🤖 Sinh câu AI → Question Bank   ← LLM
📝 Trắc nghiệm (MCQ)               ← rule, lesson (giữ)
```

`ManageVocabularySetsPage.tsx`:

```typescript
const [bankAiGenSetId, setBankAiGenSetId] = useState<string | null>(null);

<QuestionBankAiGenDialog
  open={Boolean(bankAiGenSetId)}
  initialSourceMode="vocabularySet"
  initialVocabularySetId={bankAiGenSetId ?? undefined}
  categories={[]} // load categories hoặc pass từ page
  onClose={() => setBankAiGenSetId(null)}
  onSaved={...}
/>
```

Categories: có thể `apiGetQuestionCategories()` trong dialog khi open (lazy) thay vì prop từ Vocab page.

### 4.5 CTA sau AI sinh bộ từ

`VocabularySetForm` / `ManageVocabularySetsPage` sau `submitForm` thành công:

- Nếu vừa tạo mới + `items.length >= 4`:
  - Snackbar: **「Sinh câu AI vào Question Bank」** action
  - `setBankAiGenSetId(savedId)`

`VocabularyAiGenDialog` → `handleAiGenerated` chỉ mở form; CTA **sau khi user bấm Lưu** bộ (có id thật).

---

## 5. File plan

### Backend (mới / sửa)

| File | Việc |
|------|------|
| `ReqCreateQuestionGenTaskDTO.java` | +`vocabularySetId` |
| `VocabularySetAiContextService.java` | **mới** — build text + document |
| `AiTaskCommandService.java` | Nhánh vocab khi tạo task |
| `AiQuestionGenPromptPreviewService.java` | resolveExcerpt vocab |
| `AiQuestionPromptAssembler.java` | Vocab rules block |
| `AiTaskProcessingService.java` | Log `vocabulary-set` |
| Unit test | `buildVocabularySetDocumentText` format |

### Frontend (mới / sửa)

| File | Việc |
|------|------|
| `QuestionBankAiGenDialog.tsx` | Tabs Topic \| Bộ từ; props initial* |
| `QuestionBankAiGenVocabConfigStep.tsx` | **mới** |
| `VocabularySetPicker.tsx` | **mới** — reusable autocomplete |
| `VocabularySetCard.tsx` | Menu AI → bank |
| `ManageVocabularySetsPage.tsx` | Wire dialog |
| `ManageQuestionsPage.tsx` | (đã có dialog — chỉ thêm tab) |
| `VocabularySetForm` / submit success | CTA optional |
| `aiTask.ts` | +`vocabularySetId` |
| `questionBankAiGenSave.ts` | tags `vocab-set:` |

**Reuse:** `useQuestionGenTask`, `QuestionBankAiPreviewStep`, `saveAiDraftsToBank`, `aiGenLogger`

---

## 6. Chia phase triển khai AI-3

| Sub | Nội dung | Ước lượng |
|-----|----------|-----------|
| **AI-3a** | BE `vocabularySetId` + document + prompt | 1–2 ngày |
| **AI-3b** | FE tab Bộ từ + Bank page | 1 ngày |
| **AI-3c** | Menu Vocab card + CTA sau lưu bộ | 0.5–1 ngày |

**Tổng:** ~3–4 ngày.

---

## 7. Acceptance criteria

### BE

- [ ] POST task với `vocabularySetId` hợp lệ → task DONE → questions liên quan từ trong set
- [ ] Set không tồn tại → 400 rõ ràng
- [ ] ActivityLog có `vocabularySetId`, `wordCount`

### FE

- [ ] Tab Bộ từ: chọn set 20 từ → 15 MCQ → preview → lưu
- [ ] Bank filter tag / topic thấy câu; `source=AI`
- [ ] Card bộ từ → 「Sinh câu AI → Question Bank」→ cùng kết quả
- [ ] CTA sau lưu bộ mới → mở dialog pre-filled
- [ ] Menu MCQ rule-based vẫn hoạt động (regression)
- [ ] Console `[AiQuestionGen]` event `vocab_set_gen_start` / `bank_save_done`

---

## 8. Rủi ro

| Rủi ro | Giảm |
|--------|------|
| Bộ quá dài (>80 từ) | Cap excerpt hoặc sample + “focus on first N words” |
| LLM bỏ qua word list | Prompt rules + validate spot-check |
| User nhầm rule MCQ vs AI | Label menu rõ; icon khác |
| Categories trên Vocab page | Lazy load trong dialog |

---

## 9. Thứ tự làm (khuyến nghị)

1. **AI-3a** BE — test Postman vocab set 10 từ  
2. **AI-3b** FE tab + ManageQuestionsPage  
3. **AI-3c** Vocab card menu + CTA  
4. Manual E2E full pipeline AI từ → AI câu → bank  

---

## 10. Sau AI-3

- **AI-4** duplicate check, prompt preview  
- **AI-2b** GAP_FILL_MCQ bank editor  

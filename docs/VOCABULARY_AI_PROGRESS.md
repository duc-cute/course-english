# Tiến độ: AI sinh bộ từ vựng

Cập nhật lần cuối: 2025-06-30

## Mục tiêu

Admin nhập prompt (chủ đề, trình độ, số từ) → AI sinh bộ từ vựng → preview → điền form → lưu → enrich từ điển.

Quản lý bộ từ: lưới card (admin) + card học viên có cover, hover theo `promt.md`.

## Phạm vi theo phase

| Phase | Nội dung AI sinh | Trạng thái |
|-------|------------------|------------|
| **1 — MVP** | `title`, `description`, `wordEn`, `meaningVi` | ✅ Code xong |
| **2a** | `partOfSpeech` (AI → từ điển), `exampleSentence` (AI) | ✅ Code xong — chờ test thủ công |
| **2b** | **Ảnh cover bộ từ** (`cover_image_url`) — image-gen, không ảnh từng từ | ✅ Code xong — chờ migration + test |

Sau lưu: phonetic / audio qua **Enrich cả bộ**. **POS:** ưu tiên AI; enrich chỉ bổ sung khi AI thiếu.

---

## Phase 1 — Checklist

### Backend

- [x] `AiTaskTypeEnum.VOCABULARY_SET_GENERATION`
- [x] DTO request + envelope
- [x] Prompt / validator / generation service
- [x] Task command + processing + controller
- [x] `application.properties` config
- [x] Unit test validator
- [ ] Manual test Postman / integration

### Frontend

- [x] `VocabularyAiGenDialog.tsx`
- [x] Tích hợp `ManageVocabularySetsPage`
- [ ] Manual test E2E trên UI

---

## UI quản lý bộ từ vựng (admin + học viên)

Tham chiếu layout/hiệu ứng: `promt.md` (card grid, cover banner, chips preview từ).

### Admin — `ManageVocabularySetsPage`

- [x] Bảng → **lưới card** (`VocabularySetCard`, `VocabularySetCreateCard`)
- [x] Cover ảnh full-width (h-32), status badge, preview chips từ
- [x] Footer: số từ + menu **Sinh bài tập AI** (MCQ / nghe / chính tả / nghe-gõ)
- [x] Hover card: `translateY(-4px)`, shadow lớn, title đổi màu primary
- [x] Cover hover: zoom ảnh + gradient overlay; nút Sửa/Xóa fade-in
- [x] Dialog editor bộ từ (`VocabularySetForm`) — hero cover + bảng từ inline
- [x] `admin-vocabulary-sets.css` import trong `index.css`
- [ ] Manual test responsive (sm 2 cột, lg 3 cột)

### Admin — `ManageVocabularyWordsPage`

- [x] Lưới card từ (`VocabularyWordCard`, `VocabularyWordCreateCard`)
- [x] `admin-vocabulary-words.css`

### Học viên

- [x] `VocabSetCard` — hiển thị `coverImageUrl`, fallback icon
- [x] `VocabWordList` — example + POS (Phase 2a)

---

## Phase 2 — Đã chốt yêu cầu

### 2a — POS + example (text, 1 lần gọi LLM)

**JSON mở rộng:**

```json
{
  "title": "...",
  "description": "...",
  "coverImagePrompt": "...",
  "items": [
    {
      "wordEn": "boarding pass",
      "meaningVi": "thẻ lên máy bay",
      "partOfSpeech": "noun",
      "exampleSentence": "Please show your boarding pass at the gate."
    }
  ]
}
```

**Quy tắc `partOfSpeech`:**

```text
POS cuối = AI.partOfSpeech ?? dictionary.partOfSpeech ?? null
Enrich: không ghi đè POS đã có từ AI
```

**`exampleSentence`:** chỉ từ AI. Enrich không đụng field này.

**Checklist 2a:**

- [x] Mở rộng prompt + validator + DTO item
- [x] `ReqVocabularyItemDTO` + `findOrCreateForSetItem` (POS, example)
- [x] `applyEnrichment`: POS chỉ set khi `word.partOfSpeech == null`
- [x] Preview FE: cột POS + Example
- [x] Student `VocabWordList`: hiển thị example + POS
- [ ] Manual E2E: enrich bổ sung POS khi AI thiếu

### 2b — Ảnh cover bộ từ (đã chốt: **image-gen**)

- Chỉ **một ảnh** cho cả `vocabulary_sets` — thumbnail/card danh sách.
- **Không** ảnh từng từ trong luồng AI gen.
- AI sinh `coverImagePrompt` (mô tả EN) trong cùng task text.
- Pipeline: OpenRouter `POST /api/v1/images` (mặc định `black-forest-labs/flux.2-klein-4b`) → tải về storage → `cover_image_url` = `/storage/vocabulary-sets/covers/{taskId}.png`.
- Lỗi image-gen **không fail** task text (log + bỏ qua cover).
- Dialog: checkbox **「Sinh ảnh cover bộ từ」** (`generateCover`, default `true`).

**Checklist 2b:**

- [x] Migration `030_vocabulary_set_cover_image.sql` — `cover_image_url VARCHAR(1024)`
- [x] `OpenRouterClient.generateImage()`
- [x] `VocabularySetCoverImageService` — gen → store local
- [x] `AiVocabularySetGenerationService` — orchestration sau text JSON
- [x] BE lưu `coverImageUrl` khi tạo/sửa bộ
- [x] `VocabSetCard` / admin `VocabularySetCard` hiển thị cover
- [x] Checkbox dialog + preview cover
- [ ] **Chạy migration 030** trên DB dev/prod
- [ ] Manual E2E: sinh bộ có cover, lưu, xem card học viên

---

## API

```
POST /api/v1/ai/tasks/vocabulary-set-generation
Body: {
  topicPrompt, languageLevel?, wordCount, titleHint?,
  additionalInstructions?, generateCover?: boolean  // default true
}
→ 202 { taskId, status }

GET /api/v1/ai/tasks/{id}
→ outputJson: {
  title, description,
  coverImagePrompt?, coverImageUrl?,
  items: [{ wordEn, meaningVi, partOfSpeech?, exampleSentence? }]
}
```

Lưu bộ: `POST /api/v1/vocabulary-sets` — body thêm `coverImageUrl`, items thêm `partOfSpeech`, `exampleSentence`.

---

## Config BE (Phase 2b)

```properties
app.ai.vocab-set-cover-image-model=black-forest-labs/flux.2-klein-4b
app.ai.vocab-set-cover-image-timeout-sec=60
```

---

## File chính

| Layer | File |
|-------|------|
| BE 2a | `service/ai/vocabulary/AiVocabularySetPromptAssembler`, `AiVocabularySetGenResultValidator`, `VocabularyWordService.findOrCreateForSetItem` |
| BE 2b | `VocabularySetCoverImageService`, `OpenRouterClient.generateImage`, migration `030_*` |
| FE AI | `VocabularyAiGenDialog.tsx`, `VocabularySetForm.tsx` |
| FE admin UI | `ManageVocabularySetsPage.tsx`, `VocabularySetCard.tsx`, `VocabularyWordCard.tsx`, `admin-vocabulary-sets.css`, `admin-vocabulary-words.css` |
| FE student | `VocabSetCard.tsx`, `VocabWordList.tsx`, `styles/student/vocab.css` |
| Test | `AiVocabularySetGenResultValidatorTest.java` |

---

## Migrations (chạy thủ công)

1. `029_ai_tasks_widen_task_type.sql` — nếu chưa chạy (ENUM → VARCHAR)
2. `030_vocabulary_set_cover_image.sql` — cột `cover_image_url`

---

## Troubleshooting

### `Data truncated for column 'task_type'`

Chạy migration `029_ai_tasks_widen_task_type.sql` (xem nhật ký cũ).

### Cover không hiện sau sinh

- Kiểm tra `generateCover: true` trong request.
- Kiểm tra OpenRouter API key + model image-gen.
- Xem log `VocabularySetCoverImageService` — lỗi image không fail task text.

### `No model found for "black-forest-labs/flux-schnell"`

Model cũ không còn trên OpenRouter Image API. Dùng:

```properties
AI_VOCAB_SET_COVER_IMAGE_MODEL=black-forest-labs/flux.2-klein-4b
```

Hoặc chất lượng cao hơn: `black-forest-labs/flux.2-pro`. Restart BE sau khi đổi.

---

## Nhật ký

| Ngày | Việc |
|------|------|
| 2025-06-30 | Phase 1 BE + FE |
| 2025-06-30 | Fix migration `task_type` ENUM |
| 2025-06-30 | Chốt Phase 2: POS AI→từ điển; example AI; cover image-gen (không stock) |
| 2025-06-30 | Phase 2a + 2b code complete; validator test pass |
| 2025-06-30 | Admin card grid + editor dialog; hover/cover theo promt.md; student card cover |

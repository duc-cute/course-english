# Block VOCABULARY — Thiết kế (Ưu tiên 2)

> Hoàn tất **Method 4**: bộ từ vựng → tab **Bài học** (ôn từ) + tab **Bài tập** (MCQ đã có).  
> Tham chiếu: [`promt.md`](../promt.md) · [`VOCABULARY_SET_DB_DESIGN.md`](./VOCABULARY_SET_DB_DESIGN.md)

---

## Mục tiêu

| Tab | Block | Nguồn dữ liệu | Trải nghiệm HS |
|-----|-------|---------------|----------------|
| **Bài học** | `VOCABULARY` | `vocabulary_set_id` trong payload | Danh sách từ / flashcard lật thẻ |
| **Bài tập** | `EXERCISE_SET` | Generator từ cùng bộ từ (đã có wizard) | MCQ stepped (đã xong) |

GV workflow một lần:

1. Chọn bộ từ trong Lesson Editor  
2. Hệ thống thêm **2 khối** (hoặc wizard 2 bước): `VOCABULARY` + `EXERCISE_SET` sinh tự động  

---

## Payload `VOCABULARY` (MVP)

```json
{
  "title": "Từ vựng — Daily words",
  "instruction": "Đọc và ghi nhớ từng từ",
  "vocabularySetId": "uuid-bộ-từ",
  "presentation": "list",
  "showPhonetic": true
}
```

| Field | Kiểu | Ghi chú |
|-------|------|---------|
| `title` | string | Tiêu đề khối |
| `instruction` | string? | Hướng dẫn ngắn |
| `vocabularySetId` | UUID | Ref tới `vocabulary_sets` |
| `presentation` | `list` \| `flashcard` | MVP: `list`; flashcard phase 2 |
| `showPhonetic` | boolean | Hiện IPA nếu có |

**Không** nhúng `items[]` vào payload — resolve lúc đọc lesson (giống `QUESTION_REF`).

---

## Backend

### Enum

- Thêm `VOCABULARY` vào `LessonBlockTypeEnum` (+ migration nếu cần).

### Resolve khi `GET /lessons/{id}/detail`

Tương tự `QuestionRefResolverService`:

```text
VocabularyBlockResolverService
  → đọc payload.vocabularySetId
  → load vocabulary_items (PUBLISHED set only)
  → gắn resolvedVocabularyJson vào ResLessonBlockDTO
```

Response block:

```json
{
  "blockType": "VOCABULARY",
  "payloadJson": "{...}",
  "resolvedVocabularyJson": "[{\"wordEn\":\"apple\",\"meaningVi\":\"quả táo\",\"phonetic\":\"...\"}]"
}
```

### Quy tắc

- Set `DRAFT` / `ARCHIVED` → HS thấy cảnh báo hoặc block ẩn (tuỳ publish policy).
- Sửa bộ từ → mọi lesson ref tự cập nhật sau F5 (live resolve).

---

## Frontend Admin

### Lesson Editor

- **+ Từ vựng từ bộ từ** (song song nút **+ Bài tập từ bộ từ** hiện có).
- Picker: chọn `VocabularySet` đã publish.
- Preview: N từ, ví dụ 3 từ đầu.

### Wizard gộp (tuỳ chọn sau MVP)

Dialog **Thêm bộ từ vào bài**:

- [x] Khối VOCABULARY (tab Bài học)  
- [x] Khối EXERCISE_SET sinh MCQ (tab Bài tập)  
- Một lần bấm → 2 API `POST blocks`

---

## Frontend Student

### `blockTypes.ts`

```typescript
STUDY_BLOCK_TYPES.add("VOCABULARY");
```

### `VocabularyBlock.tsx` (tab Bài học)

**MVP — `presentation: list`**

- Card từng item: `word_en` (lớn) + `meaning_vi` + phonetic (nếu bật).
- Optional: nút 🔊 phát audio (phase sau, cần `audio_asset_id`).

**Phase 2 — `flashcard`** ✅

- Một thẻ / màn: mặt trước EN, tap flip → VI.
- Nút Trước / Sau, progress `3 / 12`.
- UX: không nút Lật thẻ riêng, không nhãn Tiếng Anh/Việt.

### `StudyPanel.tsx`

- Render `VOCABULARY` qua `VocabularyBlock` (parse `resolvedVocabularyJson`).

---

## Generator mở rộng (không chặn MVP block)

| Activity | Output | Giai đoạn |
|----------|--------|-----------|
| MCQ EN→VI | `EXERCISE_SET` | ✅ Đã có |
| MATCHING | `EXERCISE_SET` question type MATCHING | ✅ `generateMatchingFromVocabItems` + wizard |
| Flashcard | Block `VOCABULARY` presentation=flashcard | ✅ `VocabularyFlashcard.tsx` |

---

## Thứ tự implement đề xuất

```
1. BE: enum VOCABULARY + VocabularyBlockResolver + resolvedVocabularyJson   (~0.5 ngày)
2. FE shared: parseVocabularyPayload + types                                    (~0.25 ngày)
3. Admin: picker + block editor + preview                                       (~0.5 ngày)
4. Student: VocabularyBlock list MVP + StudyPanel                               (~0.5 ngày)
5. (Tuỳ chọn) Wizard gộp VOCABULARY + EXERCISE_SET                              (~0.25 ngày)
6. (Sau) Flashcard UI + MATCHING generator từ vocab                             (~1 ngày)
```

---

## Kiểm thử E2E

1. Admin: bộ từ 5 mục → lesson + khối VOCABULARY + khối EXERCISE_SET (wizard).
2. HS tab **Bài học**: thấy 5 từ.
3. HS tab **Bài tập**: làm MCQ 5 câu.
4. Admin sửa `meaning_vi` của `apple` → F5 HS thấy nghĩa mới ở cả 2 tab.

---

## Rủi ro / quyết định

| Chủ đề | Quyết định MVP |
|--------|----------------|
| Snapshot vs live | **Live resolve** (nhất quán QUESTION_REF) |
| Bộ từ < 4 từ | Generator MCQ cảnh báo; VOCABULARY list vẫn hiển thị |
| Lesson chỉ có vocab, không MCQ | Tab Bài tập ẩn (logic `lessonHasPracticeTab` sẵn có) |

# Question Bank — Kế hoạch Phase 3 (Bulk + AI Actions)

> Cập nhật: **2026-06-30**  
> Tiền đề: Phase 1–2 ✅ · AI-1/2/3 ✅  
> Tổng quan: [`QUESTION_BANK_PROGRESS.md`](./QUESTION_BANK_PROGRESS.md)

---

## Quyết định đã chốt (product)

| Chủ đề | Quyết định |
|--------|------------|
| **Rewrite khi có `QUESTION_REF`** | **C — Fork:** Duplicate câu → sửa bản copy → lesson mới trỏ bản mới; câu gốc + lesson cũ **không đổi** |
| **Bulk Publish/Archive/Delete** | **`POST /api/v1/questions/bulk`** (một request BE, transaction) |
| **Quota AI actions** | **Không tách** — dùng chung `daily-gen-task-limit` hiện tại |

---

## 1. Mục tiêu Phase 3

Biến Question Bank từ “thêm/sửa từng câu” sang **vận hành hàng loạt** và **AI chỉnh câu đã có**.

| Slice | Nội dung | Trạng thái |
|-------|----------|------------|
| **3a** | Checkbox + bulk Publish / Archive / Delete + `POST /questions/bulk` | ✅ |
| **3b** | Bulk Duplicate + Export JSON | ✅ |
| **3c** | AI Explain Answer (chỉ `explanation`, mặc định **tiếng Việt**) | ✅ |
| **3d** | AI Generate Similar → câu **mới** | ⏳ |
| **3e** | AI Rewrite / Simplify — luồng **Fork (C)** | ⏳ |
| **3f** | Bulk AI, audit mở rộng | ⏳ |

---

## 2. Giải thích nhanh từng AI action (cho GV)

### Generate Similar
- **Là gì:** Từ câu A → AI tạo câu B (mới), cùng chủ đề/độ khó, nội dung khác.
- **Khi dùng:** Muốn thêm biến thể mà không sửa câu đang dùng ở lesson.
- **An toàn:** ✅ Không đụng `QUESTION_REF` cũ.

### Rewrite / Simplify / Increase difficulty
- **Là gì:** Đổi stem/đáp án của câu hiện tại.
- **Rủi ro:** ⚠️ Nếu Apply trực tiếp → mọi lesson trỏ `questionId` đó đổi theo.
- **Cách làm (Fork C):**
  1. Hệ thống **Duplicate** câu gốc → `id` mới.
  2. AI sửa trên bản copy.
  3. GV **Apply** lên bản copy.
  4. Lesson mới chọn `QUESTION_REF` → id mới; lesson cũ giữ id cũ.

### Explain Answer
- **Là gì:** Chỉ sinh/điền `explanation`.
- **Khi dùng:** Câu thiếu giải thích cho HS.
- **Ghi chú:** Có thể Apply trực tiếp (ít rủi ro hơn Rewrite) hoặc Fork nếu muốn thống nhất.

---

## 3. Phase 3a — Bulk API + UI

### API

`POST /api/v1/questions/bulk`

```json
{
  "ids": ["uuid-1", "uuid-2"],
  "operation": "PUBLISH"
}
```

`operation`: `PUBLISH` | `ARCHIVE` | `DRAFT` | `DELETE`

Response:

```json
{
  "requested": 2,
  "affected": 2,
  "notFoundIds": []
}
```

- Tối đa **100** id/request.
- Transaction: cập nhật/xóa mềm tất cả câu **tìm thấy**; `notFoundIds` = id không tồn tại hoặc đã voided.

### FE

- Checkbox cột đầu table (chỉ **trang hiện tại**).
- Toolbar: Xuất bản / Lưu trữ / Xóa + confirm.
- Sau bulk → refresh list + stats + clear selection.

---

## 4. Phase 3e — Rewrite Fork (C) — flow chi tiết

```text
User: Rewrite câu abc-123 (đang QUESTION_REF ở 2 lesson)
  ↓
BE/FE: Duplicate → def-456 (copy đầy đủ choices/content)
  ↓
AI task trên def-456 (không gửi abc-123 vào prompt Apply)
  ↓
Preview diff → Apply → PUT def-456
  ↓
GV tự cập nhật lesson (hoặc phase sau: gợi ý "Thay ref lesson X bằng def-456")
```

Câu `abc-123` và 2 lesson cũ **không đổi**.

---

## 5. Quota (không tách)

- Mọi `AiTask` (gen đề, gen câu, Rewrite, Similar…) dùng chung `app.ai.daily-gen-task-limit`.
- Explain sync (nếu làm không qua task) **không** ăn quota.

---

## 8. Phase 3c — Explain Answer (VI)

### API

`POST /api/v1/questions/{id}/ai/explain` — sync, không tạo `AiTask`.

Response: `explanation`, `previousExplanation`, `explanationLang` (`vi`), `model`, `durationMs`.

- Hỗ trợ: `MULTIPLE_CHOICE`, `TRUE_FALSE`, `FILL_BLANK`.
- Prompt yêu cầu AI trả JSON `{"explanation":"..."}` bằng **tiếng Việt**.
- Model: `app.ai.question-explain-model` (fallback `app.ai.default-chat-model`).

### FE

- Nút **AI giải thích (VI)** trên Preview drawer + icon hàng trong table.
- `QuestionBankExplainDialog`: auto gọi API → preview cũ/mới → **Áp dụng** (`PUT` chỉ cập nhật `explanation` qua payload đầy đủ).

---

## 7. Phase 3b — Duplicate + Export

### Duplicate (`operation: DUPLICATE`)

- Copy đầy đủ: stem, choices, `contentJson`, metadata.
- Bản mới: `status=DRAFT`, `source=MANUAL`, `aiGenerated=false`.
- Title: thêm suffix ` (copy)`; tag `dup-from:{sourceId}` (dùng cho Fork Rewrite sau).
- Response: `createdIds[]` — id các câu mới.

### Export

`POST /api/v1/questions/export` `{ "ids": [...] }`

- Trả `questions[]` (full DTO + choices), `exportedAt`, `notFoundIds`.
- FE tải file `question-bank-export-YYYY-MM-DD.json`.

---

## 6. Acceptance Phase 3a

- [ ] Chọn ≥1 câu → Publish → status `PUBLISHED`, 1 request bulk.
- [ ] Archive / Delete bulk hoạt động; Delete có confirm.
- [ ] Id không tồn tại → `notFoundIds`, các id hợp lệ vẫn xử lý.
- [ ] Đổi trang/filter → selection clear.

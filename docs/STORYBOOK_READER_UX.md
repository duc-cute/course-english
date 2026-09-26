# Storybook Reader UX (kiểu A)

> Tham chiếu sản phẩm: [`promt3.md`](../promt3.md)  
> Plan Reading Studio: [`STORY_READING_STUDIO_PLAN.md`](./STORY_READING_STUDIO_PLAN.md)  
> **Cập nhật:** 2026-09-14

---

## Quyết định đã chốt

- **Layout:** Storybook học tiếng Anh — ảnh minh họa sạch, **không** speech bubble / chữ trong ảnh.
- **Đơn vị trang:** 1 scene = 1 trang (Prev / Next). Story 400–500 từ ≈ 4–6 trang.
- **Học tập giữ nguyên:** text dưới ảnh vẫn là HTML tokens → click từ điển, notebook, karaoke highlight.

---

## 1. Kích thước ảnh

| Hạng mục | Giá trị |
|----------|---------|
| Aspect ratio gen | **4:3** (landscape) |
| Resolve gen | **1024×768** |
| Format lưu | PNG (OpenRouter default) |
| Hiển thị FE | Full width cột đọc; `object-fit: cover` trong khung 4:3 |
| Max width cột | ~720–800px |
| Mobile | Full bleed ngang; cao theo 4:3 |

**Prompt rule bắt buộc khi gen:** no text, no letters, no speech bubbles, no captions, no watermark.

Cover story (`cover_image_url`) vẫn riêng — dùng list/card; **không** thay scene 1.

Character reference sheet: **1:1**, ~768×768 — nội bộ khi gen scene (admin có thể review).

---

## 2. Cấu trúc một trang (Student)

```text
┌──────────────────────────────────┐
│  Header: title · scene 2/5       │
├──────────────────────────────────┤
│     ILLUSTRATION (4:3, sạch)     │
├──────────────────────────────────┤
│  [Lời dẫn] đoạn văn thường       │
│  ┌ dialogue card ─────────────┐  │
│  │ Emma                        │  │
│  │ "Look at this red book!"    │  │
│  └─────────────────────────────┘  │
│  [Lời dẫn] tiếp tục…             │
├──────────────────────────────────┤
│  Audio player · ← Prev / Next →  │
└──────────────────────────────────┘
```

---

## 3. Lời dẫn (narration)

- Ngay dưới ảnh, typography reader hiện có.
- Không gắn tên nhân vật.
- Karaoke scoped theo scene (auto flip trang = phase sync sau).

---

## 4. Thoại (dialogue)

Không bubble trên ảnh. Mỗi lượt thoại = **dialogue card** (label speaker + text tokenized).

### Scene JSON contract

```json
{
  "sceneIndex": 1,
  "sentenceStart": 3,
  "sentenceEnd": 7,
  "imageUrl": "/storage/stories/{id}/scenes/1.png",
  "segments": [
    { "type": "narration", "text": "Emma walked into the bookstore." },
    { "type": "dialogue", "speaker": "Emma", "text": "Is anyone here?" },
    { "type": "narration", "text": "Nobody answered." }
  ]
}
```

`sentenceStart` / `sentenceEnd` neo `sentences[]` tokenizer. Fallback thiếu `segments`: hiện text scene như một khối narration.

---

## 5. Data model

| Cột / bảng | Mục đích |
|------------|----------|
| `stories.visual_profile_json` | artStyle, colorStyle, lighting, mood |
| `stories.characters_json` | profiles + `referenceImageUrl` |
| `stories.illustration_status` | `NONE` \| `ANALYZED` \| `GENERATING` \| `PARTIAL` \| `READY` \| `FAILED` |
| `story_scenes` | sceneIndex, sentence range, segments_json, image_url, image_prompt, status |

---

## 6. Pipeline gen

```text
Story text (tokenized)
  → Analyze scenes + characters + visual profile
  → Character sheet images (1:1)
  → Scene illustrations 4:3 (với input_references)
  → Link Scene ↔ Text ↔ Image (± Audio sync sau)
```

---

## 7. Admin tối thiểu

- Phân tích scenes
- Sinh illustrations (async)
- Regenerate từng scene
- Poll `illustration_status`

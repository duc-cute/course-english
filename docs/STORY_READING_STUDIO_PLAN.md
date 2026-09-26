# AI Reading Studio — Plan & Progress

> Tham chiếu sản phẩm: [`promt.md`](../promt.md)  
> **Canonical reader payload:** JSON `tokens[]` (AI chỉ sinh plain text; BE tokenize sau khi lưu)  
> **Tokenizer MVP:** `lower(trim) + strip edge punctuation` — exact surface form only  
> **Cập nhật:** 2026-07-02 — Báo cáo tiến độ Phase 1 + Phase 2 (MVP audio/karaoke)

---

## Báo cáo tiến độ (snapshot 2026-07-02)

### Tóm tắt nhanh

| Phase | Trạng thái | Ghi chú |
|-------|------------|---------|
| **1 — Reading Core** | ✅ **Code xong** | CRUD, AI gen, reader, notebook, cover, translations — chờ xác nhận E2E |
| **2 — Listen & Karaoke (MVP)** | ✅ **Code xong** | Python TTS + alignment + player + karaoke — chờ E2E ổn định |
| **2.1 — Voice catalog** | ✅ **Code xong** | `tts_voice_catalog`, profile UI, `voice_profile_json` |
| **2.2 — ElevenLabs** | ✅ **Code xong** | Provider Python + ElevenLabs-first, Edge fallback + log |
| **2.3 — Multi-speaker** | 📋 **Chưa làm** | AI `speech.lines[]`, sinh từng câu, ghép audio |
| **3 — AI Context** | 📋 Chưa làm | Text selection, Ask AI theo story |
| **4 — Review+** | 📋 Chưa làm | Notebook review modes, analytics, pronunciation |
| **5 — Storybook illustrations** | ✅ **Code xong (MVP)** | Scenes 4:3, character refs, dialogue cards — [`STORYBOOK_READER_UX.md`](./STORYBOOK_READER_UX.md) |

### Đánh giá: đã ổn chưa?

**Code:** Đủ để chạy luồng MVP end-to-end (Admin sinh story → sinh audio → Student nghe karaoke).

**Chưa chốt production** cho đến khi hoàn tất checklist E2E bên dưới:

- [ ] Chạy đủ migrations `032` → `036`
- [ ] Python `:8100` + Spring `SPEECH_PLATFORM_ENABLED=true` chạy ổn định
- [ ] Sinh audio ElevenLabs thành công (hoặc fallback Edge có log `[StoryAudio]`)
- [ ] Student play audio + highlight từ/câu khớp timeline
- [ ] Phase 1 reader + notebook smoke test

---

## Luồng hiện tại (đang chạy)

```mermaid
flowchart LR
  A[Admin: Story + voice profiles] --> B[BE tokenize tokens_json]
  B --> C[Admin: Sinh audio]
  C --> D[Spring StoryAudioService]
  D --> E[Python POST /api/v1/tts/generate]
  E --> F{ElevenLabs}
  F -->|OK| G[MP3 + timeline]
  F -->|Lỗi| H[Edge fallback]
  H --> G
  G --> I[story_audio + AUDIO_READY]
  I --> J[Student reader + karaoke]
```

**Chiến lược TTS hiện tại:**

1. Đọc `stories.voice_profile_json` → ưu tiên profile `NARRATOR` (map sang **Edge** theo `profile_key`)
2. **Chỉ dùng Edge TTS** (không gọi ElevenLabs)
3. Log prefix `[StoryAudio]` trên Spring Boot

**Giới hạn hiện tại:** Một giọng đọc **cả story** (narrator mode). Chưa sinh từng câu / nhiều nhân vật.

---

## Tổng quan phase

| Phase | Mục tiêu | Trạng thái |
|-------|----------|------------|
| **1 — Reading Core** | CRUD story, AI gen, tokenizer JSON, reader, dictionary popup, notebook | ✅ Code xong |
| **2 — Listen & Karaoke** | Python TTS, timeline, audio player, admin sinh audio | ✅ Code xong (MVP) |
| **2.1 — Voice catalog** | Bảng voices + chọn profile trên form story | ✅ Code xong |
| **2.2 — ElevenLabs** | Provider + fallback Edge | ✅ Code xong |
| **2.3 — Multi-speaker** | AI speech manifest, per-sentence TTS, concat | 📋 Kế hoạch |
| **3 — AI Context** | Text selection toolbar, Ask AI theo story | 📋 Chưa làm |
| **4 — Review+** | Notebook review modes, analytics, pronunciation | 📋 Chưa làm |

---

## Migrations (chạy theo thứ tự)

```bash
mysql -u root -p course_english < course_english_backend/migrations/032_stories.sql
mysql -u root -p course_english < course_english_backend/migrations/033_story_audio.sql
mysql -u root -p course_english < course_english_backend/migrations/034_story_cover_image.sql
mysql -u root -p course_english < course_english_backend/migrations/035_story_translations.sql
mysql -u root -p course_english < course_english_backend/migrations/036_tts_voice_catalog.sql
mysql -u root -p course_english < course_english_backend/migrations/052_story_illustrations.sql
```

| Migration | Nội dung |
|-----------|----------|
| `032_stories.sql` | `stories`, `student_notebook_entries` |
| `033_story_audio.sql` | `story_audio` (audio URL, timelines, cache hash) |
| `034_story_cover_image.sql` | `stories.cover_image_url` |
| `035_story_translations.sql` | `stories.translations_json` (song ngữ / glossary) |
| `036_tts_voice_catalog.sql` | `tts_voice_catalog`, `stories.voice_profile_json` |
| `052_story_illustrations.sql` | `story_scenes`, visual/characters JSON, illustration status |

---

## Phase 1 — Reading Core

### Outcomes

- GV tạo / AI sinh story (plain text), gắn optional `vocabularySetId`.
- BE tokenize → lưu `tokens_json`, trả `reader-payload` cho FE.
- HS đọc story: typography đẹp, click từ → popup từ điển, lưu notebook.
- **Bổ sung đã làm:** cover image AI/upload, translations/glossary, word enrich AI (popup).

### Data model — `stories` (mở rộng)

| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| `id` | CHAR(36) PK | UUID |
| `title` | VARCHAR(255) | |
| `slug` | VARCHAR(255) UNIQUE | URL student |
| `content` | TEXT | Plain text only |
| `level` | VARCHAR(16) | A1–C2 |
| `reading_time_minutes` | INT | Ước lượng |
| `prompt` | TEXT | Prompt AI (nếu có) |
| `cover_image_url` | VARCHAR(1024) | Migration 034 |
| `vocabulary_set_id` | CHAR(36) FK | Optional |
| `status` | VARCHAR(20) | `DRAFT` \| `PUBLISHED` \| `ARCHIVED` |
| `processing_status` | VARCHAR(32) | `PENDING` \| `TOKENIZED` \| `AUDIO_READY` |
| `tokens_json` | TEXT | JSON — canonical render |
| `translations_json` | TEXT | Migration 035 |
| `voice_profile_json` | TEXT | Migration 036 — map profile → voice |
| `is_ai_generated` | TINYINT(1) | |
| audit + `voided` | | |

#### `student_notebook_entries`

| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| `id` | CHAR(36) PK | |
| `student_id` | CHAR(36) | JWT user id |
| `word_id` | CHAR(36) FK | → `vocabulary_words` |
| `story_id` | CHAR(36) FK | → `stories` |
| `context_sentence` | TEXT | Câu chứa từ |
| `review_status` | VARCHAR(20) | `NEW` \| `REVIEWED` (phase 4) |
| audit + `voided` | | UNIQUE(`student_id`, `word_id`, `story_id`) |

### Token JSON contract

```json
{
  "tokens": [
    { "type": "text", "value": "Tom showed his " },
    {
      "type": "word",
      "text": "passport",
      "wordIndex": 5,
      "vocabularyId": "uuid-or-null",
      "isVocab": true
    },
    { "type": "text", "value": " before entering the gate." }
  ],
  "sentences": [
    {
      "sentenceIndex": 0,
      "startWordIndex": 0,
      "endWordIndex": 12,
      "text": "Tom showed his passport..."
    }
  ]
}
```

### API (Phase 1 + mở rộng)

| Method | Path | Mô tả |
|--------|------|--------|
| POST | `/api/v1/stories/search` | List (`publishedOnly` cho student) |
| GET | `/api/v1/stories/{id}` | Chi tiết admin |
| POST | `/api/v1/stories` | Tạo (+ auto tokenize) |
| PUT | `/api/v1/stories/{id}` | Sửa (+ re-tokenize nếu content/vocab đổi) |
| DELETE | `/api/v1/stories/{id}` | Xóa mềm |
| POST | `/api/v1/stories/ai-preview` | Sync preview AI story (plain text) |
| POST | `/api/v1/stories/ai-cover-preview` | AI sinh ảnh cover |
| GET | `/api/v1/stories/{id}/reader-payload` | Reader payload theo id |
| GET | `/api/v1/stories/slug/{slug}/reader-payload` | Reader payload theo slug |
| GET | `/api/v1/stories/lookup-word?word=` | Popup: vocab DB → dictionary |
| POST | `/api/v1/stories/lookup-word/enrich` | AI enrich nghĩa Việt (popup) |
| POST | `/api/v1/student/notebook` | Lưu từ notebook |
| POST | `/api/v1/student/notebook/search` | Danh sách notebook |
| DELETE | `/api/v1/student/notebook/{id}` | Xóa entry |

### Frontend routes (Phase 1)

| Route | Page |
|-------|------|
| `/admin/stories` | `ManageStoriesPage` — list + editor + AI + audio |
| `/student/stories` | `StudentStoryListPage` |
| `/student/stories/notebook` | `StudentNotebookPage` |
| `/student/stories/:storySlug` | `StoryReaderPage` — reader + player |

### Checklist Phase 1

#### Backend
- [x] Migration `032_stories.sql`
- [x] Migration `034_story_cover_image.sql`
- [x] Migration `035_story_translations.sql`
- [x] Entity `Story`, `StudentNotebookEntry`
- [x] `StoryTokenizerService` + `StoryWordKeyUtil`
- [x] `StoryService` CRUD + tokenize + reader payload
- [x] `AiStoryPreviewService` (sync OpenRouter)
- [x] `StoryCoverImageService`, `StoryTranslationMergeService`
- [x] `StoryWordAiEnrichService`
- [x] `StudentNotebookService` + controller
- [x] `StoryController`
- [x] Unit test tokenizer + word key util
- [ ] Manual test E2E Phase 1

#### Frontend
- [x] `shared/api/story.ts`, `notebook.ts`
- [x] Admin `ManageStoriesPage` + `StoryAiGenDialog`
- [x] Student list + `StoryReaderPage` + `StoryWordPopup` + notebook save
- [x] `StudentNotebookPage`
- [x] Routes + admin/student nav
- [x] `styles/student/story-reader.css`, `admin-manage-stories.css`

#### Acceptance Criteria Phase 1
- [ ] Chạy migrations `032`, `034`, `035`
- [ ] GV tạo story thủ công → publish → HS thấy trong list
- [ ] Từ trong vocab set highlight khi đọc
- [ ] Click từ → popup nghĩa + IPA (nếu có)
- [ ] Save notebook → hiện trong `/student/stories/notebook`
- [ ] AI preview sinh plain text, không HTML

---

## Phase 2 — Listen & Karaoke (MVP)

### Outcomes

- Python microservice `reading_text/` — `POST /api/v1/tts/generate`
- Providers: **Edge TTS** + **ElevenLabs** + **faster-whisper** alignment
- BE `StoryAudioService` async → cache theo `content_hash`
- FE `StoryAudioPlayer` + karaoke highlight từ/câu + auto-scroll
- Admin: nút **Sinh audio**, poll status, nghe thử

### Python service (`reading_text/`)

| Endpoint | Mô tả |
|----------|--------|
| `GET /health` | Health + providers đã register |
| `POST /api/v1/tts/generate` | TTS + alignment + upload → `SpeechResult` |
| `GET /api/v1/tts/voices` | List voices (edge / elevenlabs) |

**Storage:** `STORAGE_LOCAL_ROOT=C:/DucNguyen/course-english-storage`  
**Public URL:** `http://localhost:8100/files/tts/{uuid}.mp3`

### Spring integration

```
StoryController → StoryAudioService → SpeechGenerationService
  → SpeechPlatformAdapter → SpeechPlatformClient → Python :8100
```

| API | Mô tả |
|-----|--------|
| `POST /api/v1/stories/{id}/generate-audio` | Queue async sinh audio |
| `GET /api/v1/stories/{id}/audio` | Trạng thái + `audioUrl` |
| `GET /api/v1/stories/voice-catalog` | Danh sách voice cho admin form |

**Config BE:** `SPEECH_PLATFORM_ENABLED=true`, `SPEECH_PLATFORM_BASE_URL=http://localhost:8100`

### Voice profile JSON (Phase 2.1)

Lưu trên `stories.voice_profile_json`:

```json
{
  "NARRATOR": { "provider": "elevenlabs", "voiceId": "dHd5gvgSOzSfduK4CvEg" },
  "MALE_ADULT": { "provider": "elevenlabs", "voiceId": "IRHApOXLvnW57QJPQH2P" },
  "FEMALE_ADULT": { "provider": "elevenlabs", "voiceId": "tnVKC6NjwhdRxoQIfKue" }
}
```

Catalog seed trong `036_tts_voice_catalog.sql` (Edge + ElevenLabs: Adam, Ed, Lyan, Lauren, Cherry Twinkle, …).

**Profile keys:** `NARRATOR`, `MALE_ADULT`, `FEMALE_ADULT`, `BOY_CHILD`, `GIRL_CHILD`

> Hiện tại sinh audio chỉ dùng **một giọng narrator** cho cả story. Các profile khác chuẩn bị cho Phase 2.3 multi-speaker.

### Checklist Phase 2 (MVP)

#### Python (`reading_text/`)
- [x] FastAPI skeleton + config + storage local
- [x] Edge TTS provider
- [x] ElevenLabs TTS provider
- [x] faster-whisper alignment + word/sentence timeline
- [x] `POST /api/v1/tts/generate`
- [x] pytest (14 tests khi last run)
- [ ] Manual test ElevenLabs với API key thật

#### Backend
- [x] Migration `033_story_audio.sql`
- [x] Migration `036_tts_voice_catalog.sql`
- [x] `integration/speech/` port-adapter pattern
- [x] `StoryAudioService` + async worker
- [x] `StorySpeechRequestAssembler` (voice profile + ElevenLabs-first)
- [x] `StoryVoiceCatalogService` + API voice-catalog
- [x] Reader payload attach `audioUrl`, timelines
- [x] Log `[StoryAudio]` + Edge fallback
- [ ] Manual E2E: Admin sinh audio → HS karaoke

#### Frontend
- [x] `apiGenerateStoryAudio`, `apiGetStoryAudioStatus`
- [x] Admin: Sinh audio + poll + nghe thử
- [x] Admin: Voice casting profiles (5 dropdown)
- [x] `StoryAudioPlayer.tsx`
- [x] `storyKaraoke.ts` — map `currentTime` → word/sentence index
- [x] `StoryReaderContent` highlight + auto-scroll
- [x] `story-reader.css` player + active word styles

#### Acceptance Criteria Phase 2
- [ ] Chạy migrations `033`, `036`
- [ ] Python `:8100` + BE enabled
- [ ] Admin chọn Narrator = Ed → Sinh audio → `AUDIO_READY`
- [ ] `story_audio.tts_provider` = `elevenlabs` (hoặc `edge` nếu fallback)
- [ ] Student play → karaoke highlight khớp
- [ ] Đổi content hoặc voice → invalidate cache, sinh lại

---

## Phase 2.3 — Multi-speaker (kế hoạch tiếp theo)

**Chưa implement.** Thiết kế đã chốt hướng:

| Thành phần | Mô tả |
|------------|--------|
| `speech_mode` | `NARRATOR` \| `DIALOGUE` \| `MIXED` \| `AUTO` |
| `speech_manifest_json` | AI trả `speakers[]` + `lines[]` (ai nói câu nào) |
| BE validator | Map `lines` ↔ `sentences` từ tokenizer |
| Python | TTS per-sentence + concat MP3 + merge timeline offset |
| Admin Cast Review | Duyệt cast trước khi sinh audio |

---

## Phase 3 — AI Context

- Text selection floating toolbar (Translate, Explain, Grammar, Save note)
- Ask AI scoped to `story.content` + selected excerpt
- Tái dùng `AiChatService` với `contextType=STORY`

---

## Phase 4 — Review & Future

- Notebook → flashcard / MCQ
- Reading analytics, daily story, recommendations
- Whisper shadowing, pronunciation scoring

---

## Phase 6 — Truyện tự sự (MONOLOGUE)

Thể loại truyện truyền cảm hứng / bài học ngắn: **một giọng kể** nói với người đọc, không hội thoại nhân vật. Admin bấm **một nút** — không cần viết prompt, không cần bộ từ vựng.

### Khái niệm — 2 trục độc lập

| Trục | Cột | Giá trị | Quyết định |
|------|-----|---------|------------|
| Thể loại | `stories.story_format` | `STORYBOOK` (Truyện tranh) \| `MONOLOGUE` (Tự sự) | Cấu trúc nội dung, prompt scene, layout reader, audio 1 hay nhiều giọng |
| Phong cách ảnh | `stories.visual_style` | `PASTEL_STORYBOOK` \| `INK_SKETCH` | Chuỗi style cố định ghép vào prompt ảnh |

| | STORYBOOK | MONOLOGUE |
|---|---|---|
| Ngôi kể | Ngôi 3 + thoại | Ngôi 1/2 ("We…", "You…") |
| Nhân vật | Nhiều, có tên | 0–1 hình tượng vô danh |
| Cấu trúc | Mở → diễn biến → kết | Câu chuyện nhỏ (~60%) → lời nhắn 5 nhịp (~40%) |
| Ảnh | Scene minh hoạ sát chữ | Ẩn dụ (mưa → nắng…), 5–6 ảnh |
| Audio | Multi-speaker (Phase 2.3) | Luôn NARRATOR |

Mặc định: `MONOLOGUE` → `INK_SKETCH`, `STORYBOOK` → `PASTEL_STORYBOOK` (admin đổi được). Story cũ = `STORYBOOK` + `PASTEL_STORYBOOK`.

**Lời nhắn 5 nhịp:** Chạm nỗi đau → Bước ngoặt ("But…") → Trấn an → Hành động nhỏ → Thông điệp chốt.

### Danh mục chủ đề (BE constant, admin chọn hoặc Ngẫu nhiên)

| Key | Tên |
|-----|-----|
| `CONFIDENCE` | Lấy lại sự tự tin |
| `STUDY_PERSEVERANCE` | Học tập & kiên trì |
| `SELF_CARE` | Tự chăm sóc bản thân |
| `GRATITUDE_FAMILY` | Biết ơn & gia đình |
| `FRIENDSHIP_KINDNESS` | Tình bạn & tử tế |
| `PARABLE` | Ngụ ngôn bài học |

Mỗi nhóm có nhiều "góc khai thác"; BE random 1 góc + gửi tiêu đề MONOLOGUE gần đây để tránh trùng.

### Level & độ dài

| Level | Câu | Tốc độ đọc ước lượng |
|-------|-----|----------------------|
| A1 | 3–6 từ, hiện tại đơn | 70 wpm |
| A2 | 5–9 từ, + quá khứ đơn, but/because | 90 wpm |
| B1 | 8–14 từ, mệnh đề phụ, collocation | 110 wpm |
| B2+ | Linh hoạt, idiom | 130 wpm |

Thời lượng 2 / 3 / 5 phút — **mặc định 3 phút, A2**. Glossary 8–15 từ đáng học (vẫn highlight + notebook).

### Luồng

1. Admin: **✨ Truyện truyền cảm hứng** → chọn chủ đề / level / thời lượng (đều có mặc định) → Sinh → xem trước → Sinh lại / Dùng truyện này.
2. Form điền sẵn `storyFormat=MONOLOGUE`, `visualStyle=INK_SKETCH` → Lưu (tokenize như cũ).
3. **Sinh ảnh**: analyzer rẽ nhánh theo `story_format`; style lấy từ `visual_style`.
4. **Sinh audio**: như cũ (narrator).

### API

| Method | Path | Mô tả |
|--------|------|-------|
| GET | `/api/v1/stories/monologue-themes` | Danh mục chủ đề |
| POST | `/api/v1/stories/ai-monologue-preview` | `{ themeGroup?, level?, readingTimeMinutes? }` → preview như `ai-preview` + `titleVi`, `storyFormat`, `visualStyle`, `prompt` |

### Checklist Phase 6

- [x] Migration `055_story_format_visual_style.sql` — **chạy trước khi start BE**
- [x] `StoryFormatEnum`, `StoryVisualStyleEnum`; `Story`, `ReqStoryDTO`, `ResStoryDTO`, reader payload (`storyFormat`, `visualStyle`, `titleVi`)
- [x] `MonologueThemeCatalog` + API themes
- [x] `AiMonologueStoryService` + API preview (`titleVi` lưu trong `translations_json`)
- [x] Scene analyzer rẽ nhánh MONOLOGUE + style cố định theo `visual_style`; fix rollback khi AI lỗi
- [x] FE: `StoryMonologueGenDialog` + nút trên `ManageStoriesPage` + 2 select trên form
- [ ] Manual test: sinh A1/A2/B1 × 2/3/5 phút — soát số từ, sentence count khớp, ảnh INK_SKETCH

### Glossary IPA + audio — chạy nền (thay tra từ điển đồng bộ khi Lưu)

Trước: `tokenizeAndSave` gọi Free Dictionary **tuần tự từng từ** trong request Lưu → chậm, timeout/429.

| Bước | Nguồn | Ghi chú |
|------|-------|---------|
| 1 | **AI** trả `ipa`, `partOfSpeech` trong `glossary[]` (cả 2 prompt) | 0 lần gọi thêm; `normalizeIpa` bỏ `/…/` |
| 2 | `word_pronunciation_cache` (migration `056`) | 1 word_key = 1 lần sinh, dùng chung mọi story |
| 3 | Edge TTS qua `reading_text` `/tts/generate` với `alignmentProvider=none` | audio từ, không chạy faster-whisper |
| fallback | Free Dictionary chỉ khi AI không trả IPA | vẫn chạy nền |

- `StoryGlossaryEnrichWorker.enqueueAfterCommit(storyId)` — gọi sau `tokenizeAndSave` (create/update), job chạy **sau commit** trên `speechTaskExecutor`.
- `StoryGlossaryEnrichService.enrichStory` cập nhật `translations_json.glossary[]` (`phonetic`, `audioUsUrl`, `audioUkUrl`, `partOfSpeech`). Reader payload đọc lại từ đó → không đổi FE.
- `lookup-word` (popup từ ngoài glossary): tra cache trước, rồi mới từ điển.
- Log: `[StoryGlossary] Done storyId=… cacheHits= dictCalls= ttsCalls= failed= durationMs=`

- [x] Migration `056_word_pronunciation_cache.sql` — **chạy trước khi start BE**
- [x] Prompt AI thêm `ipa`/`partOfSpeech`; `parseFromAi` đọc
- [x] `WordPronunciationCache` + repo; `StoryGlossaryEnrichService` + worker; bỏ enrich đồng bộ
- [ ] Manual: Lưu story → response ngay; vài giây sau reader có IPA/audio; lưu story 2 cùng từ → `cacheHits`
- [x] Reader layout MONOLOGUE cho học sinh — `student/stories/MonologueReader.tsx`: ảnh scene sticky trên (tự đổi theo câu đang đọc), mỗi câu 1 dòng EN (Lexend) + VI, câu active thẻ xanh, từ active viền đậm; `StoryReaderPage` rẽ nhánh theo `storyFormat`, ẩn toggle Storybook/Classic, bật bản dịch mặc định, hiện `titleVi`

---

## Quyết định kỹ thuật (đã chốt)

| Chủ đề | Quyết định |
|--------|------------|
| Reader format | JSON `tokens[]` canonical; không HTML từ AI |
| Tokenizer | Exact `lower(trim) + strip edge punctuation` only |
| Story vs Lesson | Module riêng `/student/stories` |
| TTS | Python microservice; BE master `wordIndex` |
| TTS strategy | **Edge TTS only** (no ElevenLabs for story audio) |
| Voice catalog | DB `tts_voice_catalog`; AI không chọn `voice_id` |
| Voice profile | JSON `{ provider, voiceId }` per profile key |
| Audio storage | `C:/DucNguyen/course-english-storage` (local) |
| Unknown word | vocab DB → dictionary → AI enrich (popup) |
| Multi-speaker | Phase 2.3 — chưa làm |

---

## File map

### Backend — Phase 1

| File | Vai trò |
|------|---------|
| `migrations/032_stories.sql` | Schema stories + notebook |
| `migrations/034_story_cover_image.sql` | Cover URL |
| `migrations/035_story_translations.sql` | Translations JSON |
| `domain/Story.java`, `StudentNotebookEntry.java` | Entities |
| `service/story/StoryTokenizerService.java` | Tokenize + vocab match |
| `service/story/AiStoryPreviewService.java` | AI gen preview |
| `service/impl/StoryServiceImpl.java` | CRUD + reader payload |

### Backend — Phase 2

| File | Vai trò |
|------|---------|
| `migrations/033_story_audio.sql` | `story_audio` |
| `migrations/036_tts_voice_catalog.sql` | Voice catalog + `voice_profile_json` |
| `integration/speech/` | Port-adapter → Python |
| `service/impl/StoryAudioServiceImpl.java` | Async gen + cache + fallback log |
| `service/story/StorySpeechRequestAssembler.java` | Voice resolve + request build |
| `service/story/StoryVoiceCatalogServiceImpl.java` | API voice catalog |
| `domain/TtsVoiceCatalog.java` | Entity catalog |

### Python — `reading_text/`

| File | Vai trò |
|------|---------|
| `app/main.py` | FastAPI app |
| `app/api/tts.py` | TTS endpoints |
| `app/providers/edge/edge_provider.py` | Edge TTS |
| `app/providers/elevenlabs/elevenlabs_provider.py` | ElevenLabs TTS |
| `app/providers/faster_whisper/alignment_provider.py` | Word/sentence timeline |
| `app/services/speech_service.py` | Orchestrate TTS → align → storage |

### Frontend

| File | Vai trò |
|------|---------|
| `pages/admin/ManageStoriesPage.tsx` | Admin CRUD + audio + voice profiles |
| `admin/components/story/StoryAiGenDialog.tsx` | AI preview |
| `student/stories/StoryReaderPage.tsx` | Reader + player |
| `student/stories/StoryReaderContent.tsx` | Render tokens + karaoke |
| `student/stories/StoryAudioPlayer.tsx` | Audio controls |
| `student/stories/storyKaraoke.ts` | Timeline → active index |
| `student/stories/StoryWordPopup.tsx` | Dictionary popup |
| `shared/api/story.ts` | Story + audio + voice API |

---

## Hướng dẫn test nhanh (E2E)

1. Chạy migrations `032`–`036`
2. Start Python: `reading_text/` → port `8100`
3. Start Spring Boot với `SPEECH_PLATFORM_ENABLED=true`
4. Start FE
5. Admin: tạo story → chọn voice profiles → **Lưu** → **Sinh audio**
6. Đợi `AUDIO_READY` (hoặc xem log `[StoryAudio]`)
7. Student: mở story → Play → kiểm tra highlight từ/câu

**Log cần xem (Spring):**

```
[StoryAudio] Start generation storyId=... primaryProvider=elevenlabs ...
[StoryAudio] Primary provider succeeded ...   (hoặc fallback to edge)
[StoryAudio] Ready storyId=... provider=... voice=... duration=...
```

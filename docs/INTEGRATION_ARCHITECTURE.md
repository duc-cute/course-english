# External API Integrations (Backend)

> Cập nhật: **2026-06-08**  
> Mọi tích hợp API bên thứ ba đặt dưới `com.courseenglish.api.integration.*` — tách khỏi domain/service nội bộ.

---

## Cấu trúc thư mục

```text
src/main/java/com/courseenglish/api/integration/
├── common/                          # Dùng chung mọi provider
│   ├── ExternalApiException.java
│   └── IntegrationRestClientConfig.java
├── dictionary/                      # Enrich từ vựng (IPA, audio)
│   ├── DictionaryIntegrationConfig.java
│   ├── model/
│   │   └── VocabularyEnrichmentData.java   ← DTO chuẩn hoá nội bộ
│   ├── port/
│   │   └── DictionaryLookupPort.java       ← Interface đổi provider
│   ├── service/
│   │   └── DictionaryLookupService.java    ← Facade cho VocabularyWordService
│   └── freedictionary/              ← Provider 1: dictionaryapi.dev
│       ├── FreeDictionaryProperties.java
│       ├── FreeDictionaryClient.java       ← HTTP + raw JSON
│       ├── FreeDictionaryMapper.java       ← JSON → VocabularyEnrichmentData
│       ├── FreeDictionaryLookupAdapter.java
│       ├── NoOpDictionaryLookupAdapter.java
│       └── dto/                            ← Khớp response API (xem data.md)
├── tts/                             ← (tương lai) Text-to-speech
└── ai/                              ← (tương lai) AI exercises / pronunciation
```

### Quy ước thêm provider mới

1. Tạo package `integration/<domain>/<provider>/`
2. DTO riêng cho JSON response của provider đó
3. Implement port interface (`DictionaryLookupPort`, …)
4. Map sang **model nội bộ** — domain/service không import DTO provider
5. Bật/tắt bằng `@ConditionalOnProperty` + `application.properties`

---

## Dictionary — Free Dictionary API

- **Endpoint:** `GET https://api.dictionaryapi.dev/api/v2/entries/en/{word}`
- **Sample:** [`data.md`](../data.md) · live: [apple](https://api.dictionaryapi.dev/api/v2/entries/en/apple)
- **Response:** JSON **array** — phần tử đầu dùng cho enrich

### Map sang `VocabularyEnrichmentData`

| API field | Field nội bộ | Ghi chú |
|-----------|--------------|---------|
| `phonetic` hoặc `phonetics[].text` | `phonetic` | IPA |
| `phonetics[].audio` chứa `-uk.mp3` | `audioUkUrl` | |
| `phonetics[].audio` chứa `-us.mp3` | `audioUsUrl` | |
| `meanings[].partOfSpeech` | `partOfSpeech` | Ưu tiên `noun` |
| — | `enrichSource` | `freedictionaryapi.dev` |

GV vẫn tự nhập `meaning_vi` — API không cung cấp nghĩa tiếng Việt.

---

## Cấu hình

```properties
integration.dictionary.free-dictionary.enabled=true
integration.dictionary.free-dictionary.base-url=https://api.dictionaryapi.dev
integration.dictionary.free-dictionary.connect-timeout-ms=3000
integration.dictionary.free-dictionary.read-timeout-ms=8000
```

Env override: `DICTIONARY_API_ENABLED`, `DICTIONARY_API_BASE_URL`, …

---

## Luồng (Phase 3+)

```text
VocabularyWordService.enrich(word)
  → DictionaryLookupService.lookup(wordEn)
    → DictionaryLookupPort (FreeDictionaryLookupAdapter)
      → FreeDictionaryClient.fetchEntries()
      → FreeDictionaryMapper.mapFirstEntry()
  → lưu vocabulary_words.phonetic, audio_*_url, enriched_at
```

---

## Test

- `FreeDictionaryMapperTest` — fixture `src/test/resources/integration/freedictionary-apple-sample.json` (từ `data.md`)

---

## Liên quan

- Tiến độ: [`VOCABULARY_LIBRARY_DICTIONARY_PROGRESS.md`](./VOCABULARY_LIBRARY_DICTIONARY_PROGRESS.md)
- Kiến trúc sản phẩm: [`promt.md`](../promt.md)

import api from "./axios";
import type { ApiResponse } from "./types";

export type StoryStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type StoryProcessingStatus = "PENDING" | "TOKENIZED" | "AUDIO_READY";

export type StoryToken = {
  type: "text" | "word";
  value?: string;
  text?: string;
  wordIndex?: number;
  vocabularyId?: string;
  isVocab?: boolean;
};

export type StorySentence = {
  sentenceIndex: number;
  startWordIndex: number;
  endWordIndex: number;
  text: string;
  textVi?: string;
};

export type StoryGlossaryEntry = {
  wordKey: string;
  wordEn?: string;
  meaningVi?: string;
  partOfSpeech?: string;
  phonetic?: string;
  audioUkUrl?: string;
  audioUsUrl?: string;
  imageUrl?: string;
  vocabularyId?: string;
  meaningSource?: "story" | "db" | "ai";
};

export type StoryWordTimelineItem = {
  wordIndex: number;
  word: string;
  start: number;
  end: number;
  charStart?: number;
  charEnd?: number;
};

export type StorySentenceTimelineItem = {
  sentenceIndex: number;
  start: number;
  end: number;
};

export type StoryRecord = {
  id: string;
  title: string;
  slug: string;
  content?: string;
  coverImageUrl?: string;
  level?: string;
  readingTimeMinutes?: number;
  prompt?: string;
  vocabularySetId?: string;
  vocabularySetTitle?: string;
  status: StoryStatus;
  processingStatus?: StoryProcessingStatus;
  aiGenerated?: boolean;
  voiceProfileJson?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
};

export type StoryReaderPayload = {
  id: string;
  title: string;
  slug: string;
  level?: string;
  readingTimeMinutes?: number;
  vocabularySetId?: string;
  processingStatus?: StoryProcessingStatus;
  tokens: StoryToken[];
  sentences: StorySentence[];
  audioUrl?: string;
  voice?: string;
  duration?: number;
  wordTimeline?: StoryWordTimelineItem[];
  sentenceTimeline?: StorySentenceTimelineItem[];
  glossary?: StoryGlossaryEntry[];
};

export type StoryAudioStatus = {
  storyId: string;
  processingStatus: StoryProcessingStatus;
  voice?: string;
  audioUrl?: string;
  duration?: number;
  cached?: boolean;
  message?: string;
};

export type StoryWordLookup = {
  wordEn: string;
  wordKey: string;
  vocabularyId?: string;
  meaningVi?: string;
  phonetic?: string;
  audioUkUrl?: string;
  audioUsUrl?: string;
  partOfSpeech?: string;
  exampleSentence?: string;
  inDatabase: boolean;
  imageUrl?: string;
  meaningSource?: "db" | "dictionary" | "story" | "ai" | "none";
};

export type StoryWordEnrichPayload = {
  word: string;
  contextSentence?: string;
  level?: string;
  partOfSpeech?: string;
};

export type StoryWordEnrichResult = {
  wordEn: string;
  wordKey: string;
  meaningVi: string;
  meaningSource?: "db" | "dictionary" | "ai";
  confidence?: number;
  enrichModel?: string;
  cached?: boolean;
};

export type StoryFormPayload = {
  title: string;
  content: string;
  coverImageUrl?: string;
  level?: string;
  readingTimeMinutes?: number;
  prompt?: string;
  vocabularySetId?: string;
  status?: StoryStatus;
  aiGenerated?: boolean;
  translationsJson?: string;
  voiceProfileJson?: string;
};

export type TtsVoiceCatalogItem = {
  id: string;
  provider: string;
  voiceId: string;
  displayName: string;
  profileKey?: string;
  gender?: string;
  ageGroup?: string;
  priority?: number;
};

export type StoryAiPreviewPayload = {
  prompt: string;
  level?: string;
  readingTimeMinutes?: number;
  vocabularySetId?: string;
};

export type StoryAiPreviewResult = {
  title: string;
  content: string;
  level?: string;
  readingTimeMinutes?: number;
  translationsJson?: string;
};

export type StoryCoverPreviewPayload = {
  title: string;
  content: string;
  level?: string;
  /** Original AI creative prompt (optional extra context). */
  prompt?: string;
};

export type StoryCoverPreviewResult = {
  coverImageUrl: string;
  coverImagePrompt?: string;
};

export type StoriesPaginationResult = {
  result?: StoryRecord[];
  meta?: {
    page?: number;
    pageSize?: number;
    pages?: number;
    total?: number;
  };
};

function unwrapPagination<T>(response: unknown): { result?: T[]; meta?: StoriesPaginationResult["meta"] } {
  // Axios interceptor returns response.data (usually ApiResponse<T>)
  const r = response as {
    result?: { result?: T[]; meta?: StoriesPaginationResult["meta"] } | T[];
    data?: { result?: { result?: T[]; meta?: StoriesPaginationResult["meta"] } | T[]; meta?: StoriesPaginationResult["meta"] };
    meta?: StoriesPaginationResult["meta"];
  };

  const data = r?.data;
  const rootPayload = data?.result ?? r?.result ?? undefined;

  // Case A: ApiResponse<StoriesPaginationResult> where data.result is { result, meta }
  if (rootPayload && typeof rootPayload === "object" && !Array.isArray(rootPayload)) {
    const obj = rootPayload as { result?: T[]; meta?: StoriesPaginationResult["meta"] };
    return {
      result: Array.isArray(obj.result) ? obj.result : [],
      meta: obj.meta ?? data?.meta ?? r?.meta,
    };
  }

  // Case B: ApiResponse<T[]> where data.result is array
  if (Array.isArray(rootPayload)) {
    return { result: rootPayload, meta: data?.meta ?? r?.meta };
  }

  return { result: [], meta: data?.meta ?? r?.meta };
}

export async function apiSearchStories(body?: {
  keyword?: string;
  status?: string;
  level?: string;
  publishedOnly?: boolean;
  page?: number;
  size?: number;
}) {
  const response = (await api.post("/stories/search", body ?? {})) as unknown;
  const { result, meta } = unwrapPagination<StoryRecord>(response);
  return { result, meta } satisfies StoriesPaginationResult;
}

export async function apiGetStoryById(id: string) {
  return api.get(`/stories/${id}`) as Promise<ApiResponse<StoryRecord>>;
}

export async function apiGetStoryReaderPayloadBySlug(slug: string) {
  return api.get(`/stories/slug/${encodeURIComponent(slug)}/reader-payload`) as Promise<
    ApiResponse<StoryReaderPayload>
  >;
}

export async function apiLookupStoryWord(word: string) {
  return api.get("/stories/lookup-word", { params: { word } }) as Promise<ApiResponse<StoryWordLookup>>;
}

export async function apiEnrichStoryWord(payload: StoryWordEnrichPayload) {
  return api.post("/stories/lookup-word/enrich", payload) as Promise<ApiResponse<StoryWordEnrichResult>>;
}

export async function apiCreateStory(payload: StoryFormPayload) {
  return api.post("/stories", payload) as Promise<ApiResponse<StoryRecord>>;
}

export async function apiUpdateStory(id: string, payload: StoryFormPayload) {
  return api.put(`/stories/${id}`, payload) as Promise<ApiResponse<StoryRecord>>;
}

export async function apiDeleteStory(id: string) {
  return api.delete(`/stories/${id}`);
}

export async function apiPreviewStoryAi(payload: StoryAiPreviewPayload) {
  return api.post("/stories/ai-preview", payload) as Promise<ApiResponse<StoryAiPreviewResult>>;
}

export async function apiPreviewStoryCoverAi(payload: StoryCoverPreviewPayload) {
  return api.post("/stories/ai-cover-preview", payload) as Promise<ApiResponse<StoryCoverPreviewResult>>;
}

export async function apiGenerateStoryAudio(storyId: string) {
  return api.post(`/stories/${storyId}/generate-audio`) as Promise<ApiResponse<StoryAudioStatus>>;
}

export async function apiGetStoryAudioStatus(storyId: string) {
  return api.get(`/stories/${storyId}/audio`) as Promise<ApiResponse<StoryAudioStatus>>;
}

export async function apiGetStoryVoiceCatalog(profileKey?: string) {
  return api.get("/stories/voice-catalog", {
    params: profileKey ? { profileKey } : undefined,
  }) as Promise<ApiResponse<TtsVoiceCatalogItem[]>>;
}

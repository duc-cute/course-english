import api from "./axios";
import type { ApiResponse } from "./types";

export type NotebookEntryRecord = {
  id: string;
  wordId: string;
  wordEn?: string;
  meaningVi?: string;
  phonetic?: string;
  audioUkUrl?: string;
  audioUsUrl?: string;
  partOfSpeech?: string;
  storyId: string;
  storyTitle?: string;
  storySlug?: string;
  contextSentence?: string;
  reviewStatus?: string;
  createdAt?: string;
};

export type NotebookPaginationResult = {
  result?: NotebookEntryRecord[];
  meta?: {
    page?: number;
    pageSize?: number;
    pages?: number;
    total?: number;
  };
};

export async function apiSearchNotebook(body?: { storyId?: string; page?: number; size?: number }) {
  return api.post("/student/notebook/search", body ?? {}) as Promise<NotebookPaginationResult>;
}

export async function apiSaveNotebookEntry(payload: {
  wordId: string;
  storyId: string;
  contextSentence?: string;
}) {
  return api.post("/student/notebook", payload) as Promise<ApiResponse<NotebookEntryRecord>>;
}

export async function apiDeleteNotebookEntry(id: string) {
  return api.delete(`/student/notebook/${id}`);
}

import api from "./axios";
import type { ApiResponse } from "./types";

export type VocabularyJourneyStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type VocabularyTopicStatus = "DRAFT" | "PUBLISHED";

export type VocabularyJourneyClassroomRecord = {
  id: string;
  classroomId: string;
  classroomName?: string;
};

export type VocabularyTopicMemberRecord = {
  id?: string;
  vocabularySetId: string;
  vocabularySetTitle?: string;
  coverImageUrl?: string;
  description?: string;
  status?: string;
  subjectName?: string;
  itemCount?: number;
  displayOrder?: number;
};

export type VocabularyTopicRecord = {
  id: string;
  journeyId: string;
  journeyTitle?: string;
  slug?: string;
  title: string;
  subtitle?: string;
  coverImageUrl?: string;
  themeColor?: string;
  displayOrder?: number;
  status: VocabularyTopicStatus | string;
  setCount?: number;
  members?: VocabularyTopicMemberRecord[];
  createdAt?: string;
  updatedAt?: string;
};

export type VocabularyJourneyRecord = {
  id: string;
  title: string;
  description?: string;
  coverImageUrl?: string;
  status: VocabularyJourneyStatus | string;
  displayOrder?: number;
  topicCount?: number;
  classroomCount?: number;
  classrooms?: VocabularyJourneyClassroomRecord[];
  topics?: VocabularyTopicRecord[];
  createdAt?: string;
  updatedAt?: string;
};

export type VocabularyJourneyFormPayload = {
  title: string;
  description?: string;
  coverImageUrl?: string;
  status?: VocabularyJourneyStatus;
  displayOrder?: number;
};

export type VocabularyTopicFormPayload = {
  journeyId: string;
  title: string;
  slug?: string;
  subtitle?: string;
  coverImageUrl?: string;
  themeColor?: string;
  status?: VocabularyTopicStatus;
  displayOrder?: number;
};

function unwrapResponse<T>(response: ApiResponse<T>): ApiResponse<T> {
  const statusCode = response?.statusCode;
  if (typeof statusCode === "number" && statusCode >= 400) {
    throw new Error(response?.message || "API request failed");
  }
  if (response?.success === false) {
    throw new Error(response?.message || "API request failed");
  }
  return response;
}

function unwrapData<T>(response: ApiResponse<T>): T {
  return unwrapResponse(response).data as T;
}

export async function apiSearchVocabularyJourneys(payload?: Record<string, unknown>) {
  const response = (await api.post(
    "/vocabulary-journeys/search",
    payload ?? {},
  )) as ApiResponse<{ result?: VocabularyJourneyRecord[]; meta?: unknown }>;
  return unwrapResponse(response);
}

export async function apiGetVocabularyJourney(id: string) {
  const response = (await api.get(
    `/vocabulary-journeys/${id}`,
  )) as ApiResponse<VocabularyJourneyRecord>;
  return unwrapData(response);
}

export async function apiCreateVocabularyJourney(data: VocabularyJourneyFormPayload) {
  const response = (await api.post(
    "/vocabulary-journeys",
    data,
  )) as ApiResponse<VocabularyJourneyRecord>;
  return unwrapData(response);
}

export async function apiUpdateVocabularyJourney(id: string, data: VocabularyJourneyFormPayload) {
  const response = (await api.put(
    `/vocabulary-journeys/${id}`,
    data,
  )) as ApiResponse<VocabularyJourneyRecord>;
  return unwrapData(response);
}

export async function apiDeleteVocabularyJourney(id: string) {
  const response = (await api.delete(`/vocabulary-journeys/${id}`)) as ApiResponse;
  return unwrapResponse(response);
}

export async function apiReplaceJourneyClassrooms(id: string, classroomIds: string[]) {
  const response = (await api.put(`/vocabulary-journeys/${id}/classrooms`, {
    classroomIds,
  })) as ApiResponse<VocabularyJourneyRecord>;
  return unwrapData(response);
}

export async function apiListJourneyTopics(journeyId: string) {
  const response = (await api.get(
    `/vocabulary-journeys/${journeyId}/topics`,
  )) as ApiResponse<VocabularyTopicRecord[]>;
  const data = unwrapData(response);
  return Array.isArray(data) ? data : [];
}

export async function apiGetVocabularyTopic(id: string) {
  const response = (await api.get(`/vocabulary-topics/${id}`)) as ApiResponse<VocabularyTopicRecord>;
  return unwrapData(response);
}

export async function apiCreateVocabularyTopic(data: VocabularyTopicFormPayload) {
  const response = (await api.post(
    "/vocabulary-topics",
    data,
  )) as ApiResponse<VocabularyTopicRecord>;
  return unwrapData(response);
}

export async function apiUpdateVocabularyTopic(id: string, data: VocabularyTopicFormPayload) {
  const response = (await api.put(
    `/vocabulary-topics/${id}`,
    data,
  )) as ApiResponse<VocabularyTopicRecord>;
  return unwrapData(response);
}

export async function apiDeleteVocabularyTopic(id: string) {
  const response = (await api.delete(`/vocabulary-topics/${id}`)) as ApiResponse;
  return unwrapResponse(response);
}

export async function apiReplaceTopicMembers(id: string, vocabularySetIds: string[]) {
  const response = (await api.put(`/vocabulary-topics/${id}/members`, {
    vocabularySetIds,
  })) as ApiResponse<VocabularyTopicRecord>;
  return unwrapData(response);
}

export async function apiGetStudentVocabJourneys() {
  const response = (await api.get(
    "/student/vocab/journeys",
  )) as ApiResponse<VocabularyJourneyRecord[]>;
  const data = unwrapData(response);
  return Array.isArray(data) ? data : [];
}

export async function apiGetStudentVocabJourney(id: string) {
  const response = (await api.get(
    `/student/vocab/journeys/${id}`,
  )) as ApiResponse<VocabularyJourneyRecord>;
  return unwrapData(response);
}

export async function apiGetStudentTopicSets(topicId: string) {
  const response = (await api.get(
    `/student/vocab/topics/${topicId}/sets`,
  )) as ApiResponse<VocabularyTopicRecord>;
  return unwrapData(response);
}

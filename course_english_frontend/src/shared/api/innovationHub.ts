import api from "./axios";
import type { ApiResponse } from "./types";

export type InnovationIdeaCategory =
  | "FEATURE"
  | "BUG"
  | "UI"
  | "PERFORMANCE"
  | "AI"
  | "OTHER";

export type InnovationIdeaStatus =
  | "UNDER_REVIEW"
  | "PLANNED"
  | "IN_PROGRESS"
  | "TESTING"
  | "COMPLETED";

export type InnovationIdeaPriority = "LOW" | "MEDIUM" | "HIGH";

export type InnovationIdeaSortMode = "FEATURED" | "NEWEST" | "TRENDING";

export type InnovationIdeaRecord = {
  id: string;
  title: string;
  description: string;
  category: InnovationIdeaCategory;
  status: InnovationIdeaStatus;
  priority: InnovationIdeaPriority;
  voteCount: number;
  commentCount: number;
  createdByUserId: string;
  createdByDisplayName?: string;
  createdAt?: string;
  updatedAt?: string;
  viewerHasVoted?: boolean;
  /** Relative paths under /storage/inovation/… */
  imageUrls?: string[];
};

/** Folder passed to POST /files for innovation idea screenshots */
export const INNOVATION_IDEA_IMAGE_FOLDER = "inovation";

export type InnovationCommentRecord = {
  id: string;
  ideaId: string;
  userId: string;
  displayName?: string;
  body: string;
  createdAt?: string;
};

export type InnovationVoteToggleResult = {
  voted: boolean;
  voteCount: number;
};

export type InnovationHubStats = {
  analyzedCount?: number;
  mineCompletedCount?: number;
  categoryShares?: Array<{
    category: InnovationIdeaCategory;
    count: number;
    percent: number;
  }>;
  topContributors?: Array<{
    userId: string;
    displayName?: string;
    points: number;
  }>;
  featuredCompleted?: {
    ideaId: string;
    title: string;
    voteCount: number;
    createdByUserId: string;
    createdByDisplayName?: string;
  } | null;
};

export type InnovationIdeasPaginationResult = {
  result?: InnovationIdeaRecord[];
  meta?: {
    page?: number;
    pageSize?: number;
    pages?: number;
    total?: number;
  };
};

export type InnovationIdeaSearchPayload = {
  page?: number;
  size?: number;
  keyword?: string;
  category?: InnovationIdeaCategory | "";
  status?: InnovationIdeaStatus | "";
  mine?: boolean;
  sortMode?: InnovationIdeaSortMode;
};

function unwrapResponse<T>(response: ApiResponse<T>): ApiResponse<T> {
  const statusCode = response?.statusCode;
  if (typeof statusCode === "number" && statusCode >= 400) {
    const error = new Error(response?.message || "API request failed") as Error & {
      response?: { data: ApiResponse<T> };
    };
    error.response = { data: response };
    throw error;
  }
  if (response?.success === false) {
    const error = new Error(response?.message || "API request failed") as Error & {
      response?: { data: ApiResponse<T> };
    };
    error.response = { data: response };
    throw error;
  }
  return response;
}

export async function apiSearchInnovationIdeas(payload?: InnovationIdeaSearchPayload) {
  const body: Record<string, unknown> = {
    page: payload?.page ?? 0,
    size: payload?.size ?? 12,
    sortMode: payload?.sortMode ?? "FEATURED",
  };
  if (payload?.keyword?.trim()) body.keyword = payload.keyword.trim();
  if (payload?.category) body.category = payload.category;
  if (payload?.status) body.status = payload.status;
  if (payload?.mine) body.mine = true;

  const response = (await api.post(
    "/innovation-ideas/search",
    body,
  )) as ApiResponse<InnovationIdeasPaginationResult>;
  return unwrapResponse(response);
}

export async function apiGetInnovationIdea(id: string) {
  const response = (await api.get(`/innovation-ideas/${id}`)) as ApiResponse<InnovationIdeaRecord>;
  return unwrapResponse(response);
}

export async function apiCreateInnovationIdea(data: {
  title: string;
  description: string;
  category: InnovationIdeaCategory;
  priority?: InnovationIdeaPriority;
  imageUrls?: string[];
}) {
  const response = (await api.post("/innovation-ideas", data)) as ApiResponse<InnovationIdeaRecord>;
  return unwrapResponse(response);
}

export async function apiUpdateInnovationIdeaStatus(id: string, status: InnovationIdeaStatus) {
  const response = (await api.put(`/innovation-ideas/${id}/status`, {
    status,
  })) as ApiResponse<InnovationIdeaRecord>;
  return unwrapResponse(response);
}

export async function apiToggleInnovationIdeaVote(id: string) {
  const response = (await api.post(
    `/innovation-ideas/${id}/votes`,
  )) as ApiResponse<InnovationVoteToggleResult>;
  return unwrapResponse(response);
}

export async function apiListInnovationIdeaComments(id: string) {
  const response = (await api.get(
    `/innovation-ideas/${id}/comments`,
  )) as ApiResponse<InnovationCommentRecord[]>;
  return unwrapResponse(response);
}

export async function apiCreateInnovationIdeaComment(id: string, body: string) {
  const response = (await api.post(`/innovation-ideas/${id}/comments`, {
    body,
  })) as ApiResponse<InnovationCommentRecord>;
  return unwrapResponse(response);
}

export async function apiGetInnovationHubStats() {
  const response = (await api.get(
    "/innovation-ideas/stats/summary",
  )) as ApiResponse<InnovationHubStats>;
  return unwrapResponse(response);
}

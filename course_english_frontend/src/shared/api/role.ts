import api from "./axios";
import type { ApiResponse } from "./types";

export type RoleRecord = {
  id: string;
  name: string;
  code?: string;
};

export type RolesPaginationResult = {
  result?: RoleRecord[];
  meta?: {
    page?: number;
    pageSize?: number;
    pages?: number;
    total?: number;
  };
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

export async function apiGetRoles(payload?: Record<string, unknown>) {
  const response = (await api.post("/roles/search", payload ?? {})) as ApiResponse<RolesPaginationResult>;
  return unwrapResponse(response);
}

export async function apiGetRoleById(id: number | string) {
  const response = (await api.get(`/roles/${id}`)) as ApiResponse<RoleRecord>;
  return unwrapResponse(response);
}

export async function apiCreateRole(data: { name: string; code?: string }) {
  const response = (await api.post("/roles", data)) as ApiResponse<RoleRecord>;
  return unwrapResponse(response);
}

export async function apiUpdateRole(id: number | string, data: { name: string; code?: string }) {
  const response = (await api.put(`/roles/${id}`, data)) as ApiResponse<RoleRecord>;
  return unwrapResponse(response);
}

export async function apiDeleteRole(id: number | string) {
  const response = (await api.delete(`/roles/${id}`)) as ApiResponse;
  return unwrapResponse(response);
}

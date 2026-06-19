import api from "./axios";
import type { ApiResponse, ForgotPasswordData, LoginResponseData, UserRecord } from "./types";

const API_AUTH_PATH = "/auth";
const API_USER_PATH = "";

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

export async function apiRegister(data: {
  name: string;
  email: string;
  password: string;
}) {
  const response = (await api.post(`${API_AUTH_PATH}/register`, data)) as ApiResponse;
  return unwrapResponse(response);
}

export async function apiLogin(data: { username: string; password: string }) {
  const response = (await api.post(`${API_AUTH_PATH}/login`, data)) as ApiResponse<LoginResponseData>;
  return unwrapResponse(response);
}

export async function apiGoogleLogin(data: { idToken: string }) {
  const response = (await api.post(`${API_AUTH_PATH}/google`, data)) as ApiResponse<LoginResponseData>;
  return unwrapResponse(response);
}

export async function apiForgotPassword(email: string) {
  const response = (await api.post(`${API_AUTH_PATH}/forgot-password`, { email })) as ApiResponse<ForgotPasswordData>;
  return unwrapResponse(response);
}

export async function apiResetPassword(data: { token: string; newPassword: string }) {
  const response = (await api.post(`${API_AUTH_PATH}/reset-password`, data)) as ApiResponse;
  return unwrapResponse(response);
}

export async function apiGetAccount() {
  const response = (await api.get(`${API_AUTH_PATH}/account`)) as ApiResponse<{
    user?: LoginResponseData["user"];
  }>;
  return unwrapResponse(response);
}

export async function apiGetUsers(payload?: Record<string, unknown>) {
  const response = (await api.post(`${API_USER_PATH}/users/search`, payload ?? {})) as ApiResponse<{
    result?: UserRecord[];
  }>;
  return unwrapResponse(response);
}

export async function apiGetUserById(id: number | string) {
  const response = (await api.get(`${API_USER_PATH}/users/${id}`)) as ApiResponse<UserRecord>;
  return unwrapResponse(response);
}

export async function apiCreateUser(data: {
  email: string;
  password: string;
  name: string;
  avatarUrl?: string;
  role?: string;
  roleNames?: string[];
}) {
  const response = (await api.post(`${API_USER_PATH}/user`, data)) as ApiResponse;
  return unwrapResponse(response);
}

export async function apiUpdateUserByAdmin(data: {
  id: number | string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  role?: string;
  roleNames?: string[];
  password?: string;
}) {
  const response = (await api.put(`${API_USER_PATH}/user-by-admin`, data)) as ApiResponse;
  return unwrapResponse(response);
}

export async function apiDeleteUser(id: number | string) {
  const response = (await api.delete(`${API_USER_PATH}/users/${id}`)) as ApiResponse;
  return unwrapResponse(response);
}

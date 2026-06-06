import api from "./axios";
import type { ApiResponse } from "./types";

export type UploadFileResult = {
  fileName: string;
  uploadedAt?: string;
};

function unwrapUpload(response: unknown): UploadFileResult {
  const wrapped = response as ApiResponse<UploadFileResult> & UploadFileResult;
  const data = wrapped?.data ?? wrapped;
  if (!data?.fileName) {
    throw new Error((wrapped as ApiResponse<UploadFileResult>)?.message || "Upload thất bại.");
  }
  return { fileName: data.fileName, uploadedAt: data.uploadedAt };
}

/** URL public để hiển thị file đã upload (BE serve /storage/**) */
export function buildStoragePublicUrl(folder: string, fileName: string): string {
  const apiBase = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/api\/v1\/?$/i, "") || "http://localhost:7070";
  const normalizedFolder = folder.replace(/^\/+|\/+$/g, "");
  // Do not encodeURIComponent the whole fileName — Spring decodes path segments; spaces are OK in URL.
  const encodedName = fileName.split("/").map((part) => encodeURIComponent(part)).join("/");
  return `${apiBase}/storage/${normalizedFolder}/${encodedName}`;
}

export async function apiUploadFile(file: File, folder: string): Promise<UploadFileResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  const response = await api.post("/files", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return unwrapUpload(response);
}

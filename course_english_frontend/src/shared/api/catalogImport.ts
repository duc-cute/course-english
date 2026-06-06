import api from "./axios";
import type { ApiResponse } from "./types";

export type CatalogImportType = "users" | "roles" | "classrooms" | "subjects" | "enrollments";

export type CatalogImportResult = {
  inserted: number;
  skipped: number;
  failed: number;
  hasErrorReport?: boolean;
  errorReportFileName?: string;
  errorReportBase64?: string;
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

export async function downloadCatalogImportTemplate(type: CatalogImportType) {
  const blob = (await api.get(`/catalog-import/${type}/template`, {
    responseType: "blob",
  })) as Blob;
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${type}_import_template.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function importCatalogExcel(type: CatalogImportType, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const response = (await api.post(`/catalog-import/${type}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })) as ApiResponse<CatalogImportResult>;
  const unwrapped = unwrapResponse(response);
  return (unwrapped?.data ?? unwrapped) as CatalogImportResult;
}

export function downloadErrorReportFromBase64(fileName: string, base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName || "import_errors.xlsx";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

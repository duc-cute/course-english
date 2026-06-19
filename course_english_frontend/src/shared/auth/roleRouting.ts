import { paths } from "../constants/paths";

const STUDENT_ROLES = new Set(["USER_ROLE", "STUDENT_ROLE"]);
const ADMIN_LIKE_ROLES = new Set(["ADMIN_ROLE", "TEACHER_ROLE"]);

function normalizeRole(role: string): string {
  return role.trim().toUpperCase();
}

export function normalizeRoles(roles?: string[] | null): string[] {
  if (!roles?.length) {
    return [];
  }
  return roles.map(normalizeRole).filter(Boolean);
}

export function collectRoles(role?: string | null, roles?: string[] | null): string[] {
  const merged = [...normalizeRoles(roles)];
  if (role?.trim()) {
    const normalized = normalizeRole(role);
    if (!merged.includes(normalized)) {
      merged.push(normalized);
    }
  }
  return merged;
}

/** Học sinh / người dùng thường — không có quyền admin/giáo viên. */
export function isStudentOnlyUser(roles?: string[] | null): boolean {
  const normalized = normalizeRoles(roles);
  if (normalized.length === 0) {
    return true;
  }
  if (normalized.some((role) => ADMIN_LIKE_ROLES.has(role))) {
    return false;
  }
  return normalized.every((role) => STUDENT_ROLES.has(role));
}

export function getDefaultHomeForRoles(roles?: string[] | null): string {
  return isStudentOnlyUser(roles) ? `/${paths.STUDENT}` : `/${paths.ADMIN}`;
}

export function canAccessPathForRoles(path: string, roles?: string[] | null): boolean {
  if (!path.startsWith(`/${paths.ADMIN}`)) {
    return true;
  }
  return !isStudentOnlyUser(roles);
}

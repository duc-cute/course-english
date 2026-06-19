import { paths } from "../constants/paths";
import { canAccessPathForRoles, collectRoles, getDefaultHomeForRoles } from "./roleRouting";

const AUTH_ONLY = new Set([`/${paths.LOGIN}`, `/${paths.REGISTER}`]);

/**
 * Landing sau login theo role:
 * - USER_ROLE / STUDENT_ROLE → khu học sinh
 * - ADMIN_ROLE / TEACHER_ROLE / role khác → admin
 * Vẫn tôn trọng `from` nếu user có quyền truy cập route đó.
 */
export function resolvePostLoginRedirect(
  from?: string | null,
  role?: string | null,
  roles?: string[] | null,
): string {
  const userRoles = collectRoles(role, roles);
  const defaultHome = getDefaultHomeForRoles(userRoles);

  if (from && !AUTH_ONLY.has(from) && canAccessPathForRoles(from, userRoles)) {
    return from;
  }

  return defaultHome;
}

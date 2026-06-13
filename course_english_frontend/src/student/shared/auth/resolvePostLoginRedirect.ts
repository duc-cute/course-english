import { paths } from "../../../shared/constants/paths";

const AUTH_ONLY = new Set([`/${paths.LOGIN}`, `/${paths.REGISTER}`]);

/**
 * Default landing after login: student home.
 * Honors `location.state.from` when user was redirected to login from a protected route.
 */
export function resolvePostLoginRedirect(from?: string | null): string {
  if (from && !AUTH_ONLY.has(from)) {
    return from;
  }
  return `/${paths.STUDENT}`;
}

import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getRolesFromAccessToken } from "./jwtUtils";
import { isStudentOnlyUser } from "./roleRouting";
import { paths } from "../constants/paths";
import { getAccessToken } from "./token";

type RequireAuthProps = {
  children: ReactNode;
  /** Chỉ cho phép admin / giáo viên — học sinh bị chuyển về khu student. */
  adminOnly?: boolean;
};

export function RequireAuth({ children, adminOnly = false }: RequireAuthProps) {
  const location = useLocation();
  const token = getAccessToken();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (adminOnly) {
    const roles = getRolesFromAccessToken(token);
    if (isStudentOnlyUser(roles)) {
      return <Navigate to={`/${paths.STUDENT}`} replace />;
    }
  }

  return <>{children}</>;
}

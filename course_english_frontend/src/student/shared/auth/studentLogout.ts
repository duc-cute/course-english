import type { AppDispatch } from "../../../redux/store";
import { logout } from "../../../redux/user/userSlice";
import { clearAccessToken } from "../../../shared/auth/token";
import { clearCachedUserProfile } from "../../../shared/auth/userProfileCache";

export function performStudentLogout(dispatch: AppDispatch): void {
  clearAccessToken();
  clearCachedUserProfile();
  dispatch(logout());
}

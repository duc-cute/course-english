import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { apiGoogleLogin } from "../../shared/api/user";
import { resolvePostLoginRedirect } from "../../shared/auth/resolvePostLoginRedirect";
import { setAccessToken } from "../../shared/auth/token";
import { setCachedAvatarUrl } from "../../shared/auth/userProfileCache";

export function useGoogleLoginHandler() {
  const navigate = useNavigate();
  const location = useLocation();
  const fromPath = (location.state as { from?: string } | null)?.from;

  return async (idToken: string) => {
    try {
      const response = await apiGoogleLogin({ idToken });
      const token = response?.data?.access_token;
      const user = response?.data?.user;

      if (!token) {
        toast.error(response?.message || "Đăng nhập Google thất bại");
        return;
      }

      setAccessToken(token);
      setCachedAvatarUrl(user?.avatarUrl);
      toast.success(response?.message || "Đăng nhập thành công");
      const redirectTo = resolvePostLoginRedirect(fromPath, user?.role, user?.roles);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      const err = error as { message?: string };
      toast.error(err?.message || "Đăng nhập Google thất bại");
    }
  };
}

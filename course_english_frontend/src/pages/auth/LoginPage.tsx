import { Box, Button, Grid, Paper, Typography } from "@mui/material";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { TextFieldInput } from "../../admin/components/TextFieldInput";
import { apiLogin } from "../../shared/api/user";
import { setAccessToken } from "../../shared/auth/token";
import { paths } from "../../shared/constants/paths";
import { useFeatureFlags } from "../../shared/featureFlags/useFeatureFlags";

type LoginForm = {
  username: string;
  password: string;
};

export function LoginPage() {
  const { flags } = useFeatureFlags();
  const [submitting, setSubmitting] = useState(false);
  const { control, handleSubmit } = useForm<LoginForm>();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from ?? `/${paths.ADMIN}`;

  const onSubmit = async (data: LoginForm) => {
    try {
      setSubmitting(true);
      const response = await apiLogin(data);
      const token = response?.data?.access_token;

      if (!token) {
        toast.error(response?.message || "Đăng nhập thất bại");
        return;
      }

      setAccessToken(token);
      toast.success(response?.message || "Đăng nhập thành công");
      navigate(redirectTo, { replace: true });
    } catch (error) {
      const err = error as { message?: string };
      toast.error(err?.message || "Đăng nhập thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#f0f4f8",
        px: 2,
      }}
    >
      <Paper elevation={3} sx={{ p: 4, width: "100%", maxWidth: 420, borderRadius: 3 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Đăng nhập
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Cell Architecture Studio — quản trị hoặc học tập
        </Typography>

        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextFieldInput
                name="username"
                control={control}
                label="Email"
                rules={{ required: "Bắt buộc nhập email" }}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextFieldInput
                name="password"
                control={control}
                label="Mật khẩu"
                type="password"
                rules={{ required: "Bắt buộc nhập mật khẩu" }}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Button type="submit" variant="contained" fullWidth disabled={submitting} sx={{ py: 1.2 }}>
                {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
              </Button>
            </Grid>
          </Grid>
        </Box>

        {flags.studentSelfRegistrationEnabled ? (
          <Typography variant="body2" sx={{ mt: 3, textAlign: "center" }}>
            Chưa có tài khoản?{" "}
            <Typography component={RouterLink} to={`/${paths.REGISTER}`} color="primary" sx={{ fontWeight: 600 }}>
              Đăng ký
            </Typography>
          </Typography>
        ) : null}
        <Typography variant="body2" sx={{ mt: 1, textAlign: "center" }}>
          <Typography component={RouterLink} to={`/${paths.STUDENT}`} color="primary" sx={{ fontWeight: 600 }}>
            Vào khu vực học sinh
          </Typography>
        </Typography>
      </Paper>
    </Box>
  );
}

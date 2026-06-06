import { Box, Button, Grid, Paper, Typography } from "@mui/material";
import { useForm } from "react-hook-form";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { TextFieldInput } from "../../admin/components/TextFieldInput";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { registerUser } from "../../redux/user/userActions";
import { paths } from "../../shared/constants/paths";

type RegisterForm = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export function RegisterPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const loading = useAppSelector((state) => state.user.loading);
  const { control, handleSubmit, watch } = useForm<RegisterForm>();

  const onSubmit = async (values: RegisterForm) => {
    const result = await dispatch(
      registerUser({
        name: values.name,
        email: values.email,
        password: values.password,
      }),
    );

    if (registerUser.fulfilled.match(result)) {
      toast.success("Đăng ký thành công");
      navigate(`/${paths.LOGIN}`);
      return;
    }

    toast.error((result.payload as string) || "Đăng ký thất bại");
  };

  const password = watch("password");

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
          Đăng ký
        </Typography>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextFieldInput name="name" control={control} label="Họ và tên" rules={{ required: "Bắt buộc" }} fullWidth />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextFieldInput
                name="email"
                control={control}
                label="Email"
                rules={{
                  required: "Bắt buộc",
                  pattern: { value: /^\S+@\S+\.\S+$/, message: "Email không hợp lệ" },
                }}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextFieldInput
                name="password"
                control={control}
                label="Mật khẩu"
                type="password"
                rules={{ required: "Bắt buộc", minLength: { value: 6, message: "Ít nhất 6 ký tự" } }}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextFieldInput
                name="confirmPassword"
                control={control}
                label="Xác nhận mật khẩu"
                type="password"
                rules={{
                  required: "Bắt buộc",
                  validate: (v) => v === password || "Mật khẩu không khớp",
                }}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Button type="submit" variant="contained" fullWidth disabled={loading}>
                {loading ? "Đang đăng ký..." : "Đăng ký"}
              </Button>
            </Grid>
          </Grid>
        </Box>
        <Typography variant="body2" sx={{ mt: 3, textAlign: "center" }}>
          Đã có tài khoản?{" "}
          <Typography component={RouterLink} to={`/${paths.LOGIN}`} color="primary" sx={{ fontWeight: 600 }}>
            Đăng nhập
          </Typography>
        </Typography>
      </Paper>
    </Box>
  );
}

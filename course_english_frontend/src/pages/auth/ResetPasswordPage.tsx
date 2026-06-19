import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { apiResetPassword } from "../../shared/api/user";
import { paths } from "../../shared/constants/paths";
import "../../styles/auth.css";
import "../../styles/reset-password.css";

type ResetPasswordForm = {
  newPassword: string;
  confirmPassword: string;
};

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { control, handleSubmit, watch } = useForm<ResetPasswordForm>();

  const newPassword = watch("newPassword") || "";

  const onSubmit = async (values: ResetPasswordForm) => {
    if (!token) {
      toast.error("Liên kết không hợp lệ");
      return;
    }

    try {
      setSubmitting(true);
      await apiResetPassword({ token, newPassword: values.newPassword });
      toast.success("Đặt mật khẩu mới thành công. Vui lòng đăng nhập.");
      setIsSuccess(true);
    } catch (error) {
      const err = error as { message?: string };
      toast.error(err?.message || "Không thể đặt lại mật khẩu");
    } finally {
      setSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="rp-success-overlay">
        <div className="rp-success-content">
          <div className="rp-success-image-wrapper">
            <img
              alt="Celebration Success Owl"
              className="rp-success-image rp-animate-float"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAl-O5BYf3bFj74hA6So5q-5NpBICTAQb0G8Eg41DhrQoZTbb180uicYhkExADDTbMf5AuI4WPNlGYXXRJQg2u9w1BBH1cvPEqg6rdBCS8mtjjC6YD9PJ8kc7SG2_31F9QhaIR3jwSihN_RtmcZKst6rei5zBcZIA9dj0njLIcUQ65qu7cP-npTWj-kTfcCW9b9bxNFIBON0CDmJLVbOL73N-HOzWRzCmme5zUsJv82LzRKOsbhBwHz8r1D3sHLMUbokCD19zMYN9Hp"
            />
          </div>
          <h2 className="rp-success-title">Đặt lại mật khẩu thành công</h2>
          <p className="rp-success-subtitle">
            Tài khoản của bạn đã được bảo mật. Bây giờ bạn có thể đăng nhập bằng mật khẩu mới và tiếp tục học tập.
          </p>
          <button
            className="rp-btn-primary"
            type="button"
            onClick={() => navigate(`/${paths.LOGIN}`, { replace: true })}
          >
            Tiếp tục đăng nhập
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rp-layout-container">
      <nav className="rp-navbar">
        <div className="rp-navbar-container">
          <div className="rp-navbar-brand">Lumina English</div>
          <a className="rp-navbar-link" href="#" onClick={(e) => e.preventDefault()}>Hỗ trợ</a>
        </div>
      </nav>

      <section className="rp-mascot-section">
        <div className="rp-mascot-content-wrapper">
          <img
            alt="Security mascot illustration"
            className="rp-mascot-image rp-animate-float"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBE_4L5Z2dBybEFGinGkQIG0tpkqdRU7f46ehDkSJ2lrhucf47KCVj30SMzgZi14FGkhCBawkqff7tFlJ3-hgBsCjfn-Qb0N-Zdh2CsH6oOpZzTFsVSx0xUhd1jBcQu-yFgcT4Gb4MztALLPY_NLXsNzqzw4MS8uMfXo8p4hZliP9TH0y_B5REcdnlz1DdO_EkrRgoAiG-cA8oknyUTUnBkMRC0XXvgqEKX3iS4dhBBkCgB8YVgwlt53NB-kT_-A_rWWxyVKKKZ1koY"
          />
          <h1 className="rp-mascot-title">Tạo mật khẩu mới</h1>
          <p className="rp-mascot-subtitle">
            Bảo mật tài khoản học tập và tiếp tục hành trình làm chủ ngôn ngữ của bạn.
          </p>
        </div>
      </section>

      <div className="rp-mobile-branding">
        <div className="rp-mobile-branding-overlay">
          <div className="rp-blob-1" />
          <div className="rp-blob-2" />
        </div>
        <img
          alt="Security illustration mobile"
          className="rp-mobile-mascot-img rp-animate-float"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBE_4L5Z2dBybEFGinGkQIG0tpkqdRU7f46ehDkSJ2lrhucf47KCVj30SMzgZi14FGkhCBawkqff7tFlJ3-hgBsCjfn-Qb0N-Zdh2CsH6oOpZzTFsVSx0xUhd1jBcQu-yFgcT4Gb4MztALLPY_NLXsNzqzw4MS8uMfXo8p4hZliP9TH0y_B5REcdnlz1DdO_EkrRgoAiG-cA8oknyUTUnBkMRC0XXvgqEKX3iS4dhBBkCgB8YVgwlt53NB-kT_-A_rWWxyVKKKZ1koY"
        />
      </div>

      <section className="rp-form-section">
        <div className="rp-card">
          {!token ? (
            <div className="rp-form">
              <div className="rp-card-header">
                <h2 className="rp-card-title">Liên kết không hợp lệ</h2>
                <p className="rp-card-subtitle">
                  Liên kết đặt lại mật khẩu thiếu hoặc không đúng. Vui lòng yêu cầu liên kết mới.
                </p>
              </div>
              <RouterLink className="rp-btn-primary" to={`/${paths.FORGOT_PASSWORD}`}>
                Yêu cầu liên kết mới
              </RouterLink>
            </div>
          ) : (
            <>
              <div className="rp-card-header">
                <h2 className="rp-card-title">Đặt lại mật khẩu</h2>
                <p className="rp-card-subtitle">Nhập mật khẩu mới cho tài khoản của bạn.</p>
              </div>

              <form className="rp-form" id="reset-form" onSubmit={handleSubmit(onSubmit)}>
                <Controller
                  control={control}
                  name="newPassword"
                  rules={{
                    required: "Bắt buộc nhập mật khẩu",
                    minLength: { value: 6, message: "Mật khẩu tối thiểu 6 ký tự" },
                  }}
                  render={({ field, fieldState }) => (
                    <div className="rp-field">
                      <label className="rp-label" htmlFor="new-password">Mật khẩu mới</label>
                      <div className="rp-input-wrapper">
                        <span className="material-symbols-outlined rp-input-icon" aria-hidden>lock</span>
                        <input
                          {...field}
                          className={`rp-input ${fieldState.error ? "rp-input--error" : ""}`}
                          id="new-password"
                          placeholder="Mật khẩu tối thiểu 6 ký tự"
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                        />
                        <button
                          className="rp-input-toggle"
                          onClick={() => setShowPassword(!showPassword)}
                          type="button"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          <span className="material-symbols-outlined">
                            {showPassword ? "visibility_off" : "visibility"}
                          </span>
                        </button>
                      </div>
                      {fieldState.error ? (
                        <span className="rp-error-text">{fieldState.error.message}</span>
                      ) : null}
                    </div>
                  )}
                />

                <Controller
                  control={control}
                  name="confirmPassword"
                  rules={{
                    required: "Bắt buộc nhập lại mật khẩu",
                    validate: (v) => v === newPassword || "Mật khẩu không khớp",
                  }}
                  render={({ field, fieldState }) => (
                    <div className="rp-field">
                      <label className="rp-label" htmlFor="confirm-password">Xác nhận mật khẩu</label>
                      <div className="rp-input-wrapper">
                        <span className="material-symbols-outlined rp-input-icon" aria-hidden>verified_user</span>
                        <input
                          {...field}
                          className={`rp-input ${fieldState.error ? "rp-input--error" : ""}`}
                          id="confirm-password"
                          placeholder="Xác nhận lại mật khẩu"
                          type={showConfirmPassword ? "text" : "password"}
                          autoComplete="new-password"
                        />
                        <button
                          className="rp-input-toggle"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          type="button"
                          aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                        >
                          <span className="material-symbols-outlined">
                            {showConfirmPassword ? "visibility_off" : "visibility"}
                          </span>
                        </button>
                      </div>
                      {fieldState.error ? (
                        <span className="rp-error-text">{fieldState.error.message}</span>
                      ) : null}
                    </div>
                  )}
                />

                <button
                  className="rp-btn-primary rp-desktop-btn"
                  disabled={submitting}
                  type="submit"
                >
                  {submitting ? (
                    <>
                      <span className="material-symbols-outlined rp-spin-icon" aria-hidden>
                        progress_activity
                      </span>
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    "Đặt mật khẩu mới"
                  )}
                </button>
              </form>
            </>
          )}

          <div className="rp-card-footer">
            <p className="rp-footer-prompt">
              Nhớ mật khẩu của bạn?{" "}
              <RouterLink className="rp-footer-link" to={`/${paths.LOGIN}`}>
                Đăng nhập
              </RouterLink>
            </p>
          </div>
        </div>
      </section>

      {token && !isSuccess ? (
        <div className="rp-mobile-btn-container">
          <button
            className="rp-btn-primary"
            disabled={submitting}
            form="reset-form"
            type="submit"
          >
            {submitting ? (
              <>
                <span className="material-symbols-outlined rp-spin-icon" aria-hidden>
                  progress_activity
                </span>
                <span>Đang lưu...</span>
              </>
            ) : (
              "Đặt mật khẩu mới"
            )}
          </button>
        </div>
      ) : null}
    </div>
  );
}

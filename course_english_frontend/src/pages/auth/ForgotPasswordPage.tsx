import { useState, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { Link as RouterLink } from "react-router-dom";
import { toast } from "react-toastify";
import { apiForgotPassword } from "../../shared/api/user";
import type { ForgotPasswordNextStep } from "../../shared/api/types";
import { paths } from "../../shared/constants/paths";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { useGoogleLoginHandler } from "./useGoogleLoginHandler";
import "../../styles/auth.css";
import "../../styles/forgot-password.css";

type ForgotPasswordForm = {
  email: string;
};

export function ForgotPasswordPage() {
  const [submitting, setSubmitting] = useState(false);
  const [nextStep, setNextStep] = useState<ForgotPasswordNextStep | null>(null);
  const [resultMessage, setResultMessage] = useState("");
  const { control, handleSubmit } = useForm<ForgotPasswordForm>();
  const handleGoogleLogin = useGoogleLoginHandler();
  const owlRef = useRef<HTMLDivElement>(null);

  const onSubmit = async (values: ForgotPasswordForm) => {
    try {
      setSubmitting(true);
      const response = await apiForgotPassword(values.email.trim());
      const data = response?.data;
      setNextStep(data?.nextStep ?? "CHECK_EMAIL");
      setResultMessage(data?.message || "Nếu email đã đăng ký, bạn sẽ nhận hướng dẫn trong vài phút.");
    } catch (error) {
      const err = error as { message?: string };
      toast.error(err?.message || "Không thể gửi yêu cầu. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (window.innerWidth >= 768 && owlRef.current) {
      const xAxis = (window.innerWidth / 2 - e.clientX) / 40;
      const yAxis = (window.innerHeight / 2 - e.clientY) / 40;
      owlRef.current.style.transform = `rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
    }
  };

  const handleMouseLeave = () => {
    if (owlRef.current) {
      owlRef.current.style.transform = `rotateY(0deg) rotateX(0deg)`;
    }
  };

  return (
    <div className="fp-layout-container">
      {/* Brand logo top overlay (Desktop left section) / Mascot Section */}
      <section
        className="fp-mascot-section"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className="fp-brand-overlay">
          <span className="material-symbols-outlined fp-brand-icon-white" style={{ fontVariationSettings: "'FILL' 1" }}>
            school
          </span>
          <span className="fp-brand-text-white">Lumina English</span>
        </div>
        
        {/* Decorative blur blobs */}
        <div className="fp-mascot-overlay">
          <div className="fp-blob-1" />
          <div className="fp-blob-2" />
        </div>

        {/* Floating Mascot Content */}
        <div className="fp-mascot-content-wrapper">
          <div ref={owlRef} className="fp-owl-float">
            <img
              alt="Mascot"
              className="fp-mascot-image"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCQ4assd12lUS3fZ9k5_OsL086PdebNk4cnIwalPznm-1Ga8zb4h04I4N7nn1l7N3P0qG2BlRKbM8VijSW0Jnf7vFrZ495A1Rms1wA6AZq2evFFnbgHcGxE7xIvsAXdQxHb7fxWSQ17DK-llU4hkVR8sWOSCofPmlXPTdN6CzdgamuXS0g0OJxYghjM2W9kgQeLC4nzGSW_Y7ggH3foY1rUOFFLZ06LqHjWasBapjkHnWE6ewa7VNXwXxdw-aMfPG9KNeLKwuxo4X9q"
            />
          </div>
          <h1 className="fp-mascot-title">Don't Worry!</h1>
          <p className="fp-mascot-subtitle">We'll help you get back to learning English.</p>
          <div className="fp-mascot-divider" />
        </div>
      </section>

      {/* Mobile Top Branding Area (Only visible on mobile) */}
      <div className="fp-mobile-branding">
        <div className="fp-mobile-mascot-card">
          <img
            alt="Educational owl illustration"
            className="fp-mobile-mascot-img"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCQ4assd12lUS3fZ9k5_OsL086PdebNk4cnIwalPznm-1Ga8zb4h04I4N7nn1l7N3P0qG2BlRKbM8VijSW0Jnf7vFrZ495A1Rms1wA6AZq2evFFnbgHcGxE7xIvsAXdQxHb7fxWSQ17DK-llU4hkVR8sWOSCofPmlXPTdN6CzdgamuXS0g0OJxYghjM2W9kgQeLC4nzGSW_Y7ggH3foY1rUOFFLZ06LqHjWasBapjkHnWE6ewa7VNXwXxdw-aMfPG9KNeLKwuxo4X9q"
          />
        </div>
        <h1 className="fp-mobile-title">Don't Worry!</h1>
        <p className="fp-mobile-subtitle">We'll help you get back to learning English.</p>
      </div>

      {/* RIGHT Form Section */}
      <section className="fp-form-section">
        <div className="fp-card">
          {/* Mobile Logo inside card (Hidden on desktop) */}
          <div className="fp-mobile-logo">
            <span className="material-symbols-outlined fp-logo-icon" style={{ fontVariationSettings: "'FILL' 1" }}>
              school
            </span>
            <span className="fp-logo-text">Lumina English</span>
          </div>

          {nextStep === null ? (
            <>
              <div className="fp-card-header">
                <h2 className="fp-card-title">Quên mật khẩu?</h2>
                <p className="fp-card-subtitle">
                  Nhập email đăng ký. Chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu.
                </p>
              </div>

              <form className="fp-form" onSubmit={handleSubmit(onSubmit)}>
                <Controller
                  control={control}
                  name="email"
                  rules={{
                    required: "Bắt buộc nhập email",
                    pattern: { value: /^\S+@\S+\.\S+$/, message: "Email không hợp lệ" },
                  }}
                  render={({ field, fieldState }) => (
                    <div className="fp-field">
                      <label className="fp-label" htmlFor="forgot-email">Địa chỉ Email</label>
                      <div className="fp-input-wrapper">
                        <span className="material-symbols-outlined fp-input-icon" aria-hidden>mail</span>
                        <input
                          {...field}
                          className={`fp-input ${fieldState.error ? "fp-input--error" : ""}`}
                          id="forgot-email"
                          placeholder="name@company.com"
                          type="email"
                          autoComplete="email"
                        />
                      </div>
                      {fieldState.error ? (
                        <span className="fp-error-text">{fieldState.error.message}</span>
                      ) : null}
                    </div>
                  )}
                />

                <p className="fp-helper-text">
                  Nhập địa chỉ email của bạn và chúng tôi sẽ gửi liên kết đặt lại mật khẩu bảo mật.
                </p>

                <button className="fp-btn-primary" disabled={submitting} type="submit">
                  {submitting ? (
                    <>
                      <span className="material-symbols-outlined fp-spin-icon" aria-hidden>
                        progress_activity
                      </span>
                      <span>Đang gửi...</span>
                    </>
                  ) : (
                    <>
                      <span>Gửi hướng dẫn</span>
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
                    </>
                  )}
                </button>
              </form>
            </>
          ) : nextStep === "USE_GOOGLE" ? (
            <div className="fp-success-state">
              <div className="fp-success-icon-wrapper">
                <span className="material-symbols-outlined fp-success-icon">link</span>
              </div>
              <div className="fp-card-header">
                <h2 className="fp-card-title" style={{ fontSize: 24 }}>Liên kết với Google</h2>
              </div>
              <p className="fp-success-text">{resultMessage}</p>
              <div className="fp-divider-row">
                <div className="fp-divider-line" />
                <span className="fp-divider-text">tiếp tục với</span>
              </div>
              <GoogleSignInButton disabled={submitting} onCredential={handleGoogleLogin} />
            </div>
          ) : (
            <div className="fp-success-state">
              <div className="fp-success-icon-wrapper">
                <span className="material-symbols-outlined fp-success-icon" style={{ fontVariationSettings: "'FILL' 1" }}>
                  mark_email_read
                </span>
              </div>
              <div className="fp-card-header">
                <h2 className="fp-card-title" style={{ fontSize: 24 }}>Kiểm tra email</h2>
              </div>
              <p className="fp-success-text">{resultMessage}</p>
              <p className="fp-success-text" style={{ fontSize: 14, marginTop: -8 }}>
                Mở hộp thư (kể cả thư rác) và làm theo liên kết để đặt mật khẩu mới.
              </p>
              
              <button
                className="fp-btn-secondary"
                type="button"
                onClick={() => setNextStep(null)}
              >
                Không nhận được email? Thử lại
              </button>
            </div>
          )}

          {/* Footer Back to Login Link inside card */}
          <div className="fp-card-footer">
            <RouterLink className="fp-back-link" to={`/${paths.LOGIN}`}>
              <span className="material-symbols-outlined fp-arrow-icon">arrow_back</span>
              <span>Quay lại đăng nhập</span>
            </RouterLink>
          </div>
        </div>

        {/* Global Footer */}
        <footer className="fp-footer">
          <p className="fp-footer-text">
            © 2026 Lumina English. Bảo lưu mọi quyền.
          </p>
          <div className="fp-footer-links">
            <a className="fp-footer-link" href="#" onClick={(e) => e.preventDefault()}>Chính sách bảo mật</a>
            <a className="fp-footer-link" href="#" onClick={(e) => e.preventDefault()}>Điều khoản dịch vụ</a>
          </div>
        </footer>
      </section>
    </div>
  );
}

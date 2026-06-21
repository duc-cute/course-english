import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { registerUser } from "../../redux/user/userActions";
import { paths } from "../../shared/constants/paths";
import { useFeatureFlags } from "../../shared/featureFlags/useFeatureFlags";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { useGoogleLoginHandler } from "./useGoogleLoginHandler";
import "../../styles/auth.css";

type RegisterForm = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export function RegisterPage() {
  const { flags } = useFeatureFlags();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const loading = useAppSelector((state) => state.user.loading);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { control, handleSubmit, watch } = useForm<RegisterForm>();
  const handleGoogleLogin = useGoogleLoginHandler();

  const onSubmit = async (values: RegisterForm) => {
    const result = await dispatch(
      registerUser({
        name: values.name.trim(),
        email: values.email.trim(),
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
    <div className="auth-layout-container">
      {/* Left Column: Hero (Desktop Only) */}
      <section className="auth-hero-column">
        <div className="auth-hero-overlay" />
        
        {/* Floating Streak Card */}
        <div className="auth-floating-card-streak auth-animate-float auth-delay-1">
          <span aria-hidden style={{ fontSize: 24 }}>🔥</span>
          <div>
            <p className="auth-streak-number">21 days</p>
            <p className="auth-streak-label">Today's streak</p>
          </div>
        </div>

        {/* Floating Level Card */}
        <div className="auth-floating-card-level auth-animate-float">
          <div className="auth-level-card-header">
            <p className="auth-level-card-title">Level 12 Explorer</p>
            <p className="auth-level-card-percent">78%</p>
          </div>
          <div className="auth-level-card-track">
            <div className="auth-level-card-fill" style={{ width: "78%" }} />
          </div>
        </div>

        {/* Floating Badges Card */}
        <div className="auth-floating-card-badges auth-animate-float auth-delay-2">
          <span aria-hidden style={{ fontSize: 20 }}>🏆</span>
          <span aria-hidden style={{ fontSize: 18 }}>⭐</span>
          <span aria-hidden style={{ fontSize: 18 }}>💎</span>
        </div>

        {/* Hero Headline content */}
        <div className="auth-hero-content">
          <h1 className="auth-hero-title">Master English Every Day</h1>
          <p className="auth-hero-subtitle">
            Practice vocabulary, grammar, listening and speaking with interactive lessons.
          </p>
        </div>

        {/* Mascot */}
        <div className="auth-hero-mascot-wrapper auth-animate-float">
          <img
            alt="Lumina Owl Mascot"
            className="auth-hero-mascot"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuB_9kf5HilFP5SQB7Lguj4kKrAmbD5bCVXUgNFBPQL5v-CAdvDvTIeDYQZs9RXjpIsVjW4x6VzePDA5mRfDzxigxdvOYL8a1H93AaTHCE8suIzc4fCTGVW3fHgmXAG7Ji_axo35XGea5WFZKA6nVbZ_6457Qtk-Gv1ofwEGJWD33SoJPedhH8eWnPUr_zarDIMr1efKA1OFJK7nfNdtt14VMMtR-k6JDPQzGTChmAgmsodEqCdvfdzwkYQRErkjrPYxhxXkq9hx0nx0"
          />
        </div>

        {/* Stats Grid */}
        <div className="auth-hero-stats-bar">
          <div className="auth-stats-card">
            <div className="auth-stat-item">
              <p className="auth-stat-value">10,000+</p>
              <p className="auth-stat-label">Students</p>
            </div>
            <div className="auth-stats-divider" />
            <div className="auth-stat-item">
              <p className="auth-stat-value">500+</p>
              <p className="auth-stat-label">Lessons</p>
            </div>
            <div className="auth-stats-divider" />
            <div className="auth-stat-item">
              <p className="auth-stat-value">95%</p>
              <p className="auth-stat-label">Completion</p>
            </div>
          </div>
          <p className="auth-hero-footer-text">
            "Small progress every day leads to big results."
          </p>
        </div>
      </section>

      {/* Right Column: Form (Desktop) / Centered View (Mobile) */}
      <section className="auth-form-column">
        {/* Blurry blobs and floating icons for mobile ambiance */}
        <div className="auth-blob" style={{ width: 256, height: 256, top: -50, right: -100, backgroundColor: "#dbeaf8" }} />
        <div className="auth-blob" style={{ width: 192, height: 192, bottom: "20%", left: -80, animationDelay: "-5s", backgroundColor: "#e0e7ff" }} />
        <span className="material-symbols-outlined auth-decor-icon auth-decor-icon--1" aria-hidden>school</span>
        <span className="material-symbols-outlined auth-decor-icon auth-decor-icon--2" aria-hidden>translate</span>

        <div className="auth-form-wrapper">
          {/* Mobile Mascot & Header branding */}
          <header className="auth-mobile-header">
            <div className="auth-mobile-mascot-wrapper">
              <img
                alt="Lumina Owl Mascot"
                className="auth-mobile-mascot"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB_9kf5HilFP5SQB7Lguj4kKrAmbD5bCVXUgNFBPQL5v-CAdvDvTIeDYQZs9RXjpIsVjW4x6VzePDA5mRfDzxigxdvOYL8a1H93AaTHCE8suIzc4fCTGVW3fHgmXAG7Ji_axo35XGea5WFZKA6nVbZ_6457Qtk-Gv1ofwEGJWD33SoJPedhH8eWnPUr_zarDIMr1efKA1OFJK7nfNdtt14VMMtR-k6JDPQzGTChmAgmsodEqCdvfdzwkYQRErkjrPYxhxXkq9hx0nx0"
              />
            </div>
            <h1 className="auth-mobile-title">Learn English Smarter</h1>
            <p className="auth-mobile-subtitle">Start your journey to mastery.</p>
          </header>

          {/* Desktop Branding Title */}
          <div className="auth-brand-logo-container">
            <div className="auth-brand-logo-icon">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden>
                auto_stories
              </span>
            </div>
            <span className="auth-brand-logo-text">Lumina English</span>
          </div>

          {/* Card Frame */}
          <div className="auth-glass-card">
            <div className="auth-form-header auth-mobile-hide">
              <h2 className="auth-form-title">Create Account ✨</h2>
              <p className="auth-form-subtitle">Please fill in the form to sign up.</p>
            </div>

            {/* Warning when registration is disabled */}
            {!flags.studentSelfRegistrationEnabled ? (
              <div className="auth-alert">
                Hệ thống tạm thời không cho phép tự đăng ký. Vui lòng liên hệ quản trị viên.
              </div>
            ) : null}

            <form className="auth-form-flow" onSubmit={handleSubmit(onSubmit)}>
              {/* Display name */}
              <Controller
                control={control}
                name="name"
                rules={{
                  required: "Bắt buộc nhập tên hiển thị",
                  minLength: { value: 2, message: "Tên hiển thị tối thiểu 2 ký tự" },
                  validate: (value) => value.trim().length >= 2 || "Bắt buộc nhập tên hiển thị",
                }}
                render={({ field, fieldState }) => (
                  <div className="auth-field">
                    <label className="auth-label" htmlFor="name">Tên hiển thị</label>
                    <div className="auth-input-wrapper">
                      <span className="material-symbols-outlined auth-input-icon" aria-hidden>person</span>
                      <input
                        {...field}
                        className={`auth-input ${fieldState.error ? "auth-input--error" : ""}`}
                        id="name"
                        placeholder="Nguyễn Văn A"
                        type="text"
                        autoComplete="name"
                      />
                    </div>
                    {fieldState.error ? (
                      <span className="auth-error-message">{fieldState.error.message}</span>
                    ) : null}
                  </div>
                )}
              />

              {/* Email Controller */}
              <Controller
                control={control}
                name="email"
                rules={{
                  required: "Bắt buộc nhập email",
                  pattern: { value: /^\S+@\S+\.\S+$/, message: "Email không hợp lệ" },
                }}
                render={({ field, fieldState }) => (
                  <div className="auth-field">
                    <label className="auth-label" htmlFor="email">Email Address</label>
                    <div className="auth-input-wrapper">
                      <span className="material-symbols-outlined auth-input-icon" aria-hidden>mail</span>
                      <input
                        {...field}
                        className={`auth-input ${fieldState.error ? "auth-input--error" : ""}`}
                        id="email"
                        placeholder="name@company.com"
                        type="email"
                      />
                    </div>
                    {fieldState.error ? (
                      <span className="auth-error-message">{fieldState.error.message}</span>
                    ) : null}
                  </div>
                )}
              />

              {/* Password Controller */}
              <Controller
                control={control}
                name="password"
                rules={{
                  required: "Bắt buộc nhập mật khẩu",
                  minLength: { value: 6, message: "Mật khẩu tối thiểu 6 ký tự" },
                }}
                render={({ field, fieldState }) => (
                  <div className="auth-field">
                    <label className="auth-label" htmlFor="password">Password</label>
                    <div className="auth-input-wrapper">
                      <span className="material-symbols-outlined auth-input-icon" aria-hidden>lock</span>
                      <input
                        {...field}
                        className={`auth-input ${fieldState.error ? "auth-input--error" : ""}`}
                        id="password"
                        placeholder="••••••••"
                        type={showPassword ? "text" : "password"}
                      />
                      <button
                        className="auth-input-toggle-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        type="button"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        <span className="material-symbols-outlined" aria-hidden>
                          {showPassword ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>
                    {fieldState.error ? (
                      <span className="auth-error-message">{fieldState.error.message}</span>
                    ) : null}
                  </div>
                )}
              />

              {/* Confirm Password Controller */}
              <Controller
                control={control}
                name="confirmPassword"
                rules={{
                  required: "Bắt buộc nhập lại mật khẩu",
                  validate: (v) => v === password || "Mật khẩu không khớp",
                }}
                render={({ field, fieldState }) => (
                  <div className="auth-field">
                    <label className="auth-label" htmlFor="confirmPassword">Confirm Password</label>
                    <div className="auth-input-wrapper">
                      <span className="material-symbols-outlined auth-input-icon" aria-hidden>lock_reset</span>
                      <input
                        {...field}
                        className={`auth-input ${fieldState.error ? "auth-input--error" : ""}`}
                        id="confirmPassword"
                        placeholder="••••••••"
                        type={showConfirmPassword ? "text" : "password"}
                      />
                      <button
                        className="auth-input-toggle-btn"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        type="button"
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        <span className="material-symbols-outlined" aria-hidden>
                          {showConfirmPassword ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>
                    {fieldState.error ? (
                      <span className="auth-error-message">{fieldState.error.message}</span>
                    ) : null}
                  </div>
                )}
              />

              {/* Action Button */}
              <button
                className="auth-btn-primary"
                disabled={loading || !flags.studentSelfRegistrationEnabled}
                type="submit"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined auth-spin-icon" aria-hidden>
                      progress_activity
                    </span>
                    <span>Đang đăng ký...</span>
                  </>
                ) : (
                  "Create Account"
                )}
              </button>
            </form>

            <div className="auth-divider-row">
              <div className="auth-divider-line" />
              <span className="auth-divider-text">or continue with</span>
            </div>

            <GoogleSignInButton disabled={loading} onCredential={handleGoogleLogin} />

            <div className="auth-footer-prompt">
              <p style={{ margin: 0 }}>
                Already have an account?{" "}
                <RouterLink className="auth-footer-prompt-link" to={`/${paths.LOGIN}`}>
                  Sign In
                </RouterLink>
              </p>
            </div>
          </div>

          <div className="auth-footer-links-row auth-mobile-hide">
            <a className="auth-footer-link" href="#" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
            <a className="auth-footer-link" href="#" onClick={(e) => e.preventDefault()}>Terms of Service</a>
            <a className="auth-footer-link" href="#" onClick={(e) => e.preventDefault()}>Help Center</a>
          </div>
        </div>
      </section>
    </div>
  );
}

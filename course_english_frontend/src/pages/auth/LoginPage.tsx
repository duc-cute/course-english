import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { apiLogin } from "../../shared/api/user";
import { resolvePostLoginRedirect } from "../../shared/auth/resolvePostLoginRedirect";
import { setAccessToken } from "../../shared/auth/token";
import { setCachedAvatarUrl } from "../../shared/auth/userProfileCache";
import { paths } from "../../shared/constants/paths";
import { useFeatureFlags } from "../../shared/featureFlags/useFeatureFlags";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { useGoogleLoginHandler } from "./useGoogleLoginHandler";
import "../../styles/auth.css";

type LoginForm = {
  username: string;
  password: string;
};

export function LoginPage() {
  const { flags } = useFeatureFlags();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { control, handleSubmit } = useForm<LoginForm>();
  const navigate = useNavigate();
  const location = useLocation();
  const fromPath = (location.state as { from?: string } | null)?.from;
  const handleGoogleLogin = useGoogleLoginHandler();

  const onSubmit = async (data: LoginForm) => {
    try {
      setSubmitting(true);
      const response = await apiLogin(data);
      const token = response?.data?.access_token;
      const user = response?.data?.user;

      if (!token) {
        toast.error(response?.message || "Đăng nhập thất bại");
        return;
      }

      setAccessToken(token);
      setCachedAvatarUrl(user?.avatarUrl);
      toast.success(response?.message || "Đăng nhập thành công");
      const redirectTo = resolvePostLoginRedirect(fromPath, user?.role, user?.roles);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      const err = error as { message?: string };
      toast.error(err?.message || "Đăng nhập thất bại");
    } finally {
      setSubmitting(false);
    }
  };

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
              <h2 className="auth-form-title">Welcome Back 👋</h2>
              <p className="auth-form-subtitle">Please enter your details to sign in.</p>
            </div>

            <form className="auth-form-flow" onSubmit={handleSubmit(onSubmit)}>
              {/* Email Controller */}
              <Controller
                control={control}
                name="username"
                rules={{ required: "Bắt buộc nhập email" }}
                render={({ field, fieldState }) => (
                  <div className="auth-field">
                    <label className="auth-label" htmlFor="username">Email Address</label>
                    <div className="auth-input-wrapper">
                      <span className="material-symbols-outlined auth-input-icon" aria-hidden>mail</span>
                      <input
                        {...field}
                        className={`auth-input ${fieldState.error ? "auth-input--error" : ""}`}
                        id="username"
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
                rules={{ required: "Bắt buộc nhập mật khẩu" }}
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

              <div className="auth-checkbox-row">
                <label className="auth-checkbox-label auth-mobile-hide">
                  <input className="auth-checkbox" type="checkbox" />
                  <span>Remember Me</span>
                </label>
                <RouterLink className="auth-link" to={`/${paths.FORGOT_PASSWORD}`}>
                  Forgot Password?
                </RouterLink>
              </div>

              {/* Action Button */}
              <button className="auth-btn-primary" disabled={submitting} type="submit">
                {submitting ? (
                  <>
                    <span className="material-symbols-outlined auth-spin-icon" aria-hidden>
                      progress_activity
                    </span>
                    <span>Đang đăng nhập...</span>
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            <div className="auth-divider-row">
              <div className="auth-divider-line" />
              <span className="auth-divider-text">or continue with</span>
            </div>

            <GoogleSignInButton disabled={submitting} onCredential={handleGoogleLogin} />

            <div className="auth-footer-prompt">
              {flags.studentSelfRegistrationEnabled ? (
                <p style={{ margin: "0 0 8px 0" }}>
                  Don't have an account?{" "}
                  <RouterLink className="auth-footer-prompt-link" to={`/${paths.REGISTER}`}>
                    Create Account
                  </RouterLink>
                </p>
              ) : null}
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

import { CredentialResponse, GoogleLogin } from "@react-oauth/google";
import { useState } from "react";
import { toast } from "react-toastify";

type GoogleSignInButtonProps = {
  disabled?: boolean;
  onCredential: (idToken: string) => Promise<void>;
};

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() ?? "";

export function isGoogleSignInConfigured(): boolean {
  return googleClientId.length > 0;
}

export function GoogleSignInButton({ disabled = false, onCredential }: GoogleSignInButtonProps) {
  const [submitting, setSubmitting] = useState(false);

  if (!isGoogleSignInConfigured()) {
    return null;
  }

  const handleSuccess = async (response: CredentialResponse) => {
    const credential = response.credential;
    if (!credential) {
      toast.error("Không nhận được token từ Google");
      return;
    }

    try {
      setSubmitting(true);
      await onCredential(credential);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={`auth-google-signin-host${disabled || submitting ? " auth-google-signin-host--disabled" : ""}`}
      aria-busy={submitting}
    >
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => toast.error("Đăng nhập Google thất bại")}
        text="continue_with"
        shape="rectangular"
        theme="outline"
        size="large"
        width="360"
      />
    </div>
  );
}

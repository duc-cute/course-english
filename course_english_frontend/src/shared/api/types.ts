export type ApiResponse<T = unknown> = {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: T;
  meta?: {
    total?: number;
  };
  result?: T;
};

export type LoginResponseData = {
  access_token?: string;
  user?: {
    id?: string;
    email?: string;
    name?: string;
    avatarUrl?: string | null;
    role?: string;
    roles?: string[];
  };
};

export type ForgotPasswordNextStep = "CHECK_EMAIL" | "USE_GOOGLE";

export type ForgotPasswordData = {
  nextStep?: ForgotPasswordNextStep;
  message?: string;
};

export type UserRecord = {
  id: number | string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  role?: string;
  roles?: string[];
};

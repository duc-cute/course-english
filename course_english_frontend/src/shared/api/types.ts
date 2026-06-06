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
};

export type UserRecord = {
  id: number | string;
  email: string;
  name: string;
  role?: string;
  roles?: string[];
};

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: unknown;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'VIEWER' | 'ANALYST' | 'ADMIN';
}

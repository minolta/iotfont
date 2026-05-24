export const USER_ROLES = ['ADMIN', 'USER'] as const;

export type UserRole = (typeof USER_ROLES)[number];

export interface User {
  id: number;
  username: string;
  role: UserRole;
  enabled: boolean;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  role: UserRole;
}

export interface EditUserRequest {
  id: number;
  username?: string;
  role?: UserRole;
  enabled?: boolean;
}

export interface AdminResetPasswordRequest {
  id: number;
  newPassword: string;
}

export interface UserFormValue {
  username: string;
  role: UserRole;
  enabled: boolean;
}

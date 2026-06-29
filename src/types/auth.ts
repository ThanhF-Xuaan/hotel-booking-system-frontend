export interface User {
  username: string;
  role: string;
  fullName: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  authenticated: boolean;
}

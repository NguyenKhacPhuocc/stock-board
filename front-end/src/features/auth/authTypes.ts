export interface LoginResponse {
  accessToken: string;
  user: User;
}

export interface User {
  id: number;
  email: string;
  username?: string;
  role: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: {
    id: number;
    email: string;
    role: string;
  };
}

export interface LoginData {
  email: string;
  password: string;
}

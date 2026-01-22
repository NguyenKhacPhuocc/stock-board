// front-end/src/features/auth/authApi.ts
import { apiClient } from '@/services/apiClient';
import type { LoginResponse, LoginData } from './authTypes';

export const loginApi = (data: LoginData) => apiClient.post<LoginResponse>('/auth/login', data);

import { apiClient } from '@/services/apiClient';
import { createAsyncThunk } from '@reduxjs/toolkit';
import type { LoginResponse } from './authTypes';

export const loginThunk = createAsyncThunk(
    'auth/login',
    async (
        loginData: { email: string, password: string }, { rejectWithValue }
    ) => {
        try {
            const response = await apiClient.post<LoginResponse>('/auth/login', loginData);
            return response;
        } catch (error: any) {
            if (error.response && error.response.data && error.response.data.message) {
                return rejectWithValue(error.response.data.message);
            }
            return rejectWithValue(error.message || 'Login failed');
        }
    }
);

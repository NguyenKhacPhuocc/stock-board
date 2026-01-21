import { createSlice } from '@reduxjs/toolkit';
import { loginThunk } from './authThunks';

interface AuthState {
  isAuthenticated: boolean;
  user: any | null;
  loading: boolean;
  error: string | null;
}

const token = localStorage.getItem('accessToken');

const initialState: AuthState = {
  isAuthenticated: token !== null ? true : false,
  user: null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLogin: (state, action) => {
      state.isAuthenticated = true;
      state.user = action.payload;
      state.error = null;
    },
    setLogout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.error = null;
      localStorage.removeItem('accessToken');
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user; // Only store user info in state, token is in localStorage
        localStorage.setItem('accessToken', action.payload.accessToken);
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setLogin, setLogout, clearError } = authSlice.actions;
export default authSlice.reducer;

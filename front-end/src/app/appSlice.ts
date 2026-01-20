import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface AppState {
  locale: 'vi' | 'en';
}

const initialState: AppState = {
  locale: 'vi',
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setLocale: (state, action: PayloadAction<'vi' | 'en'>) => {
      state.locale = action.payload;
    },
  },
});

export const { setLocale } = appSlice.actions;
export default appSlice.reducer;

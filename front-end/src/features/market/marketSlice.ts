import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { marketService } from './marketService';
import type { MarketState, StockInstrument } from './marketTypes';

export const fetchInstruments = createAsyncThunk(
  'market/fetchInstruments',
  async (exchange: string) => {
    return await marketService.getInstruments(exchange);
  }
);

const initialState: MarketState = {
  stocks: [],
  loading: false,
  error: null,
};

const marketSlice = createSlice({
  name: 'market',
  initialState,
  reducers: {
    setStocks: (state, action: PayloadAction<StockInstrument[]>) => {
      state.stocks = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInstruments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInstruments.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload;

        // Robust check for BSC API structure { s: 'ok', d: [...] }
        if (payload?.s === 'ok' && Array.isArray(payload.d)) {
          state.stocks = payload.d;
        } else if (Array.isArray(payload)) {
          state.stocks = payload;
        } else {
          state.stocks = [];
        }
      })
      .addCase(fetchInstruments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch market data';
      });
  },
});

export const { setStocks, clearError } = marketSlice.actions;
export default marketSlice.reducer;

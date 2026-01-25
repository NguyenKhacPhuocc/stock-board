import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { marketService } from './marketService';
import type { MarketState, StockInstrument, MarketSymbolType } from './marketTypes';

export const fetchInstruments = createAsyncThunk(
  'market/fetchInstruments',
  async (exchange: string) => {
    return await marketService.getInstruments(exchange);
  }
);

export const fetchAllInstruments = createAsyncThunk(
  'market/fetchAllInstruments',
  async () => {
    const exchanges = ['HOSE', 'HNX', 'UPCOM'];
    const results = await Promise.allSettled(
      exchanges.map(ex => marketService.getInstruments(ex))
    );

    return results.flatMap((result, index) => {
      if (result.status === 'fulfilled') {
        const res = result.value;
        const data = (res?.s === 'ok' && Array.isArray(res.d)) ? res.d : (Array.isArray(res) ? res : []);
        return data.map((item: any) => ({ ...item, exchange: exchanges[index] }));
      }
      return [];
    });
  }
);

const initialState: MarketState = {
  stocks: [],
  allStocks: [],
  loading: false,
  error: null,
  selectedExchange: 'HOSE',
  selectedType: 'STOCK',
  highlightedSymbol: null,
  pinnedSymbols: JSON.parse(localStorage.getItem('pinnedSymbols') || '[]'),
};

const marketSlice = createSlice({
  name: 'market',
  initialState,
  reducers: {
    setStocks: (state, action: PayloadAction<StockInstrument[]>) => {
      state.stocks = action.payload;
    },
    setSelectedExchange: (state, action: PayloadAction<string>) => {
      state.selectedExchange = action.payload;
    },
    setSelectedType: (state, action: PayloadAction<MarketSymbolType>) => {
      state.selectedType = action.payload;
    },
    setHighlightedSymbol: (state, action: PayloadAction<string | null>) => {
      state.highlightedSymbol = action.payload;
    },
    togglePin: (state, action: PayloadAction<string>) => {
      const symbol = action.payload;
      if (state.pinnedSymbols.includes(symbol)) {
        state.pinnedSymbols = state.pinnedSymbols.filter(s => s !== symbol);
      } else {
        state.pinnedSymbols.push(symbol);
      }
      localStorage.setItem('pinnedSymbols', JSON.stringify(state.pinnedSymbols));
    },
    clearError: (state) => {
      state.error = null;
    },
    // Update stock data from WebSocket
    updateStockData: (state, action: PayloadAction<{ symbol: string; data: Partial<StockInstrument> }>) => {
      const { symbol, data } = action.payload;

      // Update in stocks array
      const stockIndex = state.stocks.findIndex(s => s.symbol === symbol);
      if (stockIndex !== -1) {
        state.stocks[stockIndex] = { ...state.stocks[stockIndex], ...data };
      }

      // Update in allStocks array
      const allStockIndex = state.allStocks.findIndex(s => s.symbol === symbol);
      if (allStockIndex !== -1) {
        state.allStocks[allStockIndex] = { ...state.allStocks[allStockIndex], ...data };
      }
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
      })
      .addCase(fetchAllInstruments.fulfilled, (state, action) => {
        state.allStocks = action.payload;
      });
  },
});

export const { setStocks, clearError, setSelectedExchange, setSelectedType, setHighlightedSymbol, togglePin, updateStockData } = marketSlice.actions;
export default marketSlice.reducer;

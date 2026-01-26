import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { marketService } from './marketService';
import type { MarketState, StockInstrument, MarketSymbolType } from './marketTypes';
import { normalizeBSCData } from './marketUtils';

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
        // Normalize each item to ensure it uses BSC short field names
        return data.map((item: any) => ({
          ...normalizeBSCData(item),
          exchange: exchanges[index]
        }));
      }
      return [];
    });
  }
);

const initialState: MarketState = {
  stocks: [],
  entities: {},
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
      // Initialize entities for fast O(1) lookups by Symbol (SB)
      const entities: Record<string, StockInstrument> = {};
      action.payload.forEach(stock => {
        entities[stock.SB] = stock;
      });
      state.entities = entities;
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
    // Batch update stock data from WebSocket
    batchUpdateStocks: (state, action: PayloadAction<Partial<StockInstrument>[]>) => {
      action.payload.forEach(update => {
        const symbol = update.SB;
        if (symbol && state.entities[symbol]) {
          state.entities[symbol] = { ...state.entities[symbol], ...update };
        }
      });
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
        let instruments: StockInstrument[] = [];

        if (payload?.s === 'ok' && Array.isArray(payload.d)) {
          instruments = payload.d.map(normalizeBSCData);
        } else if (Array.isArray(payload)) {
          instruments = payload.map(normalizeBSCData);
        }

        state.stocks = instruments;

        // Merge initial instruments into entities. 
        // WS updates might have already arrived, so we merge carefully.
        instruments.forEach(stock => {
          if (state.entities[stock.SB]) {
            state.entities[stock.SB] = { ...stock, ...state.entities[stock.SB] };
          } else {
            state.entities[stock.SB] = stock;
          }
        });
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

export const {
  setStocks,
  clearError,
  setSelectedExchange,
  setSelectedType,
  setHighlightedSymbol,
  togglePin,
  batchUpdateStocks
} = marketSlice.actions;

export default marketSlice.reducer;

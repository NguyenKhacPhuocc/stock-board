import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import {
  fetchAllQuotes,
  fetchAllExchangeStocks,
  type StockInstrument,
  type QuoteData,
} from './marketService';
import type { MarketState } from './marketTypes';

const getInitialExchange = (): 'HOSE' | 'HNX' | 'UPCOM' => {
  if (typeof window === 'undefined') return 'HOSE';
  const stored = sessionStorage.getItem('selectedExchange');
  return (stored as 'HOSE' | 'HNX' | 'UPCOM') || 'HOSE';
};

export const initializeMarket = createAsyncThunk(
  'market/initialize',
  async (_, { rejectWithValue }) => {
    const logger = {
      debug: (msg: string, data?: any) => {
        console.log(`[MarketSlice] ${msg}`, data || '');
      },
      error: (msg: string, error?: any) => {
        console.error(`[MarketSlice] ${msg}`, error || '');
      },
    };

    try {
      logger.debug('Starting market initialization');
      logger.debug('Step 1: Fetching all quotes from BSC API');
      const allQuotes = await fetchAllQuotes();
      logger.debug('Step 2: Quotes loaded successfully');
      return allQuotes;
    } catch (error) {
      logger.error('Market initialization failed', error);
      return rejectWithValue('Failed to initialize market');
    }
  }
);

export const loadExchangeStocks = createAsyncThunk(
  'market/loadExchangeStocks',
  async (
    { exchange, quoteData }: { exchange: string; quoteData: Map<string, QuoteData> },
    { rejectWithValue }
  ) => {
    const logger = {
      debug: (msg: string, data?: any) => {
        console.log(`[MarketSlice] ${msg}`, data || '');
      },
      error: (msg: string, error?: any) => {
        console.error(`[MarketSlice] ${msg}`, error || '');
      },
    };

    try {
      logger.debug(`Loading stocks for exchange: ${exchange}`);
      const stocks = await fetchAllExchangeStocks(exchange, quoteData);
      logger.debug(`Loaded ${stocks.length} stocks for ${exchange}`);
      return { exchange, stocks };
    } catch (error) {
      logger.error(`Failed to load stocks for ${exchange}`, error);
      return rejectWithValue(`Failed to load ${exchange} stocks`);
    }
  }
);

const initialState: MarketState = {
  stocks: [],
  entities: {},
  allQuotes: new Map(),
  loading: false,
  error: null,
  selectedExchange: getInitialExchange(),
  selectedType: 'STOCK',
  pinnedSymbols: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('pinnedSymbols') || '[]') : [],
  highlightedSymbol: null,
};

const marketSlice = createSlice({
  name: 'market',
  initialState,
  reducers: {
    batchUpdateStocks: (state, action: PayloadAction<Partial<StockInstrument>[]>) => {
      action.payload.forEach(update => {
        const symbol = (update as any).SB;
        if (symbol && state.entities[symbol]) {
          state.entities[symbol] = { ...state.entities[symbol], ...update };
        }
      });
    },

    setSelectedExchange: (state, action: PayloadAction<'HOSE' | 'HNX' | 'UPCOM'>) => {
      state.selectedExchange = action.payload;
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('selectedExchange', action.payload);
      }
    },

    setSelectedType: (state, action: PayloadAction<string>) => {
      state.selectedType = action.payload;
    },

    togglePin: (state, action: PayloadAction<string>) => {
      const symbol = action.payload;
      const index = state.pinnedSymbols.indexOf(symbol);
      if (index > -1) {
        state.pinnedSymbols.splice(index, 1);
      } else {
        state.pinnedSymbols.push(symbol);
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('pinnedSymbols', JSON.stringify(state.pinnedSymbols));
      }
    },

    setHighlightedSymbol: (state, action: PayloadAction<string | null>) => {
      state.highlightedSymbol = action.payload;
    },

    clearError: (state) => {
      state.error = null;
    },
  },

  extraReducers: builder => {
    builder
      .addCase(initializeMarket.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(initializeMarket.fulfilled, (state, action) => {
        state.allQuotes = action.payload;
        state.loading = false;
      })
      .addCase(initializeMarket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(loadExchangeStocks.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadExchangeStocks.fulfilled, (state, action) => {
        const { stocks } = action.payload;
        state.stocks = stocks;
        state.entities = {};
        stocks.forEach(stock => {
          state.entities[(stock as any).SB] = stock;
        });
        state.loading = false;
      })
      .addCase(loadExchangeStocks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  batchUpdateStocks,
  setSelectedExchange,
  setSelectedType,
  togglePin,
  setHighlightedSymbol,
  clearError,
} = marketSlice.actions;

export default marketSlice.reducer;

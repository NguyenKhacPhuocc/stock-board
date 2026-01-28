import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { fetchAllQuotes, fetchAllExchangeStocks } from "./marketApi";
import type {
  StockInstrument,
  MarketState,
  ExchangeType,
  Logger,
  NormalizedQuoteMap,
} from "./marketTypes";

const getInitialExchange = (): ExchangeType => {
  if (typeof window === "undefined") return "HOSE";
  const stored = sessionStorage.getItem("selectedExchange");
  return (stored as ExchangeType) || "HOSE";
};

const createLogger = (prefix: string): Logger => ({
  debug: (msg: string, data?: unknown): void => {
    console.log(`[${prefix}] ${msg}`, data || "");
  },
  error: (msg: string, error?: unknown): void => {
    console.error(`[${prefix}] ${msg}`, error || "");
  },
});

export const initializeMarket = createAsyncThunk(
  "market/initialize",
  async (exchange: ExchangeType = "HOSE", { rejectWithValue }) => {
    const logger = createLogger("MarketSlice");

    try {
      const allQuotes = await fetchAllQuotes();
      const stocks = await fetchAllExchangeStocks(exchange, allQuotes);
      logger.debug("Market initialization failed", {
        allQuotes,
        stocks,
        exchange,
      });
      
      return { allQuotes, stocks, exchange };
    } catch (error) {
      logger.error("Market initialization failed", error);
      return rejectWithValue("Failed to initialize market");
    }
  },
);

export const loadExchangeStocks = createAsyncThunk(
  "market/loadExchangeStocks",
  async (
    {
      exchange,
      quoteData,
    }: { exchange: string; quoteData: NormalizedQuoteMap },
    { rejectWithValue },
  ) => {
    const logger = createLogger("MarketSlice");

    try {
      logger.debug(`Loading stocks for exchange: ${exchange}`);
      const stocks = await fetchAllExchangeStocks(exchange, quoteData);
      logger.debug(`Loaded ${stocks.length} stocks for ${exchange}`);
      return { exchange, stocks };
    } catch (error) {
      logger.error(`Failed to load stocks for ${exchange}`, error);
      return rejectWithValue(`Failed to load ${exchange} stocks`);
    }
  },
);

const initialState: MarketState = {
  stocks: [],
  entities: {},
  allQuotes: new Map(),
  loading: false,
  error: null,
  selectedExchange: getInitialExchange(),
  selectedType: "STOCK",
  pinnedSymbols:
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("pinnedSymbols") || "[]")
      : [],
  highlightedSymbol: null,
};

const marketSlice = createSlice({
  name: "market",
  initialState,
  reducers: {
    batchUpdateStocks: (
      state,
      action: PayloadAction<Partial<StockInstrument>[]>,
    ) => {
      action.payload.forEach((update) => {
        const symbol = update.SB;
        if (symbol && state.entities[symbol]) {
          state.entities[symbol] = { ...state.entities[symbol], ...update };
        }
      });
    },

    setSelectedExchange: (state, action: PayloadAction<ExchangeType>) => {
      state.selectedExchange = action.payload;
      if (typeof window !== "undefined") {
        sessionStorage.setItem("selectedExchange", action.payload);
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
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "pinnedSymbols",
          JSON.stringify(state.pinnedSymbols),
        );
      }
    },

    setHighlightedSymbol: (state, action: PayloadAction<string | null>) => {
      state.highlightedSymbol = action.payload;
    },

    clearError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(initializeMarket.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(initializeMarket.fulfilled, (state, action) => {
        const { allQuotes, stocks } = action.payload;
        state.allQuotes = allQuotes;
        state.stocks = stocks;
        state.entities = {};
        stocks.forEach((stock) => {
          state.entities[stock.SB] = stock;
        });
        state.loading = false;
      })
      .addCase(initializeMarket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(loadExchangeStocks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadExchangeStocks.fulfilled, (state, action) => {
        const { stocks } = action.payload;
        state.stocks = stocks;
        state.entities = {};
        stocks.forEach((stock) => {
          state.entities[stock.SB] = stock;
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

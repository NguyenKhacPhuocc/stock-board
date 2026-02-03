/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { fetchAllQuotes, fetchInstrumentsByExchange, fetchIndexSnapshot } from "./marketApi";
import type {
  StockInstrument,
  MarketState,
  ExchangeType,
  Logger,
  NormalizedQuoteMap,
  ChartDataPoint,
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

/**
 * Map market status to open/closed based on exchange type
 * HOSE, HNX: P(pre), O(open), A(ATC), B(break), C(close), H(halt)
 * UPCOM: 1(pre), 2(ATO), 5(open), 6(ATC), 7(close), 9(halt)
 */
const mapMarketStatus = (status: string, exchange: string): "open" | "closed" => {
  // UPCOM uses numeric codes
  if (exchange === "UPCOM" || exchange === "HNX") {
    return status === "5" ? "open" : "closed";
  }
  // HOSE, HNX use letter codes
  return status === "O" ? "open" : "closed";
};

export const initializeMarket = createAsyncThunk(
  "market/initialize",
  async (exchange: ExchangeType = "HOSE", { rejectWithValue }) => {
    const logger = createLogger("MarketSlice");

    try {
      const allQuotes = await fetchAllQuotes();
      const stocks = await fetchInstrumentsByExchange(exchange, allQuotes);
      const indexSnapshot = await fetchIndexSnapshot();
      
      return { allQuotes, stocks, exchange, indexSnapshot };
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
      const stocks = await fetchInstrumentsByExchange(exchange, quoteData);
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
  indices: {}, // Market index by exchange
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

    updateIndexData: (
      state,
      action: PayloadAction<{ exchange: ExchangeType; rawData: any }>,
    ) => {
      const { exchange, rawData } = action.payload;
      
      const previousData = state.indices[exchange];
      if (!previousData) return;

      const miValue = parseFloat(rawData.MI);
      if (isNaN(miValue) || rawData.MI === undefined || rawData.MI === null) {
        state.indices[exchange] = {
          ...previousData,
          totalVolume: parseInt(rawData.TV, 10) || previousData.totalVolume,
          totalValue: parseFloat(rawData.TVA) || previousData.totalValue,
          status: mapMarketStatus(rawData.MS, exchange),
          counts: {
            up: rawData.ADV ? parseInt(rawData.ADV, 10) : (previousData?.counts.up ?? 0),
            reference: rawData.NC ? parseInt(rawData.NC, 10) : (previousData?.counts.reference ?? 0),
            down: rawData.DE ? parseInt(rawData.DE, 10) : (previousData?.counts.down ?? 0),
          },
        };
        return;
      }

      const status = mapMarketStatus(rawData.MS, exchange);
      const change = parseFloat(rawData.ICH) || 0;
      const changePercent = parseFloat(rawData.IPC) || 0;
      const color = change > 0 ? "up" : change < 0 ? "down" : "ref";

      const normalizedTime = (rawData.IT || "").substring(0, 5);
      const newPoint: ChartDataPoint = {
        time: normalizedTime,
        value: miValue,
        volume: 0,
        unixtime: Date.now(),
      };

      const currentTotalVolume = parseInt(rawData.TV, 10) || 0;
      const previousTotalVolume = previousData.totalVolume || 0;
      const volumeIncoming = Math.max(0, currentTotalVolume - previousTotalVolume);

      let updatedChart = previousData.chartData || [];
      let currentPointVolume = previousData.currentPointVolume || 0;

      if (updatedChart.length === 0) {
        // First candle: start with incoming volume
        updatedChart = [{ ...newPoint, volume: volumeIncoming }];
        currentPointVolume = volumeIncoming;
      } else {
        const lastPoint = updatedChart[updatedChart.length - 1];
        const timeChanged = lastPoint.time !== normalizedTime;

        if (timeChanged) {
          // Minute changed: close previous candle, start new one
          currentPointVolume += volumeIncoming;
          lastPoint.volume = Math.max(0, currentPointVolume);
          updatedChart.push(newPoint);
          currentPointVolume = 0;
        } else {
          // Same minute: accumulate volume
          currentPointVolume += volumeIncoming;
          lastPoint.volume = currentPointVolume;
        }
      }

      state.indices[exchange] = {
        ...previousData,
        currentValue: miValue,
        change,
        changePercent,
        totalVolume: currentTotalVolume,
        totalValue: parseFloat(rawData.TVA) || previousData.totalValue,
        status,
        counts: {
          up: rawData.ADV ? parseInt(rawData.ADV, 10) : (previousData?.counts.up ?? 0),
          reference: rawData.NC ? parseInt(rawData.NC, 10) : (previousData?.counts.reference ?? 0),
          down: rawData.DE ? parseInt(rawData.DE, 10) : (previousData?.counts.down ?? 0),
        },
        chartData: updatedChart,
        color,
        currentPointVolume,
      };
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(initializeMarket.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(initializeMarket.fulfilled, (state, action) => {
        const { allQuotes, stocks, indexSnapshot } = action.payload;
        state.allQuotes = allQuotes;
        state.stocks = stocks;
        state.entities = {};
        stocks.forEach((stock) => {
          state.entities[stock.SB] = stock;
        });
        
        // Process index snapshot
        if (indexSnapshot) {
          Object.entries(indexSnapshot).forEach(([exchange, rawData]) => {
            const status = mapMarketStatus(rawData.marketStatus, exchange);
            const change = parseFloat(rawData.indexChange) || 0;
            const changePercent = parseFloat(rawData.indexPercentChange) || 0;
            const color = change > 0 ? "up" : change < 0 ? "down" : "ref";
            
            const initialChart: ChartDataPoint[] = (rawData as any).chartData && Array.isArray((rawData as any).chartData)
              ? (rawData as any).chartData as ChartDataPoint[]
              : [{
                  time: rawData.indexTime || "",
                  value: parseFloat(rawData.marketIndex) || 0,
                  volume: parseInt(rawData.totalVolume, 10) || 0,
                  unixtime: typeof rawData.ts === 'number' ? rawData.ts : Date.now(),
                }];

            state.indices[exchange] = {
              id: exchange,
              name: exchange,
              currentValue: parseFloat(rawData.marketIndex) || 0,
              change,
              changePercent,
              totalVolume: parseInt(rawData.totalVolume, 10) || 0,
              totalValue: parseFloat(rawData.totalValue) || 0,
              status,
              counts: {
                up: parseInt(rawData.advances, 10) || 0,
                reference: parseInt(rawData.noChange, 10) || 0,
                down: parseInt(rawData.declines, 10) || 0,
              },
              chartData: initialChart,
              color,
              currentPointVolume: 0, // Track volume of current (open) candle
            };
          });
        }
        
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
  updateIndexData,
} = marketSlice.actions;

export default marketSlice.reducer;

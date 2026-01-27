/**
 * Market API Service
 * Handles all API calls for market data
 */

import axios from "axios";
import {
  normalizeQuoteData,
  normalizeInstrumentData,
  mergeStockData,
} from "./fieldMapping";
import type {
  StockInstrument,
  QuoteDataRaw,
  InstrumentDataRaw,
  QuotesApiResponse,
  InstrumentsApiResponse,
  NormalizedQuoteMap,
  Logger,
} from "./marketTypes";

// ============================================================================
// Logger
// ============================================================================

const logger: Logger = {
  debug: (msg: string, data?: unknown): void => {
    console.log(`[MarketApi] ${msg}`, data || "");
  },
  error: (msg: string, error?: unknown): void => {
    console.error(`[MarketApi] ${msg}`, error || "");
  },
};

// ============================================================================
// Data Transformation
// ============================================================================

/**
 * Transform normalized data to StockInstrument
 */
const createStockInstrument = (
  instrumentNormalized: Record<string, unknown>,
  quoteNormalized?: Record<string, unknown>,
): StockInstrument => {
  const merged = mergeStockData(quoteNormalized, instrumentNormalized);
  const sym = String(merged.SB || "");

  return {
    SB: sym,
    symbol: sym,
    FullName: merged.FN as string,
    StockType: merged.ST as string,
    exchange: merged.EX as StockInstrument["exchange"],
    IssuerName: merged.IN as string,
    tradelot: (merged.TL as number) || 100,
    nvalue: merged.NV as number,
    pricestep: merged.PS as number,
    cond_effdate: merged.CE as string,

    RE: (merged.RE as number) || 0,
    CL: (merged.CL as number) || 0,
    FL: (merged.FL as number) || 0,
    reference: (merged.RE as number) || 0,
    ceiling: (merged.CL as number) || 0,
    floor: (merged.FL as number) || 0,

    B1: merged.B1 as number,
    B2: merged.B2 as number,
    B3: merged.B3 as number,
    V1: merged.V1 as number,
    V2: merged.V2 as number,
    V3: merged.V3 as number,

    S1: merged.S1 as number,
    S2: merged.S2 as number,
    S3: merged.S3 as number,
    U1: merged.U1 as number,
    U2: merged.U2 as number,
    U3: merged.U3 as number,

    CP: merged.CP as number,
    CV: merged.CV as number,
    CH: merged.CH as number,
    CHP: merged.CHP as number,

    OP: merged.OP as number,
    HI: merged.HI as number,
    LO: merged.LO as number,
    AP: merged.AP as number,

    TT: merged.TT as number,
    TV: merged.TV as number,

    FB: merged.FB as number,
    FS: merged.FS as number,
    FR: merged.FR as number,
    FO: merged.FO as number,
  };
};

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch all quotes (static stock info)
 * Called once on initialization
 */
export const fetchAllQuotes = async (): Promise<NormalizedQuoteMap> => {
  try {
    logger.debug("Fetching all quotes from BSC API");
    const response = await axios.get<QuoteDataRaw[] | QuotesApiResponse>(
      "/api-trade/trade/quotes?symbols=ALL",
    );
    const data = response.data;

    const quoteMap: NormalizedQuoteMap = new Map();

    let dataArray: QuoteDataRaw[] = [];
    if (Array.isArray(data)) {
      dataArray = data;
    } else if (data?.s === "ok" && Array.isArray(data.d)) {
      dataArray = data.d;
    }

    dataArray.forEach((quote) => {
      const normalized = normalizeQuoteData(
        quote as unknown as Record<string, unknown>,
      );
      quoteMap.set(quote.symbol, normalized);
    });

    logger.debug(`Fetched ${quoteMap.size} quotes`, {
      exchanges: {
        HOSE: dataArray.filter((q) => q.exchange === "HOSE").length,
        HNX: dataArray.filter((q) => q.exchange === "HNX").length,
        UPCOM: dataArray.filter((q) => q.exchange === "UPCOM").length,
      },
    });

    return quoteMap;
  } catch (error) {
    logger.error("Failed to fetch quotes", error);
    throw error;
  }
};

/**
 * Fetch instruments for a specific exchange
 * Called when switching exchange tabs
 */
export const fetchInstruments = async (
  exchange: string,
): Promise<StockInstrument[]> => {
  try {
    logger.debug(`Fetching instruments for exchange: ${exchange}`);
    const response = await axios.get<
      InstrumentDataRaw[] | InstrumentsApiResponse
    >(`/api-bsc/datafeed/instruments?exchange=${exchange}`);
    const data = response.data;

    let instruments: InstrumentDataRaw[] = [];
    if (Array.isArray(data)) {
      instruments = data;
    } else if (data?.s === "ok" && Array.isArray(data.d)) {
      instruments = data.d;
    }

    const stocks = instruments.map((instrument) => {
      const normalized = normalizeInstrumentData(
        instrument as unknown as Record<string, unknown>,
      );
      return createStockInstrument(normalized);
    });

    logger.debug(`Fetched ${stocks.length} instruments for ${exchange}`);
    return stocks;
  } catch (error) {
    logger.error(`Failed to fetch instruments for ${exchange}`, error);
    throw error;
  }
};

/**
 * Fetch instruments and merge with quote data
 */
export const fetchInstrumentsByExchange = async (
  exchange: string,
  quoteData: NormalizedQuoteMap,
): Promise<StockInstrument[]> => {
  try {
    logger.debug(`Fetching instruments for exchange: ${exchange}`);
    const response = await axios.get<
      InstrumentDataRaw[] | InstrumentsApiResponse
    >(`/api-bsc/datafeed/instruments?exchange=${exchange}`);
    const data = response.data;

    let instruments: InstrumentDataRaw[] = [];
    if (Array.isArray(data)) {
      instruments = data;
    } else if (data?.s === "ok" && Array.isArray(data.d)) {
      instruments = data.d;
    }

    const stocks = instruments.map((instrument) => {
      const instrumentNormalized = normalizeInstrumentData(
        instrument as unknown as Record<string, unknown>,
      );
      const sym = instrument.symbol;
      const quoteNormalized = quoteData.get(sym);
      return createStockInstrument(instrumentNormalized, quoteNormalized);
    });

    logger.debug(`Fetched ${stocks.length} instruments for ${exchange}`);
    return stocks;
  } catch (error) {
    logger.error(`Failed to fetch instruments for ${exchange}`, error);
    throw error;
  }
};

/**
 * Alias for fetchInstrumentsByExchange
 */
export const fetchAllExchangeStocks = fetchInstrumentsByExchange;

/**
 * Market Types
 * All type definitions for market feature
 */

import type { CSSProperties } from "react";

// ============================================================================
// Exchange & Symbol Types
// ============================================================================

export type ExchangeType = "HOSE" | "HNX" | "UPCOM";

// ============================================================================
// Raw API Response Types (before normalization)
// ============================================================================

/** Raw quote data from /trade/quotes API */
export interface QuoteDataRaw {
  symbol: string;
  ceiling: number;
  floor: number;
  reference: number;
  exchange: ExchangeType | "XHNF";
  tradelot: number;
  nvalue: number | null;
  pricestep: number | null;
  FullName: string;
  StockType: string;
  IssuerName: string | null;
  cond_effdate: string | null;
}

/** Raw instrument data from /datafeed/instruments API */
export interface InstrumentDataRaw {
  symbol: string;
  reference?: number;
  ceiling?: number;
  floor?: number;
  closePrice?: number;
  closeVol?: number;
  change?: number;
  changePercent?: number;
  bidPrice1?: number | string;
  bidVol1?: number;
  bidPrice2?: number | string;
  bidVol2?: number;
  bidPrice3?: number | string;
  bidVol3?: number;
  offerPrice1?: number | string;
  offerVol1?: number;
  offerPrice2?: number | string;
  offerVol2?: number;
  offerPrice3?: number | string;
  offerVol3?: number;
  high?: number;
  low?: number;
  open?: number;
  totalTrading?: number;
  totalTradingValue?: number;
  foreignBuy?: number;
  foreignSell?: number;
  averagePrice?: number;
  FullName?: string;
  StockType?: string;
  exchange?: string;
}

/** API response wrapper for instruments */
export interface InstrumentsApiResponse {
  s?: string;
  d?: InstrumentDataRaw[];
}

/** API response wrapper for quotes */
export interface QuotesApiResponse {
  s?: string;
  ec?: number;
  em?: string;
  d?: QuoteDataRaw[];
}

// ============================================================================
// Market Index Types
// ============================================================================

/** Raw index data from /datafeed/indexsnaps/ API */
export interface IndexSnapshotRaw {
  tradingdate: string;
  marketIndex: string;
  indexTime: string;
  indexColor: "up" | "down" | "unchanged";
  indexChange: string;
  indexPercentChange: string;
  totalTrade: string;
  totalVolume: string;
  totalValue: string;
  marketStatus: string; // "O" = open, "I" = interim/off, "C" = closed
  advances: string;
  declines: string;
  noChange: string;
  advancesVolumn: string;
  declinesVolumn: string;
  noChangeVolumn: string;
  marketId: string;
  marketCode: ExchangeType;
  PRV_PRIOR_MARKET_INDEX?: string;
  AVR_MARKET_INDEX?: string;
  AVR_PRIOR_MARKET_INDEX?: string;
  AVR_CHG_INDEX?: string;
  AVR_PCT_INDEX?: string;
  PT_TOTAL_QTTY?: string;
  PT_TOTAL_VALUE?: string;
  PT_TOTAL_TRADE?: string;
  numberOfCe?: string;
  numberOfFl?: string;
  oddLotTotalVolume?: string;
  oddLotTotalValue?: string;
  ts?: number;
  kid?: string;
}

/** Index snapshot API response */
export interface IndexSnapshotApiResponse {
  s: string;
  ec: number;
  em: string;
  d: IndexSnapshotRaw[];
}


// ============================================================================
// Normalized Stock Data (using SHORT field names)
// ============================================================================

/**
 * StockInstrument - normalized stock data using short field names
 *
 * Field naming convention from BSC WebSocket:
 * - SB: Symbol
 * - RE: Reference price
 * - CL: Ceiling price
 * - FL: Floor price
 * - B1/B2/B3: Bid prices
 * - V1/V2/V3: Bid volumes
 * - S1/S2/S3: Offer/Ask prices
 * - U1/U2/U3: Offer/Ask volumes
 * - CP: Close/Current price
 * - CV: Close volume
 * - CH: Change (absolute)
 * - CHP: Change percent
 */
export interface StockInstrument {
  // Identity (required)
  SB: string;
  RE: number;
  CL: number;
  FL: number;

  // Bid (Buy) prices/volumes
  B1?: number;
  B2?: number;
  B3?: number;
  V1?: number;
  V2?: number;
  V3?: number;

  // Offer (Sell) prices/volumes
  S1?: number;
  S2?: number;
  S3?: number;
  U1?: number;
  U2?: number;
  U3?: number;

  // Match/Close
  CP?: number;
  CV?: number;
  CH?: number;
  CHP?: number;

  // OHLC
  OP?: number;
  HI?: number;
  LO?: number;
  AP?: number;

  // Volume/Value
  TT?: number;
  TV?: number;

  // Foreign
  FB?: number;
  FS?: number;
  FR?: number;
  FO?: number;

  // Legacy/additional fields (for backwards compatibility)
  symbol?: string;
  FullName?: string;
  exchange?: ExchangeType | "XHNF";
  StockType?: string;
  tradelot?: number;
  ceiling?: number;
  floor?: number;
  reference?: number;
  nvalue?: number | null;
  pricestep?: number | null;
  IssuerName?: string | null;
  cond_effdate?: string | null;

  // Index signature for dynamic WebSocket updates
  [key: string]: unknown;
}

/** Normalized quote data map */
export type NormalizedQuoteMap = Map<string, Record<string, unknown>>;

// ============================================================================
// Market Index Types
// ============================================================================

export interface MarketIndexData {
  id: string;
  name: string;
  currentValue: number;
  change: number;
  changePercent: number;
  totalVolume: number;
  totalValue: number;
  status: "open" | "closed";
  counts: {
    up: number;
    reference: number;
    down: number;
  };
  chartData: {
    time: string;
    value: number;
    volume: number;
  }[];
  color: "up" | "down" | "ref";
  currentPointVolume: number; // Track volume of current (open) candle
}

// ============================================================================
// Redux State Types
// ============================================================================

export interface MarketState {
  stocks: StockInstrument[];
  entities: Record<string, StockInstrument>;
  allQuotes: NormalizedQuoteMap;
  indices: Record<string, MarketIndexData>; // Market index by exchange
  loading: boolean;
  error: string | null;
  selectedExchange: ExchangeType;
  selectedType: string;
  highlightedSymbol: string | null;
  pinnedSymbols: string[];
}

// ============================================================================
// Chart In Day Types
// ============================================================================

/** Chart data point for intraday chart */
export interface ChartDataPoint {
  time: string; // Formatted time (HH:MM:SS)
  value: number; // Close price/index value
  volume: number; // Trading volume
  unixtime: number; // Unix timestamp
}

/** Raw chart in day data from /datafeed/chartinday/ API */
export interface ChartInDayRaw {
  formattedtime: string[]; // Array of time strings (HH:MM:SS)
  volume: number[]; // Array of volumes
  reference: number[]; // Array with single reference value
  close: number[]; // Array of close prices
  unixtime: number[]; // Array of unix timestamps
}

/** Chart in day API response (keyed by exchange) */
export interface ChartInDayApiResponse {
  s: string;
  ec: number;
  em: string;
  d: Record<string, ChartInDayRaw>;
}

// ============================================================================
// WebSocket Types
// ============================================================================

/** WebSocket update payload */
export interface WSUpdatePayload {
  a: "u" | "s"; // action: update or snapshot
  d: StockInstrument[];
}

// ============================================================================
// Utility Types
// ============================================================================

/** Logger interface for consistent logging */
export interface Logger {
  debug: (msg: string, data?: unknown) => void;
  error: (msg: string, error?: unknown) => void;
}

// ============================================================================
// UI Component Types
// ============================================================================

/** Cell display type for market table */
export type CellType = "price" | "vol" | "percent" | "change" | "text";

export type VirtualRowData = {
  unpinnedSymbols: string[];
  highlightedSymbol: string | null;
};

export type CellColorType = "up" | "down" | "ref" | "ceiling" | "floor";


export interface CellData {
  value: string;
  colorClass: string;
  colorType?: CellColorType;
  rawValue?: unknown;
}

export interface StockRowProps {
  symbol: string;
  isHighlighted: boolean;
  isPinned: boolean;
  style?: CSSProperties;
}


export interface SymbolCellProps {
  symbol: string;
  symbolColorClass: string;
  isPinned: boolean;
}

export interface MarketCellProps {
  symbol: string;
  field: string;
  type?: CellType;
  colorField?: string;
  fixedColorClass?: string;
  className?: string;
}
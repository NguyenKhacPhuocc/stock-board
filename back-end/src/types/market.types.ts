/**
 * Market data types for type safety across the application
 */

// Raw BSC instrument data format
export interface BSCInstrumentData {
  SB: string; // Symbol
  CP?: number; // Current Price
  CH?: number; // Change
  CHP?: number; // Change Percentage
  B1?: number; // Best Bid Price
  V1?: number; // Best Bid Volume
  S1?: number; // Best Ask Price
  U1?: number; // Best Ask Volume
  HI?: number; // High
  LO?: number; // Low
  OP?: number; // Open
  TT?: number; // Total Traded Volume
  TV?: number; // Total Traded Value
  RE: number; // Reference Price
  CL: number; // Ceiling Price
  FL: number; // Floor Price
  [key: string]: any;
}

// Raw BSC index data format
export interface BSCIndexData {
  SB?: string; // Symbol (for indices)
  Id?: string; // Alternative ID field
  symbol?: string; // Alternative symbol field
  CP?: number; // Current Value
  CH?: number; // Change
  CHP?: number; // Change Percentage
  TT?: number; // Total Volume
  TV?: number; // Total Value
  [key: string]: any;
}

// BSC feed payload format
export interface BSCFeedPayload {
  a: "u" | "s"; // Action: 'u' = update, 's' = snapshot
  d: BSCInstrumentData[] | BSCIndexData[];
}

// Socket event types
export type MarketEventType = "i" | "idx";

// Subscription acknowledgment
export interface SubscriptionAck {
  status: "ok" | "error";
  message?: string;
  subscribed?: number;
  unsubscribed?: number;
}

// Market snapshot item
export type MarketSnapshotItem = BSCInstrumentData | BSCIndexData;

/**
 * Field Mapping for different data sources
 *
 * Internal storage uses SHORT names (SB, CL, FL, RE, B1, S1, etc.)
 * because WebSocket already sends data in this format.
 *
 * Data sources:
 * 1. quotes API: Full names (symbol, ceiling, floor, reference, FullName, etc.)
 * 2. instruments API: Full names (symbol, bidPrice1, offerPrice1, closePrice, etc.)
 * 3. WebSocket: Short names (SB, CL, FL, RE, B1, S1, CP, etc.)
 */

/**
 * Parse a price value that might be a string like "7800.0" or a number
 */
const parsePrice = (value: unknown): number | undefined => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
};

/**
 * Normalize data from quotes API to internal short format
 * quotes API provides: symbol, ceiling, floor, reference, FullName, StockType, exchange, tradelot
 */
export const normalizeQuoteData = (
  raw: Record<string, unknown>,
): Record<string, unknown> => {
  return {
    SB: raw.symbol,
    FN: raw.FullName,
    ST: raw.StockType,
    EX: raw.exchange,
    CL: raw.ceiling,
    FL: raw.floor,
    RE: raw.reference,
    TL: raw.tradelot,
    IN: raw.IssuerName,
    NV: raw.nvalue,
    PS: raw.pricestep,
    CE: raw.cond_effdate,
  };
};

/**
 * Normalize data from instruments API to internal short format
 * instruments API provides full trading data with long field names
 */
export const normalizeInstrumentData = (
  raw: Record<string, unknown>,
): Record<string, unknown> => {
  return {
    // Identity
    SB: raw.symbol,
    SI: raw.StockId,
    FN: raw.FullName,
    TD: raw.tradingdate,
    FC: raw.FloorCode,
    ST: raw.StockType,
    EX: raw.exchange,
    IN: raw.IssuerName,
    SS: raw.Status,
    SC: raw.symbolStatusCode,

    // Price levels
    CL: raw.ceiling,
    FL: raw.floor,
    RE: raw.reference,

    // Bid prices/volumes (may be string like "7800.0")
    B1: parsePrice(raw.bidPrice1),
    B2: parsePrice(raw.bidPrice2),
    B3: parsePrice(raw.bidPrice3),
    V1: raw.bidVol1,
    V2: raw.bidVol2,
    V3: raw.bidVol3,

    // Offer prices/volumes
    S1: parsePrice(raw.offerPrice1),
    S2: parsePrice(raw.offerPrice2),
    S3: parsePrice(raw.offerPrice3),
    U1: raw.offerVol1,
    U2: raw.offerVol2,
    U3: raw.offerVol3,

    // Match/Close
    CP: raw.closePrice,
    CV: raw.closeVol,
    CH: raw.change,
    CHP: raw.changePercent,

    // OHLC
    OP: raw.open,
    HI: raw.high,
    LO: raw.low,
    AP: raw.averagePrice,

    // Volume/Value
    TT: raw.totalTrading,
    TV: raw.totalTradingValue,

    // Foreign
    FB: raw.foreignBuy,
    FS: raw.foreignSell,
    FR: raw.foreignRemain,
    FO: raw.foreignRoom,

    // PT
    PMP: raw.PT_MATCH_PRICE,
    PMQ: raw.PT_MATCH_QTTY,
    PTQ: raw.PT_TOTAL_TRADED_QTTY,
    PTV: raw.PT_TOTAL_TRADED_VALUE,
    PP: raw.PRIOR_PRICE,
    TO: raw.TOTAL_OFFER_QTTY,
    TB: raw.TOTAL_BID_QTTY,

    // Others
    EP: raw.ExercisePrice,
  };
};

/**
 * WebSocket data already uses short names, just pass through
 * but ensure we handle any edge cases
 */
// export const normalizeWsData = (
//   raw: Record<string, unknown>,
// ): Record<string, unknown> => {
//   // WS data already in short format, just return as-is
//   return raw;
// };

/**
 * Merge two stock records, with newer data taking precedence
 */
export const mergeStockData = (
  existing: Record<string, unknown> | undefined,
  update: Record<string, unknown>,
): Record<string, unknown> => {
  if (!existing) return update;

  const merged = { ...existing };

  // Only update fields that have actual values (not undefined/null)
  for (const [key, value] of Object.entries(update)) {
    if (value !== undefined && value !== null) {
      merged[key] = value;
    }
  }

  return merged;
};

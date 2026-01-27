export interface MarketIndexData {
  id: string;
  name: string;
  currentValue: number;
  change: number;
  changePercent: number;
  totalVolume: number;
  totalValue: number;
  status: 'open' | 'closed';
  counts: {
    up: number;
    ceiling: number;
    reference: number;
    down: number;
    floor: number;
  };
  chartData: {
    time: string;
    value: number;
    volume: number;
  }[];
  color: 'up' | 'down' | 'ref';
}

// Using BSC's original short field names for performance (no parsing needed)
export interface StockInstrument {
  SB: string;      // Symbol
  RE: number;      // Reference price
  CL: number;      // Ceiling price
  FL: number;      // Floor price
  B1?: number;     // Bid Price 1
  V1?: number;     // Bid Volume 1
  B2?: number;     // Bid Price 2
  V2?: number;     // Bid Volume 2
  B3?: number;     // Bid Price 3
  V3?: number;     // Bid Volume 3
  S1?: number;     // Offer/Ask Price 1
  U1?: number;     // Offer/Ask Volume 1
  S2?: number;     // Offer/Ask Price 2
  U2?: number;     // Offer/Ask Volume 2
  S3?: number;     // Offer/Ask Price 3
  U3?: number;     // Offer/Ask Volume 3
  CP?: number;     // Close Price (current/last matched price)
  CV?: number;     // Close Volume (last matched volume)
  CH?: number;     // Change (absolute)
  CHP?: number;    // Change Percent (ratio)
  HI?: number;     // High price
  LO?: number;     // Low price
  AP?: number;     // Average Price
  TT?: number;     // Total Traded Quantity
  TV?: number;     // Total Traded Value
  OP?: number;     // Open price
  FB?: number;     // Foreign Buy
  FS?: number;     // Foreign Sell
  [key: string]: any;
}

export type MarketSymbolType = 'STOCK' | 'WARRANT' | 'ETF' | 'ALL';

export interface MarketState {
  stocks: StockInstrument[];
  entities: Record<string, StockInstrument>;
  allQuotes: Map<string, any>;
  loading: boolean;
  error: string | null;
  selectedExchange: 'HOSE' | 'HNX' | 'UPCOM';
  selectedType: string;
  highlightedSymbol: string | null;
  pinnedSymbols: string[];
}

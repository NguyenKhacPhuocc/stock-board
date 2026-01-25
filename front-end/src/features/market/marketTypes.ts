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

export interface StockInstrument {
  symbol: string;
  reference: number;
  ceiling: number;
  floor: number;
  bidPrice1?: number;
  bidVol1?: number;
  bidPrice2?: number;
  bidVol2?: number;
  bidPrice3?: number;
  bidVol3?: number;
  offerPrice1?: number;
  offerVol1?: number;
  offerPrice2?: number;
  offerVol2?: number;
  offerPrice3?: number;
  offerVol3?: number;
  closePrice?: number;
  closeVol?: number;
  change?: number;
  ratioChange?: number;
  high?: number;
  low?: number;
  averagePrice?: number;
  totalTradedQtty?: number;
  buyForeignVol?: number;
  sellForeignVol?: number;
  [key: string]: any;
}

export type MarketSymbolType = 'STOCK' | 'WARRANT' | 'ETF' | 'ALL';

export interface MarketState {
  stocks: StockInstrument[]; // Stocks for current exchange
  allStocks: StockInstrument[]; // Global stocks for search
  loading: boolean;
  error: string | null;
  selectedExchange: string;
  selectedType: MarketSymbolType;
  highlightedSymbol: string | null;
  pinnedSymbols: string[];
}

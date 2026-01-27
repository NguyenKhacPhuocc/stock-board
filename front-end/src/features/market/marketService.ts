import { apiClient } from '@/services/apiClient';

export interface QuoteData {
  symbol: string;
  ceiling: number;
  floor: number;
  reference: number;
  exchange: 'HOSE' | 'HNX' | 'UPCOM';
  tradelot: number;
  nvalue: number | null;
  pricestep: number | null;
  FullName: string;
  StockType: string;
  IssuerName: string | null;
  cond_effdate: string | null;
}

export interface InstrumentData {
  SB: string;
  RE: number;
  CL: number;
  FL: number;
  [key: string]: any;
}

export interface StockInstrument extends QuoteData {
  SB: string;
  CP?: number;
  CH?: number;
  CHP?: number;
  B1?: number;
  V1?: number;
  S1?: number;
  U1?: number;
  HI?: number;
  LO?: number;
  OP?: number;
  TT?: number;
  TV?: number;
  RE: number;
  CL: number;
  FL: number;
  [key: string]: any;
}

const logger = {
  debug: (msg: string, data?: any) => {
    console.log(`[MarketService] ${msg}`, data || '');
  },
  error: (msg: string, error?: any) => {
    console.error(`[MarketService] ${msg}`, error || '');
  },
};

const mapInstrumentToStock = (
  instrument: InstrumentData,
  quoteData: Map<string, QuoteData>
): StockInstrument => {
  const quote = quoteData.get(instrument.SB);

  return {
    symbol: instrument.SB,
    SB: instrument.SB,
    FullName: quote?.FullName || '',
    exchange: quote?.exchange || 'HOSE',
    StockType: quote?.StockType || '2',
    tradelot: quote?.tradelot || 100,
    ceiling: quote?.ceiling || instrument.CL,
    floor: quote?.floor || instrument.FL,
    reference: quote?.reference || instrument.RE,
    CP: instrument.CP,
    CH: instrument.CH,
    CHP: instrument.CHP,
    B1: instrument.B1,
    V1: instrument.V1,
    S1: instrument.S1,
    U1: instrument.U1,
    HI: instrument.HI,
    LO: instrument.LO,
    OP: instrument.OP,
    TT: instrument.TT,
    TV: instrument.TV,
    RE: instrument.RE,
    CL: instrument.CL,
    FL: instrument.FL,
    nvalue: quote?.nvalue || null,
    pricestep: quote?.pricestep || null,
    IssuerName: quote?.IssuerName || null,
    cond_effdate: quote?.cond_effdate || null,
  };
};

export const fetchAllQuotes = async (): Promise<Map<string, QuoteData>> => {
  try {
    logger.debug('Fetching all quotes from BSC API');
    const data = await apiClient.get<QuoteData[]>(
      'https://tradeapi.bsc.com.vn/trade/quotes?symbols=ALL'
    );

    const quoteMap = new Map<string, QuoteData>();
    const dataArray = Array.isArray(data) ? data : [];
    
    dataArray.forEach(quote => {
      quoteMap.set(quote.symbol, quote);
    });

    logger.debug(`Fetched ${quoteMap.size} quotes`, {
      exchanges: {
        HOSE: dataArray.filter((q: QuoteData) => q.exchange === 'HOSE').length,
        HNX: dataArray.filter((q: QuoteData) => q.exchange === 'HNX').length,
        UPCOM: dataArray.filter((q: QuoteData) => q.exchange === 'UPCOM').length,
      },
    });

    return quoteMap;
  } catch (error) {
    logger.error('Failed to fetch quotes', error);
    throw error;
  }
};

export const fetchInstrumentsByExchange = async (
  exchange: string,
  quoteData: Map<string, QuoteData>
): Promise<StockInstrument[]> => {
  try {
    logger.debug(`Fetching instruments for exchange: ${exchange}`);
    const data = await apiClient.get<InstrumentData[]>(
      `https://priceapi.bsc.com.vn/datafeed/instruments?exchange=${exchange}`
    );

    let instruments: InstrumentData[] = [];
    if (Array.isArray(data)) {
      instruments = data;
    } else if ((data as any)?.s === 'ok' && Array.isArray((data as any).d)) {
      instruments = (data as any).d;
    }

    const stocks = instruments.map(instrument =>
      mapInstrumentToStock(instrument, quoteData)
    );

    logger.debug(`Fetched ${stocks.length} instruments for ${exchange}`);
    return stocks;
  } catch (error) {
    logger.error(`Failed to fetch instruments for ${exchange}`, error);
    throw error;
  }
};

export const fetchAllExchangeStocks = async (
  exchange: string,
  quoteData: Map<string, QuoteData>
): Promise<StockInstrument[]> => {
  return fetchInstrumentsByExchange(exchange, quoteData);
};

export const marketService = {
  /**
   * Fetch instruments by exchange (legacy support)
   * @param exchange - e.g. 'HOSE', 'HNX', 'UPCOM'
   */
  getInstruments: async (exchange: string = 'HOSE') => {
    try {
      const data = await apiClient.get('/instruments', {
        params: { exchange }
      });
      return data;
    } catch (error) {
      console.error('Error fetching instruments:', error);
      throw error;
    }
  }
};

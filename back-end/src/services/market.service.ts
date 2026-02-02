import EventEmitter from "events";
import axios from "axios";
import type {
  BSCFeedPayload,
  MarketEventType,
  MarketSnapshotItem,
} from "../types/market.types";

const logger = {
  debug: (msg: string, data?: any) => {
    console.log(`[MarketService] ${msg}`, data || "");
  },
  error: (msg: string, error?: any) => {
    console.error(`[MarketService] ${msg}`, error || "");
  },
};

const BSC_API_URL = process.env.BSC_API_URL || "https://priceapi.bsc.com.vn";
import { EXCHANGES } from "../constants/exchanges";

class MarketService extends EventEmitter {
  private marketMap = new Map<string, MarketSnapshotItem>();
  private lastUpdateTime = new Map<string, number>();
  private symbolExchangeMap = new Map<string, string>();
  private indexMap = new Map<string, MarketSnapshotItem>(); // Cache for market index data by exchange
  private lastIndexUpdateTime = new Map<string, number>();

  constructor() {
    super();
    this.setMaxListeners(20); // Prevent memory leak warnings
  }

  // Load symbol-exchange mapping from BSC API
  public async loadSymbolExchangeMapping(): Promise<void> {
    logger.debug("Loading symbol-exchange mapping from BSC API");
    
    const promises = EXCHANGES.map(async (exchange) => {
      try {
        const response = await axios.get(
          `${BSC_API_URL}/datafeed/instruments?exchange=${exchange}`,
          { timeout: 10000 }
        );
        
        let instruments: any[] = [];
        if (Array.isArray(response.data)) {
          instruments = response.data;
        } else if (response.data?.d && Array.isArray(response.data.d)) {
          instruments = response.data.d;
        }
        
        instruments.forEach((item: any) => {
          const symbol = item.symbol || item.SB;
          if (symbol) {
            this.symbolExchangeMap.set(symbol, exchange);
          }
        });
        
        logger.debug(`Loaded ${instruments.length} symbols for ${exchange}`);
        return instruments.length;
      } catch (error: any) {
        logger.error(`Failed to load symbols for ${exchange}`, error.message);
        return 0;
      }
    });
    
    await Promise.all(promises);
    logger.debug(`Total symbol mappings loaded: ${this.symbolExchangeMap.size}`);
  }

  // Extract symbol from raw data item
  private extractSymbol(item: any): string | null {
    return item.SB || item.symbol || item.id || item.Id || null;
  }

  public onRawFeed(payload: BSCFeedPayload, type: MarketEventType = "i"): void {
    if (payload?.a !== "u" || !Array.isArray(payload.d)) {
      return;
    }
    const now = Date.now();
    if (type === "idx") {
      this.handleIndexData(payload.d, now);
      return;
    }
    this.handleStockData(payload.d, now, type);
  }


  private handleIndexData(items: any[], timestamp: number): void {
    items.forEach((item: any) => {
      const exchange = item.MC; 
      if (!exchange) return;

      // Cache latest index state by exchange
      this.indexMap.set(exchange, item);
      this.lastIndexUpdateTime.set(exchange, timestamp);

      // Emit index update for this exchange
      this.emit("idx", item, exchange);
    });
  }

  private handleStockData(items: any[], timestamp: number, type: MarketEventType): void {
    // Group items by exchange
    const exchangeBatches = new Map<string, MarketSnapshotItem[]>();

    items.forEach((item: any) => {
      const symbol = this.extractSymbol(item);
      if (!symbol) return;

      // Cache latest state
      this.marketMap.set(symbol, item);
      this.lastUpdateTime.set(symbol, timestamp);

      // Lookup exchange for this symbol
      const exchange = this.symbolExchangeMap.get(symbol);
      if (exchange) {
        if (!exchangeBatches.has(exchange)) {
          exchangeBatches.set(exchange, []);
        }
        exchangeBatches.get(exchange)!.push(item);
      }
    });

    // Emit separately for each exchange
    exchangeBatches.forEach((batch, exchange) => {
      if (batch.length > 0) {
        this.emit(type, batch, exchange);
      }
    });
  }

  /**
   * Clear all cached data
   */
  public clear(): void {
    this.marketMap.clear();
    this.lastUpdateTime.clear();
    this.indexMap.clear();
    this.lastIndexUpdateTime.clear();
    logger.debug("Market cache cleared");
  }
}

export const marketService = new MarketService();

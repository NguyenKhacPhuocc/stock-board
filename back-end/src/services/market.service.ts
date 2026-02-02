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
const EXCHANGES = ["HOSE", "HNX", "UPCOM"];

class MarketService extends EventEmitter {
  private marketMap = new Map<string, MarketSnapshotItem>();
  private lastUpdateTime = new Map<string, number>();
  private symbolExchangeMap = new Map<string, string>();

  constructor() {
    super();
    this.setMaxListeners(20); // Prevent memory leak warnings
  }

  // Set exchange mapping for a symbol
  public setSymbolExchange(symbol: string, exchange: string): void {
    this.symbolExchangeMap.set(symbol, exchange);
  }

  // Get exchange for a symbol (returns undefined if not known)
  public getSymbolExchange(symbol: string): string | undefined {
    return this.symbolExchangeMap.get(symbol);
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
    // Group items by exchange
    const exchangeBatches = new Map<string, MarketSnapshotItem[]>();

    payload.d.forEach((item: any) => {
      const symbol = this.extractSymbol(item);
      if (!symbol) return;

      // Cache latest state
      this.marketMap.set(symbol, item);
      this.lastUpdateTime.set(symbol, now);

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
   * Get latest prices for all symbols
   */
  public getSnapshot(): MarketSnapshotItem[] {
    return Array.from(this.marketMap.values());
  }

  /**
   * Get latest price for a specific symbol
   */
  public getSymbolState(symbol: string): MarketSnapshotItem | undefined {
    return this.marketMap.get(symbol);
  }

  /**
   * Get last update time for a symbol
   */
  public getLastUpdateTime(symbol: string): number | undefined {
    return this.lastUpdateTime.get(symbol);
  }

  /**
   * Get cache statistics
   */
  public getStats(): { symbolCount: number; oldestUpdate: number | null } {
    const times = Array.from(this.lastUpdateTime.values());
    return {
      symbolCount: this.marketMap.size,
      oldestUpdate: times.length > 0 ? Math.min(...times) : null,
    };
  }

  /**
   * Clear all cached data
   */
  public clear(): void {
    this.marketMap.clear();
    this.lastUpdateTime.clear();
    logger.debug("Market cache cleared");
  }
}

export const marketService = new MarketService();

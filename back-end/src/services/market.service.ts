import EventEmitter from "events";
import type {
  BSCFeedPayload,
  MarketEventType,
  MarketSnapshotItem,
  BSCInstrumentData,
  BSCIndexData,
} from "../types/market.types";

const logger = {
  debug: (msg: string, data?: any) => {
    console.log(`[MarketService] ${msg}`, data || "");
  },
  error: (msg: string, error?: any) => {
    console.error(`[MarketService] ${msg}`, error || "");
  },
};

class MarketService extends EventEmitter {
  private marketMap = new Map<string, MarketSnapshotItem>();
  private lastUpdateTime = new Map<string, number>();

  constructor() {
    super();
    this.setMaxListeners(20); // Prevent memory leak warnings
  }

  /**
   * Extract symbol from raw data item
   */
  private extractSymbol(item: any): string | null {
    return item.SB || item.symbol || item.id || item.Id || null;
  }

  /**
   * Process raw data from BSC feed
   */
  public onRawFeed(payload: BSCFeedPayload, type: MarketEventType = "i"): void {
    if (payload?.a !== "u" || !Array.isArray(payload.d)) {
      return;
    }

    const batch: MarketSnapshotItem[] = [];
    const now = Date.now();

    payload.d.forEach((item: any) => {
      const symbol = this.extractSymbol(item);
      if (!symbol) return;

      // Cache latest state with raw BSC format
      this.marketMap.set(symbol, item);
      this.lastUpdateTime.set(symbol, now);
      batch.push(item);
    });

    if (batch.length > 0) {
      this.emit(type, batch);
    }
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

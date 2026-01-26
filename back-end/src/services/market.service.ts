import EventEmitter from 'events';

class MarketService extends EventEmitter {
    private marketMap = new Map<string, any>();

    constructor() {
        super();
    }

    // Process raw data from BSC feed
    public onRawFeed(payload: any, type: 'i' | 'idx' = 'i') {
        if (payload?.a !== 'u' || !Array.isArray(payload.d)) return;

        const batch: any[] = [];
        payload.d.forEach((item: any) => {
            // Use SB (symbol) as key, keep all data in original BSC format
            const symbol = item.SB || item.symbol || item.id || item.Id;
            if (symbol) {
                // Cache latest state with raw BSC format
                this.marketMap.set(symbol, item);
                batch.push(item);
            }
        });

        if (batch.length > 0) {
            this.emit(type, batch);
        }
    }

    // Get latest prices for all symbols
    public getSnapshot() {
        return Array.from(this.marketMap.values());
    }

    // Get latest price for a specific symbol
    public getSymbolState(symbol: string) {
        return this.marketMap.get(symbol);
    }
}

export const marketService = new MarketService();

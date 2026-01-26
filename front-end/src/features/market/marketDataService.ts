type Listener = (data: any) => void;

// High-performance service for handling real-time market data updates 
// outside of the standard React/Redux render cycle.
class MarketDataService {
    private entities: Record<string, any> = {};
    private listeners: Record<string, Set<Listener>> = {};

    // Update a single symbol's data and notify its listeners
    public update(symbol: string, data: any) {
        const current = this.entities[symbol] || {};
        const updated = { ...current, ...data };

        // Ensure CH (change) and CHP (ratio) are consistent with current CP and RE
        if (updated.CP && updated.CP > 0 && updated.RE) {
            updated.CH = updated.CP - updated.RE;
            updated.CHP = (updated.CP - updated.RE) / updated.RE;
        }

        this.entities[symbol] = updated;

        if (this.listeners[symbol]) {
            this.listeners[symbol].forEach(listener => listener(updated));
        }
    }

    // Update multiple symbols in a single batch
    public batchUpdate(updates: any[]) {
        updates.forEach(u => {
            if (u.SB) this.update(u.SB, u);
        });
    }

    // Subscribe to real-time updates for a specific symbol.
    // Returns an unsubscribe function.
    public subscribe(symbol: string, listener: Listener) {
        if (!this.listeners[symbol]) {
            this.listeners[symbol] = new Set();
        }
        this.listeners[symbol].add(listener);

        // Immediately notify with current data if available
        if (this.entities[symbol]) {
            listener(this.entities[symbol]);
        }

        return () => {
            this.listeners[symbol].delete(listener);
        };
    }

    // Get the latest known state for a symbol
    public get(symbol: string) {
        return this.entities[symbol];
    }

    // Initialize the internal state from a snapshot (e.g. from Redux)
    public setInitialData(data: any[]) {
        data.forEach(item => {
            if (item.SB) {
                this.entities[item.SB] = item;
            }
        });
    }
}

export const marketDataService = new MarketDataService();

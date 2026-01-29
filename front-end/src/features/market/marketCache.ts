// /**
//  * Market Cache Service
//  * In-memory cache for real-time stock data with listener support
//  */

// import type { StockInstrument, StockListener } from "./marketTypes";

// class MarketCache {
//   private entities: Record<string, StockInstrument> = {};
//   private listeners: Record<string, Set<StockListener>> = {};

//   /**
//    * Update a single stock
//    */
//   public update(symbol: string, data: Partial<StockInstrument>): void {
//     const current = this.entities[symbol] || ({} as StockInstrument);
//     const updated: StockInstrument = {
//       ...current,
//       ...data,
//       SB: symbol,
//     } as StockInstrument;

//     // CHP = (CH / RE) * 100
//     if (updated.CH !== undefined && updated.RE && updated.RE > 0) {
//       updated.CHP = (updated.CH / updated.RE) * 100;
//     }

//     this.entities[symbol] = updated;

//     // Notify listeners
//     if (this.listeners[symbol]) {
//       this.listeners[symbol].forEach((listener) => listener(updated));
//     }
//   }

//   /**
//    * Batch update multiple stocks
//    */
//   public batchUpdate(updates: Partial<StockInstrument>[]): void {
//     updates.forEach((u) => {
//       if (u.SB) this.update(u.SB, u);
//     });
//   }

//   /**
//    * Subscribe to stock updates
//    * Returns unsubscribe function
//    */
//   public subscribe(symbol: string, listener: StockListener): () => void {
//     if (!this.listeners[symbol]) {
//       this.listeners[symbol] = new Set();
//     }
//     this.listeners[symbol].add(listener);

//     // Immediately call listener with current data if exists
//     if (this.entities[symbol]) {
//       listener(this.entities[symbol]);
//     }

//     return () => {
//       this.listeners[symbol].delete(listener);
//     };
//   }

//   /**
//    * Get stock by symbol
//    */
//   public get(symbol: string): StockInstrument | undefined {
//     return this.entities[symbol];
//   }

//   /**
//    * Set initial data (on market initialization)
//    */
//   public setInitialData(data: StockInstrument[]): void {
//     data.forEach((item) => {
//       if (item.SB) {
//         this.entities[item.SB] = item;
//       }
//     });
//   }

//   /**
//    * Clear all data
//    */
//   public clear(): void {
//     this.entities = {};
//   }
// }

// export const marketCache = new MarketCache();

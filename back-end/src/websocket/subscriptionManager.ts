import { bscFeed } from '../feeds/bsc.feed';

interface ClientSubscription {
  clientId: string;
  symbols: Set<string>;
}

class SubscriptionManager {
  private clientSubscriptions = new Map<string, ClientSubscription>();
  private symbolSubscribers = new Map<string, Set<string>>();
  private logger = {
    debug: (msg: string, data?: any) => {
      console.log(`[SubscriptionManager] ${msg}`, data || '');
    },
    error: (msg: string, error?: any) => {
      console.error(`[SubscriptionManager] ${msg}`, error || '');
    },
  };

  subscribe(clientId: string, symbols: string[]): void {
    if (!Array.isArray(symbols) || symbols.length === 0) {
      this.logger.debug('Empty symbols list, skipping subscription', { clientId });
      return;
    }

    const validSymbols = symbols.filter(s => typeof s === 'string' && s.length > 0);
    if (validSymbols.length === 0) {
      this.logger.error('No valid symbols provided', { clientId, symbols });
      return;
    }

    const client = this.clientSubscriptions.get(clientId) || {
      clientId,
      symbols: new Set(),
    };

    const newSymbols: string[] = [];

    validSymbols.forEach(symbol => {
      if (!client.symbols.has(symbol)) {
        client.symbols.add(symbol);
        newSymbols.push(symbol);

        if (!this.symbolSubscribers.has(symbol)) {
          this.symbolSubscribers.set(symbol, new Set());
        }
        this.symbolSubscribers.get(symbol)!.add(clientId);
      }
    });

    this.clientSubscriptions.set(clientId, client);

    if (newSymbols.length > 0) {
      const displaySymbols = newSymbols.slice(0, 5).join(', ') +
        (newSymbols.length > 5 ? `... (+${newSymbols.length - 5} more)` : '');
      this.logger.debug(`Client subscribed to ${newSymbols.length} new symbols`, {
        clientId,
        symbols: displaySymbols,
      });

      bscFeed.subscribe(newSymbols);
    } else {
      this.logger.debug('Client already subscribed to all symbols', { clientId });
    }
  }

  unsubscribe(clientId: string, symbols: string[]): void {
    const client = this.clientSubscriptions.get(clientId);
    if (!client) {
      this.logger.debug('Client not found, skipping unsubscription', { clientId });
      return;
    }

    const removedSymbols: string[] = [];

    symbols.forEach(symbol => {
      if (client.symbols.has(symbol)) {
        client.symbols.delete(symbol);
        removedSymbols.push(symbol);

        const subscribers = this.symbolSubscribers.get(symbol);
        if (subscribers) {
          subscribers.delete(clientId);

          if (subscribers.size === 0) {
            this.symbolSubscribers.delete(symbol);
            this.logger.debug(`No more subscribers for symbol, can unsubscribe from BSC`, {
              symbol,
            });
          }
        }
      }
    });

    if (removedSymbols.length > 0) {
      const displaySymbols = removedSymbols.slice(0, 5).join(', ') +
        (removedSymbols.length > 5 ? `... (+${removedSymbols.length - 5} more)` : '');
      this.logger.debug(`Client unsubscribed from ${removedSymbols.length} symbols`, {
        clientId,
        symbols: displaySymbols,
      });
    }

    if (client.symbols.size === 0) {
      this.clientSubscriptions.delete(clientId);
      this.logger.debug('Client removed (no more subscriptions)', { clientId });
    }
  }

  unsubscribeAll(clientId: string): void {
    const client = this.clientSubscriptions.get(clientId);
    if (!client) {
      this.logger.debug('Client not found, nothing to clean up', { clientId });
      return;
    }

    const allSymbols = Array.from(client.symbols);
    this.logger.debug(`Unsubscribing client from all ${allSymbols.length} symbols`, {
      clientId,
    });

    this.unsubscribe(clientId, allSymbols);
  }

  getClientSubscriptions(clientId: string): string[] {
    const client = this.clientSubscriptions.get(clientId);
    return client ? Array.from(client.symbols) : [];
  }

  getSymbolSubscribers(symbol: string): string[] {
    const subscribers = this.symbolSubscribers.get(symbol);
    return subscribers ? Array.from(subscribers) : [];
  }

  getMetrics() {
    return {
      totalClients: this.clientSubscriptions.size,
      totalSymbols: this.symbolSubscribers.size,
      clientBreakdown: Array.from(this.clientSubscriptions.values()).map(client => ({
        clientId: client.clientId,
        subscriptionCount: client.symbols.size,
      })),
    };
  }
}

export const subscriptionManager = new SubscriptionManager();

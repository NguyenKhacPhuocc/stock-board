import { bscFeed } from '../feeds/bsc.feed';

interface ClientSubscription {
  exchange: string | null;
}

class SubscriptionManager {
  private clientSubscriptions: Map<string, ClientSubscription> = new Map();
  private exchangeSubscribers: Map<string, Set<string>> = new Map();
  private currentBSCExchanges: Set<string> = new Set();

  private logger = {
    debug: (msg: string, data?: any) => {
      console.log(`[SubscriptionManager] ${msg}`, data || '');
    },
    error: (msg: string, error?: any) => {
      console.error(`[SubscriptionManager] ${msg}`, error || '');
    },
  };

  subscribeToExchange(clientId: string, exchange: string): void {
    let client = this.clientSubscriptions.get(clientId);
    const previousExchange = client?.exchange;

    // Unsubscribe from previous exchange if different
    if (previousExchange && previousExchange !== exchange) {
      this.logger.debug('Client switching exchanges', { 
        clientId, 
        from: previousExchange, 
        to: exchange 
      });
      this.unsubscribeFromExchange(clientId, previousExchange);
    }

    // Update client subscription
    if (!client) {
      client = { exchange: null };
      this.clientSubscriptions.set(clientId, client);
    }
    client.exchange = exchange;

    // Track exchange subscribers
    if (!this.exchangeSubscribers.has(exchange)) {
      this.exchangeSubscribers.set(exchange, new Set());
    }
    this.exchangeSubscribers.get(exchange)!.add(clientId);

    this.logger.debug('Client subscribed to exchange', { clientId, exchange });

    // Check if this is the first subscriber to this exchange
    this.updateBSCSubscription();
  }

  unsubscribeFromExchange(clientId: string, exchange: string): void {
    const client = this.clientSubscriptions.get(clientId);
    if (!client) {
      this.logger.debug('Client not found, skipping unsubscription', { clientId });
      return;
    }

    // Remove from exchange subscribers
    const subscribers = this.exchangeSubscribers.get(exchange);
    if (subscribers) {
      subscribers.delete(clientId);
      if (subscribers.size === 0) {
        this.exchangeSubscribers.delete(exchange);
      }
    }

    // Clear client's exchange
    if (client.exchange === exchange) {
      client.exchange = null;
    }

    this.logger.debug('Client unsubscribed from exchange', { clientId, exchange });

    // Update BSC subscription if no more clients for this exchange
    this.updateBSCSubscription();
  }

  disconnect(clientId: string): void {
    const client = this.clientSubscriptions.get(clientId);
    if (!client) {
      return;
    }

    // Unsubscribe from exchange
    if (client.exchange) {
      this.unsubscribeFromExchange(clientId, client.exchange);
    }

    this.clientSubscriptions.delete(clientId);
    this.logger.debug('Client disconnected and cleaned up', { clientId });

    // Update BSC subscription
    this.updateBSCSubscription();
  }

  private updateBSCSubscription(): void {
    const activeExchanges = Array.from(this.exchangeSubscribers.keys());
    
    // Check if subscription changed
    const currentArray = Array.from(this.currentBSCExchanges).sort();
    const activeArray = [...activeExchanges].sort();
    const hasChanged = JSON.stringify(currentArray) !== JSON.stringify(activeArray);
    
    if (!hasChanged) {
      this.logger.debug('BSC subscriptions unchanged', { 
        current: currentArray 
      });
      return;
    }
    
    // Update subscription (this will automatically unsubscribe old and subscribe new)
    if (activeExchanges.length > 0) {
      this.logger.debug('Updating BSC subscriptions', { 
        from: currentArray,
        to: activeArray
      });
      bscFeed.subscribeToExchanges(activeExchanges);
      this.currentBSCExchanges = new Set(activeExchanges);
    } else {
      this.logger.debug('No active exchanges - unsubscribing all');
      if (this.currentBSCExchanges.size > 0) {
        bscFeed.unsubscribeFromExchanges(Array.from(this.currentBSCExchanges));
        this.currentBSCExchanges.clear();
      }
    }
  }
}

export const subscriptionManager = new SubscriptionManager();

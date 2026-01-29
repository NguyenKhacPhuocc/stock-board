import ioClient from "socket.io-client";
import { marketService } from "../services/market.service";

const logger = {
  debug: (msg: string, data?: any) => {
    console.log(`[BSC Feed] ${msg}`, data || "");
  },
  error: (msg: string, error?: any) => {
    console.error(`[BSC Feed] ${msg}`, error || "");
  },
};

export class BSCFeed {
  private bscSocket: any;
  private readonly BSC_URL =
    process.env.BSC_SOCKET_URL || "wss://priceapi.bsc.com.vn";
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 10;
  private readonly baseReconnectDelay = 1000; // 1 second
  private readonly maxReconnectDelay = 30000; // 30 seconds
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private currentExchanges: Set<string> = new Set();

  constructor() {}

  public connect() {
    if (this.isConnecting) {
      logger.debug("Already connecting, skipping...");
      return;
    }

    this.isConnecting = true;
    logger.debug("Connecting to BSC...", { url: this.BSC_URL });

    this.bscSocket = ioClient(this.BSC_URL, {
      path: "/market/socket.io",
      transports: ["websocket", "polling"], // Fallback to polling
      reconnection: false, // Handle reconnection manually
      timeout: 20000,
      forceNew: true,
      query: {
        __sails_io_sdk_version: "1.2.1",
        __sails_io_sdk_platform: "browser",
        __sails_io_sdk_language: "javascript",
        EIO: "3",
      },
    });

    this.bscSocket.on("connect", () => {
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      logger.debug("Connected to BSC successfully");

      // Subscribe to ALL indices once (they don't change)
      const indexChannels = [
        "idx:HOSE",
        "idx:30",
        "idx:HNX",
        "idx:HNX30",
        "idx:UPCOM",
      ];

      this.subscribe(indexChannels);
      logger.debug("Subscribed to all market indices");

      // Re-subscribe to exchanges that clients are currently watching
      if (this.currentExchanges.size > 0) {
        const exchanges = Array.from(this.currentExchanges);
        logger.debug("Re-subscribing to active exchanges after reconnect", {
          exchanges,
        });
        this.subscribeToExchanges(exchanges);
      }
    });

    // Pass raw data to MarketService for state management
    // MarketService will group data by exchange using symbol-exchange mapping
    this.bscSocket.on("i", (payload: any) => {
      marketService.onRawFeed(payload, "i");
    });

    this.bscSocket.on("idx", (payload: any) => {
      marketService.onRawFeed(payload, "idx");
    });

    this.bscSocket.on("disconnect", (reason: string) => {
      this.isConnecting = false;
      logger.debug("Disconnected from BSC", { reason });
      this.scheduleReconnect();
    });

    this.bscSocket.on("connect_error", (error: any) => {
      this.isConnecting = false;
      logger.error("Connection error", { message: error.message });
      this.scheduleReconnect();
    });
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error(
        "Max reconnect attempts reached. Manual intervention required.",
      );
      return;
    }

    // Exponential backoff with jitter
    const delay = Math.min(
      this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts) +
        Math.random() * 1000,
      this.maxReconnectDelay,
    );

    this.reconnectAttempts++;
    logger.debug(
      `Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`,
      { delayMs: delay },
    );

    this.reconnectTimer = setTimeout(() => {
      logger.debug(`Attempting reconnect (attempt ${this.reconnectAttempts})`);
      this.connect();
    }, delay);
  }

  /**
   * Generic subscribe method for any channels
   */
  private subscribe(args: string[]) {
    if (!this.bscSocket || !this.bscSocket.connected) {
      logger.debug("Socket not connected, skipping subscription");
      return;
    }

    const subscriptionData = {
      url: "/client/subscribe",
      method: "get",
      headers: {},
      data: {
        op: "subscribe",
        args: args,
      },
    };

    logger.debug(`Subscribing to ${args.length} channels`, args);
    this.bscSocket.emit("get", subscriptionData);
  }

  /**
   * Subscribe to specific exchanges (HOSE, HNX, or UPCOM)
   * Only subscribes to 'e:' channels (stock streams), not indices
   */
  public subscribeToExchanges(exchanges: string[]) {
    if (!this.bscSocket || !this.bscSocket.connected) {
      logger.debug("Socket not connected, queueing exchanges", { exchanges });
      exchanges.forEach((ex) => this.currentExchanges.add(ex));
      return;
    }

    // Find which exchanges to unsubscribe and which to subscribe
    const toUnsubscribe = Array.from(this.currentExchanges).filter(
      (ex) => !exchanges.includes(ex),
    );
    const toSubscribe = exchanges.filter(
      (ex) => !this.currentExchanges.has(ex),
    );

    // Unsubscribe from old exchanges (only e: channels)
    if (toUnsubscribe.length > 0) {
      const unsubArgs = toUnsubscribe.map((ex) => `e:${ex}`);

      const unsubscribeData = {
        url: "/client/subscribe",
        method: "get",
        headers: {},
        data: {
          op: "unsubscribe",
          args: unsubArgs,
        },
      };

      logger.debug(
        `Unsubscribing from exchanges: ${toUnsubscribe.join(", ")}`,
        { channels: unsubArgs },
      );
      this.bscSocket.emit("get", unsubscribeData);
    }

    // Subscribe to new exchanges (only e: channels)
    if (toSubscribe.length > 0) {
      const subArgs = toSubscribe.map((ex) => `e:${ex}`);

      const subscriptionData = {
        url: "/client/subscribe",
        method: "get",
        headers: {},
        data: {
          op: "subscribe",
          args: subArgs,
        },
      };

      logger.debug(`Subscribing to exchanges: ${toSubscribe.join(", ")}`, {
        channels: subArgs,
      });
      this.bscSocket.emit("get", subscriptionData);
    }

    // Update current exchanges
    this.currentExchanges.clear();
    exchanges.forEach((ex) => this.currentExchanges.add(ex));

    if (toUnsubscribe.length === 0 && toSubscribe.length === 0) {
      logger.debug("Exchange subscriptions unchanged");
    }
  }

  /**
   * Unsubscribe from specific exchanges
   * Note: Some WebSocket APIs may not support selective unsubscribe
   */
  public unsubscribeFromExchanges(exchanges: string[]) {
    if (!this.bscSocket || !this.bscSocket.connected) {
      logger.debug("Socket not connected, skipping unsubscribe");
      return;
    }

    const args: string[] = [];
    exchanges.forEach((ex) => {
      args.push(`e:${ex}`);
      args.push(`idx:${ex}`);
      if (ex === "HOSE") args.push("idx:30");
      if (ex === "HNX") args.push("idx:HNX30");
    });

    const unsubscribeData = {
      url: "/client/unsubscribe",
      method: "get",
      headers: {},
      data: {
        op: "unsubscribe",
        args: args,
      },
    };

    logger.debug(`Unsubscribing from exchanges: ${exchanges.join(", ")}`, {
      channels: args,
    });
    this.bscSocket.emit("get", unsubscribeData);

    // Remove from current exchanges
    exchanges.forEach((ex) => this.currentExchanges.delete(ex));
  }

  public disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.bscSocket) {
      this.bscSocket.disconnect();
    }
    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  public getConnectionStatus(): {
    connected: boolean;
    reconnectAttempts: number;
  } {
    return {
      connected: this.bscSocket?.connected || false,
      reconnectAttempts: this.reconnectAttempts,
    };
  }
}

export const bscFeed = new BSCFeed();

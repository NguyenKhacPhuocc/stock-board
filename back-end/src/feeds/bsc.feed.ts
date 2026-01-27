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
  private subscribedSymbols: Set<string> = new Set();

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
      transports: ["websocket"],
      reconnection: false, // We handle reconnection manually for more control
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

      // Subscribe to default indices on connect
      const defaultSymbols = [
        "idx:HOSE",
        "idx:30",
        "idx:HNX",
        "idx:HNX30",
        "idx:UPCOM",
      ];
      this.subscribe(defaultSymbols);

      // Re-subscribe to previously subscribed symbols
      if (this.subscribedSymbols.size > 0) {
        const symbolsToResubscribe = Array.from(this.subscribedSymbols);
        logger.debug("Re-subscribing to previous symbols", {
          count: symbolsToResubscribe.length,
        });
        this.subscribe(symbolsToResubscribe);
      }
    });

    // Pass raw data to MarketService for state management
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
   * Dynamically subscribe to a list of symbols (e.g. ['i:FPT', 'idx:HOSE'])
   */
  public subscribe(args: string[]) {
    if (!this.bscSocket || !this.bscSocket.connected) {
      // Store symbols to subscribe when connected
      args.forEach((s) => this.subscribedSymbols.add(s));
      logger.debug("Socket not connected, queued symbols for subscription", {
        count: args.length,
      });
      return;
    }

    // Track subscribed symbols
    args.forEach((s) => this.subscribedSymbols.add(s));

    const subscriptionData = {
      url: "/client/subscribe",
      method: "get",
      headers: {},
      data: {
        op: "subscribe",
        args: args,
      },
    };

    logger.debug(`Sending subscription for ${args.length} items`);
    this.bscSocket.emit("get", subscriptionData);
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

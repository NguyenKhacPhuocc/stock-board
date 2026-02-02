import ioClient from "socket.io-client";
import { marketService } from "../services/market.service";
import { EXCHANGES } from "../constants/exchanges";

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
    if (this.isConnecting) return;

    this.isConnecting = true;
    logger.debug("Connecting to BSC...", { url: this.BSC_URL });

    this.bscSocket = ioClient(this.BSC_URL, {
      path: "/market/socket.io",
      transports: ["websocket", "polling"],
      reconnection: false,
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

      const indexChannels = EXCHANGES.flatMap((ex) => {
        const idx = [`idx:${ex}`];
        // if (ex === "HOSE") idx.push("idx:30");
        // if (ex === "HNX") idx.push("idx:HNX30");
        return idx;
      });

      this.subscribe(indexChannels);

      // Re-subscribe to exchanges that clients are currently watching
      if (this.currentExchanges.size > 0) {
        const exchanges = Array.from(this.currentExchanges);
        this.subscribeToExchanges(exchanges);
      }
    });

    this.bscSocket.on("i", (payload: any) => {
      marketService.onRawFeed(payload, "i");
    });

    this.bscSocket.on("idx", (payload: any) => {
      marketService.onRawFeed(payload, "idx");
    });

    this.bscSocket.on("disconnect", (reason: string) => {
      this.isConnecting = false;
      this.scheduleReconnect();
    });

    this.bscSocket.on("connect_error", (error: any) => {
      this.isConnecting = false;
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

  private subscribe(args: string[]) {
    if (!this.bscSocket || !this.bscSocket.connected) return;

    const subscriptionData = {
      url: "/client/subscribe",
      method: "get",
      headers: {},
      data: {
        op: "subscribe",
        args: args,
      },
    };

    this.bscSocket.emit("get", subscriptionData);
  }

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
      this.bscSocket.emit("get", subscriptionData);
    }

    // Update current exchanges
    this.currentExchanges.clear();
    exchanges.forEach((ex) => this.currentExchanges.add(ex));
  }

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

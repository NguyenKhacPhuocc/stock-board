import { useEffect, useRef } from "react";
import { useAppDispatch } from "@/app/hooks";
import { batchUpdateStocks } from "./marketSlice";
import io from "socket.io-client";
import type { Socket } from "socket.io-client";
import type { WSUpdatePayload, Logger } from "./marketTypes";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Use environment variable with fallback
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";

const SOCKET_CONFIG = {
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: Infinity,
  timeout: 20000,
  auth: {
    token:
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null,
  },
};

const logger: Logger = {
  debug: (msg: string, data?: unknown): void => {
    console.log(`[MarketWS] ${msg}`, data || "");
  },
  error: (msg: string, error?: unknown): void => {
    console.error(`[MarketWS] ${msg}`, error || "");
  },
};

const createSocket = (): Socket => {
  const socket = io(SOCKET_URL, SOCKET_CONFIG);
  logger.debug("Socket instance created");
  return socket;
};

export const useMarketWebSocket = (exchange: string): void => {
  const dispatch = useAppDispatch();
  const socketRef = useRef<Socket | null>(null);
  const previousExchangeRef = useRef<string | null>(null);

  // Handle socket creation and exchange subscription
  useEffect(() => {
    // Create socket if not exists
    if (!socketRef.current) {
      logger.debug("Creating socket connection");
      socketRef.current = createSocket();
      
      const socket = socketRef.current;
      
      // Setup event handlers
      socket.on("connect", () => {
        logger.debug("Connected to backend", { socketId: socket.id });
        // Subscribe to initial exchange
        socket.emit("subscribe", { exchange }, (ack: any) => {
          logger.debug("Subscribed to exchange", { exchange, ack });
        });
        previousExchangeRef.current = exchange;
      });

      socket.on("disconnect", ((reason: string) => {
        logger.debug("Disconnected from backend", { reason });
      }) as (...args: unknown[]) => void);

      socket.on("connect_error", (error: any) => {
        logger.error("Connection error", { message: error?.message });
      });

      // Listen for stock updates
      socket.on("i", (payload: unknown) => {
        if (isValidUpdate(payload)) {
          const batch = payload.d;
          logger.debug(`Received ${batch.length} stock updates from ${exchange}`);
          dispatch(batchUpdateStocks(batch));
        }
      });

      // Listen for index updates
      socket.on("idx", (payload: unknown) => {
        logger.debug("Received index update", payload);
      });
    } else {
      // Socket exists, handle exchange change
      const socket = socketRef.current;
      const previousExchange = previousExchangeRef.current;

      if (socket.connected && previousExchange && previousExchange !== exchange) {
        logger.debug(`Switching exchange from ${previousExchange} to ${exchange}`);
        
        // Unsubscribe from old exchange
        socket.emit("unsubscribe", { exchange: previousExchange }, (ack: any) => {
          logger.debug("Unsubscribed from exchange", { exchange: previousExchange, ack });
        });

        // Subscribe to new exchange
        socket.emit("subscribe", { exchange }, (ack: any) => {
          logger.debug("Subscribed to exchange", { exchange, ack });
        });

        previousExchangeRef.current = exchange;
      }
    }
  }, [exchange, dispatch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const socket = socketRef.current;
      if (socket?.connected && previousExchangeRef.current) {
        logger.debug("Component unmounting, unsubscribing from exchange");
        socket.emit("unsubscribe", { exchange: previousExchangeRef.current });
        socket.disconnect();
      }
      socketRef.current = null;
      previousExchangeRef.current = null;
    };
  }, []);
};

const isValidUpdate = (payload: any): payload is WSUpdatePayload => {
  return payload?.a === "u" && Array.isArray(payload.d);
};

export const MarketWS = useMarketWebSocket;

export default useMarketWebSocket;

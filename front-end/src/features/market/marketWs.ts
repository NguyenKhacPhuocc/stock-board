import { useEffect, useRef } from "react";
import { useAppDispatch } from "@/app/hooks";
import { batchUpdateStocks, updateIndexData } from "./marketSlice";
import io from "socket.io-client";
import type { Socket } from "socket.io-client";
import type { WSUpdatePayload, Logger } from "./marketTypes";

/* eslint-disable @typescript-eslint/no-explicit-any */

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

// Global singleton socket instance
let globalSocket: Socket | null = null;

const createSocket = (): Socket => {
  if (!globalSocket) {
    globalSocket = io(SOCKET_URL, SOCKET_CONFIG);
    logger.debug("Socket created", { socketId: globalSocket.id });
  }
  return globalSocket;
};

const setupSocketListeners = (socket: Socket, onStockUpdate: (batch: any[]) => void, onIndexUpdate: (exchange: string, rawData: any) => void): void => {
  logger.debug("Setting up socket listeners");

  socket.on("connect", () => {
    logger.debug("Connected to server", { socketId: socket.id });
  });

  socket.on("disconnect", (reason: unknown) => {
    logger.debug("Disconnected from server", { reason });
  });

  socket.on("connect_error", (error: any) => {
    logger.error("Connection error", error?.message);
  });

  socket.on("i", (payload: unknown) => {
    if (isValidUpdate(payload)) {
      onStockUpdate(payload.d);
    }
  });

  socket.on("idx", (payload: unknown) => {
    const data = (payload as any).d;
    const items = Array.isArray(data) ? data : [data];
    items.forEach((item: any) => {
      const exchange = item.MC; 
      if (exchange) {
        onIndexUpdate(exchange, item);
      }
    });
  });
};

const isValidUpdate = (payload: any): payload is WSUpdatePayload => {
  return payload?.a === "u" && Array.isArray(payload.d);
};

export const useMarketWebSocket = (exchange: string): void => {
  const dispatch = useAppDispatch();
  const initRef = useRef(false);

  // Initialize socket and listeners (runs once on mount)
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const socket = createSocket();
    setupSocketListeners(
      socket,
      (batch) => {
        dispatch(batchUpdateStocks(batch));
      },
      (exchange, rawData) => {
        dispatch(updateIndexData({ exchange, rawData }));
      }
    );

    logger.debug("Market WebSocket initialized");
  }, [dispatch]);

  // Handle exchange subscription
  useEffect(() => {
    const socket = globalSocket;
    if (!socket) return;

    const handleExchangeSubscribe = () => {
      socket.emit("subscribe", { exchange });
    };

    if (socket.connected) {
      handleExchangeSubscribe();
    } else {
      socket.on("connect", handleExchangeSubscribe);
    }

    return () => {
      if (socket.connected) {
        socket.emit("unsubscribe", { exchange });
      }
    };
  }, [exchange]);
};

export const MarketWS = useMarketWebSocket;
export default useMarketWebSocket;

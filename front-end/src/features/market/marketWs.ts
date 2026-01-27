import { useEffect, useRef, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { batchUpdateStocks } from "./marketSlice";
import { selectMarketStocks } from "./marketSelectors";
import { marketCache } from "./marketCache";
import io from "socket.io-client";
import type { Socket } from "socket.io-client";
import type { StockInstrument, WSUpdatePayload, Logger } from "./marketTypes";
import type { AppDispatch } from "@/app/store";

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

const extractSymbols = (stocks: StockInstrument[]): string[] => {
  return stocks.map((s) => `i:${s.SB}`);
};

const isValidUpdate = (payload: any): payload is WSUpdatePayload => {
  return payload?.a === "u" && Array.isArray(payload.d);
};

const createSocket = (): Socket => {
  const socket = io(SOCKET_URL, SOCKET_CONFIG);
  logger.debug("Socket instance created");
  return socket;
};

const subscribeToSymbols = (socket: Socket, symbols: string[]): void => {
  if (!socket.connected) {
    logger.debug("Socket not connected, skipping subscription");
    return;
  }

  if (symbols.length === 0) {
    logger.debug("No symbols to subscribe");
    return;
  }

  const displaySymbols = symbols
    .slice(0, 5)
    .map((s) => s.replace("i:", ""))
    .join(", ");
  const suffix = symbols.length > 5 ? `... (+${symbols.length - 5} more)` : "";

  logger.debug(
    `Subscribing to ${symbols.length} symbols: ${displaySymbols}${suffix}`,
  );
  socket.emit("subscribe", symbols, (ack: any) => {
    logger.debug("Subscription acknowledged by server", { ack });
  });
};

const unsubscribeFromSymbols = (socket: Socket, symbols: string[]): void => {
  if (!socket.connected) {
    logger.debug("Socket not connected, skipping unsubscription");
    return;
  }

  if (symbols.length === 0) {
    logger.debug("No symbols to unsubscribe");
    return;
  }

  const displaySymbols = symbols
    .slice(0, 5)
    .map((s) => s.replace("i:", ""))
    .join(", ");
  const suffix = symbols.length > 5 ? `... (+${symbols.length - 5} more)` : "";

  logger.debug(
    `Unsubscribing from ${symbols.length} symbols: ${displaySymbols}${suffix}`,
  );
  socket.emit("unsubscribe", symbols, (ack: any) => {
    logger.debug("Unsubscription acknowledged by server", { ack });
  });
};

const handleMarketUpdate = (payload: any, dispatch: AppDispatch): void => {
  if (!isValidUpdate(payload)) {
    logger.error("Invalid update payload", payload);
    return;
  }

  const batch = payload.d.filter((item: any) => !!item.SB);

  if (batch.length === 0) return;

  marketCache.batchUpdate(batch);
  dispatch(batchUpdateStocks(batch));

  logger.debug(`Updated ${batch.length} stocks`, {
    samples: batch
      .slice(0, 3)
      .map((s) => s.SB)
      .join(", "),
  });
};

interface SocketHandlers {
  onConnect: () => void;
  onDisconnect: (reason: string) => void;
  onConnectError: (error: any) => void;
  onUpdate: (payload: any) => void;
}

const setupSocketHandlers = (
  socket: Socket,
  handlers: SocketHandlers,
): void => {
  socket.on("connect", handlers.onConnect);
  socket.on(
    "disconnect",
    handlers.onDisconnect as (...args: unknown[]) => void,
  );
  socket.on("connect_error", handlers.onConnectError);
  socket.on("i", handlers.onUpdate);
  socket.on("idx", handlers.onUpdate);
};

const getSymbolsDiff = (
  prev: string[],
  current: string[],
): { toAdd: string[]; toRemove: string[] } => {
  const prevSet = new Set(prev);
  const currSet = new Set(current);

  const toAdd = current.filter((s) => !prevSet.has(s));
  const toRemove = prev.filter((s) => !currSet.has(s));

  return { toAdd, toRemove };
};

export const useMarketWebSocket = (exchange: string): void => {
  const dispatch = useAppDispatch();
  const socketRef = useRef<Socket | null>(null);
  const stocks = useAppSelector(selectMarketStocks);
  const previousSymbolsRef = useRef<string[]>([]);
  const isConnectedRef = useRef(false);
  const dispatchRef = useRef(dispatch);
  const symbolsRef = useRef<string[]>([]);

  const symbols = useMemo(() => extractSymbols(stocks), [stocks]);
  const hasStocks = stocks.length > 0;

  // Keep refs in sync via effect
  useEffect(() => {
    dispatchRef.current = dispatch;
  }, [dispatch]);

  useEffect(() => {
    symbolsRef.current = symbols;
  }, [symbols]);

  // Setup socket connection once when stocks are loaded
  useEffect(() => {
    if (!hasStocks) {
      logger.debug("No stocks loaded, skipping socket setup");
      return;
    }

    // Don't create new socket if already connected
    if (socketRef.current?.connected) {
      return;
    }

    const socket = createSocket();
    socketRef.current = socket;

    const handlers: SocketHandlers = {
      onConnect: () => {
        logger.debug("Connected to backend", { socketId: socket.id });
        isConnectedRef.current = true;
        // Subscribe to current symbols on connect
        const currentSymbols = symbolsRef.current;
        subscribeToSymbols(socket, currentSymbols);
        previousSymbolsRef.current = [...currentSymbols];
      },
      onDisconnect: (reason: string) => {
        logger.debug("Disconnected from backend", { reason });
        isConnectedRef.current = false;
      },
      onConnectError: (error: any) => {
        logger.error("Connection error", { message: error?.message });
        isConnectedRef.current = false;
      },
      onUpdate: (payload: unknown) => {
        handleMarketUpdate(payload, dispatchRef.current);
      },
    };

    setupSocketHandlers(socket, handlers);

    return () => {
      if (socket.connected) {
        logger.debug("Cleaning up socket connection");
        unsubscribeFromSymbols(socket, previousSymbolsRef.current);
        socket.disconnect();
      }
      socketRef.current = null;
      isConnectedRef.current = false;
      previousSymbolsRef.current = [];
    };
  }, [hasStocks]);

  // Handle symbol changes (including exchange changes)
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket?.connected || !isConnectedRef.current) {
      return;
    }

    const { toAdd, toRemove } = getSymbolsDiff(
      previousSymbolsRef.current,
      symbols,
    );

    // Only unsubscribe/subscribe if there are actual changes
    if (toRemove.length === 0 && toAdd.length === 0) {
      return;
    }

    logger.debug(`Symbol subscription update for ${exchange}`, {
      toRemove: toRemove.length,
      toAdd: toAdd.length,
    });

    // Unsubscribe first, then subscribe
    if (toRemove.length > 0) {
      logger.debug(`Unsubscribing ${toRemove.length} symbols`, {
        samples: toRemove
          .slice(0, 3)
          .map((s) => s.replace("i:", ""))
          .join(", "),
      });
      unsubscribeFromSymbols(socket, toRemove);
    }

    if (toAdd.length > 0) {
      logger.debug(`Subscribing ${toAdd.length} symbols`, {
        samples: toAdd
          .slice(0, 3)
          .map((s) => s.replace("i:", ""))
          .join(", "),
      });
      subscribeToSymbols(socket, toAdd);
    }

    previousSymbolsRef.current = [...symbols];
  }, [symbols, exchange]);
};

export const MarketWS = useMarketWebSocket;

export default useMarketWebSocket;

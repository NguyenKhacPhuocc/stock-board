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
  // No longer need to add 'i:' prefix since backend subscribes to entire exchanges
  return stocks.map((s) => s.SB);
};

const isValidUpdate = (payload: any): payload is WSUpdatePayload => {
  return payload?.a === "u" && Array.isArray(payload.d);
};

const createSocket = (): Socket => {
  const socket = io(SOCKET_URL, SOCKET_CONFIG);
  logger.debug("Socket instance created");
  return socket;
};

const subscribeToExchange = (socket: Socket, exchange: string): void => {
  if (!socket.connected) {
    logger.debug("Socket not connected, skipping subscription");
    return;
  }

  logger.debug(`Subscribing to exchange: ${exchange}`);
  socket.emit("subscribe", { exchange }, (ack: any) => {
    logger.debug("Exchange subscription acknowledged", { ack, exchange });
  });
};

const unsubscribeFromExchange = (socket: Socket, exchange: string): void => {
  if (!socket.connected) {
    logger.debug("Socket not connected, skipping unsubscription");
    return;
  }

  logger.debug(`Unsubscribing from exchange: ${exchange}`);
  socket.emit("unsubscribe", { exchange }, (ack: any) => {
    logger.debug("Exchange unsubscription acknowledged", { ack, exchange });
  });
};

const handleMarketUpdate = (
  payload: any,
  dispatch: AppDispatch,
  currentSymbols: Set<string>,
): void => {
  if (!isValidUpdate(payload)) {
    logger.error("Invalid update payload", payload);
    return;
  }

  // Filter: Only update stocks that are in current exchange/view
  const batch = payload.d.filter(
    (item: any) => item.SB && currentSymbols.has(item.SB),
  );

  if (batch.length === 0) return;

  marketCache.batchUpdate(batch);
  dispatch(batchUpdateStocks(batch));

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

export const useMarketWebSocket = (exchange: string): void => {
  const dispatch = useAppDispatch();
  const socketRef = useRef<Socket | null>(null);
  const stocks = useAppSelector(selectMarketStocks);
  const previousExchangeRef = useRef<string | null>(null);
  const isConnectedRef = useRef(false);
  const dispatchRef = useRef(dispatch);
  const symbolsSetRef = useRef<Set<string>>(new Set());
  const pendingExchangeRef = useRef<string | null>(null);

  const symbols = useMemo(() => extractSymbols(stocks), [stocks]);
  const symbolsSet = useMemo(() => new Set(symbols), [symbols]);
  const hasStocks = stocks.length > 0;
  
  // Get exchange from first stock (if available) to know which exchange data is loaded
  const loadedExchange = useMemo(() => {
    if (stocks.length > 0 && stocks[0].exchange) {
      return stocks[0].exchange;
    }
    return null;
  }, [stocks]);

  // Keep refs in sync via effect
  useEffect(() => {
    dispatchRef.current = dispatch;
  }, [dispatch]);

  useEffect(() => {
    symbolsSetRef.current = symbolsSet;
  }, [symbolsSet]);

  // Setup socket connection once when stocks are loaded
  useEffect(() => {
    if (!hasStocks) {
      logger.debug("No stocks loaded, skipping socket setup");
      return;
    }

    // Don't create new socket if already exists
    if (socketRef.current) {
      logger.debug("Socket already exists, reusing connection");
      return;
    }

    logger.debug("Creating new socket connection");
    const socket = createSocket();
    socketRef.current = socket;

    const handlers: SocketHandlers = {
      onConnect: () => {
        logger.debug("Connected to backend", { socketId: socket.id });
        isConnectedRef.current = true;
        // Subscribe to current exchange on connect
        subscribeToExchange(socket, exchange);
        previousExchangeRef.current = exchange;
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
        handleMarketUpdate(payload, dispatchRef.current, symbolsSetRef.current);
      },
    };

    setupSocketHandlers(socket, handlers);

    // Cleanup only when component unmounts or stocks cleared
    return () => {
      logger.debug("Component unmounting - cleaning up socket");
      if (socket.connected && previousExchangeRef.current) {
        unsubscribeFromExchange(socket, previousExchangeRef.current);
        socket.disconnect();
      }
      socketRef.current = null;
      isConnectedRef.current = false;
      previousExchangeRef.current = null;
    };
  }, [hasStocks, exchange]);

  // Handle exchange changes
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket?.connected || !isConnectedRef.current) {
      logger.debug("Socket not ready for exchange switch", { 
        hasSocket: !!socket, 
        connected: socket?.connected,
        isConnected: isConnectedRef.current 
      });
      // Store pending exchange to handle when socket connects
      pendingExchangeRef.current = exchange;
      return;
    }

    const previousExchange = previousExchangeRef.current;
    
    // Check if stocks data is loaded for the target exchange
    if (loadedExchange && loadedExchange !== exchange) {
      logger.debug(`Waiting for stocks data to load for ${exchange} (currently: ${loadedExchange})`);
      pendingExchangeRef.current = exchange;
      return;
    }
    
    // If exchange changed, switch subscription
    if (previousExchange && previousExchange !== exchange) {
      logger.debug(
        `Switching exchange from ${previousExchange} to ${exchange}`,
        { socketId: socket.id, loadedExchange, symbolsCount: symbolsSet.size }
      );
      
      // Unsubscribe from old exchange
      unsubscribeFromExchange(socket, previousExchange);
      
      // Subscribe to new exchange
      subscribeToExchange(socket, exchange);
      
      previousExchangeRef.current = exchange;
      pendingExchangeRef.current = null;
    } else if (!previousExchange) {
      // First time - just set the ref
      logger.debug(`Setting initial exchange: ${exchange}`);
      previousExchangeRef.current = exchange;
    }
    
    // Update symbolsSet for filtering
    symbolsSetRef.current = symbolsSet;
  }, [exchange, symbolsSet, loadedExchange]);
};

export const MarketWS = useMarketWebSocket;

export default useMarketWebSocket;

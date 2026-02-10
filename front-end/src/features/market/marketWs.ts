/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from "react";
import { useAppDispatch } from "@/app/hooks";
import { batchUpdateStocks, updateIndexData } from "./marketSlice";
import io, { type Socket } from "socket.io-client";
import type { WSUpdatePayload, Logger, ExchangeType } from "./marketTypes";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";

let socketInstance: Socket | null = null;
let channel: BroadcastChannel | null = null;

const SOCKET_CONFIG = {
  transports: ["websocket"],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  auth: {
    token:
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null,
  },
};

const getSocket = (): Socket => {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, SOCKET_CONFIG);
  }
  return socketInstance;
};

const getChannel = (): BroadcastChannel => {
  if (!channel) {
    channel = new BroadcastChannel("market-ws");
  }
  return channel;
};

const logger: Logger = {
  debug: (msg: string, data?: unknown) => {
    console.log("[MarketWS]", msg, data ?? "");
  },
  error: (msg: string, err?: unknown) => {
    console.error("[MarketWS]", msg, err ?? "");
  },
};

const isValidUpdate = (p: any): p is WSUpdatePayload => {
  return p && Array.isArray(p.d);
};

// Track subscription count per exchange across all tabs
const subscriptionCount: Map<ExchangeType, number> = new Map();

const handleUnsubscribe = (socket: Socket, exchange: ExchangeType): void => {
  const count = subscriptionCount.get(exchange) ?? 1;
  const newCount = Math.max(0, count - 1);

  if (newCount > 0) {
    subscriptionCount.set(exchange, newCount);
  } else {
    subscriptionCount.delete(exchange);
    getChannel().postMessage({ type: "subscribe:remove", exchange });
    socket.emit("unsubscribe", { exchange });
  }
  getChannel().postMessage({ type: "subscribe:remove", exchange });
};

export const useMarketWebSocket = (exchange: ExchangeType): void => {
  const dispatch = useAppDispatch();
  const currentExchangeRef = useRef<ExchangeType | null>(null);

  useEffect(() => {
    const socket = getSocket();

    const onStock = (payload: any) => {
      if (isValidUpdate(payload)) {
        dispatch(batchUpdateStocks(payload.d));
      }
    };

    const onIndex = (payload: any) => {
      const items = Array.isArray(payload?.d) ? payload.d : [payload?.d];
      items.forEach((item: any) => {
        if (item?.MC) {
          dispatch(
            updateIndexData({
              exchange: item.MC,
              rawData: item,
            })
          );
        }
      });
    };

    socket.on("i", onStock);
    socket.on("idx", onIndex);

    return () => {
      socket.off("i", onStock);
      socket.off("idx", onIndex);
    };
  }, [dispatch]);


  useEffect(() => {
    const ch = getChannel();

    const handleMessage = (event: MessageEvent) => {
      const { type, exchange } = event.data;

      if (type === "subscribe:add") {
        subscriptionCount.set(exchange, (subscriptionCount.get(exchange) ?? 0) + 1);
        logger.debug("subscription count", { exchange, count: subscriptionCount.get(exchange) });
      } else if (type === "subscribe:remove") {
        const count = subscriptionCount.get(exchange) ?? 0;
        const newCount = Math.max(0, count - 1);
        if (newCount > 0) {
          subscriptionCount.set(exchange, newCount);
        } else {
          subscriptionCount.delete(exchange);
        }
        logger.debug("subscription count", { exchange, count: subscriptionCount.get(exchange) });
      }
    };

    ch.addEventListener("message", handleMessage);
    return () => ch.removeEventListener("message", handleMessage);
  }, []);


  useEffect(() => {
    const socket = getSocket();
    if (!exchange) return;

    const next = exchange.toUpperCase() as ExchangeType;
    const prev = currentExchangeRef.current;

    if (prev === next) return;

    if (prev) {
      handleUnsubscribe(socket, prev);
    }

    // Update count immediately for this tab
    subscriptionCount.set(next, (subscriptionCount.get(next) ?? 0) + 1);

    // Notify other tabs that we're subscribing
    getChannel().postMessage({ type: "subscribe:add", exchange: next });

    socket.emit("subscribe", { exchange: next });
    logger.debug("subscribed", next);
    currentExchangeRef.current = next;

    return () => {
      if (currentExchangeRef.current === next) {
        handleUnsubscribe(socket, next);
        currentExchangeRef.current = null;
      }
    };
  }, [exchange]);
};

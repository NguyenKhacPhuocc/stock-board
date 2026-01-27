import { useEffect, useRef, useMemo, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { batchUpdateStocks } from './marketSlice';
import { selectMarketStocks } from './marketSelectors';
import { marketDataService } from './marketDataService';
import io from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3000';
const SOCKET_CONFIG = {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 3000,
  reconnectionAttempts: 5,
} as const;

const logger = {
  debug: (msg: string, data?: any) => {
    console.log(`[MarketWS] ${msg}`, data || '');
  },
  error: (msg: string, error?: any) => {
    console.error(`[MarketWS] ${msg}`, error || '');
  },
};

const extractSymbols = (stocks: any[]): string[] => {
  return stocks.map(s => `i:${s.SB}`);
};

const isValidUpdate = (payload: any): payload is { a: string; d: any[] } => {
  return payload?.a === 'u' && Array.isArray(payload.d);
};

const createSocket = (): any => {
  const socket = io(SOCKET_URL, SOCKET_CONFIG);
  logger.debug('Socket instance created');
  return socket;
};

const subscribeToSymbols = (socket: any, symbols: string[]): void => {
  if (!socket.connected) {
    logger.debug('Socket not connected, skipping subscription');
    return;
  }

  if (symbols.length === 0) {
    logger.debug('No symbols to subscribe');
    return;
  }

  const displaySymbols = symbols
    .slice(0, 5)
    .map(s => s.replace('i:', ''))
    .join(', ');
  const suffix = symbols.length > 5 ? `... (+${symbols.length - 5} more)` : '';

  logger.debug(`Subscribing to ${symbols.length} symbols: ${displaySymbols}${suffix}`);
  socket.emit('subscribe', symbols, (ack: any) => {
    logger.debug('Subscription acknowledged by server', { ack });
  });
};

const unsubscribeFromSymbols = (socket: any, symbols: string[]): void => {
  if (!socket.connected) {
    logger.debug('Socket not connected, skipping unsubscription');
    return;
  }

  if (symbols.length === 0) {
    logger.debug('No symbols to unsubscribe');
    return;
  }

  const displaySymbols = symbols
    .slice(0, 5)
    .map(s => s.replace('i:', ''))
    .join(', ');
  const suffix = symbols.length > 5 ? `... (+${symbols.length - 5} more)` : '';

  logger.debug(`Unsubscribing from ${symbols.length} symbols: ${displaySymbols}${suffix}`);
  socket.emit('unsubscribe', symbols, (ack: any) => {
    logger.debug('Unsubscription acknowledged by server', { ack });
  });
};

const handleMarketUpdate = (payload: any, dispatch: any): void => {
  if (!isValidUpdate(payload)) {
    logger.error('Invalid update payload', payload);
    return;
  }

  const batch = payload.d.filter((item: any) => !!item.SB);

  if (batch.length === 0) return;

  marketDataService.batchUpdate(batch);
  dispatch(batchUpdateStocks(batch));

  logger.debug(`Updated ${batch.length} stocks`, {
    samples: batch.slice(0, 3).map((s: any) => s.SB).join(', '),
  });
};

interface SocketHandlers {
  onConnect: () => void;
  onDisconnect: (reason: string) => void;
  onConnectError: (error: any) => void;
  onUpdate: (payload: any) => void;
}

const setupSocketHandlers = (socket: any, handlers: SocketHandlers): void => {
  socket.on('connect', handlers.onConnect);
  socket.on('disconnect', handlers.onDisconnect);
  socket.on('connect_error', handlers.onConnectError);
  socket.on('i', handlers.onUpdate);
  socket.on('idx', handlers.onUpdate);
};

const getSymbolsDiff = (
  prev: string[],
  current: string[]
): { toAdd: string[]; toRemove: string[] } => {
  const prevSet = new Set(prev);
  const currSet = new Set(current);

  const toAdd = current.filter(s => !prevSet.has(s));
  const toRemove = prev.filter(s => !currSet.has(s));

  return { toAdd, toRemove };
};

export const useMarketWebSocket = (exchange: string) => {
  const dispatch = useAppDispatch();
  const socketRef = useRef<any>(null);
  const stocks = useAppSelector(selectMarketStocks);
  const previousSymbolsRef = useRef<string[]>([]);
  const currentExchangeRef = useRef<string>(exchange);

  const symbols = useMemo(() => extractSymbols(stocks), [stocks]);

  const setupSocket = useCallback(() => {
    if (stocks.length === 0) {
      logger.debug('No stocks loaded, skipping socket setup');
      return null;
    }

    const socket = createSocket();
    socketRef.current = socket;

    const handlers: SocketHandlers = {
      onConnect: () => {
        logger.debug('Connected to backend', { socketId: socket.id, exchange });
        subscribeToSymbols(socket, symbols);
        previousSymbolsRef.current = symbols;
      },
      onDisconnect: (reason: string) => {
        logger.debug('Disconnected from backend', { reason, exchange });
      },
      onConnectError: (error: any) => {
        logger.error('Connection error', { error, exchange });
      },
      onUpdate: (payload: any) => {
        handleMarketUpdate(payload, dispatch);
      },
    };

    setupSocketHandlers(socket, handlers);
    return socket;
  }, [stocks.length, symbols, dispatch, exchange]);

  useEffect(() => {
    currentExchangeRef.current = exchange;
    const socket = socketRef.current;

    if (!socket?.connected) {
      logger.debug(`Exchange changed to ${exchange}, need to reconnect`);
      setupSocket();
      return;
    }

    logger.debug(`Exchange changed to ${exchange}, unsubscribing from previous`);
    unsubscribeFromSymbols(socket, previousSymbolsRef.current);
    subscribeToSymbols(socket, symbols);
    previousSymbolsRef.current = symbols;
  }, [exchange, setupSocket, symbols]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket?.connected) {
      logger.debug('Socket not connected, skipping subscription update');
      return;
    }

    const { toAdd, toRemove } = getSymbolsDiff(previousSymbolsRef.current, symbols);

    if (toRemove.length > 0) {
      logger.debug(`Symbols removed from exchange ${exchange}`, {
        count: toRemove.length,
        samples: toRemove.slice(0, 3).map(s => s.replace('i:', '')).join(', '),
      });
      unsubscribeFromSymbols(socket, toRemove);
    }

    if (toAdd.length > 0) {
      logger.debug(`Symbols added to exchange ${exchange}`, {
        count: toAdd.length,
        samples: toAdd.slice(0, 3).map(s => s.replace('i:', '')).join(', '),
      });
      subscribeToSymbols(socket, toAdd);
    }

    previousSymbolsRef.current = symbols;
  }, [symbols, exchange]);

  useEffect(() => {
    return () => {
      const socket = socketRef.current;
      if (socket?.connected) {
        logger.debug(`Cleaning up socket connection for exchange ${currentExchangeRef.current}`);
        unsubscribeFromSymbols(socket, previousSymbolsRef.current);
        socket.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  return socketRef.current;
};

export const MarketWS = useMarketWebSocket;

export default useMarketWebSocket;

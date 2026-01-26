import { useEffect, useRef, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { batchUpdateStocks } from './marketSlice';
import { selectMarketStocks } from './marketSelectors';
import { marketDataService } from './marketDataService';
import io from 'socket.io-client';

export const MarketWS = (exchange: string) => {
  const dispatch = useAppDispatch();
  const socketRef = useRef<any>(null);
  const stocks = useAppSelector(selectMarketStocks);

  const symbols = useMemo(() => {
    return stocks.map(s => `i:${s.SB}`);
  }, [stocks.map(s => s.SB).join(',')]); // Stable dependency

  useEffect(() => {
    // Only connect if we have the baseline data from API
    if (stocks.length === 0) return;

    const SOCKET_URL = 'http://localhost:3000';

    const socket = io(SOCKET_URL, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionDelay: 3000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    // Connection event handlers
    socket.on('connect', () => {
      console.log(`[Socket.IO] Connected to Backend (ID: ${socket.id})`);

      // Initial subscription if symbols are already available
      if (symbols.length > 0) {
        socket.emit('subscribe', symbols);
      }
    });

    socket.on('disconnect', (reason: any) => {
      console.log(`[Socket.IO] Disconnected: ${reason}`);
    });

    socket.on('connect_error', (error: any) => {
      console.error('[Socket.IO] Connection error:', error);
    });

    // Market data event handlers: "i" for Stocks, "idx" for Indices
    // Use raw BSC data directly (no parsing needed)
    const handleUpdate = (payload: any) => {
      if (payload && payload.a === 'u' && Array.isArray(payload.d)) {
        const batch = payload.d.filter((item: any) => !!item.SB);

        if (batch.length > 0) {
          // 1. Update the High Performance Service immediately
          marketDataService.batchUpdate(batch);

          // 2. Still update Redux for state consistency (can be batched/debouced if needed)
          dispatch(batchUpdateStocks(batch));
        }
      }
    };

    socket.on('i', (payload: any) => handleUpdate(payload));
    socket.on('idx', (payload: any) => handleUpdate(payload));

    // Cleanup on unmount
    return () => {
      console.log(`[Socket.IO] Cleaning up connection`);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [exchange, dispatch, stocks.length > 0]);

  // Update subscription when symbols list changes
  useEffect(() => {
    const socket = socketRef.current;
    if (socket && socket.connected && symbols.length > 0) {
      console.log(`[Socket.IO] Subscribing to ${symbols.length} symbols`);
      socket.emit('subscribe', symbols);
    }
  }, [symbols]);

  return socketRef.current;
};

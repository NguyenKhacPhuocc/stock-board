import { useEffect, useRef } from 'react';
import { useAppDispatch } from '@/app/hooks';
import { updateStockData } from './marketSlice';
import { io, Socket } from 'socket.io-client';

/**
 * Socket.IO hook for real-time market data updates
 * Connects to Socket.IO server and dispatches updates to Redux
 */
export const MarketWS = (exchange: string) => {
  const dispatch = useAppDispatch();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Socket.IO URL - adjust to your backend endpoint
    const SOCKET_URL = 'http://localhost:8080';

    // Create socket connection
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 3000,
      reconnectionAttempts: 3,
      query: {
        exchange, // Pass exchange as query parameter
      }
    });

    socketRef.current = socket;

    // Connection event handlers
    socket.on('connect', () => {
      console.log(`[Socket.IO] Connected to ${exchange} (ID: ${socket.id})`);

      // Join exchange room (if backend uses rooms)
      socket.emit('join_exchange', exchange);
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket.IO] Disconnected: ${reason}`);
    });

    socket.on('connect_error', (error) => {
      console.error('[Socket.IO] Connection error:', error);
    });

    // Market data event handlers

    // Single stock update
    socket.on('stock_update', (data: { symbol: string; data: any }) => {
      dispatch(updateStockData({
        symbol: data.symbol,
        data: data.data
      }));
    });

    // Batch updates (for multiple stocks at once)
    socket.on('batch_update', (updates: Array<{ symbol: string; data: any }>) => {
      updates.forEach((update) => {
        dispatch(updateStockData({
          symbol: update.symbol,
          data: update.data
        }));
      });
    });

    // Full snapshot (initial load or refresh)
    socket.on('market_snapshot', (stocks: any[]) => {
      console.log(`[Socket.IO] Received snapshot: ${stocks.length} stocks`);
      // Handle full snapshot if needed
    });

    // Cleanup on unmount or exchange change
    return () => {
      console.log(`[Socket.IO] Cleaning up connection for ${exchange}`);
      socket.emit('leave_exchange', exchange);
      socket.disconnect();
    };
  }, [exchange, dispatch]);

  return socketRef.current;
};

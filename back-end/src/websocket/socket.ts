import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { bscFeed } from '../feeds/bsc.feed';
import { marketService } from '../services/market.service';
import { subscriptionManager } from './subscriptionManager';

let io: Server;

const logger = {
  debug: (msg: string, data?: any) => {
    console.log(`[Socket Server] ${msg}`, data || '');
  },
  error: (msg: string, error?: any) => {
    console.error(`[Socket Server] ${msg}`, error || '');
  },
};

const handleSocketConnection = (socket: Socket) => {
  const clientId = socket.id;
  logger.debug('Client connected', { clientId });

  const snapshot = marketService.getSnapshot();
  if (snapshot.length > 0) {
    logger.debug('Sending initial snapshot to client', {
      clientId,
      symbolCount: snapshot.length,
    });
    socket.emit('i', { a: 'u', d: snapshot });
  }

  socket.on('subscribe', (symbols: string[], ack?: (msg: any) => void) => {
    if (!Array.isArray(symbols) || symbols.length === 0) {
      logger.error('Invalid subscribe request', { clientId, symbols });
      if (ack) ack({ status: 'error', message: 'Invalid symbols' });
      return;
    }

    subscriptionManager.subscribe(clientId, symbols);

    const displaySymbols = symbols.slice(0, 5).join(', ') +
      (symbols.length > 5 ? `... (+${symbols.length - 5} more)` : '');
    logger.debug('Subscribe request processed', {
      clientId,
      symbolCount: symbols.length,
      symbols: displaySymbols,
    });

    if (ack) ack({ status: 'ok', subscribed: symbols.length });
  });

  socket.on('unsubscribe', (symbols: string[], ack?: (msg: any) => void) => {
    if (!Array.isArray(symbols) || symbols.length === 0) {
      logger.error('Invalid unsubscribe request', { clientId, symbols });
      if (ack) ack({ status: 'error', message: 'Invalid symbols' });
      return;
    }

    subscriptionManager.unsubscribe(clientId, symbols);

    const displaySymbols = symbols.slice(0, 5).join(', ') +
      (symbols.length > 5 ? `... (+${symbols.length - 5} more)` : '');
    logger.debug('Unsubscribe request processed', {
      clientId,
      symbolCount: symbols.length,
      symbols: displaySymbols,
    });

    if (ack) ack({ status: 'ok', unsubscribed: symbols.length });
  });

  socket.on('disconnect', () => {
    subscriptionManager.unsubscribeAll(clientId);
    logger.debug('Client disconnected and cleaned up', { clientId });
  });

  socket.on('error', (error: any) => {
    logger.error('Socket error', { clientId, error: error.message });
  });
};

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    allowEIO3: true,
    cors: {
      origin: [
        process.env.FRONTEND_URL || 'http://localhost:5173',
        'http://localhost',
        'http://127.0.0.1',
      ],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  logger.debug('Socket Server Initialized');

  bscFeed.connect();

  marketService.on('i', (batch) => {
    io.emit('i', { a: 'u', d: batch });
  });

  marketService.on('idx', (batch) => {
    io.emit('idx', { a: 'u', d: batch });
  });

  io.on('connection', handleSocketConnection);

  setInterval(() => {
    const metrics = subscriptionManager.getMetrics();
    logger.debug('Subscription metrics', metrics);
  }, 60000);

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

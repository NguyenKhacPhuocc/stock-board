import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { bscFeed } from '../feeds/bsc.feed';
import { marketService } from '../services/market.service';

let io: Server;

export const initSocket = (server: HttpServer) => {
    io = new Server(server, {
        allowEIO3: true,
        cors: {
            origin: [
                process.env.FRONTEND_URL || "http://localhost:5173",
                "http://localhost",
                "http://127.0.0.1"
            ],
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    console.log('[Socket Server] Initialized');

    // Connect to BSC Feed
    bscFeed.connect();

    // Listen to market updates from MarketService (Short names for performance)
    marketService.on('i', (batch) => {
        io.emit('i', { a: 'u', d: batch });
    });

    marketService.on('idx', (batch) => {
        io.emit('idx', { a: 'u', d: batch });
    });

    io.on('connection', (socket) => {
        console.log(`[Socket Server] Client connected: ${socket.id}`);

        // Send initial snapshot to newly connected client
        const snapshot = marketService.getSnapshot();
        if (snapshot.length > 0) {
            socket.emit('i', { a: 'u', d: snapshot });
        }

        // Handle subscription requests from clients
        socket.on('subscribe', (symbols: string[]) => {
            console.log(`[Socket Server] Client ${socket.id} requested subscription for ${symbols.length} items`);
            if (Array.isArray(symbols) && symbols.length > 0) {
                bscFeed.subscribe(symbols);
            }
        });

        socket.on('disconnect', () => {
            console.log(`[Socket Server] Client disconnected: ${socket.id}`);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
};

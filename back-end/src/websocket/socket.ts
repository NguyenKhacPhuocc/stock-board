import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { bscFeed } from "../feeds/bsc.feed";
import { marketService } from "../services/market.service";
import { subscriptionManager } from "./subscriptionManager";
import { verifyToken, JwtPayload } from "../utils/jwt";

let io: Server;

const logger = {
  debug: (msg: string, data?: any) => {
    console.log(`[Socket Server] ${msg}`, data || "");
  },
  error: (msg: string, error?: any) => {
    console.error(`[Socket Server] ${msg}`, error || "");
  },
};

// Extended socket interface with user data
interface AuthenticatedSocket extends Socket {
  user?: JwtPayload;
}

// Middleware to verify JWT token (optional - allows anonymous connections)
const authMiddleware = (
  socket: AuthenticatedSocket,
  next: (err?: Error) => void,
) => {
  const token = socket.handshake.auth?.token;

  if (token) {
    try {
      const decoded = verifyToken(token);
      socket.user = decoded;
      logger.debug("Client authenticated", {
        userId: decoded.userId,
        socketId: socket.id,
      });
    } catch (error: any) {
      logger.debug("Invalid token provided, continuing as anonymous", {
        socketId: socket.id,
      });
    }
  } else {
    logger.debug("No token provided, continuing as anonymous", {
      socketId: socket.id,
    });
  }

  next();
};

const handleSocketConnection = (socket: AuthenticatedSocket) => {
  const clientId = socket.id;
  const isAuthenticated = !!socket.user;

  logger.debug("Client connected", {
    clientId,
    authenticated: isAuthenticated,
    userId: socket.user?.userId,
  });

  socket.on("subscribe", (data: { exchange: string }, ack?: (msg: any) => void) => {
    if (!data?.exchange) {
      logger.error("Invalid subscribe request - missing exchange", { clientId, data });
      if (ack) ack({ status: "error", message: "Exchange is required" });
      return;
    }

    const exchange = data.exchange.toUpperCase();
    const validExchanges = ['HOSE', 'HNX', 'UPCOM'];
    
    if (!validExchanges.includes(exchange)) {
      logger.error("Invalid exchange", { clientId, exchange });
      if (ack) ack({ status: "error", message: "Invalid exchange" });
      return;
    }

    // Leave all previous exchange rooms
    validExchanges.forEach(ex => {
      socket.leave(`e:${ex}`);
    });
    
    // Join new exchange room
    socket.join(`e:${exchange}`);
    
    subscriptionManager.subscribeToExchange(clientId, exchange);

    logger.debug("Exchange subscription processed", {
      clientId,
      exchange,
      rooms: Array.from(socket.rooms),
    });

    if (ack) ack({ status: "ok", exchange });
  });

  socket.on("unsubscribe", (data: { exchange: string }, ack?: (msg: any) => void) => {
    if (!data?.exchange) {
      logger.error("Invalid unsubscribe request", { clientId, data });
      if (ack) ack({ status: "error", message: "Exchange is required" });
      return;
    }

    const exchange = data.exchange.toUpperCase();
    
    // Leave exchange room
    socket.leave(`e:${exchange}`);
    
    subscriptionManager.unsubscribeFromExchange(clientId, exchange);

    logger.debug("Exchange unsubscription processed", {
      clientId,
      exchange,
      rooms: Array.from(socket.rooms),
    });

    if (ack) ack({ status: "ok", exchange });
  });

  socket.on("disconnect", () => {
    logger.debug("Client disconnected", { clientId });
    subscriptionManager.disconnect(clientId);
  });

  socket.on("error", (error: any) => {
    logger.error("Socket error", { clientId, error: error.message });
  });
};

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    allowEIO3: true,
    cors: {
      origin: [
        process.env.FRONTEND_URL || "http://localhost:5173",
        "http://localhost",
        "http://127.0.0.1",
      ],
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  logger.debug("Socket Server Initialized");

  // Apply authentication middleware
  io.use(authMiddleware);

  bscFeed.connect();

  marketService.on("i", (batch, exchange?: string) => {
    // If exchange info available, emit to specific room only
    if (exchange) {
      const room = `e:${exchange}`;
      const roomSockets = io.sockets.adapter.rooms.get(room);
      const socketCount = roomSockets ? roomSockets.size : 0;
      
      if (socketCount > 0) {
        io.to(room).emit("i", { a: "u", d: batch });
        logger.debug(`Emitted ${batch.length} stocks to room ${room} (${socketCount} clients)`);
      }
    } else {
      // Fallback: broadcast to all (for unknown symbols)
      logger.debug(`No exchange info, broadcasting ${batch.length} stocks to all`);
      io.emit("i", { a: "u", d: batch });
    }
  });

  marketService.on("idx", (batch) => {
    // Indices are broadcast to everyone
    io.emit("idx", { a: "u", d: batch });
  });

  io.on("connection", handleSocketConnection);

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};

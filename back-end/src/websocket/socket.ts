import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { bscFeed } from "../feeds/bsc.feed";
import { marketService } from "../services/market.service";
import { subscriptionManager } from "./subscriptionManager";
import { verifyToken, JwtPayload } from "../utils/jwt";
import { EXCHANGES } from "../constants/exchanges";

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

  socket.on("subscribe", (data, ack) => {
    const exchange = data?.exchange?.toUpperCase();

    if (!exchange || !EXCHANGES.includes(exchange)) {
      ack?.({ status: "error", message: "Invalid exchange" });
      return;
    }

    const prev = socket.data.exchange;
    if (prev === exchange) {
      ack?.({ status: "ok", exchange });
      return;
    }

    socket.join(`e:${exchange}`);

    subscriptionManager.subscribeToExchange(socket.id, exchange);

    if (prev) {
      socket.leave(`e:${prev}`);
    }

    socket.data.exchange = exchange;
    ack?.({ status: "ok", exchange });
  });

  socket.on("unsubscribe", (data, ack) => {
    const exchange = data?.exchange?.toUpperCase();

    if (!exchange || !EXCHANGES.includes(exchange)) {
      ack?.({ status: "error", message: "Invalid exchange" });
      return;
    }

    socket.leave(`e:${exchange}`);
    subscriptionManager.unsubscribeFromExchange(socket.id, exchange);

    if (socket.data.exchange === exchange) {
      socket.data.exchange = undefined;
    }

    ack?.({ status: "ok", exchange });
  });

  socket.on("disconnect", () => {
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

  // Apply authentication middleware
  io.use(authMiddleware);

  bscFeed.connect();

  marketService.on("i", (batch, exchange?: string) => {
    if (exchange) {
      const room = `e:${exchange}`;
      io.to(room).emit("i", { a: "u", d: batch });
    } else {
      io.emit("i", { a: "u", d: batch });
    }
  });

  marketService.on("idx", (item, exchange) => {
    io.emit("idx", { a: "u", d: item });
  });

  io.on("connection", handleSocketConnection);

  return io;
};

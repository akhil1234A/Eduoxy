// utils/socketLogger.ts
import winston from "winston";
import { format } from "winston";
import { WebSocketServer, WebSocket } from "ws";
import { Server as HttpServer } from "http";
import DailyRotateFile from "winston-daily-rotate-file";
import path from "path";

const { combine, timestamp, printf, colorize } = format;

// Custom replacer function to handle circular references
const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (key: string, value: any) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return "[Circular Reference]";
      }
      seen.add(value);
    }
    return value;
  };
};

const socketLogFormat = printf(({ level, message, timestamp, ...metadata }) => {
  const metaString = Object.keys(metadata).length 
    ? JSON.stringify(metadata, getCircularReplacer(), 2) 
    : "";
  return `[${timestamp}] 🔌 SOCKET ${level}: ${message} ${metaString}`;
});

export const socketLogger = winston.createLogger({
  format: combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), socketLogFormat),
  transports: [
    new winston.transports.Console({ level: "debug" }),
    new DailyRotateFile({
      filename: path.join(__dirname, "../logs/socket-info-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      maxSize: "10m",
      maxFiles: "7d",
      zippedArchive: true,
      level: "info",
    }),
    new DailyRotateFile({
      filename: path.join(__dirname, "../logs/socket-error-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      maxSize: "10m",
      maxFiles: "7d",
      zippedArchive: true,
      level: "error",
    }),
  ],
});

export const logSocketEvent = (event: string, data?: any) => {
  socketLogger.info(`${event}`, { data });
};

export const logSocketError = (event: string, error: any) => {
  // Extract relevant error properties to avoid circular references
  const errorInfo = {
    message: error.message,
    code: error.code,
    stack: error.stack,
    // Include any other relevant properties that might be useful
    ...(error.context && { context: error.context }),
    ...(error.req && { 
      url: error.req.url,
      method: error.req.method,
      headers: error.req.headers
    })
  };
  
  socketLogger.error(`${event}`, { error: errorInfo });
};

interface WebSocketClient extends WebSocket {
  userId?: string;
  isAlive?: boolean;
}

class WebSocketManager {
  private wss: WebSocketServer;
  private clients: Map<string, WebSocketClient[]> = new Map();

  constructor(server: HttpServer) {
    this.wss = new WebSocketServer({ server, path: "/ws" });
    this.initialize();
  }

  private initialize() {
    this.wss.on("connection", (ws: WebSocketClient, request) => {
      const userId = new URL(request.url!, `http://${request.headers.host}`).searchParams.get("userId");

      if (!userId) {
        ws.close();
        return;
      }

      ws.userId = userId;
      ws.isAlive = true;

      if (!this.clients.has(userId)) {
        this.clients.set(userId, []);
      }
      this.clients.get(userId)!.push(ws);

      socketLogger.info(`WebSocket client connected`, { userId }); 

      ws.on("pong", () => {
        ws.isAlive = true;
      });

      ws.on("close", () => {
        this.removeClient(ws);
        socketLogger.info(`WebSocket client disconnected`, { userId }); 
      });
    });

    const interval = setInterval(() => {
      this.wss.clients.forEach((ws: WebSocketClient) => {
        if (ws.isAlive === false) {
          this.removeClient(ws);
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);

    this.wss.on("close", () => {
      clearInterval(interval);
    });
  }

  private removeClient(ws: WebSocketClient) {
    if (ws.userId) {
      const userClients = this.clients.get(ws.userId);
      if (userClients) {
        const index = userClients.indexOf(ws);
        if (index !== -1) {
          userClients.splice(index, 1);
        }
        if (userClients.length === 0) {
          this.clients.delete(ws.userId);
        }
      }
    }
  }

  public sendNotification(userId: string, notification: any) {
    const userClients = this.clients.get(userId);
    if (userClients) {
      const message = JSON.stringify({
        type: "notification",
        data: notification,
      });
      userClients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
          socketLogger.info(`Notification sent`, { userId, notification }); // Log sent notifications
        }
      });
    }
  }
}

let wsManager: WebSocketManager;

export function initializeWebSocket(server: HttpServer) {
  wsManager = new WebSocketManager(server);
  return wsManager;
}

export function getWebSocketManager() {
  if (!wsManager) {
    throw new Error("WebSocket Manager not initialized");
  }
  return wsManager;
}
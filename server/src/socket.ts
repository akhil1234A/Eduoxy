import { Server } from "socket.io";
import { Server as HttpServer } from "http";

export function initializeSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    },
    path: "/socket.io/",
    transports: ["polling", "websocket"]
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    const userId = socket.handshake.query.userId as string;
    if (userId) {
      socket.join(userId);
      console.log(`User ${userId} joined their room`);
    }

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
}

export function sendNotification(io: Server, userId: string, notification: any) {
  io.to(userId).emit("notification", notification);
} 
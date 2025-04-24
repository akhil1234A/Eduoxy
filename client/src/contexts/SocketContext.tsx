"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import Cookies from "js-cookie";

interface SocketContextType {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextType>({ socket: null });

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const userId = Cookies.get("userId");
    if (!userId) return;

    const socketIo = io(process.env.NEXT_PUBLIC_API_URL, {
      query: { userId },
      reconnection: true,
      reconnectionAttempts: 5,
      path: "/socket.io/",
      transports: ["websocket", "polling"],
    });

    socketIo.on("connect", () => {
      console.log("Connected to Socket.IO server:", socketIo.id);
      socketIo.emit("joinNotifications", { userId });
    });

    socketIo.on("connect_error", (error: Error) => {
      console.error("Socket.IO connection error:", {
        message: error.message,
        stack: error.stack
      });
    });

    socketIo.on("disconnect", (reason) => {
      console.log("Disconnected from Socket.IO server. Reason:", reason);
    });

    socketIo.on("error", (error: Error) => {
      console.error("Socket.IO error:", {
        message: error.message,
        stack: error.stack
      });
    });

    setSocket(socketIo);

    return () => {
      socketIo.disconnect();
    };
  }, []);

  return <SocketContext.Provider value={{ socket }}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import Cookies from "js-cookie";
import { toast } from "sonner";
import { io} from "socket.io-client";



interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const userId = Cookies.get("userId");

  useEffect(() => {
    if (!userId) return;

    const socketInstance = io(process.env.NEXT_PUBLIC_API_URL, {
      query: { userId },
      path: "/socket.io/",
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance.on("connect", () => {
      console.log("Notification socket connected:", socketInstance.id);
      socketInstance.emit("joinNotifications", { userId });
    });

    socketInstance.on("notification", (notification: AppNotification) => {
      console.log("Received notification:", notification);
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);

      switch (notification.type) {
        case "success":
          toast.success(notification.title, {
            description: notification.message,
          });
          break;
        case "error":
          toast.error(notification.title, {
            description: notification.message,
          });
          break;
        case "warning":
          toast.warning(notification.title, {
            description: notification.message,
          });
          break;
        case "info":
        default:
          toast.info(notification.title, {
            description: notification.message,
          });
          break;
      }
    });

    socketInstance.on("connect_error", (err) => {
      console.error("Notification socket error:", err);
      toast.error("Failed to connect to notification server");
    });


    // Fetch existing notifications
    fetchNotifications();

    return () => {
      if (socketInstance.connected) {
        socketInstance.disconnect();
      }
    };
  }, [userId]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications`, {
        credentials: "include",
      });
      const data = await response.json();
      setNotifications(data.notifications);
      setUnreadCount(data.notifications.filter((n: AppNotification) => !n.isRead).length);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${notificationId}/read`, {
        method: "PUT",
        credentials: "include",
      });
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => prev - 1);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/read-all`, {
        method: "PUT",
        credentials: "include",
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, markAsRead, markAllAsRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};
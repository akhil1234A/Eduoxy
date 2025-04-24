"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { useSocket } from "./SocketContext";

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
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on("notification", (notification: AppNotification) => {
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

    // Fetch existing notifications
    fetchNotifications();

    return () => {
      socket.off("notification");
    };
  }, [socket]);

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
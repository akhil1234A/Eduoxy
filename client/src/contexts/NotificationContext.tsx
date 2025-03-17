"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import Cookies from "js-cookie";
import { toast } from "sonner";

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  isRead: boolean;
  link?: string;
  createdAt: Date;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const userId = Cookies.get("userId");

  useEffect(() => {
    if (userId) {
      const wsUrl = `${process.env.NEXT_PUBLIC_API_URL!.replace('http', 'ws')}/ws?userId=${userId}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected");
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'notification') {
          const notification = data.data;
          console.log("Received notification:", notification);
          setNotifications((prev) => [notification, ...prev]);
          setUnreadCount((prev) => prev + 1);
          toast({
            title: notification.title,
            description: notification.message,
            variant: notification.type as any,
          });
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected");
      };

      // Fetch existing notifications
      fetchNotifications();

      return () => {
        if (wsRef.current) {
          wsRef.current.close();
        }
      };
    }
  }, [userId]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/notifications`,
        {
          credentials: "include",
        }
      );
      const data = await response.json();
      setNotifications(data.notifications);
      setUnreadCount(data.notifications.filter((n: Notification) => !n.isRead).length);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${notificationId}/read`,
        {
          method: "PUT",
          credentials: "include",
        }
      );
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notificationId ? { ...n, isRead: true } : n
        )
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
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
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
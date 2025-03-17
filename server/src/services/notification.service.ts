import { Notification } from "../models/notification.model";
import { getWebSocketManager } from "../utils/socketLogger";

export class NotificationService {
  async createNotification(data: {
    userId: string;
    title: string;
    message: string;
    type: "info" | "success" | "warning" | "error";
    link?: string;
  }) {
    const notification = await Notification.create(data);
    
    // Send real-time notification via WebSocket
    const wsManager = getWebSocketManager();
    wsManager.sendNotification(data.userId, notification);
    
    return notification;
  }

  async getUserNotifications(userId: string) {
    return Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);
  }

  async markAsRead(notificationId: string) {
    return Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    );
  }

  async markAllAsRead(userId: string) {
    return Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );
  }
} 
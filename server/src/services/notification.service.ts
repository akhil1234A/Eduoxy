import { Notification } from "../models/notification.model";
import { getWebSocketManager } from "../utils/socketLogger";
import { apiLogger } from "../utils/logger";

export class NotificationService {
  async createNotification(data: {
    userId: string;
    title: string;
    message: string;
    type: "info" | "success" | "warning" | "error";
    link?: string;
  }) {
    apiLogger.info("Creating notification", {
      userId: data.userId,
      type: data.type,
      title: data.title,
    });

    try {
      const notification = await Notification.create(data);
      
      // Send real-time notification via WebSocket
      const wsManager = getWebSocketManager();
      wsManager.sendNotification(data.userId, notification);
      
      apiLogger.info("Notification created and sent", {
        notificationId: notification._id,
        userId: data.userId,
      });
      
      return notification;
    } catch (error) {
      const err = error as Error
      apiLogger.error("Failed to create notification", {
        error: err.message,
        userId: data.userId,
      });
      throw err;
    }
  }

  async getUserNotifications(userId: string) {
    apiLogger.debug("Fetching user notifications", { userId });
    
    try {
      const notifications = await Notification.find({ userId })
        .sort({ createdAt: -1 })
        .limit(50);
      
      apiLogger.info("User notifications fetched", {
        userId,
        count: notifications.length,
      });
      
      return notifications;
    } catch (error) {
      const err = error as Error
      apiLogger.error("Failed to fetch user notifications", {
        error: err.message,
        userId,
      });
      throw err;
    }
  }

  async markAsRead(notificationId: string) {
    apiLogger.debug("Marking notification as read", { notificationId });
    
    try {
      const notification = await Notification.findByIdAndUpdate(
        notificationId,
        { isRead: true },
        { new: true }
      );
      
      apiLogger.info("Notification marked as read", {
        notificationId,
        userId: notification?.userId,
      });
      
      return notification;
    } catch (error) {
      const err = error as Error
      apiLogger.error("Failed to mark notification as read", {
        error: err.message,
        notificationId,
      });
      throw err;
    }
  }

  async markAllAsRead(userId: string) {
    apiLogger.debug("Marking all notifications as read", { userId });
    
    try {
      const result = await Notification.updateMany(
        { userId, isRead: false },
        { isRead: true }
      );
      
      apiLogger.info("All notifications marked as read", {
        userId,
        modifiedCount: result.modifiedCount,
      });
      
      return result;
    } catch (error) {
      const err = error as Error
      apiLogger.error("Failed to mark all notifications as read", {
        error: err.message,
        userId,
      });
      throw err;
    }
  }
} 
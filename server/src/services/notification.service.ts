import { Notification } from "../models/notification.model";
import { io } from "../app";
import { apiLogger } from "../utils/logger";

/**
 * This is a service responsible for managing notifications
 * It handles creating, retrieving, and marking notifications as read
 * It uses Socket.IO to send real-time notifications to users
 */
export class NotificationService {

  /**
   * This method creates a new notification and sends it to the user in real-time
   * @param data - data object containing userId, title, message, type, and optional link
   * @param userId - ID of the user to whom the notification is sent
   * @param title - title of the notification
   * @param message - message of the notification
   * @param type - type of the notification (info, success, warning, error)
   * @param link - optional link to be included in the notification
   * @returns 
   */
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
      
      // Send real-time notification via Socket.IO
      io.to(`notifications:${data.userId}`).emit("notification", notification);
      
      apiLogger.info("Notification created and sent", {
        notificationId: notification._id,
        userId: data.userId,
      });
      
      return notification;
    } catch (error) {
      const err = error as Error;
      apiLogger.error("Failed to create notification", {
        error: err.message,
        userId: data.userId,
      });
      throw err;
    }
  }

  /**
   * This method retrieves notifications for a specific user
   * @param userId - ID of the user whose notifications are to be fetched
   * @returns list of notifications for the user
   */
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

  /**
   * This method marks notification as read
   * @param notificationId 
   * @returns 
   */
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

  /**
   * This method marks all notifications as read for a specific user
   * @param userId - ID of the user whose notifications are to be marked as read
   * @returns result of the update operation
   */
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
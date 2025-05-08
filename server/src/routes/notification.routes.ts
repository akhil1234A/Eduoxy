import { Router } from "express";
import container from "../di/container";
import { NotificationService } from "../services/notification.service";

const router = Router();
const notificationService = container.get<NotificationService>(NotificationService);

/**
 * Notification Routes
 * These routes are accessible to all users
 */


/** 
 * GET /api/notifications
 * Get all notifications for the logged-in user
 * @returns {Array} notifications - List of notifications for the user
 */
router.get("/", async (req, res, next) => {
  try {
    const userId = req.cookies.userId;
    const notifications = await notificationService.getUserNotifications(userId);
    res.json({ notifications });
  } catch (error) {
    next(error);
  }
});

/** 
 * Update a notification as read 
 * @returns {Object} notification - The updated notification object
 */
router.put("/:id/read", async (req, res, next) => {
  try {
    const notification = await notificationService.markAsRead(req.params.id);
    res.json({ notification });
  } catch (error) {
    next(error);
  }
});

/** 
 * Update all notifications as read 
 * @returns {Object} message - Confirmation message
 */
router.put("/read-all", async (req, res, next) => {
  try {
    const userId = req.cookies.userId;
    await notificationService.markAllAsRead(userId);
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    next(error);
  }
});

export default router; 
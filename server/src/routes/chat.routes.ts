import express from "express";
import { chatController } from "../di/container";

const router = express.Router();

/**
 * Chat Routes
 * These routes are accessible to all users
 */
router.get("/history", chatController.getChatHistory.bind(chatController));

export default router;

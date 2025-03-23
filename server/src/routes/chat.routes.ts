import express from "express";
import { chatController } from "../di/container";

const router = express.Router();

router.get("/history", chatController.getChatHistory.bind(chatController));

export default router;

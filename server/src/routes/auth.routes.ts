import express from "express";
import { authController } from "../di/container";

const router = express.Router();

/**
 * Auth Routes
 * These routes are accessible to all users
 */
router.post("/signup", authController.signUp.bind(authController));
router.post("/login", authController.login.bind(authController));
router.post("/verify-otp", authController.verifyOtp.bind(authController));
router.post("/refresh", authController.refresh.bind(authController));
router.post("/logout", authController.logout.bind(authController));
router.post("/google", authController.googleAuth.bind(authController));
router.post("/request-password-reset", authController.requestPasswordReset.bind(authController));
router.post("/reset-password/:token", authController.resetPassword.bind(authController));
router.post("/send-otp", authController.sendOtp.bind(authController));

export default router;
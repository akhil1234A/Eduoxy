import express from "express";
import { signUp, login, verifyOtp, logout, refresh, googleAuth, requestPasswordReset, resetPassword, sendOtp} from "../controllers/auth.controller";

const router = express.Router();

router.post("/signup", signUp);
router.post("/login", login);
router.post("/verify-otp", verifyOtp);
router.post("/refresh",refresh);
router.post("/logout", logout);
router.post("/google",googleAuth);
router.post("/password-reset/request", requestPasswordReset);
router.post("/password-reset/verify", resetPassword);
router.post("/send-otp",sendOtp)

export default router;

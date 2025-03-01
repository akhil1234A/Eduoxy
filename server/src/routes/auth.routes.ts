import express from "express";
import { signUp, login, verifyOtp} from "../controllers/auth.controller";

const router = express.Router();

router.post("/signup", signUp);
router.post("/login", login);
router.post("/verify-otp", verifyOtp);
// router.post("/logout", logout);

export default router;

import express from "express";
import { userController } from "../di/container";
import { authenticateUser } from "../middleware/auth.middleware";
import multer from "multer";

const router = express.Router();
const upload = multer({ dest: "uploads/" });


/**
 * User Routes
 * These routes are accessible to all authenticated users
 */
router.put("/update-password", authenticateUser, userController.updatePassword.bind(userController));

router.put("/update-profile", authenticateUser, upload.single("profileImage"), userController.updateInstructorProfile.bind(userController));

router.get("/profile", userController.getProfile.bind(userController));

export default router;

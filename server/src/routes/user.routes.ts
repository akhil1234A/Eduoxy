import express from "express";
import { userController } from "../di/container";
import { authenticateUser } from "../middleware/auth.middleware";
import multer from "multer";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.use(authenticateUser);

router.put("/update-password", userController.updatePassword.bind(userController));

router.put("/update-profile", upload.single("profileImage"), userController.updateInstructorProfile.bind(userController));

router.get("/profile", userController.getProfile.bind(userController));

export default router;

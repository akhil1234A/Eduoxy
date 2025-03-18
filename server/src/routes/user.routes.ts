import express from "express";
import { userController } from "../di/container";
import { authenticateUser } from "../middleware/auth.middleware";

const router = express.Router();

router.use(authenticateUser);

router.put("/update-password", userController.updatePassword.bind(userController));

export default router;

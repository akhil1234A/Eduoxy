import express from "express";
import { dashboardController } from "../di/container";
import { authenticateUser, authorizeRoles } from "../middleware/auth.middleware";

const router = express.Router();
router.use(authenticateUser);

router.get("/admin", authorizeRoles("admin"), dashboardController.getAdminDashboard.bind(dashboardController));
router.get("/teacher/:teacherId", authorizeRoles("teacher"), dashboardController.getTeacherDashboard.bind(dashboardController));
router.get("/user/:userId", authorizeRoles("student"), dashboardController.getUserDashboard.bind(dashboardController));

export default router;

import express from "express";
import { userCourseProgressController } from "../di/container";
import { authenticateUser, authorizeRoles } from "../middleware/auth.middleware";

const router = express.Router();

router.use(authenticateUser, authorizeRoles("student"));

/**
 * Course Progress Routes
 * These routes are accessible only to student users
 */
router.get("/:userId/enrolled-courses", userCourseProgressController.getUserEnrolledCourses.bind(userCourseProgressController));
router.get("/:userId/courses/:courseId", userCourseProgressController.getUserCourseProgress.bind(userCourseProgressController));
router.put("/:userId/courses/:courseId", userCourseProgressController.updateUserCourseProgress.bind(userCourseProgressController));

export default router;
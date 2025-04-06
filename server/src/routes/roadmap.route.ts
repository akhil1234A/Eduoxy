import { Router } from "express";
import { roadmapController } from "../di/container";
import { authenticateUser, authorizeRoles } from "../middleware/auth.middleware";

const router = Router();


// Admin routes
router.post(
  "/",
  authenticateUser,
  authorizeRoles("admin"),
  roadmapController.createRoadmap.bind(roadmapController)
);

router.put(
  "/:id",
  authenticateUser,
  authorizeRoles("admin"),
  roadmapController.updateRoadmap.bind(roadmapController)
);

router.delete(
  "/:id",
  authenticateUser,
  authorizeRoles("admin"),
  roadmapController.deleteRoadmap.bind(roadmapController)
);

// Public routes
router.get("/", roadmapController.getAllRoadmaps.bind(roadmapController));
router.get("/:id", roadmapController.getRoadmapById.bind(roadmapController));

// User progress routes
router.put(
  "/:roadmapId/sections/:sectionId/topics/:topicId/progress",
  authenticateUser,
  roadmapController.updateTopicProgress.bind(roadmapController)
);

export default router; 
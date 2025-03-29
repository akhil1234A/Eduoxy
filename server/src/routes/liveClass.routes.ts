import express from "express";
import { liveClassController } from "../di/container";
import { authenticateUser } from "../middleware/auth.middleware";

const router = express.Router();

router.use(authenticateUser);

router.post("/", liveClassController.createLiveClass.bind(liveClassController));
router.get("/:courseId", liveClassController.getSchedule.bind(liveClassController));
router.post("/:liveClassId/join", liveClassController.joinLiveClass.bind(liveClassController));
router.post("/:liveClassId/leave", liveClassController.leaveLiveClass.bind(liveClassController));
router.post("/:liveClassId/start", liveClassController.startLiveClass.bind(liveClassController));

export default router;

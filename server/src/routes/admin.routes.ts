import express from "express";
import { adminController } from "../di/container";
import { authenticateUser, authorizeRoles } from "../middleware/auth.middleware";

const router = express.Router();

router.use(authenticateUser, authorizeRoles("admin"));

router.get("/students", adminController.listStudents.bind(adminController));
router.get("/teachers", adminController.listTeachers.bind(adminController));
router.put("/users/:userId/block", adminController.blockUser.bind(adminController));
router.put("/users/:userId/unblock", adminController.unblockUser.bind(adminController));

export default router;
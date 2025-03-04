import express from "express";
import multer from "multer";
import {
  createCourse,
  deleteCourse,
  getCourse,
  listCourses,
  updateCourse,
} from "../controllers/courseController";
import { authenticateUser, authorizeRoles } from "../middleware/auth.middleware";


const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/", listCourses);
router.post("/", authenticateUser, authorizeRoles("teacher"),createCourse);

router.get("/:courseId", getCourse);
router.put("/:courseId", authenticateUser, authorizeRoles("teacher"),upload.single("image"), updateCourse);
router.delete("/:courseId", authenticateUser, authorizeRoles("teacher"),deleteCourse);



export default router;

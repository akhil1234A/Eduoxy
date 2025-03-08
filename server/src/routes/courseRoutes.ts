import express from "express";
import multer from "multer";
import {
  createCourse,
  deleteCourse,
  getCourse,
  listAdminCourses,
  listPublicCourses,
  listTeacherCourses,
  updateCourse,
  unlistCourse,
  publishCourse,
} from "../controllers/courseController";
import { authenticateUser, authorizeRoles } from "../middleware/auth.middleware";


const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

//Public
router.get("/public", listPublicCourses);

//Admin
router.get("/admin", authenticateUser, authorizeRoles("admin"),listAdminCourses);
router.put("/:courseId/unlist", authenticateUser, authorizeRoles("admin"), unlistCourse);
router.put("/:courseId/publish", authenticateUser, authorizeRoles("admin"), publishCourse);


//Teacer
router.get("/teacher", authenticateUser, authorizeRoles("teacher"),listTeacherCourses)
router.post("/", authenticateUser, authorizeRoles("teacher"),createCourse);
router.get("/:courseId", getCourse);
router.put("/:courseId", authenticateUser, authorizeRoles("teacher"),upload.single("image"), updateCourse);
router.delete("/:courseId", authenticateUser, authorizeRoles("teacher"),deleteCourse);



export default router;

import express from "express";
import multer from "multer";
import { courseController } from "../di/container";
import { authenticateUser, authorizeRoles } from "../middleware/auth.middleware";


const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

//Public
router.get("/public", courseController.listPublicCourses.bind(courseController));

//Admin
router.get("/admin", authenticateUser, authorizeRoles("admin"), courseController.listAdminCourses.bind(courseController));
router.put("/:courseId/unlist", authenticateUser, authorizeRoles("admin"), courseController.unlistCourse.bind(courseController));
router.put("/:courseId/publish", authenticateUser, authorizeRoles("admin"), courseController.publishCourse.bind(courseController));


//Teacher
router.get("/teacher", authenticateUser, authorizeRoles("teacher"), courseController.listTeacherCourses.bind(courseController));
router.post("/", authenticateUser, authorizeRoles("teacher"), courseController.createCourse.bind(courseController));
router.get("/:courseId", courseController.getCourse.bind(courseController));
router.put(
  "/:courseId",
  authenticateUser,
  authorizeRoles("teacher"),
  upload.single("image"),
  courseController.updateCourse.bind(courseController)
);
router.delete("/:courseId", authenticateUser, authorizeRoles("teacher"), courseController.deleteCourse.bind(courseController));





export default router;

import { Router } from "express";
import { reviewController } from "../di/container";
import { authenticateUser, authorizeRoles } from "../middleware/auth.middleware";



const router = Router();

 /**    
  * Review Routes
  * These routes are accessible only to authenticated users 
  */
router.get("/course/:courseId", reviewController.getReviewsByCourseId.bind(reviewController));
router.post("/",authenticateUser,reviewController.addReview.bind(reviewController))
router.delete("/:id",authenticateUser,reviewController.deleteReview.bind(reviewController))

export default router;

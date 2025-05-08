import { Router } from "express";
import { forumController } from "../di/container";
import { authenticateUser } from "../middleware/auth.middleware";

const router = Router();

/** 
 * Routes for forum
 */

// Forum routes
router.get("/", forumController.getForums.bind(forumController));
router.post("/", authenticateUser, forumController.createForum.bind(forumController));
router.get("/:forumId", forumController.getForum.bind(forumController));
router.put("/:forumId", authenticateUser, forumController.updateForum.bind(forumController));
router.delete("/:forumId", authenticateUser, forumController.deleteForum.bind(forumController));

// Post routes
router.get("/:forumId/posts", forumController.getPosts.bind(forumController));
router.post("/:forumId/posts", authenticateUser, forumController.createPost.bind(forumController));
router.get("/posts/:postId", forumController.getPost.bind(forumController));
router.put("/posts/:postId", authenticateUser, forumController.updatePost.bind(forumController));
router.delete("/posts/:postId", authenticateUser, forumController.deletePost.bind(forumController));

// Reply routes
router.get("/posts/:postId/replies", forumController.getReplies.bind(forumController));
router.post("/posts/:postId/replies", authenticateUser, forumController.createReply.bind(forumController));
router.put("/replies/:replyId", authenticateUser, forumController.updateReply.bind(forumController));
router.delete("/replies/:replyId", authenticateUser, forumController.deleteReply.bind(forumController));

export default router;
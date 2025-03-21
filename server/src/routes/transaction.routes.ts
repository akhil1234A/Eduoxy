import express from "express";
import { transactionController } from "../di/container";
import { authenticateUser, authorizeRoles } from "../middleware/auth.middleware";

const router = express.Router();

router.use(authenticateUser);

router.post("/", transactionController.createTransaction.bind(transactionController));
router.post("/stripe/payment-intent", transactionController.createStripePaymentIntent.bind(transactionController));
router.get("/admin/earnings", authorizeRoles("admin"), transactionController.getAdminEarnings.bind(transactionController));
router.get("/teacher/earnings/:teacherId", authorizeRoles("teacher"), transactionController.getTeacherEarnings.bind(transactionController));
router.get("/student/purchases/:userId", authorizeRoles("student"), transactionController.getStudentPurchases.bind(transactionController));

export default router;
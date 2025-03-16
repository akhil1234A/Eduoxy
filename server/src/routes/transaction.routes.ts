import express from "express";
import { transactionController } from "../di/container";

const router = express.Router();

router.get("/", transactionController.listTransactions.bind(transactionController));
router.post("/", transactionController.createTransaction.bind(transactionController));
router.post("/stripe/payment-intent", transactionController.createStripePaymentIntent.bind(transactionController));

export default router;


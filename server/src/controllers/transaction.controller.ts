import { injectable, inject } from "inversify";
import TYPES from "../di/types";
import { Request, Response } from "express";
import { ITransactionService } from "../interfaces/transaction.service";
import Stripe from "stripe";
import { HttpStatus } from "../utils/httpStatus";
import { errorResponse, successResponse } from "../types/types";
import { apiLogger } from "../utils/logger";
import { RESPONSE_MESSAGES } from "../utils/responseMessages";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: "2025-02-24.acacia" });

@injectable()
export class TransactionController {
  constructor(
    @inject(TYPES.ITransactionService) private _transactionService: ITransactionService
  ) {}

  async createStripePaymentIntent(req: Request, res: Response): Promise<void> {
    console.log("Request body:", req.body);
    const { amount, userId, courseId } = req.body;
    apiLogger.info("Creating stripe payment intent", { amount, userId, courseId });
    if (!amount || amount <= 0 || !userId || !courseId) {
      res.status(HttpStatus.BAD_REQUEST).json(errorResponse(RESPONSE_MESSAGES.TRANSACTION.CREATE_PAYMENT_INTENT_FAIL));
      apiLogger.error("Invalid request parameters", { amount, userId, courseId });
      return;
    }

    try {
      const idempotencyKey = `${userId}:${courseId}`;
      apiLogger.info("Creating stripe payment intent", { idempotencyKey });
      const paymentIntent = await stripe.paymentIntents.create(
        {
          amount: amount * 100,
          currency: "inr",
          automatic_payment_methods: { enabled: true, allow_redirects: "never" },
          metadata: {
            userId,
            courseId,
          },
        },
        { idempotencyKey }
      );
      apiLogger.info("Stripe payment intent created successfully", { paymentIntent });
      res.json(successResponse(RESPONSE_MESSAGES.TRANSACTION.CREATE_PAYMENT_INTENT_SUCCESS, { clientSecret: paymentIntent.client_secret }));
    } catch (error) {
      const err = error as Error;
      apiLogger.error("Error creating stripe payment intent", { error: err.message });
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse(RESPONSE_MESSAGES.TRANSACTION.CREATE_PAYMENT_INTENT_FAIL, err));
    }
  }

  async createTransaction(req: Request, res: Response): Promise<void> {
    const { userId, courseId, transactionId, amount, paymentProvider } = req.body;
    apiLogger.info("Creating transaction", { userId, courseId, transactionId, amount, paymentProvider });
    try {
      const transaction = await this._transactionService.createTransaction(
        userId,
        courseId,
        transactionId,
        amount,
        paymentProvider
      );
      apiLogger.info("Transaction created successfully", { transaction });
      res.json(successResponse(RESPONSE_MESSAGES.TRANSACTION.CREATE_TRANSACTION_SUCCESS, { transaction }));
    } catch (error) {
      const err = error as Error;
      apiLogger.error("Error creating transaction", { error: err.message });
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse(RESPONSE_MESSAGES.TRANSACTION.CREATE_TRANSACTION_FAIL, err));
    }
  }

  async getAdminEarnings(req: Request, res: Response): Promise<void> {
    try {
      const earnings = await this._transactionService.getAdminEarnings();
      res.json(successResponse(RESPONSE_MESSAGES.TRANSACTION.GET_ADMIN_EARNINGS_SUCCESS, earnings));
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse(RESPONSE_MESSAGES.TRANSACTION.GET_ADMIN_EARNINGS_FAIL, err));
    }
  }

  async getTeacherEarnings(req: Request, res: Response): Promise<void> {
    const { teacherId } = req.params;
    if (!teacherId) {
      res.status(HttpStatus.BAD_REQUEST).json(errorResponse(RESPONSE_MESSAGES.TRANSACTION.TEACHER_ID_REQUIRED));
      return;
    }
    try {
      const earnings = await this._transactionService.getTeacherEarnings(teacherId);
      res.json(successResponse(RESPONSE_MESSAGES.TRANSACTION.GET_TEACHER_EARNINGS_SUCCESS, earnings));
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse(RESPONSE_MESSAGES.TRANSACTION.GET_TEACHER_EARNINGS_FAIL, err));
    }
  }

  async getStudentPurchases(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    if (!userId) {
      res.status(HttpStatus.BAD_REQUEST).json(errorResponse(RESPONSE_MESSAGES.TRANSACTION.USER_ID_REQUIRED));
      return;
    }
    try {
      const purchases = await this._transactionService.getStudentPurchases(userId);
      res.json(successResponse(RESPONSE_MESSAGES.TRANSACTION.GET_STUDENT_PURCHASES_SUCCESS, purchases));
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse(RESPONSE_MESSAGES.TRANSACTION.GET_STUDENT_PURCHASES_FAIL, err));
    }
  }
}
import { injectable, inject } from "inversify";
import TYPES from "../di/types";
import { Request, Response } from "express";
import { ITransactionService } from "../interfaces/transaction.service";
import Stripe from "stripe";
import { HttpStatus } from "../utils/httpStatus";
import { errorResponse, successResponse } from "../types/types";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: "2025-02-24.acacia" });

@injectable()
export class TransactionController {
  constructor(
    @inject(TYPES.ITransactionService) private _transactionService: ITransactionService
  ) {}

  async createStripePaymentIntent(req: Request, res: Response): Promise<void> {
    console.log("Request body:", req.body);
    const { amount, userId, courseId } = req.body;

    if (!amount || amount <= 0 || !userId || !courseId) {
      res.status(HttpStatus.BAD_REQUEST).json(errorResponse("Invalid request parameters"));
      return;
    }

    try {
      const idempotencyKey = `${userId}:${courseId}`;
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
      res.json(successResponse("Stripe payment intent created successfully", { clientSecret: paymentIntent.client_secret }));
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse("Error creating stripe payment intent", err));
    }
  }

  async createTransaction(req: Request, res: Response): Promise<void> {
    const { userId, courseId, transactionId, amount, paymentProvider } = req.body;
    try {
      const transaction = await this._transactionService.createTransaction(
        userId,
        courseId,
        transactionId,
        amount,
        paymentProvider
      );
      res.json(successResponse("Purchased Course successfully", { transaction }));
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse("Error creating transaction", err));
    }
  }

  async getAdminEarnings(req: Request, res: Response): Promise<void> {
    try {
      const earnings = await this._transactionService.getAdminEarnings();
      res.json(successResponse("Admin earnings retrieved successfully", earnings));
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse("Error retrieving admin earnings", err));
    }
  }

  async getTeacherEarnings(req: Request, res: Response): Promise<void> {
    const { teacherId } = req.params;
    if (!teacherId) {
      res.status(HttpStatus.BAD_REQUEST).json(errorResponse("Teacher ID is required"));
      return;
    }
    try {
      const earnings = await this._transactionService.getTeacherEarnings(teacherId);
      res.json(successResponse("Teacher earnings retrieved successfully", earnings));
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse("Error retrieving teacher earnings", err));
    }
  }

  async getStudentPurchases(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    if (!userId) {
      res.status(HttpStatus.BAD_REQUEST).json(errorResponse("User ID is required"));
      return;
    }
    try {
      const purchases = await this._transactionService.getStudentPurchases(userId);
      res.json(successResponse("Student purchases retrieved successfully", purchases));
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse("Error retrieving student purchases", err));
    }
  }
}
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

  async listTransactions(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.query as { userId?: string };
      const transactions = await this._transactionService.listTransactions(userId);
      res.json(successResponse("Transactions retrieved successfully", transactions));
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse("Error retrieving transactions", err));
    }
  }

  async createStripePaymentIntent(req: Request, res: Response): Promise<void> {
    let { amount } = req.body;
    if (!amount || amount <= 0) amount = 50;

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100,
        currency: "inr",
        automatic_payment_methods: { enabled: true, allow_redirects: "never" },
      });
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
}
import { injectable, inject } from "inversify";
import TYPES from "../di/types";
import { Request, Response } from "express";
import { ITransactionService } from "../interfaces/transaction.service";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: "2025-02-24.acacia" });

@injectable()
export class TransactionController {
  constructor(
    @inject(TYPES.ITransactionService) private transactionService: ITransactionService
  ) {}

  async listTransactions(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.query as { userId?: string };
      const transactions = await this.transactionService.listTransactions(userId);
      res.json({ message: "Transactions retrieved successfully", data: transactions });
    } catch (error) {
      res.status(500).json({ message: "Error retrieving transactions", error });
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
      res.json({ message: "", data: { clientSecret: paymentIntent.client_secret } });
    } catch (error) {
      res.status(500).json({ message: "Error creating stripe payment intent", error });
    }
  }

  async createTransaction(req: Request, res: Response): Promise<void> {
    const { userId, courseId, transactionId, amount, paymentProvider } = req.body;
    try {
      const transaction = await this.transactionService.createTransaction(
        userId,
        courseId,
        transactionId,
        amount,
        paymentProvider
      );
      res.json({ message: "Purchased Course successfully", data: { transaction } });
    } catch (error) {
      res.status(500).json({ message: "Error creating transaction", error });
    }
  }
}
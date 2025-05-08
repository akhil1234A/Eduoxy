import { injectable, inject } from "inversify";
import TYPES from "../di/types";
import { Request, Response } from "express";
import { ITransactionService } from "../interfaces/transaction.service";
import Stripe from "stripe";
import { HttpStatus } from "../utils/httpStatus";
import { errorResponse, successResponse } from "../types/types";
import { apiLogger } from "../utils/logger";
import { RESPONSE_MESSAGES } from "../utils/responseMessages";
import { buildPaginationResult, getPaginationParams } from "../utils/paginationUtil";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: "2025-02-24.acacia" });

/**
 * Controller for handling transaction functionality
 * * *    1. Create a Stripe payment intent
 * * *    2. Create a transaction
 * * *    3. Get admin earnings
 * * *    4. Get teacher earnings
 * * *    5. Get student purchases
 * 
 */
@injectable()
export class TransactionController {
  constructor(
    @inject(TYPES.ITransactionService) private _transactionService: ITransactionService
  ) {}

  /**
   * This method handles the creation of a Stripe payment intent
   * @param req amount, userId, courseId
   * @param res 
   * @returns 
   */
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

  /**
   * This method handles the creation of a transaction
   * @param req userId, courseId, transactionId, amount, paymentProvider
   * @param res 
   */
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

  /**
   * This method retrieves admin earnings with pagination and search
   * @param req page, limit, searchTerm
   * @param res 
   */
  async getAdminEarnings(req: Request, res: Response): Promise<void> {
    try {
      const params = getPaginationParams(req);

      const results = await this._transactionService.getAdminEarnings(params.page, params.limit, params.searchTerm);
      apiLogger.info("Admin earnings fetched successfully", { results });
      res.json(successResponse(RESPONSE_MESSAGES.TRANSACTION.GET_ADMIN_EARNINGS_SUCCESS, results));
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse(RESPONSE_MESSAGES.TRANSACTION.GET_ADMIN_EARNINGS_FAIL, err));
    }
  }

  /**
   * This method retrieves teacher earnings with pagination and search
   * @param req teacherId, page, limit, searchTerm
   * @param res 
   * @returns 
   */
  async getTeacherEarnings(req: Request, res: Response): Promise<void> {
    const { teacherId } = req.params;
    if (!teacherId) {
      res.status(HttpStatus.BAD_REQUEST).json(errorResponse(RESPONSE_MESSAGES.TRANSACTION.TEACHER_ID_REQUIRED));
      return;
    }
    try {

      const params = getPaginationParams(req);
      
      const earnings = await this._transactionService.getTeacherEarnings(teacherId, params.page, params.limit, params.searchTerm);
      res.json(successResponse(RESPONSE_MESSAGES.TRANSACTION.GET_TEACHER_EARNINGS_SUCCESS, earnings));
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse(RESPONSE_MESSAGES.TRANSACTION.GET_TEACHER_EARNINGS_FAIL, err));
    }
  }

  /**
   * This method retrieves student purchases with pagination and search
   * @param req userId, page, limit, searchTerm
   * @param res 
   */
  async getStudentPurchases(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    apiLogger.info("Getting student purchases", { userId });
    if (!userId) {
      res.status(HttpStatus.BAD_REQUEST).json(errorResponse(RESPONSE_MESSAGES.TRANSACTION.USER_ID_REQUIRED));
      return;
    }
    try {
      const { page, limit, searchTerm } = getPaginationParams(req);
      const purchases = await this._transactionService.getStudentPurchases(userId, page, limit, searchTerm);
      apiLogger.info("Student purchases fetched successfully", { purchases });
      res.json(successResponse(RESPONSE_MESSAGES.TRANSACTION.GET_STUDENT_PURCHASES_SUCCESS, purchases));
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse(RESPONSE_MESSAGES.TRANSACTION.GET_STUDENT_PURCHASES_FAIL, err));
    }
  }
}
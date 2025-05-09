import { inject, injectable } from "inversify";
import { Model, FilterQuery } from "mongoose";
import Transaction, { ITransaction } from "../models/transaction.model";
import { ITransactionRepository } from "../interfaces/transaction.repository";
import { BaseRepository } from "./base.repository";
import TYPES from "../di/types";

/**
 * Repository for managing transaction-related database operations.
 */
@injectable()
export class TransactionRepository extends BaseRepository<ITransaction> implements ITransactionRepository {
  constructor(@inject(TYPES.TransactionModel) private transactionModel: Model<ITransaction>) {
    super(transactionModel);
  }

  /**
   * Retrieves transactions for a specific user.
   * @param userId 
   * @param skip 
   * @param limit 
   * @returns 
   */
  async findByUserId(userId: string, skip: number = 0, limit: number = 0): Promise<ITransaction[]> {
    try {
      let transactionQuery = this.model.find({ userId }).sort({ createdAt: -1 });
      if (skip > 0) transactionQuery = transactionQuery.skip(skip);
      if (limit > 0) transactionQuery = transactionQuery.limit(limit);
      return await transactionQuery.exec();
    } catch (error) {
      throw new Error(`Failed to fetch transactions for user ${userId}: ${(error as Error).message}`);
    }
  }

  /**
   * Retrieves all transactions for the admin panel.
   * @param skip 
   * @param limit 
   * @returns 
   */
  async findAll(skip: number = 0, limit: number = 0): Promise<ITransaction[]> {
    try {
      let transactionQuery = this.model.find().sort({ createdAt: -1 });
      if (skip > 0) transactionQuery = transactionQuery.skip(skip);
      if (limit > 0) transactionQuery = transactionQuery.limit(limit);
      return await transactionQuery.exec();
    } catch (error) {
      throw new Error(`Failed to fetch all transactions: ${(error as Error).message}`);
    }
  }

  /**
   * Retrieves transactions for specific course IDs.
   * @param courseIds 
   * @param skip 
   * @param limit 
   * @returns 
   */
  async findByCourseIds(courseIds: string[], skip: number = 0, limit: number = 0): Promise<ITransaction[]> {
    try {
      let transactionQuery = this.model.find({ courseId: { $in: courseIds } }).sort({ createdAt: -1 });
      if (skip > 0) transactionQuery = transactionQuery.skip(skip);
      if (limit > 0) transactionQuery = transactionQuery.limit(limit);
      return await transactionQuery.exec();
    } catch (error) {
      throw new Error(`Failed to fetch transactions for courses ${courseIds.join(", ")}: ${(error as Error).message}`);
    }
  }

  /**
   * Counts the total number of transactions.
   * @returns 
   */
  async countAll(): Promise<number> {
    try {
      return await this.model.countDocuments().exec();
    } catch (error) {
      throw new Error(`Failed to count transactions: ${(error as Error).message}`);
    }
  }

  /**
   * Creates a new transaction.
   * @param transactionData 
   * @returns 
   */
  async create(transactionData: Partial<ITransaction>): Promise<ITransaction> {
    try {
      const newTransaction = new this.model(transactionData);
      return await newTransaction.save();
    } catch (error) {
      throw new Error(`Failed to create transaction: ${(error as Error).message}`);
    }
  }

  /**
   * Retrieves transactions within a date range for the admin panel.
   * @param startDate 
   * @param endDate 
   * @param skip 
   * @param limit 
   * @returns 
   */
  async findByDateRange(
    startDate: string,
    endDate: string,
    skip: number = 0,
    limit: number = 10
  ): Promise<{ transactions: ITransaction[]; total: number }> {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error("Invalid date format");
      }
      const transactionQuery: FilterQuery<ITransaction> = {
        dateTime: {
          $gte: start,
          $lte: end,
        },
      };
      const [transactions, total] = await Promise.all([
        this.model.find(transactionQuery).sort({ dateTime: -1 }).skip(skip).limit(limit).exec(),
        this.model.countDocuments(transactionQuery).exec(),
      ]);
      return { transactions, total };
    } catch (error) {
      throw new Error(`Failed to fetch transactions for date range ${startDate} to ${endDate}: ${(error as Error).message}`);
    }
  }
}
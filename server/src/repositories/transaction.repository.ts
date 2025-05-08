import { injectable } from "inversify";
import Transaction, { ITransaction } from "../models/transaction.model";
import { ITransactionRepository } from "../interfaces/transaction.repository";

/**
 * This is a repository responsible for interacting with transaction repository
 *
 */
@injectable()
export class TransactionRepository implements ITransactionRepository {
  /**
   * This method retrieves all transactions for a specific user
   * @param userId
   * @returns
   */
  async findByUserId(userId: string, skip: number = 0, limit: number = 0): Promise<ITransaction[]> {
    let query = Transaction.find({ userId }).sort({ createdAt: -1 });
    if (skip > 0) query = query.skip(skip);
    if (limit > 0) query = query.limit(limit);
    return query.exec();
  }

  /**
   * This method retrieves all transactions to list in admin panel
   * @param skip
   * @param limit
   * @returns
   */
  async findAll(skip: number = 0, limit: number = 0): Promise<ITransaction[]> {
    let query = Transaction.find().sort({ createdAt: -1 });
    if (skip > 0) query = query.skip(skip);
    if (limit > 0) query = query.limit(limit);
    return query.exec();
  }

  /**
   * This method retrieves transactions for specific course IDs
   * @param courseIds
   * @param skip
   * @param limit
   * @returns
   */
  async findByCourseIds(courseIds: string[], skip: number = 0, limit: number = 0): Promise<ITransaction[]> {
    let query = Transaction.find({ courseId: { $in: courseIds } }).sort({ createdAt: -1 });
    if (skip > 0) query = query.skip(skip);
    if (limit > 0) query = query.limit(limit);
    return query.exec();
  }

  /**
   * This method exists for pagination purpose, count the number of transactions
   * @returns
   */
  async countAll(): Promise<number> {
    return Transaction.countDocuments().exec();
  }

  /**
   * This method creates a new transaction for a user
   * @param transaction
   * @returns
   */
  async create(transaction: Partial<ITransaction>): Promise<ITransaction> {
    const newTransaction = new Transaction(transaction);
    return newTransaction.save();
  }

  /**
   * This method exists for filtering transactions by date range in admin panel
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
    const query = {
      dateTime: {
        $gte: startDate,
        $lte: endDate,
      },
    };

    const [transactions, total] = await Promise.all([
      Transaction.find(query).skip(skip).limit(limit).sort({ dateTime: -1 }).exec(),
      Transaction.countDocuments(query).exec(),
    ]);

    return { transactions, total };
  }
}
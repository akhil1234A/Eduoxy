import { injectable } from "inversify";
import Transaction, { ITransaction } from "../models/transaction.model";
import { ITransactionRepository } from "../interfaces/transaction.repository";

@injectable()
export class TransactionRepository implements ITransactionRepository {
  async findByUserId(userId: string): Promise<ITransaction[]> {
    return Transaction.find({ userId }).exec();
  }

  async findAll(skip: number = 0, limit: number = 10): Promise<ITransaction[]> {
    return Transaction.find().skip(skip).limit(limit).exec();
  }
  
  async countAll(): Promise<number> {
    return Transaction.countDocuments().exec();
  }

  async create(transaction: Partial<ITransaction>): Promise<ITransaction> {
    const newTransaction = new Transaction(transaction);
    return newTransaction.save();
  }

  async findByDateRange(startDate: string, endDate: string, skip: number = 0, limit: number = 10): Promise<{ transactions: ITransaction[]; total: number }> {
    const query = {
      dateTime: {
        $gte: startDate,
        $lte: endDate
      }
    };
    
    const [transactions, total] = await Promise.all([
      Transaction.find(query).skip(skip).limit(limit).sort({ dateTime: -1 }).exec(),
      Transaction.countDocuments(query).exec()
    ]);
    
    return { transactions, total };
  }
}
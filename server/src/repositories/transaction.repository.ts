import { injectable } from "inversify";
import Transaction, { ITransaction } from "../models/transaction.model";
import { ITransactionRepository } from "../interfaces/transaction.repository";

@injectable()
export class TransactionRepository implements ITransactionRepository {
  async findByUserId(userId: string): Promise<ITransaction[]> {
    return Transaction.find({ userId }).exec();
  }

  async findAll(): Promise<ITransaction[]> {
    return Transaction.find().exec();
  }

  async create(transaction: Partial<ITransaction>): Promise<ITransaction> {
    const newTransaction = new Transaction(transaction);
    return newTransaction.save();
  }
}
import { ITransaction } from "../models/transaction.model";

export interface ITransactionRepository {
  findByUserId(userId: string): Promise<ITransaction[]>;
  findAll(): Promise<ITransaction[]>;
  create(transaction: Partial<ITransaction>): Promise<ITransaction>;
}
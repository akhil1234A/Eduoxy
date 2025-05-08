import { ITransaction } from "../models/transaction.model";

export interface ITransactionRepository {
  findByUserId(userId: string, skip?: number, limit?: number): Promise<ITransaction[]>;
  findAll(skip: number, limit: number): Promise<ITransaction[]>;
  findByCourseIds(courseIds: string[], skip: number, limit: number): Promise<ITransaction[]>;
  countAll(): Promise<number>;
  create(transaction: Partial<ITransaction>): Promise<ITransaction>;
  findByDateRange(startDate: string, endDate: string, skip: number, limit: number): Promise<{ transactions: ITransaction[]; total: number }>;
}
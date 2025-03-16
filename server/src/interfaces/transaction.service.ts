import { ITransaction } from "../models/transaction.model";

export interface ITransactionService {
  listTransactions(userId?: string): Promise<ITransaction[]>;
  createTransaction(
    userId: string,
    courseId: string,
    transactionId: string,
    amount: number,
    paymentProvider: "stripe"
  ): Promise<ITransaction>;
}
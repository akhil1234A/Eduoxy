import { ITransaction } from "../models/transaction.model";
import { TransactionResponse } from "../types/types";

export interface ITransactionService {
  createTransaction(
    userId: string,
    courseId: string,
    transactionId: string,
    amount: number,
    paymentProvider: "stripe"
  ): Promise<ITransaction>;
  getAdminEarnings(page?: number, limit?: number, searchTerm?: string): Promise<{ transactions: TransactionResponse[]; total: number; totalPages: number }>;  
  getTeacherEarnings(teacherId: string, page?: number, limit?: number, searchTerm?: string): Promise<{ transactions: TransactionResponse[]; total: number; totalPages: number }>;
  getStudentPurchases(userId: string, page?: number, limit?: number, searchTerm?: string): Promise<{ transactions: TransactionResponse[]; total: number; totalPages: number }>; 
}